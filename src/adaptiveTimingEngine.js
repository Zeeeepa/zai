/**
 * Adaptive Timing Engine
 * Intelligent timing and strategy selection for AI-to-AI loops
 */

export class AdaptiveTimingEngine {
    constructor() {
        this.strategies = new Map();
        this.performanceHistory = new Map();
        this.timingPatterns = new Map();
        this.loadBalancer = new LoadBalancer();
        
        this.initializeStrategies();
        console.log('🧠 Adaptive Timing Engine initialized with intelligent strategy selection');
    }

    /**
     * Initialize available strategies
     */
    initializeStrategies() {
        this.strategies.set('aggressive', {
            name: 'aggressive',
            baseInterval: 2000,
            phases: {
                breakdown: { frequency: 2, weight: 1.5 },
                deepThinking: { frequency: 1, weight: 2.0 },
                execution: { frequency: 3, weight: 1.8 },
                optimization: { frequency: 1, weight: 1.2 }
            },
            description: 'Fast iteration with frequent analysis'
        });

        this.strategies.set('balanced', {
            name: 'balanced',
            baseInterval: 5000,
            phases: {
                breakdown: { frequency: 3, weight: 1.0 },
                deepThinking: { frequency: 2, weight: 1.5 },
                execution: { frequency: 5, weight: 1.3 },
                optimization: { frequency: 2, weight: 1.0 }
            },
            description: 'Balanced approach with moderate timing'
        });

        this.strategies.set('conservative', {
            name: 'conservative',
            baseInterval: 10000,
            phases: {
                breakdown: { frequency: 5, weight: 0.8 },
                deepThinking: { frequency: 3, weight: 1.2 },
                execution: { frequency: 7, weight: 1.0 },
                optimization: { frequency: 3, weight: 0.9 }
            },
            description: 'Careful approach with thorough analysis'
        });

        this.strategies.set('adaptive', {
            name: 'adaptive',
            baseInterval: 'dynamic',
            phases: {
                breakdown: { frequency: 'adaptive', weight: 'dynamic' },
                deepThinking: { frequency: 'adaptive', weight: 'dynamic' },
                execution: { frequency: 'adaptive', weight: 'dynamic' },
                optimization: { frequency: 'adaptive', weight: 'dynamic' }
            },
            description: 'Fully adaptive based on performance and context'
        });

        this.strategies.set('experimental', {
            name: 'experimental',
            baseInterval: 'variable',
            phases: {
                breakdown: { frequency: 'random', weight: 'experimental' },
                deepThinking: { frequency: 'burst', weight: 'experimental' },
                execution: { frequency: 'parallel', weight: 'experimental' },
                optimization: { frequency: 'continuous', weight: 'experimental' }
            },
            description: 'Experimental approach with novel timing patterns'
        });
    }

    /**
     * Select optimal strategy based on loop context and performance
     */
    async selectStrategy(loop) {
        const context = await this.analyzeLoopContext(loop);
        const performance = await this.analyzePerformanceHistory(loop);
        const resources = await this.analyzeResourceAvailability();
        
        // Strategy selection algorithm
        let selectedStrategy = 'balanced'; // default
        
        if (context.complexity === 'high' && resources.available > 0.8) {
            selectedStrategy = 'aggressive';
        } else if (context.complexity === 'low' && performance.quality > 0.8) {
            selectedStrategy = 'conservative';
        } else if (performance.variance > 0.3) {
            selectedStrategy = 'adaptive';
        } else if (context.experimental && resources.available > 0.9) {
            selectedStrategy = 'experimental';
        }
        
        // Adaptive override based on learning
        if (loop.currentIteration > 10) {
            const learnedStrategy = await this.selectLearnedStrategy(loop);
            if (learnedStrategy) {
                selectedStrategy = learnedStrategy;
            }
        }
        
        const strategy = this.strategies.get(selectedStrategy);
        console.log(`🎯 [${loop.id}] Selected strategy: ${strategy.name} (${strategy.description})`);
        
        return strategy;
    }

