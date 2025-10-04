/**
 * Project Memory & Context Persistence System
 * Persistent storage for project history, user preferences, successful strategies, and cross-session context
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class ProjectMemory {
    constructor(options = {}) {
        this.memoryDir = options.memoryDir || './memory';
        this.maxProjects = options.maxProjects || 100;
        this.maxContextHistory = options.maxContextHistory || 50;
        this.compressionThreshold = options.compressionThreshold || 30; // days
        
        this.projects = new Map();
        this.userPreferences = new Map();
        this.successfulStrategies = new Map();
        this.contextHistory = [];
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            context: {},
            interactions: []
        };
        
        console.log('🧠 Project Memory & Context Persistence initialized');
        this.initializeMemory();
    }

    async initializeMemory() {
        try {
            await fs.mkdir(this.memoryDir, { recursive: true });
            await this.loadMemoryFromDisk();
            console.log(`📁 Memory directory initialized: ${this.memoryDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize memory directory:', error.message);
        }
    }

    generateSessionId() {
        return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    generateProjectId(projectName, context = {}) {
        const projectData = {
            name: projectName.toLowerCase().trim(),
            type: context.type || 'general',
            domain: context.domain || 'unknown'
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(projectData))
            .digest('hex').substring(0, 16);
    }

    async loadMemoryFromDisk() {
        try {
            const files = [
                { name: 'projects.json', target: 'projects' },
                { name: 'preferences.json', target: 'userPreferences' },
                { name: 'strategies.json', target: 'successfulStrategies' },
                { name: 'context.json', target: 'contextHistory' }
            ];

            for (const file of files) {
                try {
                    const filePath = path.join(this.memoryDir, file.name);
                    const data = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(data);
                    
                    if (file.target === 'projects') {
                        this.projects = new Map(Object.entries(parsed));
                    } else if (file.target === 'userPreferences') {
                        this.userPreferences = new Map(Object.entries(parsed));
                    } else if (file.target === 'successfulStrategies') {
                        this.successfulStrategies = new Map(Object.entries(parsed));
                    } else if (file.target === 'contextHistory') {
                        this.contextHistory = Array.isArray(parsed) ? parsed : [];
                    }
                    
                    console.log(`📥 Loaded ${file.name}: ${file.target === 'contextHistory' ? parsed.length : Object.keys(parsed).length} items`);
                } catch (error) {
                    console.log(`📝 No existing ${file.name} found, starting fresh`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load memory from disk:', error.message);
        }
    }

    async saveMemoryToDisk() {
        try {
            const files = [
                { name: 'projects.json', data: Object.fromEntries(this.projects) },
                { name: 'preferences.json', data: Object.fromEntries(this.userPreferences) },
                { name: 'strategies.json', data: Object.fromEntries(this.successfulStrategies) },
                { name: 'context.json', data: this.contextHistory }
            ];

            for (const file of files) {
                const filePath = path.join(this.memoryDir, file.name);
                await fs.writeFile(filePath, JSON.stringify(file.data, null, 2));
            }
            
            console.log('💾 Memory saved to disk');
        } catch (error) {
            console.warn('⚠️ Failed to save memory to disk:', error.message);
        }
    }

    // Project Management
    async createProject(projectName, context = {}) {
        const projectId = this.generateProjectId(projectName, context);
        
        const project = {
            id: projectId,
            name: projectName,
            type: context.type || 'general',
            domain: context.domain || 'unknown',
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            status: 'active',
            context: context,
            history: [],
            outcomes: [],
            strategies: [],
            metrics: {
                totalTasks: 0,
                completedTasks: 0,
                successRate: 0,
                averageCompletionTime: 0,
                costSpent: 0
            }
        };
        
        this.projects.set(projectId, project);
        await this.saveMemoryToDisk();
        
        console.log(`📝 Created project: ${projectName} (${projectId})`);
        return projectId;
    }

    async getProject(projectId) {
        const project = this.projects.get(projectId);
        if (project) {
            project.lastAccessed = Date.now();
            await this.saveMemoryToDisk();
        }
        return project;
    }

    async updateProject(projectId, updates) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        Object.assign(project, updates);
        project.lastAccessed = Date.now();
        
        await this.saveMemoryToDisk();
        console.log(`📝 Updated project: ${project.name}`);
        return project;
    }

    async addProjectHistory(projectId, event) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        const historyEntry = {
            timestamp: Date.now(),
            type: event.type || 'general',
            description: event.description,
            data: event.data || {},
            outcome: event.outcome || 'pending'
        };
        
        project.history.push(historyEntry);
        project.lastAccessed = Date.now();
        
        // Keep only recent history
        if (project.history.length > 100) {
            project.history = project.history.slice(-100);
        }
        
        await this.saveMemoryToDisk();
        return historyEntry;
    }

    // User Preferences Management
    async setUserPreference(key, value, context = {}) {
        const preference = {
            value,
            context,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            usageCount: 1
        };
        
        if (this.userPreferences.has(key)) {
            const existing = this.userPreferences.get(key);
            preference.usageCount = existing.usageCount + 1;
            preference.createdAt = existing.createdAt;
        }
        
        this.userPreferences.set(key, preference);
        await this.saveMemoryToDisk();
        
        console.log(`⚙️ Set user preference: ${key} = ${value}`);
        return preference;
    }

    getUserPreference(key, defaultValue = null) {
        const preference = this.userPreferences.get(key);
        if (preference) {
            preference.lastUsed = Date.now();
            return preference.value;
        }
        return defaultValue;
    }

    // Successful Strategies Management
    async recordSuccessfulStrategy(strategyName, context, outcome) {
        const strategyId = crypto.createHash('sha256')
            .update(strategyName + JSON.stringify(context))
            .digest('hex').substring(0, 12);
        
        const strategy = {
            id: strategyId,
            name: strategyName,
            context,
            outcome,
            successCount: 1,
            totalAttempts: 1,
            successRate: 1.0,
            averageTime: outcome.duration || 0,
            lastUsed: Date.now(),
            createdAt: Date.now()
        };
        
        if (this.successfulStrategies.has(strategyId)) {
            const existing = this.successfulStrategies.get(strategyId);
            strategy.successCount = existing.successCount + 1;
            strategy.totalAttempts = existing.totalAttempts + 1;
            strategy.successRate = strategy.successCount / strategy.totalAttempts;
            strategy.createdAt = existing.createdAt;
            
            // Update average time
            strategy.averageTime = (existing.averageTime * existing.successCount + (outcome.duration || 0)) / strategy.successCount;
        }
        
        this.successfulStrategies.set(strategyId, strategy);
        await this.saveMemoryToDisk();
        
        console.log(`✅ Recorded successful strategy: ${strategyName} (success rate: ${(strategy.successRate * 100).toFixed(1)}%)`);
        return strategy;
    }

    getRecommendedStrategies(context, limit = 5) {
        const strategies = Array.from(this.successfulStrategies.values());
        
        // Score strategies based on context similarity and success rate
        const scoredStrategies = strategies.map(strategy => {
            let score = strategy.successRate * 0.6; // Base score from success rate
            
            // Context similarity bonus
            const contextSimilarity = this.calculateContextSimilarity(context, strategy.context);
            score += contextSimilarity * 0.4;
            
            // Recency bonus
            const daysSinceUsed = (Date.now() - strategy.lastUsed) / (1000 * 60 * 60 * 24);
            const recencyBonus = Math.max(0, 1 - daysSinceUsed / 30) * 0.1;
            score += recencyBonus;
            
            return { ...strategy, score };
        });
        
        return scoredStrategies
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    calculateContextSimilarity(context1, context2) {
        const keys1 = Object.keys(context1);
        const keys2 = Object.keys(context2);
        const allKeys = new Set([...keys1, ...keys2]);
        
        let matches = 0;
        for (const key of allKeys) {
            if (context1[key] === context2[key]) {
                matches++;
            }
        }
        
        return allKeys.size > 0 ? matches / allKeys.size : 0;
    }

    // Context History Management
    addContextEntry(type, data, sessionId = null) {
        const entry = {
            id: crypto.randomBytes(8).toString('hex'),
            type,
            data,
            sessionId: sessionId || this.currentSession.id,
            timestamp: Date.now()
        };
        
        this.contextHistory.push(entry);
        this.currentSession.interactions.push(entry);
        
        // Keep only recent context
        if (this.contextHistory.length > this.maxContextHistory) {
            this.contextHistory = this.contextHistory.slice(-this.maxContextHistory);
        }
        
        return entry;
    }

    getRecentContext(limit = 10, type = null) {
        let context = this.contextHistory.slice(-limit);
        
        if (type) {
            context = context.filter(entry => entry.type === type);
        }
        
        return context.reverse(); // Most recent first
    }

    getCurrentSessionContext() {
        return {
            ...this.currentSession,
            duration: Date.now() - this.currentSession.startTime
        };
    }

    // Analytics and Insights
    getMemoryAnalytics() {
        const now = Date.now();
        const projects = Array.from(this.projects.values());
        const strategies = Array.from(this.successfulStrategies.values());
        
        return {
            projects: {
                total: projects.length,
                active: projects.filter(p => p.status === 'active').length,
                completed: projects.filter(p => p.status === 'completed').length,
                averageSuccessRate: projects.reduce((sum, p) => sum + p.metrics.successRate, 0) / projects.length || 0
            },
            preferences: {
                total: this.userPreferences.size,
                mostUsed: Array.from(this.userPreferences.entries())
                    .sort((a, b) => b[1].usageCount - a[1].usageCount)
                    .slice(0, 5)
                    .map(([key, pref]) => ({ key, usageCount: pref.usageCount }))
            },
            strategies: {
                total: strategies.length,
                averageSuccessRate: strategies.reduce((sum, s) => sum + s.successRate, 0) / strategies.length || 0,
                topStrategies: strategies
                    .sort((a, b) => b.successRate - a.successRate)
                    .slice(0, 5)
                    .map(s => ({ name: s.name, successRate: s.successRate, usageCount: s.successCount }))
            },
            context: {
                totalEntries: this.contextHistory.length,
                currentSessionDuration: now - this.currentSession.startTime,
                currentSessionInteractions: this.currentSession.interactions.length
            }
        };
    }

    async compressOldMemory() {
        const cutoffDate = Date.now() - (this.compressionThreshold * 24 * 60 * 60 * 1000);
        
        // Compress old project history
        for (const [projectId, project] of this.projects) {
            const oldHistory = project.history.filter(h => h.timestamp < cutoffDate);
            const recentHistory = project.history.filter(h => h.timestamp >= cutoffDate);
            
            if (oldHistory.length > 0) {
                // Create summary of old history
                const summary = {
                    timestamp: cutoffDate,
                    type: 'compressed_history',
                    description: `Compressed ${oldHistory.length} old history entries`,
                    data: {
                        entryCount: oldHistory.length,
                        timespan: {
                            start: Math.min(...oldHistory.map(h => h.timestamp)),
                            end: Math.max(...oldHistory.map(h => h.timestamp))
                        },
                        outcomes: oldHistory.reduce((acc, h) => {
                            acc[h.outcome] = (acc[h.outcome] || 0) + 1;
                            return acc;
                        }, {})
                    }
                };
                
                project.history = [summary, ...recentHistory];
            }
        }
        
        // Compress old context history
        this.contextHistory = this.contextHistory.filter(entry => entry.timestamp >= cutoffDate);
        
        await this.saveMemoryToDisk();
        console.log(`🗜️ Compressed memory older than ${this.compressionThreshold} days`);
    }

    async clearMemory(type = 'all') {
        switch (type) {
            case 'projects':
                this.projects.clear();
                break;
            case 'preferences':
                this.userPreferences.clear();
                break;
            case 'strategies':
                this.successfulStrategies.clear();
                break;
            case 'context':
                this.contextHistory = [];
                break;
            case 'all':
                this.projects.clear();
                this.userPreferences.clear();
                this.successfulStrategies.clear();
                this.contextHistory = [];
                break;
        }
        
        await this.saveMemoryToDisk();
        console.log(`🗑️ Cleared ${type} memory`);
    }
}
