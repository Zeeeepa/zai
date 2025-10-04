import { EventEmitter } from 'events';

/**
 * Semantic Understanding for AI-to-AI Communication
 * Analyzes user intentions and code semantics for better understanding
 */
export class SemanticAnalyzer extends EventEmitter {
  constructor() {
    super();
    this.intentionPatterns = this.initializeIntentionPatterns();
    this.codeSemantics = new Map(); // file -> semantic analysis
    this.userIntentHistory = new Map(); // loopId -> intent history
    this.domainKnowledge = this.initializeDomainKnowledge();
    this.contextualMappings = new Map(); // context -> semantic mappings
  }

  /**
   * Initialize intention patterns
   * @returns {Object} - Intention patterns
   */
  initializeIntentionPatterns() {
    return {
      improvement: {
        patterns: [
          /improve|enhance|optimize|better|upgrade/i,
          /make.*better|increase.*performance|reduce.*time/i,
          /fix.*issue|solve.*problem|address.*concern/i
        ],
        confidence: 0.8,
        category: 'enhancement'
      },
      creation: {
        patterns: [
          /create|build|develop|implement|add/i,
          /new.*feature|fresh.*start|from.*scratch/i,
          /generate.*code|write.*function|design.*component/i
        ],
        confidence: 0.9,
        category: 'development'
      },
      refactoring: {
        patterns: [
          /refactor|restructure|reorganize|clean.*up/i,
          /simplify.*code|reduce.*complexity|modularize/i,
          /extract.*function|split.*component|separate.*concerns/i
        ],
        confidence: 0.85,
        category: 'maintenance'
      },
      testing: {
        patterns: [
          /test|coverage|qa|quality.*assurance/i,
          /unit.*test|integration.*test|e2e.*test/i,
          /verify.*functionality|validate.*behavior/i
        ],
        confidence: 0.9,
        category: 'quality'
      },
      performance: {
        patterns: [
          /performance|speed|fast|slow|optimization/i,
          /memory.*usage|cpu.*usage|load.*time/i,
          /cache|lazy.*load|bundle.*size/i
        ],
        confidence: 0.85,
        category: 'performance'
      },
      security: {
        patterns: [
          /security|secure|auth|authorization|authentication/i,
          /vulnerability|exploit|sanitize|validate/i,
          /encrypt|decrypt|hash|token/i
        ],
        confidence: 0.9,
        category: 'security'
      },
      ui_ux: {
        patterns: [
          /ui|ux|user.*interface|user.*experience/i,
          /design|layout|styling|visual|appearance/i,
          /responsive|mobile|accessibility|usability/i
        ],
        confidence: 0.8,
        category: 'frontend'
      },
      api: {
        patterns: [
          /api|endpoint|route|service|backend/i,
          /rest|graphql|microservice|database/i,
          /crud|http|request|response/i
        ],
        confidence: 0.85,
        category: 'backend'
      }
    };
  }

