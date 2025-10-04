import { EventEmitter } from 'events';

/**
 * Dynamic Context Manager for AI-to-AI Communication
 * Handles adaptive context windows, compression, and intelligent context management
 */
export class ContextManager extends EventEmitter {
  constructor() {
    super();
    this.contextHistory = new Map(); // loopId -> context data
    this.compressionThreshold = 5000; // tokens
    this.maxContextWindow = 8000; // tokens
    this.minContextWindow = 1000; // tokens
  }

  /**
   * Adaptive context window based on conversation complexity
   * @param {Object} loopData - Loop data
   * @param {string} complexity - Project complexity (simple, medium, complex)
   * @returns {number} - Optimal context window size
   */
  adaptiveContextWindow(loopData, complexity = 'medium') {
    const baseWindows = {
      simple: 1500,
      medium: 3000,
      complex: 6000,
      enterprise: 8000
    };

    let contextSize = baseWindows[complexity] || baseWindows.medium;

    // Adjust based on iteration count
    if (loopData.iteration > 10) {
      contextSize += 1000; // More context for longer conversations
    }

    // Adjust based on error rate
    const errorRate = this.calculateErrorRate(loopData);
    if (errorRate > 0.3) {
      contextSize += 500; // More context if many errors
    }

    // Adjust based on response quality
    const avgQuality = this.calculateAverageQuality(loopData);
    if (avgQuality < 0.7) {
      contextSize += 800; // More context for poor quality responses
    }

    return Math.min(Math.max(contextSize, this.minContextWindow), this.maxContextWindow);
  }

  /**
   * Compress context history for long conversations
   * @param {Array} agentResponseHistory - History of agent responses
   * @param {number} targetSize - Target size in tokens
   * @returns {string} - Compressed context
   */
  compressContextHistory(agentResponseHistory, targetSize = 2000) {
    if (!agentResponseHistory || agentResponseHistory.length === 0) {
      return '';
    }

    // Keep recent responses in full detail
    const recentCount = Math.min(3, agentResponseHistory.length);
    const recentResponses = agentResponseHistory.slice(-recentCount);

    // Compress older responses
    const olderResponses = agentResponseHistory.slice(0, -recentCount);

    let compressed = '';

    // Add compressed summary of older responses
    if (olderResponses.length > 0) {
      compressed += '**Previous Iterations Summary:**\n';

      const keyAchievements = this.extractKeyAchievements(olderResponses);
      const mainChallenges = this.extractMainChallenges(olderResponses);
      const evolutionPattern = this.analyzeEvolutionPattern(olderResponses);

      compressed += `- Key Achievements: ${keyAchievements}\n`;
      compressed += `- Main Challenges: ${mainChallenges}\n`;
      compressed += `- Evolution Pattern: ${evolutionPattern}\n\n`;
    }

    // Add recent responses in detail
    compressed += '**Recent Detailed History:**\n';
    recentResponses.forEach((response, index) => {
      const iterationNum = agentResponseHistory.length - recentCount + index + 1;
      compressed += `**Iteration ${iterationNum}:**\n`;
      compressed += `${this.summarizeResponse(response.response)}\n\n`;
    });

    return this.truncateToTokenLimit(compressed, targetSize);
  }

  /**
   * Calculate error rate for a loop
   * @param {Object} loopData - Loop data
   * @returns {number} - Error rate (0-1)
   */
  calculateErrorRate(loopData) {
    if (!loopData.results || loopData.results.length === 0) {return 0;}

    const errors = loopData.results.filter(result => !result.success || result.error);
    return errors.length / loopData.results.length;
  }

  /**
   * Calculate average quality score
   * @param {Object} loopData - Loop data
   * @returns {number} - Average quality (0-1)
   */
  calculateAverageQuality(loopData) {
    if (!loopData.agentResponseHistory || loopData.agentResponseHistory.length === 0) {
      return 0.8; // Default quality
    }

    const qualityScores = loopData.agentResponseHistory.map(response =>
      this.assessResponseQuality(response.response)
    );

    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  /**
   * Assess response quality
   * @param {string} response - Agent response
   * @returns {number} - Quality score (0-1)
   */
  assessResponseQuality(response) {
    if (!response || response.length < 50) {return 0.2;}

    let score = 0.5; // Base score

    // Check for implementation details
    if (response.includes('Implementation:') || response.includes('implemented')) {score += 0.2;}

    // Check for specific code changes
    if (response.includes('Code Changes:') || response.includes('modified')) {score += 0.15;}

    // Check for results/outcomes
    if (response.includes('Results:') || response.includes('achieved')) {score += 0.1;}

    // Check for next steps
    if (response.includes('Next Steps:') || response.includes('continue')) {score += 0.05;}

    // Penalty for very short responses
    if (response.length < 200) {score -= 0.2;}

    // Bonus for detailed responses
    if (response.length > 1000) {score += 0.1;}

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Extract key achievements from responses
   * @param {Array} responses - Array of responses
   * @returns {string} - Summary of key achievements
   */
  extractKeyAchievements(responses) {
    const achievements = [];

    responses.forEach(response => {
      const text = response.response || '';

      // Look for achievement indicators
      const achievementPatterns = [
        /implemented\s+([^.]+)/gi,
        /created\s+([^.]+)/gi,
        /added\s+([^.]+)/gi,
        /enhanced\s+([^.]+)/gi,
        /optimized\s+([^.]+)/gi
      ];

      achievementPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          achievements.push(...matches.slice(0, 2)); // Limit to 2 per pattern
        }
      });
    });

