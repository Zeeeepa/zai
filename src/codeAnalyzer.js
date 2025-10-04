import { EventEmitter } from 'events';
import { watch } from 'fs';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

/**
 * Real-Time Code Analyzer for AI-to-AI Communication
 * Monitors codebase changes and provides impact assessment
 */
export class CodeAnalyzer extends EventEmitter {
  constructor(workspaceRoot = process.cwd()) {
    super();
    this.workspaceRoot = workspaceRoot;
    this.watchers = new Map(); // loopId -> file watchers
    this.fileStates = new Map(); // file -> state info
    this.changeHistory = new Map(); // loopId -> changes
    this.analysisCache = new Map(); // file -> analysis results
  }

  /**
   * Start monitoring codebase changes for a loop
   * @param {string} loopId - Loop ID
   * @param {Array} watchPaths - Paths to monitor
   * @returns {Promise<void>}
   */
  async startMonitoring(loopId, watchPaths = ['.']) {
    console.error(`[CODE ANALYZER] Starting monitoring for loop ${loopId}`);

    const watchers = [];

    for (const watchPath of watchPaths) {
      const fullPath = join(this.workspaceRoot, watchPath);

      try {
        const watcher = watch(fullPath, { recursive: true }, (eventType, filename) => {
          if (filename && this.isRelevantFile(filename)) {
            this.handleFileChange(loopId, eventType, filename);
          }
        });

        watchers.push(watcher);
        console.error(`[CODE ANALYZER] Watching: ${fullPath}`);
      } catch (error) {
        console.error(`[CODE ANALYZER] Failed to watch ${fullPath}: ${error.message}`);
      }
    }

    this.watchers.set(loopId, watchers);
    this.changeHistory.set(loopId, []);

    // Initialize file states
    await this.initializeFileStates(watchPaths);
  }

  /**
   * Stop monitoring for a loop
   * @param {string} loopId - Loop ID
   */
  stopMonitoring(loopId) {
    const watchers = this.watchers.get(loopId);
    if (watchers) {
      watchers.forEach(watcher => watcher.close());
      this.watchers.delete(loopId);
      console.error(`[CODE ANALYZER] Stopped monitoring for loop ${loopId}`);
    }
  }

  /**
   * Check if file is relevant for monitoring
   * @param {string} filename - File name
   * @returns {boolean} - Whether file is relevant
   */
  isRelevantFile(filename) {
    const relevantExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
      '.html', '.css', '.scss', '.sass', '.less',
      '.json', '.md', '.yml', '.yaml', '.xml'
    ];