    /**
     * Calculate next iteration interval based on adaptive timing
     */
    async calculateNextInterval(loop, result) {
        const strategy = loop.currentStrategy || this.strategies.get('balanced');
        let baseInterval = strategy.baseInterval;
        
        if (baseInterval === 'dynamic') {
            baseInterval = await this.calculateDynamicInterval(loop, result);
        } else if (baseInterval === 'variable') {
            baseInterval = await this.calculateVariableInterval(loop, result);
        }
        
        // Apply performance-based adjustments
        const performanceMultiplier = await this.calculatePerformanceMultiplier(loop, result);
        const resourceMultiplier = await this.calculateResourceMultiplier();
        const qualityMultiplier = await this.calculateQualityMultiplier(result);
        
        const finalInterval = Math.max(
            1000, // minimum 1 second
            Math.min(
                60000, // maximum 1 minute
                baseInterval * performanceMultiplier * resourceMultiplier * qualityMultiplier
            )
        );
        
        console.log(`⏱️ [${loop.id}] Next interval: ${finalInterval}ms (base: ${baseInterval}, perf: ${performanceMultiplier.toFixed(2)}, res: ${resourceMultiplier.toFixed(2)}, qual: ${qualityMultiplier.toFixed(2)})`);
        
        return finalInterval;
    }

    /**
     * Calculate retry interval for error scenarios
     */
    async calculateRetryInterval(loop, error) {
        const errorType = this.classifyError(error);
        const baseRetryInterval = loop.interval || 5000;
        
        let multiplier = 1.5; // default exponential backoff
        
        switch (errorType) {
            case 'rate_limit':
                multiplier = 3.0;
                break;
            case 'temporary_failure':
                multiplier = 2.0;
                break;
            case 'resource_exhaustion':
                multiplier = 4.0;
                break;
            case 'network_error':
                multiplier = 2.5;
                break;
            default:
                multiplier = 1.5;
        }
        
        const retryInterval = Math.min(
            300000, // max 5 minutes
            baseRetryInterval * multiplier * (loop.consecutiveErrors || 1)
        );
        
        console.log(`🔄 [${loop.id}] Retry interval: ${retryInterval}ms for ${errorType} error`);
        return retryInterval;
    }

    /**
     * Select recovery strategy based on error type and loop state
     */
    async selectRecoveryStrategy(loop, errorType) {
        const strategies = {
            rate_limit: {
                name: 'backoff_and_retry',
                actions: ['increase_interval', 'reduce_concurrency', 'switch_provider']
            },
            temporary_failure: {
                name: 'retry_with_fallback',
                actions: ['retry_same', 'try_alternative', 'reduce_complexity']
            },
            resource_exhaustion: {
                name: 'resource_optimization',
                actions: ['free_resources', 'reduce_load', 'defer_execution']
            },
            network_error: {
                name: 'network_recovery',
                actions: ['retry_connection', 'switch_endpoint', 'offline_mode']
            },
            unknown: {
                name: 'conservative_recovery',
                actions: ['safe_retry', 'reduce_scope', 'manual_intervention']
            }
        };
        
        return strategies[errorType] || strategies.unknown;
    }

    /**
     * Analyze loop context for strategy selection
     */
    async analyzeLoopContext(loop) {
        const context = {
            complexity: 'medium',
            urgency: 'normal',
            resourceRequirements: 'moderate',
            experimental: false
        };
        
        // Analyze topic complexity
        if (loop.topic.length > 100 || loop.topic.includes('complex') || loop.topic.includes('advanced')) {
            context.complexity = 'high';
        } else if (loop.topic.length < 30 || loop.topic.includes('simple') || loop.topic.includes('basic')) {
            context.complexity = 'low';
        }
        
        // Analyze urgency indicators
        if (loop.topic.includes('urgent') || loop.topic.includes('critical') || loop.topic.includes('emergency')) {
            context.urgency = 'high';
        } else if (loop.topic.includes('research') || loop.topic.includes('explore') || loop.topic.includes('experiment')) {
            context.urgency = 'low';
            context.experimental = true;
        }
        
        // Analyze resource requirements
        if (loop.agents && loop.agents.length > 5) {
            context.resourceRequirements = 'high';
        } else if (loop.agents && loop.agents.length < 3) {
            context.resourceRequirements = 'low';
        }
        
        return context;
    }

    /**
     * Analyze performance history for adaptive decisions
     */
    async analyzePerformanceHistory(loop) {
        const history = this.performanceHistory.get(loop.id) || [];
        
        if (history.length === 0) {
            return { quality: 0.5, variance: 0.5, trend: 'stable' };
        }
        
        const qualities = history.map(h => h.quality || 0.5);
        const durations = history.map(h => h.duration || 5000);
        
        const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        
        const qualityVariance = this.calculateVariance(qualities);
        const durationVariance = this.calculateVariance(durations);
        
        const trend = this.calculateTrend(qualities);
        
        return {
            quality: avgQuality,
            duration: avgDuration,
            variance: (qualityVariance + durationVariance) / 2,
            trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable'
        };
    }

