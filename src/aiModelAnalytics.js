/**
 * AI Model Performance Analytics System
 * Comprehensive analytics to track model performance by task type, cost vs quality, response times, and success rates
 */

import fs from 'fs/promises';
import path from 'path';

export class AIModelAnalytics {
    constructor(options = {}) {
        this.analyticsDir = options.analyticsDir || './analytics';
        this.maxHistoryEntries = options.maxHistoryEntries || 1000;
        this.aggregationInterval = options.aggregationInterval || 24 * 60 * 60 * 1000; // 24 hours
        
        this.modelMetrics = new Map();
        this.taskTypeMetrics = new Map();
        this.performanceHistory = [];
        this.costAnalysis = new Map();
        this.qualityScores = new Map();
        
        this.modelCosts = {
            'gpt-4': { input: 0.03, output: 0.06 },
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            'claude-3-opus': { input: 0.015, output: 0.075 },
            'claude-3-sonnet': { input: 0.003, output: 0.015 },
            'claude-3-haiku': { input: 0.00025, output: 0.00125 },
            'deepseek-chat': { input: 0.0014, output: 0.0028 },
            'deepseek-coder': { input: 0.0014, output: 0.0028 },
            'gemini-pro': { input: 0.001, output: 0.002 },
            'gemini-1.5-pro': { input: 0.0035, output: 0.0105 }
        };
        
        console.log('📊 AI Model Performance Analytics initialized');
        this.initializeAnalytics();
    }