    const ext = extname(filename).toLowerCase();
    return relevantExtensions.includes(ext) &&
           !filename.includes('node_modules') &&
           !filename.includes('.git') &&
           !filename.startsWith('.');
  }

  /**
   * Handle file change event
   * @param {string} loopId - Loop ID
   * @param {string} eventType - Event type (change, rename)
   * @param {string} filename - Changed file
   */
  async handleFileChange(loopId, eventType, filename) {
    const filePath = join(this.workspaceRoot, filename);

    try {
      const change = {
        timestamp: new Date(),
        eventType,
        filename,
        filePath,
        analysis: await this.analyzeFileChange(filePath, eventType)
      };

      const changes = this.changeHistory.get(loopId) || [];
      changes.push(change);
      this.changeHistory.set(loopId, changes);

      console.error(`[CODE ANALYZER] File changed: ${filename} (${eventType})`);

      this.emit('fileChanged', {
        loopId,
        change,
        impact: await this.assessChangeImpact(change)
      });

    } catch (error) {
      console.error(`[CODE ANALYZER] Error analyzing change: ${error.message}`);
    }
  }

  /**
   * Analyze file change
   * @param {string} filePath - File path
   * @param {string} eventType - Event type
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzeFileChange(filePath, eventType) {
    try {
      const stats = await stat(filePath);
      const content = await readFile(filePath, 'utf-8');

      const analysis = {
        size: stats.size,
        lines: content.split('\n').length,
        type: this.getFileType(filePath),
        complexity: this.calculateComplexity(content),
        dependencies: this.extractDependencies(content),
        exports: this.extractExports(content),
        functions: this.extractFunctions(content),
        classes: this.extractClasses(content)
      };

      // Cache analysis for future reference
      this.analysisCache.set(filePath, analysis);

      return analysis;
    } catch (error) {
      return {
        error: error.message,
        type: 'unknown',
        size: 0,
        lines: 0
      };
    }
  }

  /**
   * Get file type
   * @param {string} filePath - File path
   * @returns {string} - File type
   */
  getFileType(filePath) {
    const ext = extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'react',
      '.tsx': 'react-typescript',
      '.vue': 'vue',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.md': 'markdown'
    };

    return typeMap[ext] || 'other';
  }

  /**
   * Calculate code complexity (simplified)
   * @param {string} content - File content
   * @returns {number} - Complexity score
   */
  calculateComplexity(content) {
    let complexity = 1; // Base complexity

    // Count control structures
    const controlStructures = [
      /\bif\s*\(/g,
      /\belse\s+if\b/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g // Ternary operators
    ];

    controlStructures.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {complexity += matches.length;}
    });

    return complexity;
  }

  /**
   * Extract dependencies from file
   * @param {string} content - File content
   * @returns {Array} - Array of dependencies
   */
  extractDependencies(content) {
    const dependencies = [];

    // ES6 imports
    const importMatches = content.match(/import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const dep = match.match(/from\s+['"`]([^'"`]+)['"`]/);
        if (dep) {dependencies.push(dep[1]);}
      });
    }

    // CommonJS requires
    const requireMatches = content.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
    if (requireMatches) {
      requireMatches.forEach(match => {
        const dep = match.match(/['"`]([^'"`]+)['"`]/);
        if (dep) {dependencies.push(dep[1]);}
      });
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Extract exports from file
   * @param {string} content - File content
   * @returns {Array} - Array of exports
   */
  extractExports(content) {
    const exports = [];

    // Named exports
    const namedExports = content.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
    if (namedExports) {
      namedExports.forEach(match => {
        const name = match.match(/(\w+)$/);
        if (name) {exports.push(name[1]);}
      });
    }

    // Export statements
    const exportStatements = content.match(/export\s*\{\s*([^}]+)\s*\}/g);
    if (exportStatements) {
      exportStatements.forEach(match => {
        const names = match.match(/\{\s*([^}]+)\s*\}/);
        if (names) {
          const exportNames = names[1].split(',').map(n => n.trim().split(' ')[0]);
          exports.push(...exportNames);
        }
      });
    }

    return [...new Set(exports)];
  }

  /**
   * Extract functions from file
   * @param {string} content - File content
   * @returns {Array} - Array of function names
   */
  extractFunctions(content) {
    const functions = [];

    // Function declarations
    const funcDeclarations = content.match(/function\s+(\w+)\s*\(/g);
    if (funcDeclarations) {
      funcDeclarations.forEach(match => {
        const name = match.match(/function\s+(\w+)/);
        if (name) {functions.push(name[1]);}
      });
    }

    // Arrow functions assigned to variables
    const arrowFunctions = content.match(/(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g);
    if (arrowFunctions) {
      arrowFunctions.forEach(match => {
        const name = match.match(/(\w+)\s*=/);
        if (name) {functions.push(name[1]);}
      });
    }

    return [...new Set(functions)];
  }

  /**
   * Extract classes from file
   * @param {string} content - File content
   * @returns {Array} - Array of class names
   */
  extractClasses(content) {
    const classes = [];

    const classMatches = content.match(/class\s+(\w+)/g);
    if (classMatches) {
      classMatches.forEach(match => {
        const name = match.match(/class\s+(\w+)/);
        if (name) {classes.push(name[1]);}
      });
    }

    return [...new Set(classes)];
  }

  /**
   * Assess impact of a change
   * @param {Object} change - Change object
   * @returns {Promise<Object>} - Impact assessment
   */
  async assessChangeImpact(change) {
    const impact = {
      severity: 'low',
      affectedAreas: [],
      recommendations: [],
      riskLevel: 'low'
    };

    if (!change.analysis || change.analysis.error) {
      impact.severity = 'unknown';
      impact.riskLevel = 'medium';
      return impact;
    }

    const { analysis } = change;

    // Assess based on file type
    if (analysis.type === 'javascript' || analysis.type === 'typescript') {
      impact.affectedAreas.push('functionality');

      if (analysis.exports && analysis.exports.length > 0) {
        impact.severity = 'medium';
        impact.affectedAreas.push('api');
        impact.recommendations.push('Check dependent files for breaking changes');
      }

      if (analysis.complexity > 10) {
        impact.riskLevel = 'high';
        impact.recommendations.push('Consider adding tests for complex logic');
      }
    }

    if (analysis.type === 'css' || analysis.type === 'scss') {
      impact.affectedAreas.push('styling', 'ui');
      impact.recommendations.push('Verify visual consistency across components');
    }

    if (analysis.type === 'html') {
      impact.affectedAreas.push('structure', 'ui');
      impact.recommendations.push('Check for accessibility and SEO impacts');
    }

    // Large files have higher impact
    if (analysis.lines > 500) {
      impact.severity = 'high';
      impact.recommendations.push('Large file change - review thoroughly');
    }

    return impact;
  }

  /**
   * Get changes for a loop
   * @param {string} loopId - Loop ID
   * @param {number} sinceIteration - Get changes since iteration
   * @returns {Array} - Array of changes
   */
  getChanges(loopId, sinceIteration = 0) {
    const changes = this.changeHistory.get(loopId) || [];

    if (sinceIteration > 0) {
      const sinceTime = new Date(Date.now() - (sinceIteration * 30000)); // Rough estimate
      return changes.filter(change => change.timestamp > sinceTime);
    }

    return changes;
  }

  /**
   * Generate change summary for iteration
   * @param {string} loopId - Loop ID
   * @param {number} iteration - Current iteration
   * @returns {Object} - Change summary
   */
  generateChangeSummary(loopId, iteration) {
    const changes = this.getChanges(loopId);
    const recentChanges = changes.slice(-10); // Last 10 changes

    const summary = {
      totalChanges: changes.length,
      recentChanges: recentChanges.length,
      affectedFiles: [...new Set(changes.map(c => c.filename))],
      fileTypes: this.analyzeFileTypes(changes),
      complexity: this.analyzeComplexityTrend(changes),
      recommendations: this.generateChangeRecommendations(changes)
    };

    return summary;
  }

  /**
   * Analyze file types in changes
   * @param {Array} changes - Array of changes
   * @returns {Object} - File type analysis
   */
  analyzeFileTypes(changes) {
    const types = {};

    changes.forEach(change => {
      if (change.analysis && change.analysis.type) {
        types[change.analysis.type] = (types[change.analysis.type] || 0) + 1;
      }
    });

    return types;
  }

  /**
   * Analyze complexity trend
   * @param {Array} changes - Array of changes
   * @returns {Object} - Complexity trend
   */
  analyzeComplexityTrend(changes) {
    const complexities = changes
      .filter(c => c.analysis && c.analysis.complexity)
      .map(c => c.analysis.complexity);

    if (complexities.length === 0) {return { trend: 'stable', average: 0 };}

    const average = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
    const recent = complexities.slice(-5);
    const recentAvg = recent.reduce((sum, c) => sum + c, 0) / recent.length;

    let trend = 'stable';
    if (recentAvg > average * 1.2) {trend = 'increasing';}
    if (recentAvg < average * 0.8) {trend = 'decreasing';}

    return { trend, average: Math.round(average), recent: Math.round(recentAvg) };
  }

  /**
   * Generate recommendations based on changes
   * @param {Array} changes - Array of changes
   * @returns {Array} - Array of recommendations
   */
  generateChangeRecommendations(changes) {
    const recommendations = [];

    if (changes.length > 20) {
      recommendations.push('Many files changed - consider reviewing overall architecture');
    }

    const jsChanges = changes.filter(c =>
      c.analysis && ['javascript', 'typescript'].includes(c.analysis.type)
    );

    if (jsChanges.length > 10) {
      recommendations.push('Significant JavaScript changes - ensure test coverage');
    }

    const cssChanges = changes.filter(c =>
      c.analysis && ['css', 'scss'].includes(c.analysis.type)
    );

    if (cssChanges.length > 5) {
      recommendations.push('Multiple style changes - verify visual consistency');
    }

    return recommendations;
  }

  /**
   * Initialize file states
   * @param {Array} watchPaths - Paths to initialize
   */
  async initializeFileStates(watchPaths) {
    // This would scan initial file states
    // Implementation depends on specific requirements
    console.error('[CODE ANALYZER] File states initialized');
  }
}