    /**
     * Analyze resource availability
     */
    async analyzeResourceAvailability() {
        // Simulate resource analysis - in real implementation, this would check actual system resources
        const cpuUsage = Math.random() * 0.8; // 0-80% usage
        const memoryUsage = Math.random() * 0.7; // 0-70% usage
        const networkLatency = Math.random() * 100; // 0-100ms latency
        
        const available = 1 - Math.max(cpuUsage, memoryUsage, networkLatency / 100);
        
        return {
            available: Math.max(0.1, available),
            cpu: 1 - cpuUsage,
            memory: 1 - memoryUsage,
            network: 1 - (networkLatency / 100)
        };
    }

    /**
     * Calculate dynamic interval based on loop performance
     */
    async calculateDynamicInterval(loop, result) {
        const baseInterval = 5000;
        const performance = result.performance || { score: 0.5 };
        const quality = result.quality || 0.5;
        
        // Faster intervals for high-performing loops
        if (performance.score > 0.8 && quality > 0.8) {
            return baseInterval * 0.6; // 40% faster
        } else if (performance.score < 0.3 || quality < 0.3) {
            return baseInterval * 1.8; // 80% slower
        }
        
        return baseInterval;
    }

    /**
     * Calculate variable interval with randomization
     */
    async calculateVariableInterval(loop, result) {
        const baseInterval = 5000;
        const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
        const performanceFactor = (result.performance?.score || 0.5) + 0.5; // 0.5 to 1.5
        
        return baseInterval * randomFactor * performanceFactor;
    }

    /**
     * Calculate performance-based multiplier
     */
    async calculatePerformanceMultiplier(loop, result) {
        const performance = result.performance || { score: 0.5 };
        
        if (performance.score > 0.9) return 0.7; // Much faster for excellent performance
        if (performance.score > 0.7) return 0.85; // Faster for good performance
        if (performance.score < 0.3) return 1.5; // Slower for poor performance
        if (performance.score < 0.5) return 1.2; // Slightly slower for below average
        
        return 1.0; // Normal speed for average performance
    }

    /**
     * Calculate resource-based multiplier
     */
    async calculateResourceMultiplier() {
        const resources = await this.analyzeResourceAvailability();
        
        if (resources.available > 0.8) return 0.8; // Faster when resources abundant
        if (resources.available < 0.3) return 1.6; // Slower when resources scarce
        
        return 1.0;
    }

    /**
     * Calculate quality-based multiplier
     */
    async calculateQualityMultiplier(result) {
        const quality = result.quality || 0.5;
        
        if (quality > 0.9) return 0.75; // Faster for high quality
        if (quality < 0.3) return 1.4; // Slower for low quality
        
        return 1.0;
    }

    /**
     * Utility functions
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n + 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
        const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
        
        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('rate limit') || message.includes('too many requests')) {
            return 'rate_limit';
        } else if (message.includes('network') || message.includes('connection')) {
            return 'network_error';
        } else if (message.includes('memory') || message.includes('resource')) {
            return 'resource_exhaustion';
        } else if (message.includes('timeout') || message.includes('temporary')) {
            return 'temporary_failure';
        }
        
        return 'unknown';
    }

    async selectLearnedStrategy(loop) {
        // Implement machine learning-based strategy selection
        // This would analyze historical performance and select optimal strategy
        const history = this.performanceHistory.get(loop.id) || [];
        
        if (history.length < 5) return null;
        
        // Simple heuristic: if recent performance is consistently good, use aggressive
        const recentHistory = history.slice(-5);
        const avgQuality = recentHistory.reduce((sum, h) => sum + (h.quality || 0.5), 0) / recentHistory.length;
        
        if (avgQuality > 0.8) return 'aggressive';
        if (avgQuality < 0.4) return 'conservative';
        
        return null; // Use default selection
    }
}

/**
 * Load Balancer for resource optimization
 */
class LoadBalancer {
    constructor() {
        this.activeLoads = new Map();
        this.resourceLimits = {
            maxConcurrentLoops: 10,
            maxConcurrentAgents: 50,
            maxMemoryUsage: 0.8,
            maxCpuUsage: 0.8
        };
    }

    async checkResourceAvailability(loopId) {
        // Check if resources are available for new operations
        const currentLoad = this.getCurrentLoad();
        
        return {
            canProceed: currentLoad.loops < this.resourceLimits.maxConcurrentLoops,
            currentLoad: currentLoad,
            limits: this.resourceLimits
        };
    }

    getCurrentLoad() {
        return {
            loops: this.activeLoads.size,
            agents: Array.from(this.activeLoads.values()).reduce((sum, load) => sum + load.agents, 0),
            memory: 0.5, // Placeholder
            cpu: 0.4 // Placeholder
        };
    }
}