    async initializeAnalytics() {
        try {
            await fs.mkdir(this.analyticsDir, { recursive: true });
            await this.loadAnalyticsFromDisk();
            console.log(`📁 Analytics directory initialized: ${this.analyticsDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize analytics directory:', error.message);
        }
    }

    async loadAnalyticsFromDisk() {
        try {
            const files = [
                { name: 'model_metrics.json', target: 'modelMetrics' },
                { name: 'task_metrics.json', target: 'taskTypeMetrics' },
                { name: 'performance_history.json', target: 'performanceHistory' },
                { name: 'cost_analysis.json', target: 'costAnalysis' },
                { name: 'quality_scores.json', target: 'qualityScores' }
            ];

            for (const file of files) {
                try {
                    const filePath = path.join(this.analyticsDir, file.name);
                    const data = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(data);
                    
                    if (file.target === 'performanceHistory') {
                        this[file.target] = Array.isArray(parsed) ? parsed : [];
                    } else if (file.target === 'modelMetrics') {
                        // Special handling for model metrics to reconstruct Sets
                        this[file.target] = new Map();
                        for (const [key, value] of Object.entries(parsed)) {
                            // Reconstruct taskTypes as a Set
                            if (value.taskTypes) {
                                value.taskTypes = new Set(Array.isArray(value.taskTypes) ? value.taskTypes : []);
                            } else {
                                value.taskTypes = new Set();
                            }
                            this[file.target].set(key, value);
                        }
                    } else if (file.target === 'taskTypeMetrics') {
                        // Special handling for task metrics to reconstruct Maps
                        this[file.target] = new Map();
                        for (const [key, value] of Object.entries(parsed)) {
                            // Reconstruct models as a Map
                            if (value.models) {
                                value.models = new Map(Object.entries(value.models));
                            } else {
                                value.models = new Map();
                            }
                            this[file.target].set(key, value);
                        }
                    } else {
                        this[file.target] = new Map(Object.entries(parsed));
                    }
                    
                    console.log(`📥 Loaded ${file.name}: ${file.target === 'performanceHistory' ? parsed.length : Object.keys(parsed).length} items`);
                } catch (error) {
                    console.log(`📝 No existing ${file.name} found, starting fresh`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load analytics from disk:', error.message);
        }
    }

    async saveAnalyticsToDisk() {
        try {
            // Convert model metrics with proper Set serialization
            const modelMetricsData = {};
            for (const [key, value] of this.modelMetrics.entries()) {
                modelMetricsData[key] = {
                    ...value,
                    taskTypes: Array.from(value.taskTypes) // Convert Set to Array for JSON
                };
            }

            // Convert task metrics with proper Map serialization
            const taskMetricsData = {};
            for (const [key, value] of this.taskTypeMetrics.entries()) {
                taskMetricsData[key] = {
                    ...value,
                    models: Object.fromEntries(value.models) // Convert Map to Object for JSON
                };
            }

            const files = [
                { name: 'model_metrics.json', data: modelMetricsData },
                { name: 'task_metrics.json', data: taskMetricsData },
                { name: 'performance_history.json', data: this.performanceHistory },
                { name: 'cost_analysis.json', data: Object.fromEntries(this.costAnalysis) },
                { name: 'quality_scores.json', data: Object.fromEntries(this.qualityScores) }
            ];

            for (const file of files) {
                const filePath = path.join(this.analyticsDir, file.name);
                await fs.writeFile(filePath, JSON.stringify(file.data, null, 2));
            }
            
            console.log('💾 Analytics saved to disk');
        } catch (error) {
            console.warn('⚠️ Failed to save analytics to disk:', error.message);
        }
    }

    recordModelPerformance(modelName, taskType, metrics) {
        const timestamp = Date.now();
        const modelKey = `${modelName}`;
        const taskKey = `${taskType}`;
        
        // Update model metrics
        if (!this.modelMetrics.has(modelKey)) {
            this.modelMetrics.set(modelKey, {
                name: modelName,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalResponseTime: 0,
                totalCost: 0,
                averageQuality: 0,
                taskTypes: new Set(),
                firstUsed: timestamp,
                lastUsed: timestamp
            });
        }
        
        const modelMetric = this.modelMetrics.get(modelKey);
        modelMetric.totalRequests++;
        modelMetric.totalResponseTime += metrics.responseTime || 0;
        modelMetric.totalCost += this.calculateCost(modelName, metrics.inputTokens || 0, metrics.outputTokens || 0);
        modelMetric.taskTypes.add(taskType);
        modelMetric.lastUsed = timestamp;
        
        if (metrics.success) {
            modelMetric.successfulRequests++;
        } else {
            modelMetric.failedRequests++;
        }
        
        if (metrics.qualityScore) {
            const currentAvg = modelMetric.averageQuality;
            const totalSuccessful = modelMetric.successfulRequests;
            modelMetric.averageQuality = (currentAvg * (totalSuccessful - 1) + metrics.qualityScore) / totalSuccessful;
        }
        
        // Update task type metrics
        if (!this.taskTypeMetrics.has(taskKey)) {
            this.taskTypeMetrics.set(taskKey, {
                type: taskType,
                totalRequests: 0,
                models: new Map(),
                averageResponseTime: 0,
                averageCost: 0,
                averageQuality: 0,
                successRate: 0
            });
        }
        
        const taskMetric = this.taskTypeMetrics.get(taskKey);
        taskMetric.totalRequests++;
        
        if (!taskMetric.models.has(modelName)) {
            taskMetric.models.set(modelName, {
                requests: 0,
                successes: 0,
                totalTime: 0,
                totalCost: 0,
                totalQuality: 0
            });
        }
        
        const taskModelMetric = taskMetric.models.get(modelName);
        taskModelMetric.requests++;
        taskModelMetric.totalTime += metrics.responseTime || 0;
        taskModelMetric.totalCost += this.calculateCost(modelName, metrics.inputTokens || 0, metrics.outputTokens || 0);
        
        if (metrics.success) {
            taskModelMetric.successes++;
            if (metrics.qualityScore) {
                taskModelMetric.totalQuality += metrics.qualityScore;
            }
        }
        
        // Update aggregated task metrics
        this.updateTaskAggregates(taskKey);
        
        // Add to performance history
        this.addToPerformanceHistory({
            timestamp,
            model: modelName,
            taskType,
            ...metrics
        });
        
        // Periodic save
        if (this.performanceHistory.length % 10 === 0) {
            this.saveAnalyticsToDisk();
        }
    }

    calculateCost(modelName, inputTokens, outputTokens) {
        const costs = this.modelCosts[modelName];
        if (!costs) return 0;
        
        return (inputTokens / 1000 * costs.input) + (outputTokens / 1000 * costs.output);
    }

    updateTaskAggregates(taskKey) {
        const taskMetric = this.taskTypeMetrics.get(taskKey);
        const models = Array.from(taskMetric.models.values());
        
        const totalRequests = models.reduce((sum, m) => sum + m.requests, 0);
        const totalSuccesses = models.reduce((sum, m) => sum + m.successes, 0);
        const totalTime = models.reduce((sum, m) => sum + m.totalTime, 0);
        const totalCost = models.reduce((sum, m) => sum + m.totalCost, 0);
        const totalQuality = models.reduce((sum, m) => sum + m.totalQuality, 0);
        
        taskMetric.averageResponseTime = totalRequests > 0 ? totalTime / totalRequests : 0;
        taskMetric.averageCost = totalRequests > 0 ? totalCost / totalRequests : 0;
        taskMetric.averageQuality = totalSuccesses > 0 ? totalQuality / totalSuccesses : 0;
        taskMetric.successRate = totalRequests > 0 ? totalSuccesses / totalRequests : 0;
    }

    addToPerformanceHistory(entry) {
        this.performanceHistory.push(entry);
        
        // Keep only recent history
        if (this.performanceHistory.length > this.maxHistoryEntries) {
            this.performanceHistory = this.performanceHistory.slice(-this.maxHistoryEntries);
        }
    }

    getModelRankings(taskType = null, metric = 'overall') {
        let models = Array.from(this.modelMetrics.values());
        
        // Filter by task type if specified
        if (taskType) {
            models = models.filter(model => model.taskTypes.has(taskType));
        }
        
        // Calculate scores based on metric
        const scoredModels = models.map(model => {
            const successRate = model.totalRequests > 0 ? model.successfulRequests / model.totalRequests : 0;
            const avgResponseTime = model.totalRequests > 0 ? model.totalResponseTime / model.totalRequests : 0;
            const avgCost = model.totalRequests > 0 ? model.totalCost / model.totalRequests : 0;
            
            let score = 0;
            switch (metric) {
                case 'speed':
                    score = avgResponseTime > 0 ? 1 / avgResponseTime * 1000 : 0; // Inverse of response time
                    break;
                case 'cost':
                    score = avgCost > 0 ? 1 / avgCost : 0; // Inverse of cost (lower cost = higher score)
                    break;
                case 'quality':
                    score = model.averageQuality;
                    break;
                case 'reliability':
                    score = successRate;
                    break;
                case 'overall':
                default:
                    // Weighted combination of all metrics
                    score = (successRate * 0.3) + 
                           (model.averageQuality * 0.3) + 
                           ((avgResponseTime > 0 ? 1 / avgResponseTime * 1000 : 0) * 0.2) + 
                           ((avgCost > 0 ? 1 / avgCost : 0) * 0.2);
                    break;
            }
            
            return {
                ...model,
                score,
                successRate,
                avgResponseTime,
                avgCost,
                taskTypesArray: Array.from(model.taskTypes)
            };
        });
        
        return scoredModels.sort((a, b) => b.score - a.score);
    }

    getTaskTypeAnalysis(taskType) {
        const taskMetric = this.taskTypeMetrics.get(taskType);
        if (!taskMetric) return null;
        
        const modelPerformance = Array.from(taskMetric.models.entries()).map(([modelName, metrics]) => {
            const successRate = metrics.requests > 0 ? metrics.successes / metrics.requests : 0;
            const avgResponseTime = metrics.requests > 0 ? metrics.totalTime / metrics.requests : 0;
            const avgCost = metrics.requests > 0 ? metrics.totalCost / metrics.requests : 0;
            const avgQuality = metrics.successes > 0 ? metrics.totalQuality / metrics.successes : 0;
            
            return {
                model: modelName,
                requests: metrics.requests,
                successRate,
                avgResponseTime,
                avgCost,
                avgQuality,
                score: (successRate * 0.4) + (avgQuality * 0.3) + 
                       ((avgResponseTime > 0 ? 1 / avgResponseTime * 1000 : 0) * 0.15) + 
                       ((avgCost > 0 ? 1 / avgCost : 0) * 0.15)
            };
        }).sort((a, b) => b.score - a.score);
        
        return {
            ...taskMetric,
            modelPerformance
        };
    }

    getCostAnalysis(timeframe = 'all') {
        const now = Date.now();
        let cutoffTime = 0;
        
        switch (timeframe) {
            case 'day':
                cutoffTime = now - 24 * 60 * 60 * 1000;
                break;
            case 'week':
                cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case 'month':
                cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
        }
        
        const relevantHistory = this.performanceHistory.filter(entry => entry.timestamp >= cutoffTime);
        
        const costByModel = new Map();
        const costByTaskType = new Map();
        let totalCost = 0;
        
        relevantHistory.forEach(entry => {
            const cost = this.calculateCost(entry.model, entry.inputTokens || 0, entry.outputTokens || 0);
            totalCost += cost;
            
            // By model
            if (!costByModel.has(entry.model)) {
                costByModel.set(entry.model, { cost: 0, requests: 0 });
            }
            const modelCost = costByModel.get(entry.model);
            modelCost.cost += cost;
            modelCost.requests++;
            
            // By task type
            if (!costByTaskType.has(entry.taskType)) {
                costByTaskType.set(entry.taskType, { cost: 0, requests: 0 });
            }
            const taskCost = costByTaskType.get(entry.taskType);
            taskCost.cost += cost;
            taskCost.requests++;
        });
        
        return {
            timeframe,
            totalCost,
            totalRequests: relevantHistory.length,
            avgCostPerRequest: relevantHistory.length > 0 ? totalCost / relevantHistory.length : 0,
            costByModel: Object.fromEntries(costByModel),
            costByTaskType: Object.fromEntries(costByTaskType)
        };
    }

    getPerformanceTrends(metric = 'responseTime', timeframe = 'week') {
        const now = Date.now();
        let cutoffTime = 0;
        let bucketSize = 60 * 60 * 1000; // 1 hour
        
        switch (timeframe) {
            case 'day':
                cutoffTime = now - 24 * 60 * 60 * 1000;
                bucketSize = 60 * 60 * 1000; // 1 hour
                break;
            case 'week':
                cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
                bucketSize = 6 * 60 * 60 * 1000; // 6 hours
                break;
            case 'month':
                cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
                bucketSize = 24 * 60 * 60 * 1000; // 1 day
                break;
        }
        
        const relevantHistory = this.performanceHistory.filter(entry => entry.timestamp >= cutoffTime);
        const buckets = new Map();
        
        relevantHistory.forEach(entry => {
            const bucketKey = Math.floor(entry.timestamp / bucketSize) * bucketSize;
            
            if (!buckets.has(bucketKey)) {
                buckets.set(bucketKey, {
                    timestamp: bucketKey,
                    values: [],
                    count: 0
                });
            }
            
            const bucket = buckets.get(bucketKey);
            bucket.count++;
            
            switch (metric) {
                case 'responseTime':
                    bucket.values.push(entry.responseTime || 0);
                    break;
                case 'successRate':
                    bucket.values.push(entry.success ? 1 : 0);
                    break;
                case 'qualityScore':
                    if (entry.qualityScore) bucket.values.push(entry.qualityScore);
                    break;
                case 'cost':
                    bucket.values.push(this.calculateCost(entry.model, entry.inputTokens || 0, entry.outputTokens || 0));
                    break;
            }
        });
        
        // Calculate averages for each bucket
        const trends = Array.from(buckets.values()).map(bucket => ({
            timestamp: bucket.timestamp,
            value: bucket.values.length > 0 ? bucket.values.reduce((sum, v) => sum + v, 0) / bucket.values.length : 0,
            count: bucket.count
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        return trends;
    }

    getRecommendedModel(taskType, priorities = { cost: 0.3, speed: 0.3, quality: 0.4 }) {
        const taskAnalysis = this.getTaskTypeAnalysis(taskType);
        if (!taskAnalysis || taskAnalysis.modelPerformance.length === 0) {
            return null;
        }
        
        // Calculate weighted scores based on priorities
        const scoredModels = taskAnalysis.modelPerformance.map(model => {
            const costScore = model.avgCost > 0 ? 1 / model.avgCost : 0;
            const speedScore = model.avgResponseTime > 0 ? 1 / model.avgResponseTime * 1000 : 0;
            const qualityScore = model.avgQuality;
            
            const weightedScore = (costScore * priorities.cost) + 
                                (speedScore * priorities.speed) + 
                                (qualityScore * priorities.quality);
            
            return {
                ...model,
                weightedScore,
                costScore,
                speedScore,
                qualityScore
            };
        }).sort((a, b) => b.weightedScore - a.weightedScore);
        
        return scoredModels[0];
    }

    getAnalyticsSummary() {
        const totalModels = this.modelMetrics.size;
        const totalTaskTypes = this.taskTypeMetrics.size;
        const totalRequests = this.performanceHistory.length;
        
        const models = Array.from(this.modelMetrics.values());
        const totalSuccessful = models.reduce((sum, m) => sum + m.successfulRequests, 0);
        const totalFailed = models.reduce((sum, m) => sum + m.failedRequests, 0);
        const totalCost = models.reduce((sum, m) => sum + m.totalCost, 0);
        
        const overallSuccessRate = (totalSuccessful + totalFailed) > 0 ? 
            totalSuccessful / (totalSuccessful + totalFailed) : 0;
        
        const topModel = this.getModelRankings(null, 'overall')[0];
        const costAnalysis = this.getCostAnalysis('month');
        
        return {
            overview: {
                totalModels,
                totalTaskTypes,
                totalRequests,
                overallSuccessRate,
                totalCost
            },
            topPerformer: topModel ? {
                name: topModel.name,
                score: topModel.score,
                successRate: topModel.successRate,
                avgResponseTime: topModel.avgResponseTime,
                avgCost: topModel.avgCost
            } : null,
            costAnalysis: {
                monthlyTotal: costAnalysis.totalCost,
                avgPerRequest: costAnalysis.avgCostPerRequest,
                topCostModel: Object.entries(costAnalysis.costByModel)
                    .sort((a, b) => b[1].cost - a[1].cost)[0]
            }
        };
    }

    async clearAnalytics(type = 'all') {
        switch (type) {
            case 'models':
                this.modelMetrics.clear();
                break;
            case 'tasks':
                this.taskTypeMetrics.clear();
                break;
            case 'history':
                this.performanceHistory = [];
                break;
            case 'costs':
                this.costAnalysis.clear();
                break;
            case 'quality':
                this.qualityScores.clear();
                break;
            case 'all':
                this.modelMetrics.clear();
                this.taskTypeMetrics.clear();
                this.performanceHistory = [];
                this.costAnalysis.clear();
                this.qualityScores.clear();
                break;
        }
        
        await this.saveAnalyticsToDisk();
        console.log(`🗑️ Cleared ${type} analytics`);
    }
}
