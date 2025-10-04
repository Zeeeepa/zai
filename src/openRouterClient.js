import { CONFIG } from './config.js';
import { APIKeyManager } from './apiKeyManager.js';

// Use global fetch (available in Node.js 18+)
// If using older Node.js, uncomment the line below:
// import fetch from 'node-fetch';

export class OpenRouterClient {
  constructor(apiKeys, model = CONFIG.DEFAULT_MODEL) {
    // Initialize API Key Manager
    this.apiKeyManager = new APIKeyManager(apiKeys);
    this.primaryModel = model;
    this.apiUrl = CONFIG.OPENROUTER_API_URL;
    this.fallbackModels = CONFIG.FALLBACK_MODELS;
    this.currentModelIndex = 0;
    this.failedModels = new Set(); // Track models that have failed

    // Ensure primary model is first in fallback list
    if (!this.fallbackModels.includes(this.primaryModel)) {
      this.fallbackModels = [this.primaryModel, ...this.fallbackModels];
    }

    console.error(`[OPENROUTER] Initialized with primary model: ${this.primaryModel}`);
    console.error(`[OPENROUTER] Available fallback models: ${this.fallbackModels.length}`);
    console.error(`[OPENROUTER] API Key Manager: ${this.apiKeyManager.apiKeys.length} key(s) available`);
  }

  /**
   * Get next available model to try
   * @returns {string|null} - Next model or null if all failed
   */
  getNextModel() {
    // Filter out failed models and get available ones
    const availableModels = this.fallbackModels.filter(model => !this.failedModels.has(model));

    if (availableModels.length === 0) {
      console.error('[OPENROUTER] All models have failed, using local fallback');
      return null;
    }

    // Get next model in rotation
    const model = availableModels[this.currentModelIndex % availableModels.length];
    this.currentModelIndex++;

    return model;
  }

  /**
   * Mark a model as failed
   * @param {string} model - Model that failed
   * @param {string} reason - Reason for failure
   */
  markModelFailed(model, reason) {
    this.failedModels.add(model);
    console.error(`[OPENROUTER] Model ${model} marked as failed: ${reason}`);
    console.error(`[OPENROUTER] Failed models: ${Array.from(this.failedModels).join(', ')}`);
  }

  /**
   * Reset failed models (call periodically to retry failed models)
   */
  resetFailedModels() {
    console.error(`[OPENROUTER] Resetting ${this.failedModels.size} failed models`);
    this.failedModels.clear();
    this.currentModelIndex = 0;
  }