    return achievements.slice(0, 5).join(', ') || 'Various improvements implemented';
  }

  /**
   * Extract main challenges from responses
   * @param {Array} responses - Array of responses
   * @returns {string} - Summary of main challenges
   */
  extractMainChallenges(responses) {
    const challenges = [];

    responses.forEach(response => {
      const text = response.response || '';

      // Look for challenge indicators
      const challengePatterns = [
        /challenge[s]?\s*:?\s*([^.]+)/gi,
        /difficult[y]?\s+([^.]+)/gi,
        /issue[s]?\s+([^.]+)/gi,
        /problem[s]?\s+([^.]+)/gi
      ];

      challengePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          challenges.push(...matches.slice(0, 1)); // Limit to 1 per pattern
        }
      });
    });

    return challenges.slice(0, 3).join(', ') || 'Standard implementation challenges';
  }

  /**
   * Analyze evolution pattern in responses
   * @param {Array} responses - Array of responses
   * @returns {string} - Evolution pattern description
   */
  analyzeEvolutionPattern(responses) {
    if (responses.length < 2) {return 'Initial development phase';}

    const early = responses.slice(0, Math.ceil(responses.length / 2));
    const later = responses.slice(Math.ceil(responses.length / 2));

    const earlyFocus = this.identifyFocus(early);
    const laterFocus = this.identifyFocus(later);

    return `Evolved from ${earlyFocus} to ${laterFocus}`;
  }

  /**
   * Identify focus area of responses
   * @param {Array} responses - Array of responses
   * @returns {string} - Focus area
   */
  identifyFocus(responses) {
    const focusAreas = {
      performance: ['performance', 'optimization', 'speed', 'cache'],
      ui: ['ui', 'interface', 'design', 'visual', 'css'],
      functionality: ['feature', 'function', 'capability', 'implement'],
      quality: ['quality', 'refactor', 'clean', 'maintain'],
      testing: ['test', 'coverage', 'validation', 'verify']
    };

    const scores = {};
    Object.keys(focusAreas).forEach(area => {
      scores[area] = 0;
    });

    responses.forEach(response => {
      const text = (response.response || '').toLowerCase();

      Object.entries(focusAreas).forEach(([area, keywords]) => {
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            scores[area]++;
          }
        });
      });
    });

    const topArea = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
    return topArea[0];
  }

  /**
   * Summarize a response
   * @param {string} response - Full response
   * @returns {string} - Summarized response
   */
  summarizeResponse(response) {
    if (!response || response.length < 100) {return response;}

    // Extract key sections
    const sections = {
      implementation: this.extractSection(response, 'Implementation'),
      results: this.extractSection(response, 'Results'),
      changes: this.extractSection(response, 'Code Changes'),
      nextSteps: this.extractSection(response, 'Next Steps')
    };

    let summary = '';
    Object.entries(sections).forEach(([key, content]) => {
      if (content && typeof content === 'string') {
        summary += `${key}: ${content.substring(0, 100)}...\n`;
      }
    });

    return summary || (response && typeof response === 'string' ? response.substring(0, 200) + '...' : 'No response available');
  }

  /**
   * Extract section from response
   * @param {string} response - Full response
   * @param {string} sectionName - Section to extract
   * @returns {string} - Extracted section
   */
  extractSection(response, sectionName) {
    const regex = new RegExp(`\\*\\*${sectionName}[:\\s]*\\*\\*([^*]+)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Truncate text to token limit (approximate)
   * @param {string} text - Text to truncate
   * @param {number} tokenLimit - Token limit
   * @returns {string} - Truncated text
   */
  truncateToTokenLimit(text, tokenLimit) {
    // Rough approximation: 1 token ≈ 4 characters
    const charLimit = tokenLimit * 4;

    if (!text || typeof text !== 'string') {return 'No content available';}
    if (text.length <= charLimit) {return text;}

    // Try to cut at sentence boundaries
    const truncated = text.substring(0, charLimit);
    const lastSentence = truncated.lastIndexOf('.');

    if (lastSentence > charLimit * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    }

    return truncated + '...';
  }

  /**
   * Get optimized context for iteration
   * @param {string} loopId - Loop ID
   * @param {Object} loopData - Loop data
   * @param {string} complexity - Project complexity
   * @returns {Object} - Optimized context
   */
  getOptimizedContext(loopId, loopData, complexity = 'medium') {
    const contextWindow = this.adaptiveContextWindow(loopData, complexity);
    const compressedHistory = this.compressContextHistory(
      loopData.agentResponseHistory,
      Math.floor(contextWindow * 0.7)
    );

    return {
      contextWindow,
      compressedHistory,
      codebaseSummary: loopData.codebaseSummary,
      lastResponse: loopData.lastAgentResponse,
      qualityScore: this.calculateAverageQuality(loopData),
      errorRate: this.calculateErrorRate(loopData),
      recommendations: this.generateContextRecommendations(loopData)
    };
  }

  /**
   * Generate context recommendations
   * @param {Object} loopData - Loop data
   * @returns {Array} - Array of recommendations
   */
  generateContextRecommendations(loopData) {
    const recommendations = [];

    const errorRate = this.calculateErrorRate(loopData);
    const quality = this.calculateAverageQuality(loopData);

    if (errorRate > 0.3) {
      recommendations.push('Consider breaking down complex tasks into smaller steps');
    }

    if (quality < 0.6) {
      recommendations.push('Request more detailed implementation descriptions');
    }

    if (loopData.iteration > 15) {
      recommendations.push('Consider summarizing progress and refocusing goals');
    }

    return recommendations;
  }
}