  /**
   * Initialize domain knowledge
   * @returns {Object} - Domain knowledge base
   */
  initializeDomainKnowledge() {
    return {
      technologies: {
        frontend: ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'javascript', 'typescript'],
        backend: ['nodejs', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'c#'],
        database: ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'cassandra'],
        cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'serverless'],
        testing: ['jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest']
      },
      patterns: {
        architectural: ['mvc', 'mvvm', 'microservices', 'monolith', 'serverless', 'event-driven'],
        design: ['singleton', 'factory', 'observer', 'strategy', 'decorator', 'adapter'],
        data: ['repository', 'active-record', 'data-mapper', 'unit-of-work']
      },
      concepts: {
        performance: ['caching', 'lazy-loading', 'code-splitting', 'bundling', 'minification'],
        security: ['authentication', 'authorization', 'encryption', 'sanitization', 'validation'],
        quality: ['testing', 'coverage', 'linting', 'documentation', 'code-review']
      }
    };
  }

  /**
   * Parse user intentions from request
   * @param {string} userRequest - User's request
   * @returns {Object} - Parsed intentions
   */
  parseUserIntentions(userRequest) {
    console.error(`[SEMANTIC ANALYZER] Parsing user intentions: "${userRequest}"`);

    const intentions = [];
    const requestLower = userRequest.toLowerCase();

    // Analyze against intention patterns
    for (const [intentType, intentData] of Object.entries(this.intentionPatterns)) {
      let confidence = 0;
      const matches = [];

      for (const pattern of intentData.patterns) {
        const match = requestLower.match(pattern);
        if (match) {
          matches.push(match[0]);
          confidence += intentData.confidence / intentData.patterns.length;
        }
      }

      if (confidence > 0) {
        intentions.push({
          type: intentType,
          category: intentData.category,
          confidence: Math.min(confidence, 1),
          matches,
          priority: this.calculateIntentionPriority(intentType, confidence, matches)
        });
      }
    }

    // Extract implicit requirements
    const implicitRequirements = this.extractImplicitRequirements(userRequest);

    // Identify technology context
    const technologyContext = this.identifyTechnologyContext(userRequest);

    // Suggest related improvements
    const relatedImprovements = this.suggestRelatedImprovements(intentions);

    const result = {
      originalRequest: userRequest,
      primaryIntentions: intentions.filter(i => i.confidence > 0.6).sort((a, b) => b.confidence - a.confidence),
      secondaryIntentions: intentions.filter(i => i.confidence <= 0.6 && i.confidence > 0.3),
      implicitRequirements,
      technologyContext,
      relatedImprovements,
      complexity: this.assessRequestComplexity(userRequest, intentions),
      scope: this.determineScope(userRequest, intentions),
      timestamp: new Date()
    };

    console.error(`[SEMANTIC ANALYZER] Found ${result.primaryIntentions.length} primary intentions`);

    return result;
  }

  /**
   * Calculate intention priority
   * @param {string} intentType - Type of intention
   * @param {number} confidence - Confidence score
   * @param {Array} matches - Pattern matches
   * @returns {number} - Priority score
   */
  calculateIntentionPriority(intentType, confidence, matches) {
    const priorityWeights = {
      security: 1.0,
      testing: 0.9,
      performance: 0.8,
      creation: 0.7,
      improvement: 0.6,
      refactoring: 0.5,
      ui_ux: 0.4,
      api: 0.6
    };

    const baseWeight = priorityWeights[intentType] || 0.5;
    const matchBonus = matches.length * 0.1;

    return Math.min(baseWeight + matchBonus, 1) * confidence;
  }

  /**
   * Extract implicit requirements
   * @param {string} userRequest - User's request
   * @returns {Array} - Implicit requirements
   */
  extractImplicitRequirements(userRequest) {
    const requirements = [];
    const requestLower = userRequest.toLowerCase();

    // Performance implications
    if (requestLower.includes('fast') || requestLower.includes('slow')) {
      requirements.push({
        type: 'performance',
        requirement: 'Performance optimization needed',
        confidence: 0.8
      });
    }

    // Scalability implications
    if (requestLower.includes('scale') || requestLower.includes('growth') || requestLower.includes('load')) {
      requirements.push({
        type: 'scalability',
        requirement: 'Scalability considerations required',
        confidence: 0.7
      });
    }

    // Maintainability implications
    if (requestLower.includes('maintain') || requestLower.includes('complex') || requestLower.includes('messy')) {
      requirements.push({
        type: 'maintainability',
        requirement: 'Code maintainability improvement needed',
        confidence: 0.6
      });
    }

    // Accessibility implications
    if (requestLower.includes('user') || requestLower.includes('accessible') || requestLower.includes('mobile')) {
      requirements.push({
        type: 'accessibility',
        requirement: 'Accessibility and usability considerations',
        confidence: 0.5
      });
    }

    // Testing implications
    if (requestLower.includes('reliable') || requestLower.includes('stable') || requestLower.includes('bug')) {
      requirements.push({
        type: 'testing',
        requirement: 'Testing and quality assurance needed',
        confidence: 0.7
      });
    }

    return requirements;
  }

  /**
   * Identify technology context
   * @param {string} userRequest - User's request
   * @returns {Object} - Technology context
   */
  identifyTechnologyContext(userRequest) {
    const context = {
      frontend: [],
      backend: [],
      database: [],
      cloud: [],
      testing: []
    };

    const requestLower = userRequest.toLowerCase();

    for (const [category, technologies] of Object.entries(this.domainKnowledge.technologies)) {
      for (const tech of technologies) {
        if (requestLower.includes(tech)) {
          context[category].push({
            technology: tech,
            confidence: 0.9
          });
        }
      }
    }

    return context;
  }

  /**
   * Suggest related improvements
   * @param {Array} intentions - Parsed intentions
   * @returns {Array} - Related improvement suggestions
   */
  suggestRelatedImprovements(intentions) {
    const suggestions = [];

    intentions.forEach(intention => {
      switch (intention.type) {
        case 'ui_ux':
          suggestions.push(
            'Consider accessibility improvements',
            'Add responsive design enhancements',
            'Implement performance optimizations for UI'
          );
          break;
        case 'performance':
          suggestions.push(
            'Add performance monitoring',
            'Implement caching strategies',
            'Consider code splitting and lazy loading'
          );
          break;
        case 'security':
          suggestions.push(
            'Conduct security audit',
            'Implement input validation',
            'Add authentication and authorization'
          );
          break;
        case 'testing':
          suggestions.push(
            'Increase test coverage',
            'Add integration tests',
            'Implement automated testing pipeline'
          );
          break;
        case 'api':
          suggestions.push(
            'Add API documentation',
            'Implement rate limiting',
            'Add error handling and validation'
          );
          break;
      }
    });

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Assess request complexity
   * @param {string} userRequest - User's request
   * @param {Array} intentions - Parsed intentions
   * @returns {Object} - Complexity assessment
   */
  assessRequestComplexity(userRequest, intentions) {
    let complexityScore = 0;
    const factors = [];

    // Multiple intentions increase complexity
    if (intentions.length > 2) {
      complexityScore += 0.3;
      factors.push('Multiple intentions detected');
    }

    // Cross-domain requirements increase complexity
    const categories = [...new Set(intentions.map(i => i.category))];
    if (categories.length > 2) {
      complexityScore += 0.2;
      factors.push('Cross-domain requirements');
    }

    // Complex keywords
    const complexKeywords = ['architecture', 'microservice', 'distributed', 'enterprise', 'scalable'];
    if (complexKeywords.some(keyword => userRequest.toLowerCase().includes(keyword))) {
      complexityScore += 0.3;
      factors.push('Complex architectural requirements');
    }

    // Length and detail
    if (userRequest.length > 200) {
      complexityScore += 0.1;
      factors.push('Detailed requirements');
    }

    const level = complexityScore >= 0.7 ? 'high' :
      complexityScore >= 0.4 ? 'medium' : 'low';

    return {
      level,
      score: complexityScore,
      factors
    };
  }

  /**
   * Determine scope
   * @param {string} userRequest - User's request
   * @param {Array} intentions - Parsed intentions
   * @returns {Object} - Scope determination
   */
  determineScope(userRequest, intentions) {
    const requestLower = userRequest.toLowerCase();
    let scope = 'component';
    const indicators = [];

    // System-wide scope indicators
    if (requestLower.includes('entire') || requestLower.includes('whole') || requestLower.includes('all')) {
      scope = 'system';
      indicators.push('System-wide keywords detected');
    }

    // Module scope indicators
    if (requestLower.includes('module') || requestLower.includes('service') || requestLower.includes('package')) {
      scope = 'module';
      indicators.push('Module-level keywords detected');
    }

    // File scope indicators
    if (requestLower.includes('file') || requestLower.includes('class') || requestLower.includes('function')) {
      scope = 'file';
      indicators.push('File-level keywords detected');
    }

    // Multiple categories suggest broader scope
    const categories = [...new Set(intentions.map(i => i.category))];
    if (categories.length > 2 && scope === 'component') {
      scope = 'module';
      indicators.push('Multiple categories suggest broader scope');
    }

    return {
      level: scope,
      indicators,
      estimatedFiles: this.estimateAffectedFiles(scope),
      estimatedEffort: this.estimateEffort(scope, intentions.length)
    };
  }

  /**
   * Estimate affected files
   * @param {string} scope - Scope level
   * @returns {number} - Estimated number of files
   */
  estimateAffectedFiles(scope) {
    const estimates = {
      file: 1,
      component: 3,
      module: 8,
      system: 20
    };

    return estimates[scope] || 3;
  }

  /**
   * Estimate effort
   * @param {string} scope - Scope level
   * @param {number} intentionCount - Number of intentions
   * @returns {string} - Effort estimate
   */
  estimateEffort(scope, intentionCount) {
    const baseEffort = {
      file: 1,
      component: 2,
      module: 4,
      system: 8
    };

    const effort = (baseEffort[scope] || 2) * Math.max(1, intentionCount / 2);

    if (effort <= 2) {return 'low';}
    if (effort <= 5) {return 'medium';}
    if (effort <= 10) {return 'high';}
    return 'very_high';
  }

  /**
   * Understand code semantics
   * @param {string} filePath - File path
   * @param {string} codeContent - Code content
   * @returns {Object} - Semantic analysis
   */
  understandCodeSemantics(filePath, codeContent) {
    console.error(`[SEMANTIC ANALYZER] Analyzing code semantics for ${filePath}`);

    const semantics = {
      filePath,
      timestamp: new Date(),
      businessLogic: this.extractBusinessLogic(codeContent),
      architecturalPatterns: this.identifyArchitecturalPatterns(codeContent),
      designPatterns: this.identifyDesignPatterns(codeContent),
      dependencies: this.analyzeDependencies(codeContent),
      complexity: this.analyzeCodeComplexity(codeContent),
      purpose: this.inferPurpose(filePath, codeContent),
      qualityMetrics: this.calculateQualityMetrics(codeContent)
    };

    this.codeSemantics.set(filePath, semantics);

    this.emit('semanticsAnalyzed', { filePath, semantics });

    return semantics;
  }

  /**
   * Extract business logic
   * @param {string} codeContent - Code content
   * @returns {Array} - Business logic elements
   */
  extractBusinessLogic(codeContent) {
    const businessLogic = [];

    // Look for business-related function names
    const businessPatterns = [
      /function\s+(\w*(?:calculate|process|validate|generate|create|update|delete|handle)\w*)/gi,
      /const\s+(\w*(?:calculate|process|validate|generate|create|update|delete|handle)\w*)\s*=/gi,
      /class\s+(\w*(?:Manager|Service|Controller|Handler|Processor)\w*)/gi
    ];

    businessPatterns.forEach(pattern => {
      const matches = codeContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          businessLogic.push({
            type: 'function',
            name: match,
            confidence: 0.7
          });
        });
      }
    });

    return businessLogic;
  }

  /**
   * Identify architectural patterns
   * @param {string} codeContent - Code content
   * @returns {Array} - Architectural patterns
   */
  identifyArchitecturalPatterns(codeContent) {
    const patterns = [];

    // MVC pattern
    if (/controller|model|view/i.test(codeContent)) {
      patterns.push({ pattern: 'MVC', confidence: 0.8 });
    }

    // Repository pattern
    if (/repository|repo/i.test(codeContent)) {
      patterns.push({ pattern: 'Repository', confidence: 0.9 });
    }

    // Service pattern
    if (/service|provider/i.test(codeContent)) {
      patterns.push({ pattern: 'Service', confidence: 0.7 });
    }

    // Observer pattern
    if (/observer|subscribe|emit|event/i.test(codeContent)) {
      patterns.push({ pattern: 'Observer', confidence: 0.6 });
    }

    return patterns;
  }

  /**
   * Identify design patterns
   * @param {string} codeContent - Code content
   * @returns {Array} - Design patterns
   */
  identifyDesignPatterns(codeContent) {
    const patterns = [];

    // Singleton pattern
    if (/getInstance|singleton/i.test(codeContent)) {
      patterns.push({ pattern: 'Singleton', confidence: 0.9 });
    }

    // Factory pattern
    if (/factory|create\w+/i.test(codeContent)) {
      patterns.push({ pattern: 'Factory', confidence: 0.7 });
    }

    // Strategy pattern
    if (/strategy|algorithm/i.test(codeContent)) {
      patterns.push({ pattern: 'Strategy', confidence: 0.6 });
    }

    return patterns;
  }

  /**
   * Analyze dependencies
   * @param {string} codeContent - Code content
   * @returns {Object} - Dependency analysis
   */
  analyzeDependencies(codeContent) {
    const imports = [];
    const exports = [];

    // ES6 imports
    const importMatches = codeContent.match(/import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const moduleMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
        if (moduleMatch) {
          imports.push({
            module: moduleMatch[1],
            type: moduleMatch[1].startsWith('.') ? 'local' : 'external'
          });
        }
      });
    }

    // Exports
    const exportMatches = codeContent.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const nameMatch = match.match(/(\w+)$/);
        if (nameMatch) {
          exports.push(nameMatch[1]);
        }
      });
    }

    return {
      imports,
      exports,
      externalDependencies: imports.filter(imp => imp.type === 'external').length,
      localDependencies: imports.filter(imp => imp.type === 'local').length
    };
  }

  /**
   * Analyze code complexity
   * @param {string} codeContent - Code content
   * @returns {Object} - Complexity analysis
   */
  analyzeCodeComplexity(codeContent) {
    let cyclomaticComplexity = 1; // Base complexity

    // Count decision points
    const decisionPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\b/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g // Ternary operators
    ];

    decisionPatterns.forEach(pattern => {
      const matches = codeContent.match(pattern);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
    });

    const lines = codeContent.split('\n').length;
    const functions = (codeContent.match(/function\s+\w+|=>\s*{|=>\s*\w+/g) || []).length;

    return {
      cyclomaticComplexity,
      linesOfCode: lines,
      functionCount: functions,
      averageComplexityPerFunction: functions > 0 ? cyclomaticComplexity / functions : 0,
      complexityLevel: cyclomaticComplexity <= 5 ? 'low' :
        cyclomaticComplexity <= 10 ? 'medium' : 'high'
    };
  }

  /**
   * Infer purpose from file path and content
   * @param {string} filePath - File path
   * @param {string} codeContent - Code content
   * @returns {Object} - Purpose inference
   */
  inferPurpose(filePath, codeContent) {
    const pathSegments = filePath.toLowerCase().split('/');
    const fileName = pathSegments[pathSegments.length - 1];

    let purpose = 'utility';
    const indicators = [];

    // Infer from path
    if (pathSegments.includes('components') || pathSegments.includes('component')) {
      purpose = 'component';
      indicators.push('Located in components directory');
    } else if (pathSegments.includes('services') || pathSegments.includes('service')) {
      purpose = 'service';
      indicators.push('Located in services directory');
    } else if (pathSegments.includes('utils') || pathSegments.includes('utilities')) {
      purpose = 'utility';
      indicators.push('Located in utilities directory');
    } else if (pathSegments.includes('tests') || pathSegments.includes('test')) {
      purpose = 'test';
      indicators.push('Located in test directory');
    }

    // Infer from filename
    if (fileName.includes('test') || fileName.includes('spec')) {
      purpose = 'test';
      indicators.push('Test file naming pattern');
    } else if (fileName.includes('config') || fileName.includes('settings')) {
      purpose = 'configuration';
      indicators.push('Configuration file naming pattern');
    }

    // Infer from content
    if (/describe\s*\(|it\s*\(|test\s*\(/i.test(codeContent)) {
      purpose = 'test';
      indicators.push('Contains test functions');
    } else if (/export\s+default\s+class.*Component|extends\s+Component/i.test(codeContent)) {
      purpose = 'component';
      indicators.push('Contains React/Vue component');
    } else if (/router|route|endpoint/i.test(codeContent)) {
      purpose = 'routing';
      indicators.push('Contains routing logic');
    }

    return {
      primary: purpose,
      indicators,
      confidence: indicators.length * 0.3
    };
  }

  /**
   * Calculate quality metrics
   * @param {string} codeContent - Code content
   * @returns {Object} - Quality metrics
   */
  calculateQualityMetrics(codeContent) {
    const lines = codeContent.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => /^\s*\/\/|^\s*\/\*|\*\//.test(line));

    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      commentRatio: commentLines.length / nonEmptyLines.length,
      averageLineLength: nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length,
      maintainabilityIndex: this.calculateMaintainabilityIndex(codeContent)
    };
  }

  /**
   * Calculate maintainability index
   * @param {string} codeContent - Code content
   * @returns {number} - Maintainability index (0-100)
   */
  calculateMaintainabilityIndex(codeContent) {
    const complexity = this.analyzeCodeComplexity(codeContent);
    const quality = this.calculateQualityMetrics(codeContent);

    // Simplified maintainability index calculation
    let index = 100;

    // Penalize high complexity
    if (complexity.cyclomaticComplexity > 10) {
      index -= (complexity.cyclomaticComplexity - 10) * 2;
    }

    // Reward good commenting
    if (quality.commentRatio > 0.1) {
      index += 5;
    }

    // Penalize very long functions
    if (complexity.averageComplexityPerFunction > 15) {
      index -= 10;
    }

    return Math.max(0, Math.min(100, index));
  }

  /**
   * Get semantic analysis report
   * @param {string} filePath - File path (optional)
   * @returns {Object} - Semantic analysis report
   */
  getSemanticAnalysisReport(filePath = null) {
    if (filePath) {
      return this.codeSemantics.get(filePath) || null;
    }

    const allAnalyses = Array.from(this.codeSemantics.values());

    return {
      timestamp: new Date(),
      totalFiles: allAnalyses.length,
      averageComplexity: allAnalyses.reduce((sum, analysis) =>
        sum + analysis.complexity.cyclomaticComplexity, 0) / allAnalyses.length,
      purposeDistribution: this.calculatePurposeDistribution(allAnalyses),
      qualityOverview: this.calculateQualityOverview(allAnalyses),
      architecturalPatterns: this.summarizeArchitecturalPatterns(allAnalyses)
    };
  }

  /**
   * Calculate purpose distribution
   * @param {Array} analyses - Array of semantic analyses
   * @returns {Object} - Purpose distribution
   */
  calculatePurposeDistribution(analyses) {
    const distribution = {};

    analyses.forEach(analysis => {
      const purpose = analysis.purpose.primary;
      distribution[purpose] = (distribution[purpose] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calculate quality overview
   * @param {Array} analyses - Array of semantic analyses
   * @returns {Object} - Quality overview
   */
  calculateQualityOverview(analyses) {
    if (analyses.length === 0) {return {};}

    const totalMaintainability = analyses.reduce((sum, analysis) =>
      sum + analysis.qualityMetrics.maintainabilityIndex, 0);

    const totalCommentRatio = analyses.reduce((sum, analysis) =>
      sum + analysis.qualityMetrics.commentRatio, 0);

    return {
      averageMaintainability: totalMaintainability / analyses.length,
      averageCommentRatio: totalCommentRatio / analyses.length,
      highComplexityFiles: analyses.filter(a => a.complexity.complexityLevel === 'high').length,
      wellDocumentedFiles: analyses.filter(a => a.qualityMetrics.commentRatio > 0.15).length
    };
  }

  /**
   * Summarize architectural patterns
   * @param {Array} analyses - Array of semantic analyses
   * @returns {Object} - Architectural patterns summary
   */
  summarizeArchitecturalPatterns(analyses) {
    const patternCounts = {};

    analyses.forEach(analysis => {
      analysis.architecturalPatterns.forEach(pattern => {
        patternCounts[pattern.pattern] = (patternCounts[pattern.pattern] || 0) + 1;
      });
    });

    return patternCounts;
  }
}