  /**
   * Generate AI improvement using OpenRouter with model fallback
   * @param {string} topic - The topic to improve
   * @param {string} strategy - The improvement strategy
   * @param {number} iteration - Current iteration number
   * @param {string} lastAgentResponse - The agent's last response (optional)
   * @returns {Promise<string>} - Generated improvement
   */
  async generateImprovement(topic, strategy, iteration, lastAgentResponse = null) {
    const systemPrompt = CONFIG.PROMPT_TEMPLATES.IMPROVEMENT_SYSTEM;

    // Choose prompt template based on whether we have agent response
    let userPrompt;
    if (lastAgentResponse && lastAgentResponse.length > 10) {
      userPrompt = CONFIG.PROMPT_TEMPLATES.IMPROVEMENT_USER_FOLLOWUP
        .replace('{topic}', topic)
        .replace('{iteration}', iteration)
        .replace('{strategy}', strategy)
        .replace('{strategy}', strategy) // Replace both occurrences
        .replace('{agentResponse}', lastAgentResponse);
    } else {
      userPrompt = CONFIG.PROMPT_TEMPLATES.IMPROVEMENT_USER_FIRST
        .replace('{topic}', topic)
        .replace('{iteration}', iteration)
        .replace('{strategy}', strategy)
        .replace('{strategy}', strategy); // Replace both occurrences
    }

    // Try up to 3 different model/key combinations
    for (let attempt = 0; attempt < 3; attempt++) {
      const model = this.getNextModel();

      if (!model) {
        console.error('[OPENROUTER] No available models, falling back to local generation');
        return this.generateFallbackImprovement(topic, strategy, iteration, lastAgentResponse);
      }

      // Get next available API key
      const keyInfo = this.apiKeyManager.getNextAvailableKey();
      if (!keyInfo) {
        console.error('[OPENROUTER] No available API keys, falling back to local generation');
        return this.generateFallbackImprovement(topic, strategy, iteration, lastAgentResponse);
      }

      try {
        console.error(`[OPENROUTER] Attempt ${attempt + 1}: Trying model ${model} with API key ${keyInfo.index + 1}`);

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keyInfo.key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/mcp-infinite-loop/mcp-infinite-loop-server',
            'X-Title': 'MCP Infinite Loop Server'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 200,
            top_p: 0.9
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          const errorMsg = `${response.status} - ${errorData}`;

          // Check if it's a rate limit or model-specific error
          if (response.status === 429 || errorData.includes('rate-limited') || errorData.includes('temporarily')) {
            console.error(`[OPENROUTER] API key ${keyInfo.index + 1} rate limited for model ${model}`);
            this.apiKeyManager.markKeyRateLimited(keyInfo.index, `Rate limited (${response.status})`);
            this.markModelFailed(model, 'Rate limited');
            continue; // Try next model/key combination
          } else if (response.status === 401 || errorData.includes('unauthorized') || errorData.includes('invalid')) {
            console.error(`[OPENROUTER] API key ${keyInfo.index + 1} unauthorized or invalid`);
            this.apiKeyManager.markKeyFailed(keyInfo.index, `Unauthorized (${response.status})`);
            continue; // Try next key
          } else if (response.status === 404 || errorData.includes('not found')) {
            console.error(`[OPENROUTER] Model ${model} not found with API key ${keyInfo.index + 1}`);
            this.markModelFailed(model, 'Model not found');
            continue; // Try next model
          } else {
            console.error(`[OPENROUTER] API error with key ${keyInfo.index + 1}: ${errorMsg}`);
            this.apiKeyManager.markKeyFailed(keyInfo.index, errorMsg);
            continue; // Try next key
          }
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from OpenRouter API');
        }

        const improvement = data.choices[0].message.content.trim();

        // Mark API key as successful
        this.apiKeyManager.markKeySuccess(keyInfo.index);

        // Log successful usage
        console.error(`[OPENROUTER] Success with model: ${model} using API key ${keyInfo.index + 1}`);
        if (data.usage) {
          console.error(`[OPENROUTER] Tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
        }

        return improvement;

      } catch (error) {
        console.error(`[OPENROUTER] Error with model ${model} and API key ${keyInfo.index + 1}: ${error.message}`);

        // If it's a network error, mark key as failed and try next
        if (error.message.includes('fetch') || error.message.includes('network')) {
          this.apiKeyManager.markKeyFailed(keyInfo.index, 'Network error');
          this.markModelFailed(model, 'Network error');
          continue;
        }

        // For other errors, mark both key and model as problematic
        this.apiKeyManager.markKeyFailed(keyInfo.index, error.message);
        this.markModelFailed(model, error.message);
      }
    }

    // If all model/key combinations failed, use local fallback
    console.error('[OPENROUTER] All model/key combinations failed, using local fallback');
    return this.generateFallbackImprovement(topic, strategy, iteration, lastAgentResponse);
  }

  /**
   * Generate fallback improvement when API fails
   * @param {string} topic - The topic to improve
   * @param {string} strategy - The improvement strategy
   * @param {number} iteration - Current iteration number
   * @returns {string} - Fallback improvement
   */
  generateFallbackImprovement(topic, strategy, iteration) {
    const fallbackImprovements = {
      optimization: `Optimize ${topic} by implementing caching mechanisms and reducing computational complexity (iteration ${iteration})`,
      refactoring: `Refactor ${topic} by breaking down complex components into smaller, more maintainable modules (iteration ${iteration})`,
      'performance enhancement': `Enhance ${topic} performance by implementing lazy loading and efficient data structures (iteration ${iteration})`,
      'code quality improvement': `Improve ${topic} code quality by adding comprehensive error handling and input validation (iteration ${iteration})`,
      'functionality expansion': `Expand ${topic} functionality by adding new features based on user feedback and requirements (iteration ${iteration})`,
      'error handling enhancement': `Enhance ${topic} error handling by implementing graceful degradation and detailed logging (iteration ${iteration})`,
      'documentation improvement': `Improve ${topic} documentation by adding comprehensive examples and API references (iteration ${iteration})`,
      'testing coverage increase': `Increase ${topic} testing coverage by implementing unit tests and integration tests (iteration ${iteration})`
    };

    return fallbackImprovements[strategy] || `Apply general improvements to ${topic} using ${strategy} approach (iteration ${iteration})`;
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/your-repo/mcp-infinite-loop-server',
          'X-Title': 'MCP Infinite Loop Server'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: 'Test connection'
            }
          ],
          max_tokens: 10
        })
      });

      return response.ok;
    } catch (error) {
      console.error(`[OPENROUTER TEST] Connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get model information
   * @returns {Object} - Model configuration
   */
  getModelInfo() {
    const availableModels = this.fallbackModels.filter(model => !this.failedModels.has(model));
    const keyStatus = this.apiKeyManager.getKeyStatus();

    return {
      primaryModel: this.primaryModel,
      currentModel: this.getNextModel(),
      availableModels: availableModels,
      failedModels: Array.from(this.failedModels),
      totalModels: this.fallbackModels.length,
      apiUrl: this.apiUrl,
      apiKeys: {
        total: keyStatus.totalKeys,
        available: keyStatus.availableKeys,
        rateLimited: keyStatus.rateLimitedKeys,
        failed: keyStatus.failedKeys
      }
    };
  }

  /**
   * Get status of all models and API keys
   * @returns {Object} - Detailed model and key status
   */
  getModelStatus() {
    const keyStatus = this.apiKeyManager.getKeyStatus();
    const keyStats = this.apiKeyManager.getStatistics();

    return {
      models: {
        allModels: this.fallbackModels,
        availableModels: this.fallbackModels.filter(model => !this.failedModels.has(model)),
        failedModels: Array.from(this.failedModels),
        currentIndex: this.currentModelIndex,
        primaryModel: this.primaryModel
      },
      apiKeys: keyStatus,
      statistics: keyStats
    };
  }

  /**
   * Reset failed API keys
   * @returns {number} - Number of keys reset
   */
  resetFailedKeys() {
    return this.apiKeyManager.resetAllKeys();
  }
}
