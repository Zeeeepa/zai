/**
 * Adaptive Learning System
 * AI that learns from user feedback, adapts to coding styles, improves from project outcomes, and personalizes recommendations
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class AdaptiveLearningSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.learningDir = options.learningDir || './learning';
        this.maxLearningEntries = options.maxLearningEntries || 10000;
        this.adaptationThreshold = options.adaptationThreshold || 0.7;
        this.learningRate = options.learningRate || 0.1;
        this.personalityUpdateInterval = options.personalityUpdateInterval || 24 * 60 * 60 * 1000; // 24 hours
        
        this.userProfiles = new Map();
        this.feedbackHistory = [];
        this.codingStyleProfiles = new Map();
        this.projectOutcomes = [];
        this.learningModels = new Map();
        this.adaptationRules = new Map();
        this.personalizedRecommendations = new Map();
        this.behaviorPatterns = new Map();
        
        // Learning categories
        this.learningCategories = [
            'coding_style', 'preferences', 'feedback_patterns', 'success_metrics',
            'error_patterns', 'tool_usage', 'collaboration_style', 'project_types'
        ];
        
        // Adaptation weights
        this.adaptationWeights = {
            feedback: 0.30,
            outcomes: 0.25,
            usage_patterns: 0.20,
            coding_style: 0.15,
            collaboration: 0.10
        };
        
        console.log('🧠 Adaptive Learning System initialized');

        // Initialize learning models immediately (synchronous)
        this.initializeLearningModels();

        // Initialize directories and load data (async)
        this.initializeLearningSystem();
        this.startPersonalityUpdates();
    }

    async initializeLearningSystem() {
        try {
            await fs.mkdir(this.learningDir, { recursive: true });
            await this.loadUserProfiles();
            await this.loadFeedbackHistory();
            await this.loadCodingStyleProfiles();
            await this.loadProjectOutcomes();
            console.log(`📁 Learning directory initialized: ${this.learningDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize learning system:', error.message);
        }
    }

    async loadUserProfiles() {
        try {
            const profilesFile = path.join(this.learningDir, 'user-profiles.json');
            const data = await fs.readFile(profilesFile, 'utf8');
            const profiles = JSON.parse(data);
            
            for (const [userId, profile] of Object.entries(profiles)) {
                this.userProfiles.set(userId, profile);
            }
            
            console.log(`📥 Loaded ${this.userProfiles.size} user profiles`);
        } catch (error) {
            console.log('📝 No existing user profiles found, starting fresh');
        }
    }

    async loadFeedbackHistory() {
        try {
            const feedbackFile = path.join(this.learningDir, 'feedback-history.json');
            const data = await fs.readFile(feedbackFile, 'utf8');
            this.feedbackHistory = JSON.parse(data);
            console.log(`📥 Loaded ${this.feedbackHistory.length} feedback entries`);
        } catch (error) {
            console.log('📝 No existing feedback history found, starting fresh');
        }
    }

    async loadCodingStyleProfiles() {
        try {
            const stylesFile = path.join(this.learningDir, 'coding-styles.json');
            const data = await fs.readFile(stylesFile, 'utf8');
            const styles = JSON.parse(data);
            
            for (const [userId, style] of Object.entries(styles)) {
                this.codingStyleProfiles.set(userId, style);
            }
            
            console.log(`📥 Loaded ${this.codingStyleProfiles.size} coding style profiles`);
        } catch (error) {
            console.log('📝 No existing coding styles found, starting fresh');
        }
    }

    async loadProjectOutcomes() {
        try {
            const outcomesFile = path.join(this.learningDir, 'project-outcomes.json');
            const data = await fs.readFile(outcomesFile, 'utf8');
            this.projectOutcomes = JSON.parse(data);
            console.log(`📥 Loaded ${this.projectOutcomes.length} project outcomes`);
        } catch (error) {
            console.log('📝 No existing project outcomes found, starting fresh');
        }
    }

    initializeLearningModels() {
        // Initialize feedback learning model
        this.learningModels.set('feedback', {
            name: 'Feedback Learning Model',
            accuracy: 0.75,
            trainingData: this.feedbackHistory.length,
            lastTrained: Date.now(),
            parameters: {
                positiveWeight: 1.2,
                negativeWeight: 0.8,
                neutralWeight: 1.0
            }
        });

        // Initialize style adaptation model
        this.learningModels.set('style', {
            name: 'Coding Style Adaptation Model',
            accuracy: 0.80,
            trainingData: this.codingStyleProfiles.size,
            lastTrained: Date.now(),
            parameters: {
                indentationWeight: 0.3,
                namingWeight: 0.25,
                structureWeight: 0.25,
                commentWeight: 0.2
            }
        });

        // Initialize outcome prediction model
        this.learningModels.set('outcomes', {
            name: 'Project Outcome Prediction Model',
            accuracy: 0.70,
            trainingData: this.projectOutcomes.length,
            lastTrained: Date.now(),
            parameters: {
                successFactors: ['team_size', 'complexity', 'timeline', 'resources'],
                failureFactors: ['scope_creep', 'poor_planning', 'resource_constraints']
            }
        });

        // Initialize personalization model
        this.learningModels.set('personalization', {
            name: 'Personalization Model',
            accuracy: 0.85,
            trainingData: this.userProfiles.size,
            lastTrained: Date.now(),
            parameters: {
                preferenceWeight: 0.4,
                behaviorWeight: 0.3,
                contextWeight: 0.3
            }
        });

        console.log(`🤖 Initialized ${this.learningModels.size} learning models`);
    }

    async recordUserFeedback(userId, feedbackData) {
        const feedbackId = crypto.randomBytes(8).toString('hex');
        
        const feedback = {
            id: feedbackId,
            userId,
            type: feedbackData.type, // 'positive', 'negative', 'neutral'
            category: feedbackData.category, // 'suggestion', 'code_generation', 'analysis', etc.
            content: feedbackData.content,
            context: feedbackData.context || {},
            rating: feedbackData.rating, // 1-5 scale
            timestamp: Date.now(),
            processed: false
        };

        this.feedbackHistory.push(feedback);

        // Keep only recent feedback
        if (this.feedbackHistory.length > this.maxLearningEntries) {
            this.feedbackHistory = this.feedbackHistory.slice(-this.maxLearningEntries);
        }

        // Update user profile
        await this.updateUserProfile(userId, feedback);

        // Process feedback for learning
        await this.processFeedbackForLearning(feedback);

        console.log(`📝 Recorded feedback from ${userId}: ${feedbackData.type} (${feedbackData.rating}/5)`);

        this.emit('feedback:recorded', {
            feedbackId,
            userId,
            feedback
        });

        return feedbackId;
    }

    async updateUserProfile(userId, feedback) {
        let profile = this.userProfiles.get(userId) || this.createDefaultUserProfile(userId);

        // Update feedback statistics
        profile.feedbackStats.total++;
        profile.feedbackStats[feedback.type]++;
        profile.feedbackStats.averageRating = 
            (profile.feedbackStats.averageRating * (profile.feedbackStats.total - 1) + feedback.rating) / 
            profile.feedbackStats.total;

        // Update category preferences
        if (!profile.categoryPreferences[feedback.category]) {
            profile.categoryPreferences[feedback.category] = { count: 0, averageRating: 0 };
        }
        
        const categoryPref = profile.categoryPreferences[feedback.category];
        categoryPref.averageRating = 
            (categoryPref.averageRating * categoryPref.count + feedback.rating) / (categoryPref.count + 1);
        categoryPref.count++;

        // Update learning preferences
        if (feedback.rating >= 4) {
            profile.learningPreferences.preferredApproaches.push(feedback.context.approach || 'unknown');
        } else if (feedback.rating <= 2) {
            profile.learningPreferences.avoidedApproaches.push(feedback.context.approach || 'unknown');
        }

        // Update last activity
        profile.lastActivity = Date.now();
        profile.totalInteractions++;

        this.userProfiles.set(userId, profile);

        // Save periodically
        if (profile.totalInteractions % 10 === 0) {
            await this.saveUserProfiles();
        }
    }

    createDefaultUserProfile(userId) {
        return {
            userId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            totalInteractions: 0,
            feedbackStats: {
                total: 0,
                positive: 0,
                negative: 0,
                neutral: 0,
                averageRating: 3.0
            },
            categoryPreferences: {},
            learningPreferences: {
                preferredApproaches: [],
                avoidedApproaches: [],
                adaptationLevel: 'medium', // low, medium, high
                personalityType: 'balanced' // analytical, creative, practical, balanced
            },
            codingStyle: {
                indentation: 'spaces', // spaces, tabs
                indentSize: 2,
                namingConvention: 'camelCase', // camelCase, snake_case, PascalCase
                commentStyle: 'descriptive', // minimal, descriptive, verbose
                codeStructure: 'modular' // monolithic, modular, functional
            },
            behaviorPatterns: {
                sessionDuration: [],
                preferredTimes: [],
                toolUsage: {},
                collaborationStyle: 'independent' // independent, collaborative, mentoring
            },
            adaptationHistory: []
        };
    }

    async processFeedbackForLearning(feedback) {
        // Update learning models based on feedback
        const feedbackModel = this.learningModels.get('feedback');
        
        // Adjust model parameters based on feedback type
        if (feedback.type === 'positive' && feedback.rating >= 4) {
            feedbackModel.parameters.positiveWeight += this.learningRate * 0.1;
        } else if (feedback.type === 'negative' && feedback.rating <= 2) {
            feedbackModel.parameters.negativeWeight += this.learningRate * 0.1;
        }

        // Update model accuracy based on feedback consistency
        const recentFeedback = this.feedbackHistory
            .filter(f => f.userId === feedback.userId && f.category === feedback.category)
            .slice(-10);
        
        const consistency = this.calculateFeedbackConsistency(recentFeedback);
        feedbackModel.accuracy = Math.min(0.95, feedbackModel.accuracy + (consistency - 0.5) * this.learningRate);

        // Mark feedback as processed
        feedback.processed = true;

        // Generate adaptation rules
        await this.generateAdaptationRules(feedback);
    }

    calculateFeedbackConsistency(feedbackList) {
        if (feedbackList.length < 2) return 0.5;

        let consistencyScore = 0;
        for (let i = 1; i < feedbackList.length; i++) {
            const ratingDiff = Math.abs(feedbackList[i].rating - feedbackList[i-1].rating);
            consistencyScore += Math.max(0, 1 - ratingDiff / 4); // Normalize to 0-1
        }

        return consistencyScore / (feedbackList.length - 1);
    }

    async generateAdaptationRules(feedback) {
        const ruleId = crypto.randomBytes(8).toString('hex');
        
        const rule = {
            id: ruleId,
            userId: feedback.userId,
            category: feedback.category,
            condition: this.extractConditionFromFeedback(feedback),
            action: this.extractActionFromFeedback(feedback),
            confidence: this.calculateRuleConfidence(feedback),
            createdAt: Date.now(),
            appliedCount: 0,
            successRate: 0
        };

        this.adaptationRules.set(ruleId, rule);

        console.log(`🔧 Generated adaptation rule for ${feedback.userId}: ${rule.condition} → ${rule.action}`);

        this.emit('rule:generated', {
            ruleId,
            rule,
            feedback
        });
    }

    extractConditionFromFeedback(feedback) {
        // Extract conditions based on feedback context
        const conditions = [];

        if (feedback.context.language) {
            conditions.push(`language=${feedback.context.language}`);
        }
        if (feedback.context.complexity) {
            conditions.push(`complexity=${feedback.context.complexity}`);
        }
        if (feedback.context.taskType) {
            conditions.push(`taskType=${feedback.context.taskType}`);
        }

        return conditions.join(' AND ') || 'general';
    }

    extractActionFromFeedback(feedback) {
        // Extract actions based on feedback type and content
        if (feedback.type === 'positive') {
            return `increase_preference:${feedback.category}`;
        } else if (feedback.type === 'negative') {
            return `decrease_preference:${feedback.category}`;
        } else {
            return `maintain_preference:${feedback.category}`;
        }
    }

    calculateRuleConfidence(feedback) {
        // Calculate confidence based on feedback rating and context
        const baseConfidence = feedback.rating / 5.0;
        
        // Adjust based on context richness
        const contextScore = Object.keys(feedback.context).length / 10.0;
        
        // Adjust based on user's feedback history
        const userProfile = this.userProfiles.get(feedback.userId);
        const historyScore = userProfile ? Math.min(userProfile.feedbackStats.total / 100.0, 1.0) : 0;
        
        return Math.min(0.95, baseConfidence * 0.6 + contextScore * 0.2 + historyScore * 0.2);
    }

    async analyzeCodingStyle(userId, codeData) {
        const styleAnalysis = {
            userId,
            codeId: crypto.randomBytes(8).toString('hex'),
            language: codeData.language,
            timestamp: Date.now(),
            style: {
                indentation: this.detectIndentation(codeData.code),
                namingConvention: this.detectNamingConvention(codeData.code, codeData.language),
                commentStyle: this.detectCommentStyle(codeData.code),
                codeStructure: this.detectCodeStructure(codeData.code, codeData.language),
                complexity: this.calculateCodeComplexity(codeData.code)
            }
        };

        // Update user's coding style profile
        await this.updateCodingStyleProfile(userId, styleAnalysis);

        console.log(`🎨 Analyzed coding style for ${userId}: ${styleAnalysis.style.namingConvention}, ${styleAnalysis.style.indentation}`);

        this.emit('style:analyzed', {
            userId,
            styleAnalysis
        });

        return styleAnalysis;
    }

    detectIndentation(code) {
        const lines = code.split('\n').filter(line => line.trim().length > 0);
        let spaceCount = 0;
        let tabCount = 0;

        for (const line of lines) {
            if (line.startsWith('  ')) spaceCount++;
            if (line.startsWith('\t')) tabCount++;
        }

        if (tabCount > spaceCount) {
            return { type: 'tabs', size: 1 };
        } else {
            // Detect space size
            const spaceSizes = [2, 4, 8];
            let bestSize = 2;
            let maxMatches = 0;

            for (const size of spaceSizes) {
                const pattern = ' '.repeat(size);
                const matches = lines.filter(line => line.startsWith(pattern)).length;
                if (matches > maxMatches) {
                    maxMatches = matches;
                    bestSize = size;
                }
            }

            return { type: 'spaces', size: bestSize };
        }
    }

    detectNamingConvention(code, language) {
        const identifiers = this.extractIdentifiers(code, language);
        
        let camelCaseCount = 0;
        let snakeCaseCount = 0;
        let pascalCaseCount = 0;

        for (const identifier of identifiers) {
            if (/^[a-z][a-zA-Z0-9]*$/.test(identifier)) camelCaseCount++;
            if (/^[a-z][a-z0-9_]*$/.test(identifier)) snakeCaseCount++;
            if (/^[A-Z][a-zA-Z0-9]*$/.test(identifier)) pascalCaseCount++;
        }

        if (camelCaseCount >= snakeCaseCount && camelCaseCount >= pascalCaseCount) {
            return 'camelCase';
        } else if (snakeCaseCount >= pascalCaseCount) {
            return 'snake_case';
        } else {
            return 'PascalCase';
        }
    }

    extractIdentifiers(code, language) {
        // Simplified identifier extraction
        const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
        const matches = code.match(identifierRegex) || [];
        
        // Filter out keywords
        const keywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'def', 'import'];
        return matches.filter(match => !keywords.includes(match.toLowerCase()));
    }

    detectCommentStyle(code) {
        const lines = code.split('\n');
        let commentLines = 0;
        let totalCommentLength = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
                commentLines++;
                totalCommentLength += trimmed.length;
            }
        }

        if (commentLines === 0) return 'minimal';
        
        const avgCommentLength = totalCommentLength / commentLines;
        if (avgCommentLength > 50) return 'verbose';
        if (avgCommentLength > 20) return 'descriptive';
        return 'minimal';
    }

    detectCodeStructure(code, language) {
        const functionCount = (code.match(/function\s+\w+|def\s+\w+/g) || []).length;
        const classCount = (code.match(/class\s+\w+/g) || []).length;
        const linesOfCode = code.split('\n').filter(line => line.trim().length > 0).length;

        if (classCount > 0 && functionCount / Math.max(classCount, 1) > 3) {
            return 'object_oriented';
        } else if (functionCount > linesOfCode / 20) {
            return 'functional';
        } else if (functionCount > 5) {
            return 'modular';
        } else {
            return 'monolithic';
        }
    }

    calculateCodeComplexity(code) {
        // Simplified complexity calculation
        const decisionPoints = (code.match(/\bif\b|\belse\b|\bwhile\b|\bfor\b|\bswitch\b|\bcase\b/g) || []).length;
        const linesOfCode = code.split('\n').filter(line => line.trim().length > 0).length;
        
        return Math.min(10, Math.round((decisionPoints / Math.max(linesOfCode / 10, 1)) * 10));
    }

    async updateCodingStyleProfile(userId, styleAnalysis) {
        let profile = this.codingStyleProfiles.get(userId) || {
            userId,
            createdAt: Date.now(),
            analyses: [],
            dominantStyle: {},
            consistency: 0,
            lastUpdated: Date.now()
        };

        profile.analyses.push(styleAnalysis);
        
        // Keep only recent analyses
        if (profile.analyses.length > 50) {
            profile.analyses = profile.analyses.slice(-50);
        }

        // Calculate dominant style
        profile.dominantStyle = this.calculateDominantStyle(profile.analyses);
        profile.consistency = this.calculateStyleConsistency(profile.analyses);
        profile.lastUpdated = Date.now();

        this.codingStyleProfiles.set(userId, profile);

        // Update user profile with coding style
        const userProfile = this.userProfiles.get(userId);
        if (userProfile) {
            userProfile.codingStyle = {
                indentation: profile.dominantStyle.indentation?.type || 'spaces',
                indentSize: profile.dominantStyle.indentation?.size || 2,
                namingConvention: profile.dominantStyle.namingConvention || 'camelCase',
                commentStyle: profile.dominantStyle.commentStyle || 'descriptive',
                codeStructure: profile.dominantStyle.codeStructure || 'modular'
            };
        }

        // Save periodically
        if (profile.analyses.length % 5 === 0) {
            await this.saveCodingStyleProfiles();
        }
    }

    calculateDominantStyle(analyses) {
        const styleCounts = {
            indentation: {},
            namingConvention: {},
            commentStyle: {},
            codeStructure: {}
        };

        // Count occurrences of each style
        for (const analysis of analyses) {
            const indentKey = `${analysis.style.indentation.type}_${analysis.style.indentation.size}`;
            styleCounts.indentation[indentKey] = (styleCounts.indentation[indentKey] || 0) + 1;
            styleCounts.namingConvention[analysis.style.namingConvention] = 
                (styleCounts.namingConvention[analysis.style.namingConvention] || 0) + 1;
            styleCounts.commentStyle[analysis.style.commentStyle] = 
                (styleCounts.commentStyle[analysis.style.commentStyle] || 0) + 1;
            styleCounts.codeStructure[analysis.style.codeStructure] = 
                (styleCounts.codeStructure[analysis.style.codeStructure] || 0) + 1;
        }

        // Find dominant styles
        const dominantStyle = {};
        for (const [category, counts] of Object.entries(styleCounts)) {
            const dominant = Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b);
            
            if (category === 'indentation') {
                const [type, size] = dominant[0].split('_');
                dominantStyle[category] = { type, size: parseInt(size) };
            } else {
                dominantStyle[category] = dominant[0];
            }
        }

        return dominantStyle;
    }

    calculateStyleConsistency(analyses) {
        if (analyses.length < 2) return 1.0;

        const dominantStyle = this.calculateDominantStyle(analyses);
        let consistentCount = 0;

        for (const analysis of analyses) {
            let matches = 0;
            let total = 0;

            // Check indentation consistency
            total++;
            if (analysis.style.indentation.type === dominantStyle.indentation.type &&
                analysis.style.indentation.size === dominantStyle.indentation.size) {
                matches++;
            }

            // Check naming convention consistency
            total++;
            if (analysis.style.namingConvention === dominantStyle.namingConvention) {
                matches++;
            }

            // Check comment style consistency
            total++;
            if (analysis.style.commentStyle === dominantStyle.commentStyle) {
                matches++;
            }

            // Check code structure consistency
            total++;
            if (analysis.style.codeStructure === dominantStyle.codeStructure) {
                matches++;
            }

            if (matches / total >= 0.75) {
                consistentCount++;
            }
        }

        return consistentCount / analyses.length;
    }

    async recordProjectOutcome(userId, projectData) {
        const outcomeId = crypto.randomBytes(8).toString('hex');

        const outcome = {
            id: outcomeId,
            userId,
            projectId: projectData.projectId,
            projectName: projectData.projectName,
            outcome: projectData.outcome, // 'success', 'failure', 'partial'
            metrics: {
                duration: projectData.duration,
                complexity: projectData.complexity,
                teamSize: projectData.teamSize,
                linesOfCode: projectData.linesOfCode,
                bugsFound: projectData.bugsFound || 0,
                userSatisfaction: projectData.userSatisfaction || 0
            },
            factors: {
                technologies: projectData.technologies || [],
                methodologies: projectData.methodologies || [],
                challenges: projectData.challenges || [],
                successFactors: projectData.successFactors || []
            },
            lessons: projectData.lessons || [],
            timestamp: Date.now()
        };

        this.projectOutcomes.push(outcome);

        // Keep only recent outcomes
        if (this.projectOutcomes.length > this.maxLearningEntries) {
            this.projectOutcomes = this.projectOutcomes.slice(-this.maxLearningEntries);
        }

        // Update learning models
        await this.updateOutcomeLearning(outcome);

        console.log(`📊 Recorded project outcome for ${userId}: ${projectData.outcome} (${projectData.projectName})`);

        this.emit('outcome:recorded', {
            outcomeId,
            userId,
            outcome
        });

        return outcomeId;
    }

    async updateOutcomeLearning(outcome) {
        const outcomeModel = this.learningModels.get('outcomes');

        // Update success factors based on outcome
        if (outcome.outcome === 'success') {
            for (const factor of outcome.factors.successFactors) {
                if (!outcomeModel.parameters.successFactors.includes(factor)) {
                    outcomeModel.parameters.successFactors.push(factor);
                }
            }
        } else if (outcome.outcome === 'failure') {
            for (const challenge of outcome.factors.challenges) {
                if (!outcomeModel.parameters.failureFactors.includes(challenge)) {
                    outcomeModel.parameters.failureFactors.push(challenge);
                }
            }
        }

        // Update model accuracy based on prediction vs actual outcome
        const userProfile = this.userProfiles.get(outcome.userId);
        if (userProfile && userProfile.lastPrediction) {
            const predictionAccuracy = this.calculatePredictionAccuracy(userProfile.lastPrediction, outcome);
            outcomeModel.accuracy = (outcomeModel.accuracy + predictionAccuracy) / 2;
        }

        outcomeModel.trainingData = this.projectOutcomes.length;
        outcomeModel.lastTrained = Date.now();
    }

    calculatePredictionAccuracy(prediction, actualOutcome) {
        // Compare predicted outcome with actual outcome
        if (prediction.outcome === actualOutcome.outcome) {
            return Math.min(1.0, prediction.confidence + 0.1);
        } else {
            return Math.max(0.1, prediction.confidence - 0.2);
        }
    }

    async generatePersonalizedRecommendations(userId, context = {}) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return this.generateDefaultRecommendations(context);
        }

        const recommendations = {
            userId,
            context,
            recommendations: [],
            confidence: 0,
            timestamp: Date.now()
        };

        // Generate recommendations based on user profile
        recommendations.recommendations.push(...await this.generateStyleRecommendations(userProfile, context));
        recommendations.recommendations.push(...await this.generateToolRecommendations(userProfile, context));
        recommendations.recommendations.push(...await this.generateWorkflowRecommendations(userProfile, context));
        recommendations.recommendations.push(...await this.generateLearningRecommendations(userProfile, context));

        // If no specific recommendations generated, add general ones
        if (recommendations.recommendations.length === 0) {
            recommendations.recommendations.push({
                type: 'general',
                category: 'engagement',
                message: 'Continue using the system to build your personalized profile',
                priority: 'medium',
                confidence: 0.7
            });

            recommendations.recommendations.push({
                type: 'general',
                category: 'feedback',
                message: 'Provide more feedback to improve recommendation accuracy',
                priority: 'high',
                confidence: 0.8
            });
        }

        // Calculate overall confidence
        recommendations.confidence = this.calculateRecommendationConfidence(userProfile, recommendations.recommendations);

        // Apply adaptation rules
        recommendations.recommendations = await this.applyAdaptationRules(userId, recommendations.recommendations, context);

        // Store recommendations
        this.personalizedRecommendations.set(userId, recommendations);

        console.log(`💡 Generated ${recommendations.recommendations.length} personalized recommendations for ${userId}`);

        this.emit('recommendations:generated', {
            userId,
            recommendations
        });

        return recommendations;
    }

    async generateStyleRecommendations(userProfile, context) {
        const recommendations = [];
        const codingStyle = userProfile.codingStyle;

        if (context.language && context.code) {
            // Recommend style consistency
            if (codingStyle.indentation === 'spaces') {
                recommendations.push({
                    type: 'style',
                    category: 'indentation',
                    message: `Use ${codingStyle.indentSize} spaces for indentation (matches your preferred style)`,
                    priority: 'medium',
                    confidence: 0.8
                });
            }

            if (codingStyle.namingConvention === 'camelCase') {
                recommendations.push({
                    type: 'style',
                    category: 'naming',
                    message: 'Use camelCase naming convention for variables and functions',
                    priority: 'medium',
                    confidence: 0.8
                });
            }

            if (codingStyle.commentStyle === 'descriptive') {
                recommendations.push({
                    type: 'style',
                    category: 'comments',
                    message: 'Add descriptive comments to explain complex logic',
                    priority: 'low',
                    confidence: 0.7
                });
            }
        }

        return recommendations;
    }

    async generateToolRecommendations(userProfile, context) {
        const recommendations = [];
        const behaviorPatterns = userProfile.behaviorPatterns;

        // Recommend tools based on usage patterns
        const mostUsedTools = Object.entries(behaviorPatterns.toolUsage || {})
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        if (mostUsedTools.length > 0) {
            recommendations.push({
                type: 'tool',
                category: 'productivity',
                message: `Consider using ${mostUsedTools[0][0]} for this task (your most used tool)`,
                priority: 'low',
                confidence: 0.6
            });
        }

        // Recommend new tools based on context
        if (context.taskType === 'testing' && !behaviorPatterns.toolUsage?.testing) {
            recommendations.push({
                type: 'tool',
                category: 'testing',
                message: 'Consider using automated testing tools to improve code quality',
                priority: 'medium',
                confidence: 0.7
            });
        }

        return recommendations;
    }

    async generateWorkflowRecommendations(userProfile, context) {
        const recommendations = [];
        const feedbackStats = userProfile.feedbackStats;

        // Recommend workflows based on success patterns
        if (feedbackStats.averageRating > 4.0) {
            recommendations.push({
                type: 'workflow',
                category: 'process',
                message: 'Your current workflow is highly effective - continue with similar approaches',
                priority: 'low',
                confidence: 0.9
            });
        } else if (feedbackStats.averageRating < 3.0) {
            recommendations.push({
                type: 'workflow',
                category: 'improvement',
                message: 'Consider breaking down complex tasks into smaller, manageable steps',
                priority: 'high',
                confidence: 0.8
            });
        }

        // Recommend collaboration style
        if (userProfile.behaviorPatterns.collaborationStyle === 'independent' && context.teamSize > 1) {
            recommendations.push({
                type: 'workflow',
                category: 'collaboration',
                message: 'Consider more collaborative approaches for team projects',
                priority: 'medium',
                confidence: 0.6
            });
        }

        return recommendations;
    }

    async generateLearningRecommendations(userProfile, context) {
        const recommendations = [];
        const learningPreferences = userProfile.learningPreferences;

        // Recommend learning approaches
        if (learningPreferences.adaptationLevel === 'high') {
            recommendations.push({
                type: 'learning',
                category: 'adaptation',
                message: 'Try experimental approaches - you adapt well to new methods',
                priority: 'medium',
                confidence: 0.8
            });
        } else if (learningPreferences.adaptationLevel === 'low') {
            recommendations.push({
                type: 'learning',
                category: 'stability',
                message: 'Stick with proven approaches that have worked well for you',
                priority: 'medium',
                confidence: 0.8
            });
        }

        // Recommend based on personality type
        if (learningPreferences.personalityType === 'analytical') {
            recommendations.push({
                type: 'learning',
                category: 'approach',
                message: 'Focus on detailed analysis and systematic problem-solving',
                priority: 'low',
                confidence: 0.7
            });
        } else if (learningPreferences.personalityType === 'creative') {
            recommendations.push({
                type: 'learning',
                category: 'approach',
                message: 'Explore innovative solutions and creative problem-solving techniques',
                priority: 'low',
                confidence: 0.7
            });
        }

        return recommendations;
    }

    generateDefaultRecommendations(context) {
        return {
            userId: 'unknown',
            context,
            recommendations: [
                {
                    type: 'general',
                    category: 'getting_started',
                    message: 'Start by providing feedback to help the system learn your preferences',
                    priority: 'high',
                    confidence: 0.9
                },
                {
                    type: 'general',
                    category: 'best_practices',
                    message: 'Follow coding best practices for better maintainability',
                    priority: 'medium',
                    confidence: 0.8
                }
            ],
            confidence: 0.5,
            timestamp: Date.now()
        };
    }

    calculateRecommendationConfidence(userProfile, recommendations) {
        if (recommendations.length === 0) return 0;

        // Base confidence on user profile completeness
        let profileCompleteness = 0;
        profileCompleteness += userProfile.feedbackStats.total > 10 ? 0.3 : userProfile.feedbackStats.total * 0.03;
        profileCompleteness += userProfile.totalInteractions > 50 ? 0.3 : userProfile.totalInteractions * 0.006;
        profileCompleteness += Object.keys(userProfile.categoryPreferences).length > 5 ? 0.2 : Object.keys(userProfile.categoryPreferences).length * 0.04;
        profileCompleteness += userProfile.behaviorPatterns.sessionDuration.length > 10 ? 0.2 : userProfile.behaviorPatterns.sessionDuration.length * 0.02;

        // Average recommendation confidence
        const avgRecommendationConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length;

        return Math.min(0.95, profileCompleteness * 0.6 + avgRecommendationConfidence * 0.4);
    }

    async applyAdaptationRules(userId, recommendations, context) {
        const userRules = Array.from(this.adaptationRules.values()).filter(rule => rule.userId === userId);

        for (const rule of userRules) {
            if (this.ruleMatchesContext(rule, context)) {
                recommendations = this.applyRule(rule, recommendations);
                rule.appliedCount++;
            }
        }

        return recommendations;
    }

    ruleMatchesContext(rule, context) {
        // Simple rule matching - can be enhanced
        if (rule.condition === 'general') return true;

        const conditions = rule.condition.split(' AND ');
        for (const condition of conditions) {
            const [key, value] = condition.split('=');
            if (context[key] !== value) return false;
        }

        return true;
    }

    applyRule(rule, recommendations) {
        const [action, category] = rule.action.split(':');

        if (action === 'increase_preference') {
            // Boost recommendations in this category
            recommendations.forEach(rec => {
                if (rec.category === category) {
                    rec.priority = rec.priority === 'low' ? 'medium' : rec.priority === 'medium' ? 'high' : rec.priority;
                    rec.confidence = Math.min(0.95, rec.confidence + 0.1);
                }
            });
        } else if (action === 'decrease_preference') {
            // Lower recommendations in this category
            recommendations.forEach(rec => {
                if (rec.category === category) {
                    rec.priority = rec.priority === 'high' ? 'medium' : rec.priority === 'medium' ? 'low' : rec.priority;
                    rec.confidence = Math.max(0.1, rec.confidence - 0.1);
                }
            });
        }

        return recommendations;
    }

    async predictProjectOutcome(userId, projectData) {
        const userProfile = this.userProfiles.get(userId);
        const outcomeModel = this.learningModels.get('outcomes');

        let successProbability = 0.5; // Base probability

        // Adjust based on user's historical success rate
        if (userProfile) {
            const userOutcomes = this.projectOutcomes.filter(o => o.userId === userId);
            if (userOutcomes.length > 0) {
                const successCount = userOutcomes.filter(o => o.outcome === 'success').length;
                const historicalSuccessRate = successCount / userOutcomes.length;
                successProbability = historicalSuccessRate * 0.4 + successProbability * 0.6;
            }
        }

        // Adjust based on project factors
        for (const factor of projectData.technologies || []) {
            if (outcomeModel.parameters.successFactors.includes(factor)) {
                successProbability += 0.1;
            }
        }

        for (const challenge of projectData.challenges || []) {
            if (outcomeModel.parameters.failureFactors.includes(challenge)) {
                successProbability -= 0.1;
            }
        }

        // Adjust based on project metrics
        if (projectData.teamSize > 10) successProbability -= 0.1;
        if (projectData.complexity === 'high') successProbability -= 0.15;
        if (projectData.timeline && projectData.timeline < 30) successProbability -= 0.1; // Less than 30 days

        successProbability = Math.max(0.1, Math.min(0.9, successProbability));

        const prediction = {
            userId,
            projectId: projectData.projectId,
            outcome: successProbability > 0.6 ? 'success' : successProbability < 0.4 ? 'failure' : 'partial',
            confidence: Math.abs(successProbability - 0.5) * 2,
            successProbability,
            factors: {
                userHistory: userProfile ? 'considered' : 'no_history',
                projectComplexity: projectData.complexity || 'unknown',
                teamSize: projectData.teamSize || 'unknown',
                timeline: projectData.timeline || 'unknown'
            },
            recommendations: [],
            timestamp: Date.now()
        };

        // Generate recommendations based on prediction
        if (successProbability < 0.5) {
            prediction.recommendations.push({
                type: 'risk_mitigation',
                message: 'Consider reducing project scope or adding more resources',
                priority: 'high'
            });
        }

        if (projectData.teamSize > 8) {
            prediction.recommendations.push({
                type: 'team_management',
                message: 'Large team size may require additional coordination efforts',
                priority: 'medium'
            });
        }

        // Store prediction for later accuracy assessment
        if (userProfile) {
            userProfile.lastPrediction = prediction;
        }

        console.log(`🔮 Predicted outcome for ${userId}: ${prediction.outcome} (${(successProbability * 100).toFixed(1)}% success probability)`);

        this.emit('prediction:generated', {
            userId,
            prediction
        });

        return prediction;
    }

    startPersonalityUpdates() {
        setInterval(() => {
            this.updateUserPersonalities();
        }, this.personalityUpdateInterval);

        console.log(`🧠 Personality updates started (${this.personalityUpdateInterval / (1000 * 60 * 60)}h interval)`);
    }

    async updateUserPersonalities() {
        for (const [userId, profile] of this.userProfiles) {
            const newPersonality = this.analyzeUserPersonality(profile);

            if (newPersonality !== profile.learningPreferences.personalityType) {
                profile.learningPreferences.personalityType = newPersonality;
                profile.adaptationHistory.push({
                    type: 'personality_update',
                    from: profile.learningPreferences.personalityType,
                    to: newPersonality,
                    timestamp: Date.now()
                });

                console.log(`🧠 Updated personality for ${userId}: ${newPersonality}`);

                this.emit('personality:updated', {
                    userId,
                    oldPersonality: profile.learningPreferences.personalityType,
                    newPersonality
                });
            }
        }
    }

    analyzeUserPersonality(profile) {
        const feedbackStats = profile.feedbackStats;
        const behaviorPatterns = profile.behaviorPatterns;
        const categoryPreferences = profile.categoryPreferences;

        let analyticalScore = 0;
        let creativeScore = 0;
        let practicalScore = 0;

        // Analyze feedback patterns
        if (feedbackStats.averageRating > 4.0) practicalScore += 2;
        if (feedbackStats.total > 50) analyticalScore += 2;

        // Analyze category preferences
        if (categoryPreferences.analysis?.averageRating > 4.0) analyticalScore += 3;
        if (categoryPreferences.code_generation?.averageRating > 4.0) creativeScore += 3;
        if (categoryPreferences.optimization?.averageRating > 4.0) practicalScore += 3;

        // Analyze behavior patterns
        const avgSessionDuration = behaviorPatterns.sessionDuration.length > 0 ?
            behaviorPatterns.sessionDuration.reduce((a, b) => a + b, 0) / behaviorPatterns.sessionDuration.length : 0;

        if (avgSessionDuration > 60) analyticalScore += 1; // Long sessions suggest analytical approach
        if (avgSessionDuration < 30) practicalScore += 1; // Short sessions suggest practical approach

        // Determine dominant personality
        if (analyticalScore > creativeScore && analyticalScore > practicalScore) {
            return 'analytical';
        } else if (creativeScore > practicalScore) {
            return 'creative';
        } else if (practicalScore > 0) {
            return 'practical';
        } else {
            return 'balanced';
        }
    }

    async saveUserProfiles() {
        try {
            const profilesFile = path.join(this.learningDir, 'user-profiles.json');
            const profiles = Object.fromEntries(this.userProfiles);
            await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save user profiles:', error.message);
        }
    }

    async saveFeedbackHistory() {
        try {
            const feedbackFile = path.join(this.learningDir, 'feedback-history.json');
            await fs.writeFile(feedbackFile, JSON.stringify(this.feedbackHistory, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save feedback history:', error.message);
        }
    }

    async saveCodingStyleProfiles() {
        try {
            const stylesFile = path.join(this.learningDir, 'coding-styles.json');
            const styles = Object.fromEntries(this.codingStyleProfiles);
            await fs.writeFile(stylesFile, JSON.stringify(styles, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save coding style profiles:', error.message);
        }
    }

    async saveProjectOutcomes() {
        try {
            const outcomesFile = path.join(this.learningDir, 'project-outcomes.json');
            await fs.writeFile(outcomesFile, JSON.stringify(this.projectOutcomes, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save project outcomes:', error.message);
        }
    }

    getLearningAnalytics() {
        const totalUsers = this.userProfiles.size;
        const totalFeedback = this.feedbackHistory.length;
        const totalOutcomes = this.projectOutcomes.length;
        const totalStyleAnalyses = Array.from(this.codingStyleProfiles.values())
            .reduce((sum, profile) => sum + profile.analyses.length, 0);

        const avgFeedbackRating = this.feedbackHistory.length > 0 ?
            this.feedbackHistory.reduce((sum, f) => sum + f.rating, 0) / this.feedbackHistory.length : 0;

        const personalityDistribution = {};
        for (const profile of this.userProfiles.values()) {
            const personality = profile.learningPreferences.personalityType;
            personalityDistribution[personality] = (personalityDistribution[personality] || 0) + 1;
        }

        const modelAccuracy = Array.from(this.learningModels.values())
            .reduce((sum, model) => sum + model.accuracy, 0) / this.learningModels.size;

        return {
            totalUsers,
            totalFeedback,
            totalOutcomes,
            totalStyleAnalyses,
            avgFeedbackRating,
            personalityDistribution,
            modelAccuracy,
            adaptationRules: this.adaptationRules.size,
            learningModels: this.learningModels.size,
            learningCategories: this.learningCategories.length
        };
    }

    getUserLearningProfile(userId) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return null;

        const codingStyle = this.codingStyleProfiles.get(userId);
        const userOutcomes = this.projectOutcomes.filter(o => o.userId === userId);
        const userFeedback = this.feedbackHistory.filter(f => f.userId === userId);
        const userRules = Array.from(this.adaptationRules.values()).filter(r => r.userId === userId);

        return {
            userId,
            profile: userProfile,
            codingStyle: codingStyle || null,
            outcomes: userOutcomes,
            feedback: userFeedback.slice(-10), // Recent feedback
            adaptationRules: userRules,
            recommendations: this.personalizedRecommendations.get(userId) || null
        };
    }
}
