import { EventEmitter } from 'events';

/**
 * Enhanced Communication Protocols for AI-to-AI Communication
 * Standardizes communication format and handles clarification requests
 */
export class CommunicationProtocol extends EventEmitter {
  constructor() {
    super();
    this.communicationHistory = new Map(); // loopId -> communication history
    this.clarificationRequests = new Map(); // loopId -> pending clarifications
    this.responseTemplates = this.initializeResponseTemplates();
    this.qualityThresholds = this.initializeQualityThresholds();
  }

  /**
   * Initialize response templates
   * @returns {Object} - Response templates
   */
  initializeResponseTemplates() {
    return {
      implementation: {
        required: ['implementation', 'results', 'code_changes', 'next_steps', 'status'],
        format: {
          implementation: 'Detailed steps taken to implement the improvement',
          results: 'Specific outcomes and improvements achieved',
          code_changes: 'Any code modifications, optimizations, or new features added',
          next_steps: 'Concrete suggestions for the next iteration',
          status: 'Current status and continuation directive'
        }
      },
      analysis: {
        required: ['analysis', 'findings', 'recommendations', 'impact', 'next_steps'],
        format: {
          analysis: 'Detailed analysis of the current state',
          findings: 'Key findings and insights discovered',
          recommendations: 'Specific recommendations for improvement',
          impact: 'Expected impact and benefits',
          next_steps: 'Suggested next steps for implementation'
        }
      },
      testing: {
        required: ['test_results', 'coverage', 'issues', 'fixes', 'next_steps'],
        format: {
          test_results: 'Test execution results and statistics',
          coverage: 'Code coverage metrics and analysis',
          issues: 'Issues found and their severity',
          fixes: 'Fixes applied and their effectiveness',
          next_steps: 'Next testing priorities and improvements'
        }
      }
    };
  }

  /**
   * Initialize quality thresholds
   * @returns {Object} - Quality thresholds
   */
  initializeQualityThresholds() {
    return {
      minResponseLength: 200,
      maxResponseLength: 5000,
      requiredSections: 3,
      clarificationThreshold: 0.7, // Confidence threshold for clarification
      implementationConfidence: 0.8,
      detailLevel: {
        low: 0.3,
        medium: 0.6,
        high: 0.9
      }
    };
  }

  /**
   * Standardize agent communication
   * @param {string} loopId - Loop ID
   * @param {string} response - Agent response
   * @param {string} type - Response type
   * @returns {Object} - Standardized communication
   */
  standardizeAgentCommunication(loopId, response, type = 'implementation') {
    console.error(`[COMMUNICATION PROTOCOL] Standardizing ${type} response for loop ${loopId}`);

    const template = this.responseTemplates[type] || this.responseTemplates.implementation;
    const standardized = {
      loopId,
      timestamp: new Date(),
      type,
      originalResponse: response,
      structured: this.extractStructuredData(response, template),
      metadata: this.extractMetadata(response),
      quality: this.assessResponseQuality(response, template),
      confidence: this.calculateConfidence(response, template),
      clarificationNeeded: false,
      clarificationRequests: []
    };

    // Check if clarification is needed
    if (standardized.confidence < this.qualityThresholds.clarificationThreshold) {
      standardized.clarificationNeeded = true;
      standardized.clarificationRequests = this.generateClarificationRequests(response, template);
    }

    // Store communication history
    this.storeCommunication(loopId, standardized);

    this.emit('communicationStandardized', standardized);

    return standardized;
  }

  /**
   * Extract structured data from response
   * @param {string} response - Agent response
   * @param {Object} template - Response template
   * @returns {Object} - Structured data
   */
  extractStructuredData(response, template) {
    const structured = {};

    template.required.forEach(section => {
      structured[section] = this.extractSection(response, section, template.format[section]);
    });

    return structured;
  }

  /**
   * Extract section from response
   * @param {string} response - Full response
   * @param {string} sectionName - Section name
   * @param {string} description - Section description
   * @returns {Object} - Section data
   */
  extractSection(response, sectionName, description) {
    const sectionPatterns = [
      new RegExp(`\\*\\*${sectionName}[:\\s]*\\*\\*([^*]+)`, 'i'),
      new RegExp(`${sectionName}[:\\s]*([^\\n]+)`, 'i'),
      new RegExp(`## ${sectionName}([^#]+)`, 'i')
    ];

    let content = null;
    let confidence = 0;

    for (const pattern of sectionPatterns) {
      const match = response.match(pattern);
      if (match) {
        content = match[1].trim();
        confidence = this.calculateSectionConfidence(content, description);
        break;
      }
    }

    // Fallback: search for keywords related to the section
    if (!content) {
      content = this.extractByKeywords(response, sectionName);
      confidence = content ? 0.3 : 0;
    }

    return {
      content: content || `No ${sectionName} information found`,
      confidence,
      extracted: !!content,
      length: content ? content.length : 0
    };
  }

