import { CONFIG } from './config.js';
import { OpenRouterClient } from './openRouterClient.js';

export class CommandProcessor {
  constructor(openRouterApiKey = null, model = null) {
    this.improvementStrategies = [
      'optimization',
      'refactoring',
      'performance enhancement',
      'code quality improvement',
      'functionality expansion',
      'error handling enhancement',
      'documentation improvement',
      'testing coverage increase'
    ];

    // Initialize OpenRouter client if API key is provided
    this.openRouterClient = null;
    this.modelResetInterval = null;

    if (openRouterApiKey) {
      try {
        this.openRouterClient = new OpenRouterClient(openRouterApiKey, model);
        console.error('[COMMAND PROCESSOR] OpenRouter client initialized');

        // Reset failed models every 10 minutes to retry them
        this.modelResetInterval = setInterval(() => {
          if (this.openRouterClient) {
            this.openRouterClient.resetFailedModels();
          }
        }, 10 * 60 * 1000); // 10 minutes

      } catch (error) {
        console.error(`[COMMAND PROCESSOR] Failed to initialize OpenRouter: ${error.message}`);
      }
    } else {
      console.error('[COMMAND PROCESSOR] No OpenRouter API key provided, using fallback generation');
    }
  }

  /**
   * Process and improve a command/topic with context-aware generation
   * @param {string} topic - The topic to improve
   * @param {number} iteration - Current iteration number
   * @param {string} contextData - The context data (agent response, codebase summary, etc.)
   * @param {string} contextType - Type of context ('raw', 'summary', 'codebase_summary', 'enhanced_context', 'ultra_enhanced_context')
   * @returns {Object} - Processed result
   */
  async processCommand(topic, iteration, contextData = null, contextType = 'raw') {
    try {
      const strategy = this.getImprovementStrategy(iteration);

      let improvement;

      if (iteration === 1 && contextType === 'codebase_summary' && contextData) {
        // First iteration with codebase summary
        improvement = await this.generateCodebaseAwareImprovement(topic, strategy, iteration, contextData);
      } else if (contextType === 'ultra_enhanced_context' && contextData) {
        // Ultra enhanced context with all AI-to-AI components
        improvement = await this.generateUltraEnhancedContextImprovement(topic, strategy, iteration, contextData);
      } else if (contextType === 'enhanced_context' && contextData) {
        // Enhanced context with code changes, test results, and quality metrics
        improvement = await this.generateEnhancedContextImprovement(topic, strategy, iteration, contextData);
      } else if (iteration > 1 && contextData) {
        // Subsequent iterations with AI agent response context
        improvement = await this.generateContextAwareImprovement(topic, strategy, iteration, contextData, contextType);
      } else {
        // Fallback to basic improvement generation
        improvement = await this.generateImprovement(topic, strategy, iteration, contextData);
      }

      return {
        success: true,
        topic,
        iteration,
        strategy,
        improvement,
        timestamp: new Date().toISOString(),
        nextAction: this.getNextAction(iteration),
        basedOnContext: !!contextData,
        contextAware: (iteration === 1 && contextType === 'codebase_summary') || (iteration > 1 && !!contextData),
        contextType
      };
    } catch (error) {
      return {
        success: false,
        topic,
        iteration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get improvement strategy based on iteration
   * @param {number} iteration - Current iteration
   * @returns {string} - Strategy name
   */
  getImprovementStrategy(iteration) {
    const strategyIndex = (iteration - 1) % this.improvementStrategies.length;
    return this.improvementStrategies[strategyIndex];
  }

  /**
   * Generate codebase-aware improvement for first iteration
   * @param {string} topic - The topic to improve
   * @param {string} strategy - Improvement strategy
   * @param {number} iteration - Current iteration (should be 1)
   * @param {string} codebaseSummary - AI agent's codebase summary
   * @returns {string} - Generated codebase-aware improvement
   */
  async generateCodebaseAwareImprovement(topic, strategy, iteration, codebaseSummary) {
    console.error(`[CODEBASE-AWARE] Generating improvement based on codebase summary for iteration ${iteration}...`);

    if (this.openRouterClient) {
      try {
        const codebaseAwarePrompt = this.buildCodebaseAwarePrompt(topic, strategy, iteration, codebaseSummary);

        const aiImprovement = await this.openRouterClient.generateContextAwareImprovement(
          codebaseAwarePrompt,
          topic,
          strategy,
          iteration
        );

        console.error(`[CODEBASE-AWARE] Generated: ${aiImprovement.substring(0, 100)}...`);
        return aiImprovement;
      } catch (error) {
        console.error(`[CODEBASE-AWARE ERROR] ${error.message}, falling back to local generation`);
        return this.generateLocalCodebaseAwareImprovement(topic, strategy, iteration, codebaseSummary);
      }
    } else {
      return this.generateLocalCodebaseAwareImprovement(topic, strategy, iteration, codebaseSummary);
    }
  }

  /**
   * Generate ultra enhanced context improvement with all AI-to-AI components
   * @param {string} topic - The topic to improve
   * @param {string} strategy - Improvement strategy
   * @param {number} iteration - Current iteration
   * @param {string} ultraEnhancedContext - Ultra enhanced context with all component data
   * @returns {string} - Generated ultra enhanced context improvement
   */
  async generateUltraEnhancedContextImprovement(topic, strategy, iteration, ultraEnhancedContext) {
    console.error(`[ULTRA ENHANCED CONTEXT] Generating improvement with all AI-to-AI components for iteration ${iteration}...`);

    if (this.openRouterClient) {
      try {
        const ultraEnhancedPrompt = this.buildUltraEnhancedContextPrompt(topic, strategy, iteration, ultraEnhancedContext);

        const aiImprovement = await this.openRouterClient.generateContextAwareImprovement(
          ultraEnhancedPrompt,
          topic,
          strategy,
          iteration
        );

        console.error(`[ULTRA ENHANCED CONTEXT] Generated: ${aiImprovement.substring(0, 100)}...`);
        return aiImprovement;
      } catch (error) {
        console.error(`[ULTRA ENHANCED CONTEXT ERROR] ${error.message}, falling back to local generation`);
        return this.generateLocalUltraEnhancedContextImprovement(topic, strategy, iteration, ultraEnhancedContext);
      }
    } else {
      return this.generateLocalUltraEnhancedContextImprovement(topic, strategy, iteration, ultraEnhancedContext);
    }
  }

  /**
   * Generate enhanced context improvement with code changes, tests, and quality metrics
   * @param {string} topic - The topic to improve
   * @param {string} strategy - Improvement strategy
   * @param {number} iteration - Current iteration
   * @param {string} enhancedContext - Enhanced context with multiple data sources
   * @returns {string} - Generated enhanced context improvement
   */
  async generateEnhancedContextImprovement(topic, strategy, iteration, enhancedContext) {
    console.error(`[ENHANCED CONTEXT] Generating improvement with enhanced context for iteration ${iteration}...`);

    if (this.openRouterClient) {
      try {
        const enhancedPrompt = this.buildEnhancedContextPrompt(topic, strategy, iteration, enhancedContext);

        const aiImprovement = await this.openRouterClient.generateContextAwareImprovement(
          enhancedPrompt,
          topic,
          strategy,
          iteration
        );

        console.error(`[ENHANCED CONTEXT] Generated: ${aiImprovement.substring(0, 100)}...`);
        return aiImprovement;
      } catch (error) {
        console.error(`[ENHANCED CONTEXT ERROR] ${error.message}, falling back to local generation`);
        return this.generateLocalEnhancedContextImprovement(topic, strategy, iteration, enhancedContext);
      }
    } else {
      return this.generateLocalEnhancedContextImprovement(topic, strategy, iteration, enhancedContext);
    }
  }

  /**
   * Generate context-aware improvement based on AI agent response summary
   * @param {string} topic - The topic to improve
   * @param {string} strategy - Improvement strategy
   * @param {number} iteration - Current iteration
   * @param {string} agentResponseSummary - AI agent response summary
   * @param {string} responseType - Type of response ('raw' or 'summary')
   * @returns {string} - Generated context-aware improvement
   */
  async generateContextAwareImprovement(topic, strategy, iteration, agentResponseSummary, responseType = 'summary') {
    console.error(`[CONTEXT-AWARE] Generating improvement based on AI agent ${responseType} for iteration ${iteration}...`);

    if (this.openRouterClient) {
      try {
        const contextAwarePrompt = this.buildContextAwarePrompt(topic, strategy, iteration, agentResponseSummary, responseType);

        const aiImprovement = await this.openRouterClient.generateContextAwareImprovement(
          contextAwarePrompt,
          topic,
          strategy,
          iteration
        );

        console.error(`[CONTEXT-AWARE] Generated: ${aiImprovement && typeof aiImprovement === 'string' ? aiImprovement.substring(0, 100) + '...' : 'No improvement available'}`);
        return aiImprovement;
      } catch (error) {
        console.error(`[CONTEXT-AWARE ERROR] ${error.message}, falling back to local generation`);
        return this.generateLocalContextAwareImprovement(topic, strategy, iteration, agentResponseSummary);
      }
    } else {
      return this.generateLocalContextAwareImprovement(topic, strategy, iteration, agentResponseSummary);
    }
  }

  /**
   * Build codebase-aware prompt for AI generation (iteration 1)
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} codebaseSummary - Codebase summary from AI agent
   * @returns {string} - Codebase-aware prompt
   */
  buildCodebaseAwarePrompt(topic, strategy, iteration, codebaseSummary) {
    return `**CODEBASE-AWARE IMPROVEMENT GENERATION - Iteration ${iteration}**

**User Request:** ${topic}
**Strategy:** ${strategy}
**Codebase Context:**
${codebaseSummary}

**Instructions:**
Based on the codebase summary provided by the AI agent, generate the first improvement that:
1. Is specifically tailored to the current codebase structure and technology stack
2. Addresses the user's request "${topic}" in the context of the existing code
3. Leverages existing patterns, frameworks, and architecture
4. Identifies specific files, components, or areas that should be modified
5. Uses the "${strategy}" strategy while respecting the current codebase design

**Requirements:**
- Reference specific parts of the codebase mentioned in the summary
- Propose concrete, actionable changes that fit the existing architecture
- Consider the current technology stack and dependencies
- Provide specific file paths or component names where applicable
- Ensure compatibility with existing code patterns and standards

Generate a detailed, codebase-aware improvement suggestion for iteration 1:`;
  }

  /**
   * Generate local codebase-aware improvement
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} codebaseSummary - Codebase summary
   * @returns {string} - Local codebase-aware improvement
   */
  generateLocalCodebaseAwareImprovement(topic, strategy, iteration, codebaseSummary) {
    const baseImprovement = `**Codebase-Aware ${strategy} for "${topic}" (Iteration ${iteration})**

Based on the codebase analysis, this iteration focuses on:

1. **Current Codebase Context:** Understanding the existing architecture and technology stack to ensure improvements align with current patterns.

2. **Targeted Implementation:** Focusing on specific files and components identified in the codebase summary that relate to "${topic}".

3. **Architecture-Aware Changes:** Implementing improvements that respect the existing code structure and design patterns.

**Specific Improvements:**
- Enhanced ${strategy} implementation tailored to the current codebase
- Integration with existing frameworks and libraries
- Modifications to relevant files and components
- Adherence to current coding standards and patterns

**Codebase Context Summary:**
${codebaseSummary && typeof codebaseSummary === 'string' ? codebaseSummary.substring(0, 400) + '...' : 'Codebase analysis in progress - implementing general improvements'}

This codebase-aware approach ensures improvements are practical and compatible with the existing system.`;

    console.error('[LOCAL CODEBASE-AWARE] Generated improvement based on codebase context');
    return baseImprovement;
  }

  /**
   * Build ultra enhanced context prompt for AI generation
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} ultraEnhancedContext - Ultra enhanced context data
   * @returns {string} - Ultra enhanced context prompt
   */
  buildUltraEnhancedContextPrompt(topic, strategy, iteration, ultraEnhancedContext) {
    return `**🚀 ULTRA ENHANCED AI-TO-AI IMPROVEMENT GENERATION - Iteration ${iteration}**

**User Request:** ${topic}
**Strategy:** ${strategy}
**Ultra Enhanced Context with All AI Components:**
${ultraEnhancedContext}

**🎯 Advanced AI-to-AI Instructions:**
Based on the comprehensive analysis from all AI-to-AI components (Semantic Analysis, Iteration Planning, Multi-Agent Collaboration, Performance Optimization, Context Management, Code Analysis, and Quality Assurance), generate the next improvement that:

1. **🧠 Semantic Awareness**: Aligns with parsed user intentions and implicit requirements
2. **📋 Iteration Planning**: Follows the intelligent iteration plan and phase guidance
3. **👥 Multi-Agent Consensus**: Incorporates specialist agent recommendations and consensus
4. **⚡ Performance Optimized**: Leverages cached patterns and parallel processing insights
5. **🔄 Context Aware**: Uses optimized context windows and compressed conversation history
6. **📊 Code Analysis**: Responds to real-time code changes and impact assessments
7. **✅ Quality Driven**: Addresses test results, quality metrics, and QA recommendations

**🎨 Ultra Enhanced Requirements:**
- Reference specific user intentions and their confidence levels
- Follow the iteration plan phase and focus areas
- Incorporate specialist agent consensus and recommendations
- Address any quality issues or test failures with priority
- Consider performance optimization opportunities
- Build upon successful patterns from previous iterations
- Ensure changes align with the detected project complexity and scope
- Provide actionable next steps that can be measured by all QA components

**🔬 Advanced Quality Focus:**
- If specialist consensus shows concerns, address them specifically
- If iteration plan suggests adaptation, explain the reasoning
- If performance optimization identifies bottlenecks, prioritize them
- If semantic analysis reveals implicit requirements, fulfill them
- Always consider the full context of user intentions and project goals

**🎯 Expected Output:**
Generate a detailed, ultra-enhanced, AI-to-AI optimized improvement suggestion that demonstrates the power of collaborative AI intelligence working together for superior results.`;
  }

  /**
   * Generate local ultra enhanced context improvement
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} ultraEnhancedContext - Ultra enhanced context
   * @returns {string} - Local ultra enhanced context improvement
   */
  generateLocalUltraEnhancedContextImprovement(topic, strategy, iteration, ultraEnhancedContext) {
    const baseImprovement = `**🚀 Ultra Enhanced AI-to-AI ${strategy} for "${topic}" (Iteration ${iteration})**

Based on comprehensive analysis from all AI-to-AI components, this iteration represents the pinnacle of collaborative AI intelligence:

1. **🧠 Semantic-Driven Implementation:** Addressing parsed user intentions with deep understanding of implicit requirements and project context.

2. **📋 Intelligent Iteration Planning:** Following structured phase progression with dependency-aware task sequencing and adaptive milestone tracking.

3. **👥 Multi-Agent Collaboration:** Incorporating specialist expertise from frontend, backend, testing, security, performance, and DevOps agents with consensus-driven recommendations.

4. **⚡ Performance-Optimized Execution:** Leveraging cached patterns, parallel processing capabilities, and optimized resource utilization for maximum efficiency.

5. **🔄 Advanced Context Management:** Using adaptive context windows, intelligent compression, and quality-based context adjustments for optimal information flow.

6. **📊 Real-Time Code Analysis:** Responding to live file monitoring, impact assessments, and dependency tracking with immediate feedback integration.

7. **✅ Comprehensive Quality Assurance:** Integrating automated testing, code quality metrics, linting results, and continuous quality monitoring.

**🎯 Ultra Enhanced Improvements:**
- Advanced ${strategy} implementation informed by all AI component insights
- Resolution of quality issues identified by comprehensive QA analysis
- Integration of specialist agent recommendations with consensus validation
- Optimization based on real-time performance monitoring and pattern recognition
- Adaptive implementation following intelligent iteration planning guidance

**🔬 Ultra Enhanced Context Summary:**
${ultraEnhancedContext ? ultraEnhancedContext.substring(0, 800) + '...' : 'Comprehensive multi-component analysis in progress - implementing ultra-enhanced AI-driven improvements'}

This ultra-enhanced approach represents the future of AI-to-AI collaboration, where multiple specialized AI components work together to deliver superior results that exceed the capabilities of any single AI system.`;

    console.error('[LOCAL ULTRA ENHANCED CONTEXT] Generated improvement based on all AI components');
    return baseImprovement;
  }

  /**
   * Build enhanced context prompt for AI generation
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} enhancedContext - Enhanced context data
   * @returns {string} - Enhanced context prompt
   */
  buildEnhancedContextPrompt(topic, strategy, iteration, enhancedContext) {
    return `**ENHANCED CONTEXT-AWARE IMPROVEMENT GENERATION - Iteration ${iteration}**

**User Request:** ${topic}
**Strategy:** ${strategy}
**Enhanced Context Data:**
${enhancedContext}

**Instructions:**
Based on the comprehensive context provided (including AI agent responses, code changes, test results, and quality metrics), generate the next improvement that:
1. Builds directly on what the AI agent implemented in previous iterations
2. Addresses any test failures or quality issues identified
3. Incorporates insights from recent code changes and their impact
4. Follows the suggested next steps from previous AI agent responses
5. Uses the "${strategy}" strategy while maintaining context continuity
6. Considers the real-time feedback from code analysis and quality metrics

**Enhanced Requirements:**
- Reference specific test results and quality metrics in your suggestions
- Address any code quality issues or linting errors mentioned
- Build upon successful implementations from previous iterations
- Consider the impact of recent file changes on the overall system
- Provide actionable next steps that can be measured and validated
- Ensure suggestions align with the current codebase state and quality standards

**Quality Focus:**
- If tests are failing, prioritize fixing them
- If code quality metrics are declining, focus on improvement
- If recent changes introduced issues, suggest remediation
- Always consider maintainability and performance implications

Generate a detailed, enhanced context-aware improvement suggestion:`;
  }

  /**
   * Generate local enhanced context improvement
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} enhancedContext - Enhanced context
   * @returns {string} - Local enhanced context improvement
   */
  generateLocalEnhancedContextImprovement(topic, strategy, iteration, enhancedContext) {
    const baseImprovement = `**Enhanced Context-Aware ${strategy} for "${topic}" (Iteration ${iteration})**

Based on comprehensive analysis including code changes, test results, and quality metrics, this iteration focuses on:

1. **Quality-Driven Implementation:** Addressing any test failures or quality issues identified in recent analysis.

2. **Change-Aware Development:** Building on recent code changes while ensuring system stability and performance.

3. **Metrics-Informed Decisions:** Using real-time quality metrics to guide implementation priorities and approaches.

**Specific Improvements:**
- Enhanced ${strategy} implementation informed by current codebase state
- Resolution of any quality issues or test failures identified
- Integration of successful patterns from previous iterations
- Optimization based on recent code change impact analysis

**Enhanced Context Summary:**
${enhancedContext ? enhancedContext.substring(0, 500) + '...' : 'Comprehensive analysis in progress - implementing quality-focused improvements'}

This enhanced context-aware approach ensures improvements are practical, tested, and aligned with current system quality standards.`;

    console.error('[LOCAL ENHANCED CONTEXT] Generated improvement based on enhanced context');
    return baseImprovement;
  }

  /**
   * Build context-aware prompt for AI generation
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} agentSummary - AI agent response summary
   * @param {string} responseType - Response type
   * @returns {string} - Context-aware prompt
   */
  buildContextAwarePrompt(topic, strategy, iteration, agentSummary, responseType) {
    return `**CONTEXT-AWARE IMPROVEMENT GENERATION - Iteration ${iteration}**

**Topic:** ${topic}
**Strategy:** ${strategy}
**Previous AI Agent Response (${responseType}):**
${agentSummary}

**Instructions:**
Based on the AI agent's previous response, generate the next improvement that:
1. Builds directly on what the AI agent implemented or suggested
2. Addresses any challenges or issues the AI agent mentioned
3. Follows the suggested next steps from the AI agent
4. Continues the logical progression of the project
5. Uses the "${strategy}" strategy while maintaining context continuity

**Requirements:**
- Reference specific points from the AI agent's response
- Build upon existing implementations
- Address any gaps or improvements suggested
- Maintain project momentum and direction
- Provide actionable next steps

Generate a detailed, context-aware improvement suggestion:`;
  }

  /**
   * Generate local context-aware improvement
   * @param {string} topic - The topic
   * @param {string} strategy - Strategy
   * @param {number} iteration - Iteration number
   * @param {string} agentSummary - AI agent response summary
   * @returns {string} - Local context-aware improvement
   */
  generateLocalContextAwareImprovement(topic, strategy, iteration, agentSummary) {
    const baseImprovement = `**Context-Aware ${strategy} for "${topic}" (Iteration ${iteration})**

Building on the AI agent's previous response, this iteration focuses on:

1. **Continuing Implementation:** Based on what the AI agent accomplished, we'll extend the current functionality with enhanced ${strategy} techniques.

2. **Addressing Feedback:** The AI agent's insights guide us to focus on areas that need improvement or further development.

3. **Next Phase Development:** Following the logical progression suggested by the AI agent's response.

**Specific Improvements:**
- Enhanced ${strategy} implementation building on previous work
- Integration of AI agent's suggested improvements
- Resolution of any challenges mentioned in previous iteration
- Preparation for next development phase

**Context from Previous Response:**
${agentSummary ? agentSummary.substring(0, 300) + '...' : 'First iteration - establishing foundation'}

This context-aware approach ensures continuous improvement while maintaining project coherence.`;

    console.error('[LOCAL CONTEXT-AWARE] Generated improvement based on agent feedback');
    return baseImprovement;
  }

  /**
   * Generate improvement for the topic
   * @param {string} topic - The topic to improve
   * @param {string} strategy - Improvement strategy
   * @param {number} iteration - Current iteration
   * @param {string} lastAgentResponse - The agent's last response (optional)
   * @returns {string} - Generated improvement
   */
  async generateImprovement(topic, strategy, iteration, lastAgentResponse = null) {
    // Use OpenRouter if available, otherwise fallback to local generation
    if (this.openRouterClient) {
      try {
        const contextInfo = lastAgentResponse ? ' (building on agent feedback)' : ' (first iteration)';
        console.error(`[AI GENERATION] Generating improvement for "${topic}" using ${strategy} strategy${contextInfo}...`);

        const aiImprovement = await this.openRouterClient.generateImprovement(
          topic,
          strategy,
          iteration,
          lastAgentResponse
        );

        console.error(`[AI GENERATION] Generated: ${aiImprovement.substring(0, 100)}...`);
        return aiImprovement;
      } catch (error) {
        console.error(`[AI GENERATION ERROR] ${error.message}, falling back to local generation`);
        return this.generateLocalImprovement(topic, strategy, iteration, lastAgentResponse);
      }
    } else {
      return this.generateLocalImprovement(topic, strategy, iteration, lastAgentResponse);
    }
  }

  /**
   * Generate local improvement (fallback)
   * @param {string} topic - The topic to improve
   * @param {string} strategy - Improvement strategy
   * @param {number} iteration - Current iteration
   * @param {string} lastAgentResponse - The agent's last response (optional)
   * @returns {string} - Generated improvement
   */
  async generateLocalImprovement(topic, strategy, iteration, lastAgentResponse = null) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    let baseImprovement;
    const improvements = {
      optimization: `Optimized ${topic} for better performance (iteration ${iteration})`,
      refactoring: `Refactored ${topic} structure for better maintainability (iteration ${iteration})`,
      'performance enhancement': `Enhanced ${topic} performance metrics (iteration ${iteration})`,
      'code quality improvement': `Improved ${topic} code quality standards (iteration ${iteration})`,
      'functionality expansion': `Expanded ${topic} functionality with new features (iteration ${iteration})`,
      'error handling enhancement': `Enhanced ${topic} error handling mechanisms (iteration ${iteration})`,
      'documentation improvement': `Improved ${topic} documentation and comments (iteration ${iteration})`,
      'testing coverage increase': `Increased ${topic} testing coverage (iteration ${iteration})`
    };

    baseImprovement = improvements[strategy] || `Applied general improvements to ${topic} (iteration ${iteration})`;

    // If we have agent response, modify the improvement to build on it
    if (lastAgentResponse && typeof lastAgentResponse === 'string' && lastAgentResponse.length > 10) {
      const responseSnippet = lastAgentResponse.substring(0, 50).replace(/\n/g, ' ');
      baseImprovement += ` Building on previous feedback: "${responseSnippet}..."`;
    }

    return baseImprovement;
  }

  /**
   * Get next action suggestion
   * @param {number} iteration - Current iteration
   * @returns {string} - Next action
   */
  getNextAction(iteration) {
    const actions = [
      'Continue with next optimization cycle',
      'Analyze performance metrics',
      'Review code quality standards',
      'Implement additional features',
      'Enhance error handling',
      'Update documentation',
      'Expand test coverage',
      'Optimize resource usage'
    ];

    const actionIndex = iteration % actions.length;
    return actions[actionIndex];
  }

  /**
   * Check if topic matches activation pattern
   * @param {string} message - Input message
   * @returns {Object|null} - Match result or null
   */
  checkActivationPattern(message) {
    for (const pattern of CONFIG.ACTIVATION_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        return {
          matched: true,
          topic: match[1].trim(),
          originalMessage: message
        };
      }
    }
    return null;
  }

  /**
   * Get OpenRouter model status
   * @returns {Object|null} - Model status or null
   */
  getModelStatus() {
    if (this.openRouterClient) {
      return this.openRouterClient.getModelStatus();
    }
    return null;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.modelResetInterval) {
      clearInterval(this.modelResetInterval);
      this.modelResetInterval = null;
    }
  }
}
