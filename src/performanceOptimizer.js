import { EventEmitter } from 'events';

/**
 * Performance Optimization for AI-to-AI Communication
 * Handles parallel processing, caching, and performance monitoring
 */
export class PerformanceOptimizer extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map(); // Pattern cache
    this.performanceMetrics = new Map(); // loopId -> metrics
    this.parallelTasks = new Map(); // loopId -> parallel tasks
    this.optimizationStrategies = this.initializeOptimizationStrategies();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0
    };
  }

  /**
   * Initialize optimization strategies
   * @returns {Object} - Optimization strategies
   */
  initializeOptimizationStrategies() {
    return {
      caching: {
        patterns: new Map(),
        responses: new Map(),
        maxSize: 1000,
        ttl: 3600000 // 1 hour
      },
      parallelization: {
        maxConcurrent: 3,
        taskTypes: ['analysis', 'testing', 'validation'],
        dependencies: new Map()
      },
      batching: {
        batchSize: 5,
        batchTimeout: 2000,
        pendingBatches: new Map()
      },
      precomputation: {
        commonPatterns: new Set(),
        precomputedResults: new Map()
      }
    };
  }

  /**
   * Process multiple improvements simultaneously
   * @param {Array} improvements - Array of improvements
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} - Processed improvements
   */
  async processMultipleImprovements(improvements, options = {}) {
    console.error(`[PERFORMANCE OPTIMIZER] Processing ${improvements.length} improvements in parallel`);

    const startTime = Date.now();
    const maxConcurrent = options.maxConcurrent || this.optimizationStrategies.parallelization.maxConcurrent;

    // Group improvements by dependencies
    const independentGroups = this.groupByDependencies(improvements);
    const results = [];

    for (const group of independentGroups) {
      // Process each group in parallel
      const groupPromises = group.slice(0, maxConcurrent).map(async (improvement, index) => {
        try {
          const result = await this.processImprovement(improvement, {
            ...options,
            parallelIndex: index,
            groupSize: group.length
          });
          return { success: true, improvement, result };
        } catch (error) {
          console.error(`[PERFORMANCE OPTIMIZER] Error processing improvement: ${error.message}`);
          return { success: false, improvement, error: error.message };
        }
      });

      const groupResults = await Promise.all(groupPromises);
      results.push(...groupResults);

      // Process remaining items in the group if any
      if (group.length > maxConcurrent) {
        const remainingResults = await this.processMultipleImprovements(
          group.slice(maxConcurrent),
          { ...options, maxConcurrent }
        );
        results.push(...remainingResults);
      }
    }

    const processingTime = Date.now() - startTime;

    this.updatePerformanceMetrics('parallel_processing', {
      itemsProcessed: improvements.length,
      processingTime,
      throughput: improvements.length / (processingTime / 1000),
      successRate: results.filter(r => r.success).length / results.length
    });

    console.error(`[PERFORMANCE OPTIMIZER] Parallel processing completed: ${results.length} items in ${processingTime}ms`);

    return results;
  }

  /**
   * Group improvements by dependencies
   * @param {Array} improvements - Array of improvements
   * @returns {Array} - Groups of independent improvements
   */
  groupByDependencies(improvements) {
    const groups = [];
    const processed = new Set();

    for (const improvement of improvements) {
      if (processed.has(improvement.id)) {continue;}

      const group = [improvement];
      processed.add(improvement.id);

      // Find other improvements that don't depend on this one
      for (const other of improvements) {
        if (processed.has(other.id)) {continue;}

        if (!this.hasDependency(other, improvement) && !this.hasDependency(improvement, other)) {
          group.push(other);
          processed.add(other.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if improvement has dependency
   * @param {Object} improvement1 - First improvement
   * @param {Object} improvement2 - Second improvement
   * @returns {boolean} - Whether there's a dependency
   */
  hasDependency(improvement1, improvement2) {
    // Simple dependency check based on file overlap
    const files1 = improvement1.affectedFiles || [];
    const files2 = improvement2.affectedFiles || [];

    return files1.some(file => files2.includes(file));
  }

  /**
   * Process single improvement
   * @param {Object} improvement - Improvement to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result
   */
  async processImprovement(improvement, options = {}) {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(improvement);
    const cachedResult = this.getFromCache(cacheKey);

    if (cachedResult) {
      console.error(`[PERFORMANCE OPTIMIZER] Cache hit for improvement ${improvement.id}`);
      this.cacheStats.hits++;
      return cachedResult;
    }

    this.cacheStats.misses++;

    // Process improvement
    const result = await this.executeImprovement(improvement, options);

    // Cache result
    this.setCache(cacheKey, result);

    const processingTime = Date.now() - startTime;
    this.updatePerformanceMetrics('single_processing', {
      improvementId: improvement.id,
      processingTime,
      cacheHit: false
    });

    return result;
  }

  /**
   * Execute improvement
   * @param {Object} improvement - Improvement to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Execution result
   */
  async executeImprovement(improvement, options = {}) {
    // Simulate improvement processing
    const complexity = improvement.complexity || 'medium';
    const processingTime = this.getProcessingTime(complexity);

    await new Promise(resolve => setTimeout(resolve, processingTime));

    return {
      id: improvement.id,
      status: 'completed',
      processingTime,
      complexity,
      parallelIndex: options.parallelIndex,
      timestamp: new Date()
    };
  }

  /**
   * Get processing time based on complexity
   * @param {string} complexity - Complexity level
   * @returns {number} - Processing time in ms
   */
  getProcessingTime(complexity) {
    const baseTimes = {
      simple: 100,
      medium: 300,
      complex: 800,
      enterprise: 1500
    };

    const baseTime = baseTimes[complexity] || baseTimes.medium;
    // Add some randomness
    return baseTime + Math.random() * baseTime * 0.3;
  }

  /**
   * Cache common patterns
   * @param {Array} patterns - Array of patterns to cache
   */
  cacheCommonPatterns(patterns) {
    console.error(`[PERFORMANCE OPTIMIZER] Caching ${patterns.length} common patterns`);

    patterns.forEach(pattern => {
      const key = this.generatePatternKey(pattern);
      this.optimizationStrategies.caching.patterns.set(key, {
        pattern,
        timestamp: Date.now(),
        usage: 0
      });
    });

    this.cacheStats.size = this.optimizationStrategies.caching.patterns.size;

    // Precompute results for common patterns
    this.precomputeCommonResults(patterns);
  }

  /**
   * Precompute results for common patterns
   * @param {Array} patterns - Array of patterns
   */
  async precomputeCommonResults(patterns) {
    console.error(`[PERFORMANCE OPTIMIZER] Precomputing results for ${patterns.length} patterns`);

    const precomputePromises = patterns.slice(0, 10).map(async pattern => {
      try {
        const result = await this.computePatternResult(pattern);
        const key = this.generatePatternKey(pattern);
        this.optimizationStrategies.precomputation.precomputedResults.set(key, result);
      } catch (error) {
        console.error(`[PERFORMANCE OPTIMIZER] Precomputation error: ${error.message}`);
      }
    });

    await Promise.all(precomputePromises);

    console.error('[PERFORMANCE OPTIMIZER] Precomputation completed');
  }

  /**
   * Compute pattern result
   * @param {Object} pattern - Pattern to compute
   * @returns {Promise<Object>} - Computed result
   */
  async computePatternResult(pattern) {
    // Simulate pattern computation
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      pattern: pattern.name,
      result: `Optimized result for ${pattern.name}`,
      computedAt: new Date(),
      complexity: pattern.complexity || 'medium'
    };
  }

  /**
   * Generate cache key
   * @param {Object} improvement - Improvement object
   * @returns {string} - Cache key
   */
  generateCacheKey(improvement) {
    const keyData = {
      type: improvement.type,
      strategy: improvement.strategy,
      files: (improvement.affectedFiles || []).sort(),
      complexity: improvement.complexity
    };

    return `improvement_${JSON.stringify(keyData)}`.replace(/\s/g, '');
  }

  /**
   * Generate pattern key
   * @param {Object} pattern - Pattern object
   * @returns {string} - Pattern key
   */
  generatePatternKey(pattern) {
    return `pattern_${pattern.name}_${pattern.type || 'default'}`;
  }

  /**
   * Get from cache
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached value or null
   */
  getFromCache(key) {
    const cached = this.optimizationStrategies.caching.responses.get(key);

    if (!cached) {return null;}

    // Check TTL
    if (Date.now() - cached.timestamp > this.optimizationStrategies.caching.ttl) {
      this.optimizationStrategies.caching.responses.delete(key);
      return null;
    }

    cached.usage++;
    return cached.value;
  }

  /**
   * Set cache
   * @param {string} key - Cache key
   * @param {Object} value - Value to cache
   */
  setCache(key, value) {
    // Check cache size limit
    if (this.optimizationStrategies.caching.responses.size >= this.optimizationStrategies.caching.maxSize) {
      this.evictLeastUsed();
    }

    this.optimizationStrategies.caching.responses.set(key, {
      value,
      timestamp: Date.now(),
      usage: 0
    });
  }

  /**
   * Evict least used cache entries
   */
  evictLeastUsed() {
    const entries = Array.from(this.optimizationStrategies.caching.responses.entries());

    // Sort by usage (ascending) and timestamp (ascending)
    entries.sort((a, b) => {
      if (a[1].usage !== b[1].usage) {
        return a[1].usage - b[1].usage;
      }
      return a[1].timestamp - b[1].timestamp;
    });

    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.optimizationStrategies.caching.responses.delete(entries[i][0]);
    }

    console.error(`[PERFORMANCE OPTIMIZER] Evicted ${toRemove} cache entries`);
  }

  /**
   * Update performance metrics
   * @param {string} operation - Operation name
   * @param {Object} metrics - Metrics data
   */
  updatePerformanceMetrics(operation, metrics) {
    const timestamp = Date.now();

    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }

    const operationMetrics = this.performanceMetrics.get(operation);
    operationMetrics.push({
      timestamp,
      ...metrics
    });

    // Keep only last 100 metrics per operation
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }

    this.emit('metricsUpdated', { operation, metrics });
  }

  /**
   * Get performance report
   * @param {string} operation - Operation name (optional)
   * @returns {Object} - Performance report
   */
  getPerformanceReport(operation = null) {
    if (operation) {
      return this.getOperationReport(operation);
    }

    const report = {
      timestamp: new Date(),
      cache: {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
        size: this.cacheStats.size
      },
      operations: {}
    };

    for (const [op, metrics] of this.performanceMetrics.entries()) {
      report.operations[op] = this.getOperationReport(op);
    }

    return report;
  }

  /**
   * Get operation report
   * @param {string} operation - Operation name
   * @returns {Object} - Operation report
   */
  getOperationReport(operation) {
    const metrics = this.performanceMetrics.get(operation) || [];

    if (metrics.length === 0) {
      return { operation, count: 0, averageTime: 0, throughput: 0 };
    }

    const recentMetrics = metrics.slice(-20); // Last 20 operations
    const totalTime = recentMetrics.reduce((sum, m) => sum + (m.processingTime || 0), 0);
    const averageTime = totalTime / recentMetrics.length;

    const timeSpan = recentMetrics.length > 1 ?
      recentMetrics[recentMetrics.length - 1].timestamp - recentMetrics[0].timestamp : 1000;
    const throughput = (recentMetrics.length / timeSpan) * 1000; // Operations per second

    return {
      operation,
      count: metrics.length,
      recentCount: recentMetrics.length,
      averageTime: Math.round(averageTime),
      throughput: Math.round(throughput * 100) / 100,
      trend: this.calculatePerformanceTrend(metrics)
    };
  }

  /**
   * Calculate performance trend
   * @param {Array} metrics - Metrics array
   * @returns {string} - Trend direction
   */
  calculatePerformanceTrend(metrics) {
    if (metrics.length < 6) {return 'stable';}

    const recent = metrics.slice(-3).map(m => m.processingTime || 0);
    const earlier = metrics.slice(-6, -3).map(m => m.processingTime || 0);

    const recentAvg = recent.reduce((sum, time) => sum + time, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, time) => sum + time, 0) / earlier.length;

    const change = (recentAvg - earlierAvg) / earlierAvg;

    if (change > 0.2) {return 'slower';}
    if (change < -0.2) {return 'faster';}
    return 'stable';
  }

  /**
   * Optimize cache
   */
  optimizeCache() {
    console.error('[PERFORMANCE OPTIMIZER] Optimizing cache...');

    // Remove expired entries
    const now = Date.now();
    const ttl = this.optimizationStrategies.caching.ttl;

    for (const [key, entry] of this.optimizationStrategies.caching.responses.entries()) {
      if (now - entry.timestamp > ttl) {
        this.optimizationStrategies.caching.responses.delete(key);
      }
    }

    // Update cache stats
    this.cacheStats.size = this.optimizationStrategies.caching.responses.size;

    console.error(`[PERFORMANCE OPTIMIZER] Cache optimized: ${this.cacheStats.size} entries remaining`);
  }

  /**
   * Get optimization recommendations
   * @returns {Array} - Optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const report = this.getPerformanceReport();

    // Cache recommendations
    if (report.cache.hitRate < 0.3) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        description: 'Low cache hit rate - consider caching more patterns',
        action: 'Increase cache size or improve cache key generation'
      });
    }

    // Performance recommendations
    for (const [operation, opReport] of Object.entries(report.operations)) {
      if (opReport.trend === 'slower') {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          description: `${operation} performance is declining`,
          action: 'Review and optimize processing logic'
        });
      }

      if (opReport.throughput < 1) {
        recommendations.push({
          type: 'throughput',
          priority: 'medium',
          description: `Low throughput for ${operation}`,
          action: 'Consider parallel processing or optimization'
        });
      }
    }

    // Parallelization recommendations
    if (this.parallelTasks.size === 0) {
      recommendations.push({
        type: 'parallelization',
        priority: 'low',
        description: 'No parallel processing detected',
        action: 'Consider implementing parallel processing for independent tasks'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.optimizationStrategies.caching.responses.clear();
    this.optimizationStrategies.caching.patterns.clear();
    this.optimizationStrategies.precomputation.precomputedResults.clear();

    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0
    };

    console.error('[PERFORMANCE OPTIMIZER] Cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStatistics() {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      responseCache: this.optimizationStrategies.caching.responses.size,
      patternCache: this.optimizationStrategies.caching.patterns.size,
      precomputedResults: this.optimizationStrategies.precomputation.precomputedResults.size
    };
  }
}