  /**
   * Extract by keywords
   * @param {string} response - Response text
   * @param {string} sectionName - Section name
   * @returns {string} - Extracted content
   */
  extractByKeywords(response, sectionName) {
    const keywords = {
      implementation: ['implemented', 'created', 'added', 'modified', 'built'],
      results: ['achieved', 'improved', 'enhanced', 'optimized', 'result'],
      code_changes: ['changed', 'updated', 'refactored', 'modified', 'code'],
      next_steps: ['next', 'continue', 'future', 'plan', 'step'],
      analysis: ['analyzed', 'examined', 'reviewed', 'studied', 'found'],
      findings: ['discovered', 'identified', 'observed', 'noted', 'found'],
      recommendations: ['recommend', 'suggest', 'propose', 'advise', 'should']
    };

    const sectionKeywords = keywords[sectionName] || [];
    const sentences = response.split(/[.!?]+/);

    const relevantSentences = sentences.filter(sentence =>
      sectionKeywords.some(keyword =>
        sentence.toLowerCase().includes(keyword)
      )
    );

    return relevantSentences.slice(0, 3).join('. ').trim();
  }

  /**
   * Calculate section confidence
   * @param {string} content - Section content
   * @param {string} description - Expected description
   * @returns {number} - Confidence score (0-1)
   */
  calculateSectionConfidence(content, description) {
    if (!content || content.length < 10) {return 0;}

    let confidence = 0.5; // Base confidence

    // Length-based confidence
    if (content.length > 50) {confidence += 0.2;}
    if (content.length > 100) {confidence += 0.1;}

    // Keyword relevance
    const descriptionWords = description.toLowerCase().split(' ');
    const contentWords = content.toLowerCase().split(' ');
    const relevantWords = descriptionWords.filter(word =>
      contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))
    );

    confidence += (relevantWords.length / descriptionWords.length) * 0.3;

    return Math.min(confidence, 1);
  }

  /**
   * Extract metadata from response
   * @param {string} response - Agent response
   * @returns {Object} - Metadata
   */
  extractMetadata(response) {
    return {
      length: response.length,
      wordCount: response.split(/\s+/).length,
      sectionCount: (response.match(/\*\*[^*]+\*\*/g) || []).length,
      codeBlocks: (response.match(/```[^`]*```/g) || []).length,
      lists: (response.match(/^\s*[-*+]\s/gm) || []).length,
      hasImplementationDetails: /implement|create|add|modify|build/i.test(response),
      hasResults: /result|achieve|improve|enhance|optimize/i.test(response),
      hasNextSteps: /next|continue|future|plan|step/i.test(response),
      sentiment: this.analyzeSentiment(response)
    };
  }

  /**
   * Analyze sentiment of response
   * @param {string} response - Response text
   * @returns {string} - Sentiment (positive, neutral, negative)
   */
  analyzeSentiment(response) {
    const positiveWords = ['success', 'improve', 'enhance', 'optimize', 'achieve', 'complete', 'good', 'better', 'excellent'];
    const negativeWords = ['fail', 'error', 'problem', 'issue', 'difficult', 'challenge', 'bad', 'worse', 'broken'];

    const text = response.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) {return 'positive';}
    if (negativeCount > positiveCount) {return 'negative';}
    return 'neutral';
  }

  /**
   * Assess response quality
   * @param {string} response - Agent response
   * @param {Object} template - Response template
   * @returns {Object} - Quality assessment
   */
  assessResponseQuality(response, template) {
    const metadata = this.extractMetadata(response);
    let score = 0;
    const issues = [];
    const strengths = [];

    // Length assessment
    if (metadata.length < this.qualityThresholds.minResponseLength) {
      issues.push('Response too short');
      score -= 0.2;
    } else if (metadata.length > this.qualityThresholds.maxResponseLength) {
      issues.push('Response too long');
      score -= 0.1;
    } else {
      strengths.push('Appropriate length');
      score += 0.2;
    }

    // Structure assessment
    if (metadata.sectionCount >= this.qualityThresholds.requiredSections) {
      strengths.push('Well-structured');
      score += 0.3;
    } else {
      issues.push('Lacks proper structure');
      score -= 0.2;
    }

    // Content assessment
    if (metadata.hasImplementationDetails) {
      strengths.push('Contains implementation details');
      score += 0.2;
    } else {
      issues.push('Missing implementation details');
      score -= 0.2;
    }

    if (metadata.hasResults) {
      strengths.push('Includes results');
      score += 0.1;
    }

    if (metadata.hasNextSteps) {
      strengths.push('Provides next steps');
      score += 0.1;
    } else {
      issues.push('Missing next steps');
      score -= 0.1;
    }

    // Code blocks bonus
    if (metadata.codeBlocks > 0) {
      strengths.push('Includes code examples');
      score += 0.1;
    }

    const finalScore = Math.max(0, Math.min(1, 0.5 + score));

    return {
      score: finalScore,
      grade: this.getQualityGrade(finalScore),
      issues,
      strengths,
      metadata
    };
  }

  /**
   * Get quality grade
   * @param {number} score - Quality score
   * @returns {string} - Quality grade
   */
  getQualityGrade(score) {
    if (score >= 0.9) {return 'A';}
    if (score >= 0.8) {return 'B';}
    if (score >= 0.7) {return 'C';}
    if (score >= 0.6) {return 'D';}
    return 'F';
  }

  /**
   * Calculate confidence
   * @param {string} response - Agent response
   * @param {Object} template - Response template
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(response, template) {
    const structured = this.extractStructuredData(response, template);
    const quality = this.assessResponseQuality(response, template);

    // Average section confidence
    const sectionConfidences = Object.values(structured).map(section => section.confidence);
    const avgSectionConfidence = sectionConfidences.reduce((sum, conf) => sum + conf, 0) / sectionConfidences.length;

    // Combined confidence
    return (avgSectionConfidence * 0.6) + (quality.score * 0.4);
  }

  /**
   * Generate clarification requests
   * @param {string} response - Agent response
   * @param {Object} template - Response template
   * @returns {Array} - Clarification requests
   */
  generateClarificationRequests(response, template) {
    const requests = [];
    const structured = this.extractStructuredData(response, template);

    template.required.forEach(section => {
      const sectionData = structured[section];
      if (!sectionData.extracted || sectionData.confidence < 0.5) {
        requests.push({
          section,
          type: 'missing_content',
          question: `Could you provide more details about ${section}? ${template.format[section]}`,
          priority: this.getSectionPriority(section)
        });
      }
    });

    // Check for ambiguous statements
    const ambiguousPatterns = [
      /maybe|perhaps|might|could be|not sure|unclear/i,
      /some|various|several|many|few/i,
      /probably|likely|possibly/i
    ];

    ambiguousPatterns.forEach((pattern, index) => {
      if (pattern.test(response)) {
        requests.push({
          section: 'general',
          type: 'ambiguity',
          question: 'Could you be more specific about the uncertain aspects mentioned?',
          priority: 'medium'
        });
      }
    });

    return requests.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Get section priority
   * @param {string} section - Section name
   * @returns {string} - Priority level
   */
  getSectionPriority(section) {
    const priorities = {
      implementation: 'high',
      results: 'high',
      code_changes: 'medium',
      next_steps: 'medium',
      analysis: 'high',
      findings: 'high',
      recommendations: 'medium'
    };

    return priorities[section] || 'low';
  }

  /**
   * Get priority weight
   * @param {string} priority - Priority level
   * @returns {number} - Priority weight
   */
  getPriorityWeight(priority) {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[priority] || 1;
  }

  /**
   * Request clarification
   * @param {string} loopId - Loop ID
   * @param {Object} ambiguousRequirement - Ambiguous requirement
   * @returns {Object} - Clarification request
   */
  requestClarification(loopId, ambiguousRequirement) {
    const clarificationId = `clarification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const clarification = {
      id: clarificationId,
      loopId,
      timestamp: new Date(),
      requirement: ambiguousRequirement,
      questions: this.generateClarificationQuestions(ambiguousRequirement),
      status: 'pending',
      response: null
    };

    // Store clarification request
    if (!this.clarificationRequests.has(loopId)) {
      this.clarificationRequests.set(loopId, []);
    }
    this.clarificationRequests.get(loopId).push(clarification);

    console.error(`[COMMUNICATION PROTOCOL] Clarification requested for loop ${loopId}: ${clarificationId}`);

    this.emit('clarificationRequested', clarification);

    return clarification;
  }

  /**
   * Generate clarification questions
   * @param {Object} requirement - Ambiguous requirement
   * @returns {Array} - Clarification questions
   */
  generateClarificationQuestions(requirement) {
    const questions = [];

    if (requirement.type === 'vague_goal') {
      questions.push(
        'What specific outcomes are you looking to achieve?',
        'Are there particular areas or components you want to focus on?',
        'What would success look like for this improvement?'
      );
    } else if (requirement.type === 'technical_ambiguity') {
      questions.push(
        'Which specific technologies or frameworks should be used?',
        'Are there any constraints or requirements to consider?',
        'What is the preferred approach or methodology?'
      );
    } else if (requirement.type === 'scope_unclear') {
      questions.push(
        'What is the scope of this change (file, component, system)?',
        'Should this be a minimal change or comprehensive overhaul?',
        'Are there dependencies that need to be considered?'
      );
    } else {
      questions.push(
        'Could you provide more specific details about this requirement?',
        'What are the key priorities for this improvement?',
        'Are there any specific constraints or preferences?'
      );
    }

    return questions;
  }

  /**
   * Store communication
   * @param {string} loopId - Loop ID
   * @param {Object} communication - Communication data
   */
  storeCommunication(loopId, communication) {
    if (!this.communicationHistory.has(loopId)) {
      this.communicationHistory.set(loopId, []);
    }

    const history = this.communicationHistory.get(loopId);
    history.push(communication);

    // Keep only last 20 communications
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  /**
   * Get communication history
   * @param {string} loopId - Loop ID
   * @returns {Array} - Communication history
   */
  getCommunicationHistory(loopId) {
    return this.communicationHistory.get(loopId) || [];
  }

  /**
   * Get communication quality trends
   * @param {string} loopId - Loop ID
   * @returns {Object} - Quality trends
   */
  getCommunicationQualityTrends(loopId) {
    const history = this.getCommunicationHistory(loopId);
    if (history.length === 0) {return null;}

    const recentHistory = history.slice(-10); // Last 10 communications
    const qualityScores = recentHistory.map(comm => comm.quality.score);
    const confidenceScores = recentHistory.map(comm => comm.confidence);

    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

    // Calculate trends
    const qualityTrend = this.calculateTrend(qualityScores);
    const confidenceTrend = this.calculateTrend(confidenceScores);

    return {
      averageQuality: avgQuality,
      averageConfidence: avgConfidence,
      qualityTrend,
      confidenceTrend,
      totalCommunications: history.length,
      recentCommunications: recentHistory.length,
      clarificationRate: recentHistory.filter(comm => comm.clarificationNeeded).length / recentHistory.length
    };
  }

  /**
   * Calculate trend
   * @param {Array} values - Array of values
   * @returns {string} - Trend direction
   */
  calculateTrend(values) {
    if (values.length < 3) {return 'stable';}

    const recent = values.slice(-3);
    const earlier = values.slice(-6, -3);

    if (earlier.length === 0) {return 'stable';}

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;

    const change = (recentAvg - earlierAvg) / earlierAvg;

    if (change > 0.1) {return 'improving';}
    if (change < -0.1) {return 'declining';}
    return 'stable';
  }

  /**
   * Generate communication report
   * @param {string} loopId - Loop ID
   * @returns {Object} - Communication report
   */
  generateCommunicationReport(loopId) {
    const history = this.getCommunicationHistory(loopId);
    const trends = this.getCommunicationQualityTrends(loopId);
    const clarifications = this.clarificationRequests.get(loopId) || [];

    return {
      loopId,
      timestamp: new Date(),
      summary: {
        totalCommunications: history.length,
        averageQuality: trends?.averageQuality || 0,
        averageConfidence: trends?.averageConfidence || 0,
        clarificationRequests: clarifications.length,
        pendingClarifications: clarifications.filter(c => c.status === 'pending').length
      },
      trends,
      recentQuality: history.slice(-5).map(comm => ({
        timestamp: comm.timestamp,
        quality: comm.quality.score,
        confidence: comm.confidence,
        grade: comm.quality.grade
      })),
      recommendations: this.generateCommunicationRecommendations(trends, clarifications)
    };
  }

  /**
   * Generate communication recommendations
   * @param {Object} trends - Quality trends
   * @param {Array} clarifications - Clarification requests
   * @returns {Array} - Recommendations
   */
  generateCommunicationRecommendations(trends, clarifications) {
    const recommendations = [];

    if (trends) {
      if (trends.averageQuality < 0.6) {
        recommendations.push('Consider providing more detailed prompts to improve response quality');
      }

      if (trends.averageConfidence < 0.7) {
        recommendations.push('Responses show low confidence - consider breaking down complex tasks');
      }

      if (trends.clarificationRate > 0.3) {
        recommendations.push('High clarification rate - consider more specific initial requirements');
      }

      if (trends.qualityTrend === 'declining') {
        recommendations.push('Quality trend is declining - review communication approach');
      }
    }

    if (clarifications.length > 5) {
      recommendations.push('Many clarification requests - consider improving initial prompt clarity');
    }

    return recommendations;
  }
}
