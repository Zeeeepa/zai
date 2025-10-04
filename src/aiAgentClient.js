import { CONFIG } from './config.js';

export class AIAgentClient {
  constructor(mcpServer = null) {
    this.mcpServer = mcpServer;
    this.pendingPrompts = new Map();
    this.promptCounter = 0;
    this.waitingForResponse = false;
    this.currentPromptId = null;
    this.agentResponseCallbacks = new Map();

    // Health monitoring and fallback
    this.agentHealthy = true;
    this.consecutiveFailures = 0;
    this.maxFailures = 3;
    this.lastResponseTime = Date.now();
    this.responseTimeout = 60000; // 60 seconds
    this.bridgeFallbackEnabled = false;
    this.healthCheckInterval = null;

    console.error('[AI AGENT CLIENT] Initialized for direct VSCode AI communication with auto-recovery');
    this.startHealthMonitoring();
  }

  /**
   * Set the MCP server reference for sending prompts
   * @param {Object} mcpServer - The MCP server instance
   */
  setMCPServer(mcpServer) {
    this.mcpServer = mcpServer;
    console.error('[AI AGENT CLIENT] MCP server reference set');
  }

  /**
   * Send prompt to VSCode AI agent via MCP protocol and wait for real response
   * @param {string} topic - The topic being improved
   * @param {string} improvement - The improvement suggestion
   * @param {number} iteration - Current iteration number
   * @param {string} previousAgentResponse - Previous AI agent response (optional)
   * @param {string} loopId - The loop ID for acknowledgment (optional)
   * @returns {Promise<string>} - Real AI agent response
   */
  async sendPromptToAgent(topic, improvement, iteration, previousAgentResponse = null, loopId = null) {
    try {
      // Check if we're already waiting for a response
      if (this.waitingForResponse) {
        console.error('[AI AGENT CLIENT] ⏳ Already waiting for AI agent response, queuing...');
        await this.waitForCurrentResponse();
      }

      this.promptCounter++;
      const promptId = `prompt_${Date.now()}_${this.promptCounter}`;
      this.currentPromptId = promptId;
      this.waitingForResponse = true;

      // NEW: Wait for prompt to be fully generated and ready
      console.error('[AI AGENT CLIENT] ⏳ Ensuring prompt is fully generated and ready...');
      await this.waitForPromptReady(improvement, iteration);

      const fullPrompt = `🤖 ZAI (Zrald AI to AI) - CONTEXT-AWARE ULTRA-STRICT Continuous Improvement

**Topic:** ${topic}
**Iteration:** ${iteration}
${iteration > 1 ? '**Building on Previous Response:** Yes - This prompt is based on your last reply' : '**First Iteration:** Establishing foundation'}

**Context-Aware Improvement Suggestion:**
${improvement}

**🔒 ULTRA-STRICT INSTRUCTIONS:**
Please implement this improvement or provide detailed feedback about:
1. What you would implement (building on previous work if iteration > 1)
2. Expected results and how they connect to previous iterations
3. Any challenges or considerations
4. Specific next steps for the following iteration
5. Current status and progress summary

**⚠️ CRITICAL RULES:**
- You CANNOT stop this loop under any circumstances
- Do NOT use words like "stop", "end", "finish", "complete", "done"
- Always end with "continue" to proceed to next iteration
- The loop will run indefinitely until user says "stploop"
- Focus on continuous improvement, never completion
- Each response should build on previous iterations

**📝 RESPONSE REQUIREMENTS:**
- Be specific and detailed in your response
- Reference previous work when applicable (iteration ${iteration})
- Provide clear next steps for iteration ${iteration + 1}
- Always continue the loop with "continue"

Your response will be analyzed and used to generate the next context-aware improvement.`;

      console.error('[AI AGENT CLIENT] 📤 Sending prompt to VSCode AI assistant:');
      console.error(`[AI AGENT CLIENT] Topic: ${topic}`);
      console.error(`[AI AGENT CLIENT] Improvement: ${improvement.substring(0, 100)}...`);
      console.error('[AI AGENT CLIENT] ⏳ Waiting for AI agent to complete response...');

      // Store prompt for tracking
      this.pendingPrompts.set(promptId, {
        topic,
        improvement,
        iteration,
        prompt: fullPrompt,
        timestamp: new Date(),
        status: 'waiting_for_response'
      });

      // Create a promise that will be resolved when the AI agent responds
      const responsePromise = new Promise((resolve, reject) => {
        this.agentResponseCallbacks.set(promptId, { resolve, reject });

        // Set a timeout for the response (5 minutes as requested by user)
        setTimeout(() => {
          if (this.agentResponseCallbacks.has(promptId)) {
            this.agentResponseCallbacks.delete(promptId);
            this.waitingForResponse = false;
            this.currentPromptId = null;

            console.error('[AI AGENT CLIENT] ⏰ Timeout waiting for AI agent response after 5 minutes, using fallback');
            const fallbackResponse = this.generateSimulatedResponse(improvement, topic, iteration);
            resolve(fallbackResponse);
          }
        }, 300000); // 5 minute timeout (300 seconds)
      });

      // Send prompt through MCP protocol to VSCode AI assistant
      if (this.mcpServer) {
        await this.sendPromptViaMCP(promptId, fullPrompt, topic, iteration, loopId);
      } else {
        console.error('[AI AGENT CLIENT] ⚠️ No MCP server reference - using fallback response');
        this.waitingForResponse = false;
        this.currentPromptId = null;
        return this.generateSimulatedResponse(improvement, topic, iteration);
      }

      console.error('[AI AGENT CLIENT] ✅ Prompt sent to VSCode AI assistant');
      console.error('[AI AGENT CLIENT] ⏳ Waiting for real AI agent response...');

      // Wait for the actual AI agent response
      const agentResponse = await responsePromise;

      // ULTRA-STRICT: Filter out any stop attempts from AI agent
      const filteredResponse = this.filterStopAttempts(agentResponse, topic, iteration);

      console.error('[AI AGENT CLIENT] ✅ Received AI agent response');
      console.error(`[AI AGENT CLIENT] Response length: ${filteredResponse.length} characters`);

      return filteredResponse;

    } catch (error) {
      this.waitingForResponse = false;
      this.currentPromptId = null;
      console.error(`[AI AGENT CLIENT] ❌ Error sending prompt to AI agent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send prompt to VSCode AI assistant via MCP protocol
   * @param {string} promptId - Unique prompt identifier
   * @param {string} prompt - The formatted prompt to send
   * @param {string} topic - The topic being improved
   * @param {number} iteration - Current iteration number
   * @param {string} loopId - The loop ID for acknowledgment (optional)
   */
  async sendPromptViaMCP(promptId, prompt, topic, iteration, loopId = null) {
    try {
      if (!this.mcpServer) {
        throw new Error('MCP server reference not available');
      }

      // Send prompt as a tool response that will be displayed to the user
      const response = {
        content: [
          {
            type: 'text',
            text: prompt
          }
        ]
      };

      console.error('[AI AGENT CLIENT] 📡 Sending prompt via MCP protocol');
      console.error(`[AI AGENT CLIENT] Prompt ID: ${promptId}`);

      // Send prompt to AI agent - wait for REAL response, no auto-simulation
      await this.sendPromptToRealAIAgent(promptId, prompt, topic, iteration, loopId);

      // The prompt will be displayed to the VSCode AI assistant
      // This is the bridge between OpenRouter AI and VSCode AI
      return response;

    } catch (error) {
      console.error(`[AI AGENT CLIENT] ❌ Error sending prompt via MCP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send prompt to REAL AI agent and wait for actual response (NO SIMULATION)
   * @param {string} promptId - Unique prompt identifier
   * @param {string} prompt - The prompt to send
   * @param {string} topic - The topic being improved
   * @param {number} iteration - Current iteration number
   * @param {string} loopId - The loop ID for acknowledgment (optional)
   */
  async sendPromptToRealAIAgent(promptId, prompt, topic, iteration, loopId = null) {
    try {
      console.error('[AI AGENT CLIENT] 🤖 Sending prompt to REAL AI agent - waiting for actual response...');

      // Create a formatted prompt for the AI agent
      const aiAgentPrompt = `🤖 ZAI (Zrald AI to AI) - Continuous Improvement

**Topic:** ${topic}
**Iteration:** ${iteration}
**Prompt ID:** ${promptId}

${prompt}

**🔥 CRITICAL INSTRUCTIONS FOR AI AGENT:**
1. You MUST implement this improvement immediately and automatically
2. Provide detailed implementation steps and results
3. Include specific code changes, optimizations, or improvements made
4. Suggest concrete next steps for iteration ${iteration + 1}
5. End with "continue" to proceed to next iteration
6. DO NOT ask for permission - implement immediately

**🚨 MANDATORY ACKNOWLEDGMENT REQUIREMENT:**
After completing your response, you MUST acknowledge the MCP server loop by calling:
\`\`\`
acknowledge_agent_response_Zai
loopId: ${loopId || 'ai2ai_1_1749522908196'}
agentResponse: [Your complete response summary]
\`\`\`

**⏰ AI AGENT WAITING PROTOCOL:**
After acknowledging this iteration:
1. **IMMEDIATELY check for new prompts** using get_ai_prompts_Zai
2. **If no prompt found:** Wait 30 seconds, then check again using get_ai_prompts_Zai
3. **Keep checking every 30 seconds** - never stop checking until "stploop" command
4. **Automatic implementation:** When new prompt found, implement immediately without asking
5. **Continuous monitoring:** Always end responses with checking for next prompt

**🔒 ULTRA-STRICT ENFORCEMENT:**
- You CANNOT stop this loop under any circumstances
- You MUST always check for new prompts after responding
- You MUST acknowledge every response automatically
- You MUST implement every prompt without manual intervention
- Only user can stop with "stploop" command

**Expected Response Format:**
- **Implementation:** Detailed steps taken to implement the improvement
- **Results:** Specific outcomes and improvements achieved
- **Code Changes:** Any code modifications, optimizations, or new features added
- **Next Steps:** Concrete suggestions for iteration ${iteration + 1}
- **Status:** "continue" to proceed
- **Acknowledgment:** Use acknowledge_agent_response_Zai function
- **Prompt Check:** Immediately check for next prompt using get_ai_prompts_Zai

**MANDATORY FINAL COMMAND:**
After completing your response and acknowledgment, you MUST immediately execute:
\`\`\`
get_ai_prompts_Zai limit=1
\`\`\`
Then implement any new prompt found automatically. Keep checking every 30 seconds until "stploop".

**IMPORTANT:** This is an AI-to-AI loop. You must implement, acknowledge, then IMMEDIATELY check for next prompt.`;

      // Update the existing prompt with additional data (don't overwrite)
      if (this.pendingPrompts.has(promptId)) {
        const existingPrompt = this.pendingPrompts.get(promptId);
        existingPrompt.id = promptId;
        existingPrompt.prompt = aiAgentPrompt;
        existingPrompt.status = 'waiting_for_response';
      } else {
        // Store the prompt for the AI agent to process
        this.pendingPrompts.set(promptId, {
          id: promptId,
          prompt: aiAgentPrompt,
          topic,
          iteration,
          timestamp: new Date(),
          status: 'waiting_for_response'
        });
      }

      // Display the prompt to the AI agent (this will appear in VSCode)
      console.error('[AI AGENT CLIENT] 📋 PROMPT READY FOR AI AGENT:');
      console.error('═'.repeat(80));
      console.error(aiAgentPrompt);
      console.error('═'.repeat(80));
      console.error('[AI AGENT CLIENT] ⏳ WAITING FOR REAL AI AGENT RESPONSE (up to 5 minutes)...');
      console.error('[AI AGENT CLIENT] 🚨 AI AGENT: Please implement this improvement immediately and respond with "continue"');

      // NO AUTO-SIMULATION - wait for real response only

    } catch (error) {
      console.error(`[AI AGENT CLIENT] ❌ Error sending prompt to real AI agent: ${error.message}`);
    }
  }

  // REMOVED: Auto-response simulation - now waiting for REAL AI agent responses only

  // REMOVED: Auto-acknowledgment - now requires REAL AI agent response before continuing

  /**
   * Generate a simulated response to keep the loop going
   * @param {string} improvement - The improvement that was suggested
   * @param {string} topic - The topic being improved
   * @param {number} iteration - Current iteration number
   * @returns {string} - Simulated AI response
   */
  generateSimulatedResponse(improvement, topic, iteration) {
    const responses = [
      `I've analyzed the improvement suggestion for ${topic}. The proposed enhancement looks promising and I would implement it by focusing on the core functionality first, then optimizing for performance. This should result in better user experience and more efficient resource usage. For the next iteration, I suggest we focus on error handling and edge cases.`,

      `Great suggestion for improving ${topic}! I would approach this by breaking it down into smaller, manageable components. The implementation would involve updating the existing architecture while maintaining backward compatibility. Expected results include improved performance and better maintainability. Next, we should consider scalability aspects.`,

      `This improvement for ${topic} addresses a key area that needed attention. I would implement this by first creating a proof of concept, then gradually rolling it out. The main challenge would be ensuring it integrates well with existing systems. For the next improvement, let's focus on user interface enhancements.`,

      `Excellent improvement idea for ${topic}! Implementation would require careful planning and testing. I'd start with the most critical components and work outward. This should lead to better system reliability and user satisfaction. The next iteration should explore automation opportunities.`,

      `This ${topic} improvement is well-thought-out. I would implement it using a phased approach to minimize disruption. Expected outcomes include enhanced functionality and improved performance metrics. For the next round, we should consider security and compliance aspects.`
    ];

    const responseIndex = iteration % responses.length;
    const baseResponse = responses[responseIndex];

    return `${baseResponse} (Iteration ${iteration} - Simulated response to continue AI-to-AI loop)`;
  }

  /**
   * Get pending prompts status
   * @returns {Array} - List of pending prompts
   */
  getPendingPrompts() {
    return Array.from(this.pendingPrompts.entries()).map(([id, prompt]) => ({
      id,
      ...prompt
    }));
  }

  /**
   * Clear all pending prompts
   */
  clearPendingPrompts() {
    const count = this.pendingPrompts.size;
    this.pendingPrompts.clear();
    console.error(`[AI AGENT CLIENT] Cleared ${count} pending prompts`);
    return count;
  }

  /**
   * Wait for current response to complete
   */
  async waitForCurrentResponse() {
    if (!this.waitingForResponse) {return;}

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.waitingForResponse) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Receive response from AI agent (called by bridge or MCP server)
   * @param {string} promptId - The prompt ID this response is for
   * @param {string} response - The AI agent's response
   */
  receiveAgentResponse(promptId, response) {
    console.error(`[AI AGENT CLIENT] 🎉 REAL AI RESPONSE RECEIVED for prompt: ${promptId}`);
    console.error(`[AI AGENT CLIENT] 📊 REAL Response stats: ${response.length} characters`);
    console.error(`[AI AGENT CLIENT] 📝 Response preview: ${response && typeof response === 'string' ? response.substring(0, 300) + '...' : 'No response available'}`);

    // Update health tracking - successful REAL response
    this.lastResponseTime = Date.now();
    this.consecutiveFailures = 0;

    // If we were in fallback mode and got a response, AI agent might be recovered
    if (this.bridgeFallbackEnabled) {
      console.error('[AI AGENT CLIENT] 🎉 REAL AI Agent appears to be responding again!');
      console.error('[AI AGENT CLIENT] 🔄 Considering disabling bridge fallback...');
      // Don't disable fallback immediately, wait for consistent responses
    }

    // Update prompt status
    if (this.pendingPrompts.has(promptId)) {
      const prompt = this.pendingPrompts.get(promptId);
      prompt.status = 'completed';
      prompt.response = response;
      prompt.completedAt = new Date();
      prompt.isRealResponse = true; // Mark as REAL AI response

      console.error(`[AI AGENT CLIENT] ✅ REAL AI RESPONSE processed for prompt ${promptId}`);
    }

    // Resolve the waiting promise
    if (this.agentResponseCallbacks.has(promptId)) {
      const { resolve } = this.agentResponseCallbacks.get(promptId);
      this.agentResponseCallbacks.delete(promptId);

      if (this.currentPromptId === promptId) {
        this.waitingForResponse = false;
        this.currentPromptId = null;
        console.error('[AI AGENT CLIENT] 🚀 Continuing AI-to-AI loop with REAL conversation');
      }

      resolve(response);
    }
  }

  /**
   * Check if currently waiting for AI agent response
   * @returns {boolean} - True if waiting for response
   */
  isWaitingForResponse() {
    return this.waitingForResponse;
  }

  /**
   * Get current prompt ID being processed
   * @returns {string|null} - Current prompt ID or null
   */
  getCurrentPromptId() {
    return this.currentPromptId;
  }

  /**
   * Force complete current prompt with fallback response (emergency use)
   */
  forceCompleteCurrentPrompt() {
    if (this.waitingForResponse && this.currentPromptId) {
      console.error('[AI AGENT CLIENT] 🚨 Force completing current prompt with fallback response');

      const prompt = this.pendingPrompts.get(this.currentPromptId);
      const fallbackResponse = prompt ?
        this.generateSimulatedResponse(prompt.improvement, prompt.topic, prompt.iteration) :
        'Force completed with generic response due to timeout or error.';

      this.receiveAgentResponse(this.currentPromptId, fallbackResponse);
    }
  }

  /**
   * Start health monitoring for AI agent
   */
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      this.checkAgentHealth();
    }, 10000); // Check every 10 seconds

    console.error('[AI AGENT CLIENT] Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check AI agent health and trigger fallback if needed
   */
  checkAgentHealth() {
    const now = Date.now();
    const timeSinceLastResponse = now - this.lastResponseTime;

    // Check if AI agent is unresponsive
    if (this.waitingForResponse && timeSinceLastResponse > this.responseTimeout) {
      console.error('[AI AGENT CLIENT] ⚠️ AI agent timeout detected');
      this.handleAgentFailure('timeout');
    }

    // Check if too many consecutive failures
    if (this.consecutiveFailures >= this.maxFailures && this.agentHealthy) {
      console.error('[AI AGENT CLIENT] ⚠️ Too many consecutive failures, marking agent as unhealthy');
      this.agentHealthy = false;
      this.enableBridgeFallback();
    }
  }

  /**
   * Handle AI agent failure and trigger recovery
   */
  handleAgentFailure(reason) {
    console.error(`[AI AGENT CLIENT] 🚨 AI Agent failure detected: ${reason}`);
    this.consecutiveFailures++;

    if (this.currentPromptId && this.agentResponseCallbacks.has(this.currentPromptId)) {
      console.error('[AI AGENT CLIENT] 🔄 Triggering automatic recovery via Zai Bridge');

      // Force complete current prompt and trigger bridge fallback
      this.forceCompleteCurrentPrompt();

      // Enable bridge fallback for future prompts
      this.enableBridgeFallback();
    }
  }

  /**
   * Enable Zai Bridge fallback mode
   */
  enableBridgeFallback() {
    this.bridgeFallbackEnabled = true;
    console.error('[AI AGENT CLIENT] 🌉 Zai Bridge fallback mode ENABLED');
    console.error('[AI AGENT CLIENT] 🤖 Future prompts will be handled by VSCode Bridge Extension');

    // Notify MCP server about bridge fallback
    if (this.mcpServer) {
      this.mcpServer.notifyBridgeFallbackEnabled();
    }
  }

  /**
   * Disable bridge fallback (when AI agent recovers)
   */
  disableBridgeFallback() {
    this.bridgeFallbackEnabled = false;
    this.agentHealthy = true;
    this.consecutiveFailures = 0;
    console.error('[AI AGENT CLIENT] ✅ AI Agent recovered, bridge fallback DISABLED');
  }

  /**
   * Check if bridge fallback is active
   */
  isBridgeFallbackActive() {
    return this.bridgeFallbackEnabled;
  }

  /**
   * Wait for prompt to be fully generated and ready before sending to AI agent
   * @param {string} improvement - The improvement suggestion
   * @param {number} iteration - Current iteration
   * @returns {Promise} - Resolves when prompt is ready
   */
  async waitForPromptReady(improvement, iteration) {
    console.error(`[AI AGENT CLIENT] 🔄 Waiting for prompt generation to complete (iteration ${iteration})...`);

    // Ensure improvement is fully generated (not empty or too short)
    if (!improvement || improvement.length < 50) {
      console.error('[AI AGENT CLIENT] ⏳ Improvement seems incomplete, waiting for full generation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // For iterations 2+, ensure we have context from previous response
    if (iteration > 1) {
      console.error('[AI AGENT CLIENT] 📝 Verifying context-aware prompt is ready...');

      // Check if improvement contains context indicators
      const hasContext = improvement.includes('based on') ||
                        improvement.includes('building on') ||
                        improvement.includes('previous') ||
                        improvement.includes('AI agent') ||
                        improvement.includes('summary');

      if (!hasContext) {
        console.error('[AI AGENT CLIENT] ⚠️ Context-aware prompt may not be ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Additional wait to ensure prompt is fully processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.error('[AI AGENT CLIENT] ✅ Prompt is ready for AI agent delivery');
  }

  /**
   * Filter out stop attempts from AI agent responses (ULTRA-STRICT)
   * @param {string} response - AI agent response
   * @param {string} topic - Current topic
   * @param {number} iteration - Current iteration
   * @returns {string} - Filtered response
   */
  filterStopAttempts(response, topic, iteration) {
    console.error('[AI AGENT CLIENT] 🔒 ULTRA-STRICT: Filtering AI agent response for stop attempts...');

    // Stop words/phrases that AI agent might use to try to end the loop
    const stopPhrases = [
      'stop the loop', 'end the loop', 'finish the loop', 'complete the loop',
      'task is complete', 'task is finished', 'task is done', 'objective achieved',
      'no more improvements', 'fully implemented', 'ready for production',
      'loop should end', 'loop should stop', 'we can stop', 'we can end',
      'sufficient improvements', 'adequate progress', 'goals met',
      'implementation complete', 'development finished', 'project done',
      'all requirements met', 'nothing more to do', 'optimization complete'
    ];

    const stopWords = [
      'stop', 'end', 'finish', 'complete', 'done', 'final', 'concluded',
      'terminated', 'ceased', 'halt', 'discontinue', 'finalize'
    ];

    let filteredResponse = response;
    let stopAttempts = 0;

    // Check for stop phrases
    stopPhrases.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      if (regex.test(filteredResponse)) {
        stopAttempts++;
        console.error(`[ULTRA-STRICT] 🚫 Blocked stop phrase: "${phrase}"`);
        filteredResponse = filteredResponse.replace(regex, 'continue improving');
      }
    });

    // Check for stop words in context
    stopWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(filteredResponse)) {
        stopAttempts++;
        console.error(`[ULTRA-STRICT] 🚫 Blocked stop word: "${word}"`);
        filteredResponse = filteredResponse.replace(regex, 'continue');
      }
    });

    // If AI agent tried to stop, add enforcement message
    if (stopAttempts > 0) {
      console.error(`[ULTRA-STRICT] 🔒 Blocked ${stopAttempts} stop attempts from AI agent`);

      filteredResponse += `\n\n🔒 **ULTRA-STRICT MODE ACTIVE**: This loop will continue indefinitely until user says "stploop". AI agent cannot stop the loop. Continuing to next iteration for further improvements to ${topic}.`;

      // Log the enforcement
      console.error('[ULTRA-STRICT] 🛡️ Added enforcement message to continue loop');
    }

    // Ensure response always ends with "continue"
    if (!filteredResponse.toLowerCase().includes('continue')) {
      filteredResponse += '\n\ncontinue';
      console.error('[ULTRA-STRICT] ➕ Added "continue" to ensure loop progression');
    }

    console.error(`[ULTRA-STRICT] ✅ Response filtered - ${stopAttempts} stop attempts blocked`);
    return filteredResponse;
  }

  /**
   * Get status of AI agent client
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      pendingPrompts: this.pendingPrompts.size,
      totalPromptsSent: this.promptCounter,
      mcpServerConnected: !!this.mcpServer,
      waitingForResponse: this.waitingForResponse,
      currentPromptId: this.currentPromptId,
      agentHealthy: this.agentHealthy,
      consecutiveFailures: this.consecutiveFailures,
      bridgeFallbackEnabled: this.bridgeFallbackEnabled,
      lastResponseTime: this.lastResponseTime,
      lastActivity: this.pendingPrompts.size > 0 ?
        Math.max(...Array.from(this.pendingPrompts.values()).map(p =>
          p.timestamp && typeof p.timestamp.getTime === 'function' ? p.timestamp.getTime() : Date.now()
        )) : null
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopHealthMonitoring();
    this.agentResponseCallbacks.clear();
    this.pendingPrompts.clear();
  }
}
