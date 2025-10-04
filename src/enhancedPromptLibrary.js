/**
 * Enhanced Prompt Library
 * Community-contributed prompts, domain-specific collections, prompt versioning, and A/B testing capabilities
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class EnhancedPromptLibrary extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.libraryDir = options.libraryDir || './prompt-library';
        this.maxPrompts = options.maxPrompts || 10000;
        this.maxVersions = options.maxVersions || 10;
        this.abTestDuration = options.abTestDuration || 7 * 24 * 60 * 60 * 1000; // 7 days
        this.communityModerationThreshold = options.communityModerationThreshold || 0.8;
        
        this.prompts = new Map();
        this.collections = new Map();
        this.versions = new Map();
        this.abTests = new Map();
        this.communityContributions = new Map();
        this.promptUsageStats = new Map();
        this.promptRatings = new Map();
        this.domainCategories = new Map();
        
        // Domain-specific categories
        this.domains = [
            'web_development', 'mobile_development', 'data_science', 'machine_learning',
            'devops', 'security', 'testing', 'api_development', 'database', 'frontend',
            'backend', 'cloud', 'blockchain', 'game_development', 'ui_ux', 'general'
        ];
        
        // Prompt quality metrics
        this.qualityMetrics = {
            clarity: 0.25,
            specificity: 0.25,
            effectiveness: 0.25,
            reusability: 0.25
        };
        
        console.log('📚 Enhanced Prompt Library initialized');
        this.initializePromptLibrary();
        this.initializeDomainCollections();
    }

    async initializePromptLibrary() {
        try {
            await fs.mkdir(this.libraryDir, { recursive: true });
            await this.loadPrompts();
            await this.loadCollections();
            await this.loadVersions();
            await this.loadABTests();
            await this.loadCommunityContributions();
            await this.loadUsageStats();
            console.log(`📁 Prompt library directory initialized: ${this.libraryDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize prompt library:', error.message);
        }
    }

    initializeDomainCollections() {
        // Initialize default collections for each domain
        for (const domain of this.domains) {
            if (!this.collections.has(domain)) {
                this.collections.set(domain, {
                    id: domain,
                    name: this.formatDomainName(domain),
                    description: `Prompts for ${this.formatDomainName(domain)}`,
                    domain: domain,
                    prompts: [],
                    isDefault: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    contributors: ['system'],
                    tags: [domain],
                    visibility: 'public'
                });
            }
        }
        
        console.log(`🏷️ Initialized ${this.domains.length} domain collections`);
    }

    formatDomainName(domain) {
        return domain.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async loadPrompts() {
        try {
            const promptsFile = path.join(this.libraryDir, 'prompts.json');
            const data = await fs.readFile(promptsFile, 'utf8');
            const prompts = JSON.parse(data);
            
            for (const [id, prompt] of Object.entries(prompts)) {
                this.prompts.set(id, prompt);
            }
            
            console.log(`📥 Loaded ${this.prompts.size} prompts`);
        } catch (error) {
            console.log('📝 No existing prompts found, starting with defaults');
            this.initializeDefaultPrompts();
        }
    }

    initializeDefaultPrompts() {
        const defaultPrompts = [
            {
                id: 'web-dev-react-component',
                title: 'React Component Generator',
                content: 'Create a React functional component named {componentName} that {functionality}. Include proper TypeScript types, error handling, and accessibility features.',
                domain: 'web_development',
                tags: ['react', 'typescript', 'component'],
                author: 'system',
                version: '1.0.0',
                quality: 0.9,
                usage: 0,
                rating: 0,
                variables: ['componentName', 'functionality']
            },
            {
                id: 'api-endpoint-design',
                title: 'REST API Endpoint Design',
                content: 'Design a RESTful API endpoint for {resource} with {operations}. Include proper HTTP methods, status codes, request/response schemas, and error handling.',
                domain: 'api_development',
                tags: ['rest', 'api', 'design'],
                author: 'system',
                version: '1.0.0',
                quality: 0.85,
                usage: 0,
                rating: 0,
                variables: ['resource', 'operations']
            },
            {
                id: 'data-analysis-python',
                title: 'Python Data Analysis Script',
                content: 'Create a Python script to analyze {dataType} data from {source}. Include data cleaning, exploratory analysis, visualization, and insights generation using pandas, matplotlib, and seaborn.',
                domain: 'data_science',
                tags: ['python', 'pandas', 'analysis'],
                author: 'system',
                version: '1.0.0',
                quality: 0.88,
                usage: 0,
                rating: 0,
                variables: ['dataType', 'source']
            },
            {
                id: 'security-audit-checklist',
                title: 'Security Audit Checklist',
                content: 'Perform a comprehensive security audit for {applicationName}. Check for {vulnerabilityTypes}, validate input sanitization, authentication mechanisms, and data encryption.',
                domain: 'security',
                tags: ['security', 'audit', 'checklist'],
                author: 'system',
                version: '1.0.0',
                quality: 0.92,
                usage: 0,
                rating: 0,
                variables: ['applicationName', 'vulnerabilityTypes']
            },
            {
                id: 'devops-ci-cd-pipeline',
                title: 'CI/CD Pipeline Configuration',
                content: 'Set up a CI/CD pipeline for {projectType} using {platform}. Include automated testing, code quality checks, security scanning, and deployment to {environment}.',
                domain: 'devops',
                tags: ['cicd', 'automation', 'deployment'],
                author: 'system',
                version: '1.0.0',
                quality: 0.87,
                usage: 0,
                rating: 0,
                variables: ['projectType', 'platform', 'environment']
            }
        ];

        for (const prompt of defaultPrompts) {
            prompt.createdAt = Date.now();
            prompt.updatedAt = Date.now();
            prompt.isDefault = true;
            prompt.isPublic = true;
            prompt.isApproved = true;
            prompt.moderationStatus = 'approved';
            prompt.ratings = [];
            prompt.metadata = {};
            this.prompts.set(prompt.id, prompt);

            // Add to domain collection
            const collection = this.collections.get(prompt.domain);
            if (collection) {
                collection.prompts.push(prompt.id);
            }
        }

        console.log(`🔧 Initialized ${defaultPrompts.length} default prompts`);
    }

    async loadCollections() {
        try {
            const collectionsFile = path.join(this.libraryDir, 'collections.json');
            const data = await fs.readFile(collectionsFile, 'utf8');
            const collections = JSON.parse(data);
            
            for (const [id, collection] of Object.entries(collections)) {
                this.collections.set(id, collection);
            }
            
            console.log(`📥 Loaded ${this.collections.size} collections`);
        } catch (error) {
            console.log('📝 No existing collections found, using defaults');
        }
    }

    async loadVersions() {
        try {
            const versionsFile = path.join(this.libraryDir, 'versions.json');
            const data = await fs.readFile(versionsFile, 'utf8');
            const versions = JSON.parse(data);
            
            for (const [id, versionHistory] of Object.entries(versions)) {
                this.versions.set(id, versionHistory);
            }
            
            console.log(`📥 Loaded version history for ${this.versions.size} prompts`);
        } catch (error) {
            console.log('📝 No existing version history found, starting fresh');
        }
    }

    async loadABTests() {
        try {
            const abTestsFile = path.join(this.libraryDir, 'ab-tests.json');
            const data = await fs.readFile(abTestsFile, 'utf8');
            const abTests = JSON.parse(data);
            
            for (const [id, test] of Object.entries(abTests)) {
                this.abTests.set(id, test);
            }
            
            console.log(`📥 Loaded ${this.abTests.size} A/B tests`);
        } catch (error) {
            console.log('📝 No existing A/B tests found, starting fresh');
        }
    }

    async loadCommunityContributions() {
        try {
            const contributionsFile = path.join(this.libraryDir, 'community-contributions.json');
            const data = await fs.readFile(contributionsFile, 'utf8');
            const contributions = JSON.parse(data);
            
            for (const [id, contribution] of Object.entries(contributions)) {
                this.communityContributions.set(id, contribution);
            }
            
            console.log(`📥 Loaded ${this.communityContributions.size} community contributions`);
        } catch (error) {
            console.log('📝 No existing community contributions found, starting fresh');
        }
    }

    async loadUsageStats() {
        try {
            const statsFile = path.join(this.libraryDir, 'usage-stats.json');
            const data = await fs.readFile(statsFile, 'utf8');
            const stats = JSON.parse(data);
            
            for (const [id, stat] of Object.entries(stats)) {
                this.promptUsageStats.set(id, stat);
            }
            
            console.log(`📥 Loaded usage statistics for ${this.promptUsageStats.size} prompts`);
        } catch (error) {
            console.log('📝 No existing usage statistics found, starting fresh');
        }
    }

    async createPrompt(promptData, authorId) {
        const promptId = crypto.randomBytes(8).toString('hex');
        
        const prompt = {
            id: promptId,
            title: promptData.title,
            content: promptData.content,
            description: promptData.description || '',
            domain: promptData.domain || 'general',
            tags: promptData.tags || [],
            variables: this.extractVariables(promptData.content),
            author: authorId,
            version: '1.0.0',
            quality: 0,
            usage: 0,
            rating: 0,
            ratings: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPublic: promptData.isPublic !== false,
            isApproved: authorId === 'system',
            moderationStatus: 'pending',
            metadata: promptData.metadata || {}
        };

        // Calculate initial quality score
        prompt.quality = this.calculatePromptQuality(prompt);

        this.prompts.set(promptId, prompt);

        // Add to domain collection
        const collection = this.collections.get(prompt.domain);
        if (collection) {
            collection.prompts.push(promptId);
            collection.updatedAt = Date.now();
        }

        // Initialize version history
        this.versions.set(promptId, [{
            version: '1.0.0',
            content: prompt.content,
            changes: 'Initial version',
            author: authorId,
            timestamp: Date.now()
        }]);

        // Initialize usage stats
        this.promptUsageStats.set(promptId, {
            promptId,
            totalUsage: 0,
            successRate: 0,
            avgRating: 0,
            usageHistory: [],
            performanceMetrics: {
                responseTime: [],
                userSatisfaction: [],
                effectiveness: []
            }
        });

        console.log(`📝 Created prompt: ${prompt.title} (${promptId})`);

        this.emit('prompt:created', {
            promptId,
            prompt,
            author: authorId
        });

        return promptId;
    }

    extractVariables(content) {
        const variableRegex = /\{([^}]+)\}/g;
        const variables = [];
        let match;
        
        while ((match = variableRegex.exec(content)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        
        return variables;
    }

    calculatePromptQuality(prompt) {
        let qualityScore = 0;

        // Clarity: Check for clear instructions and structure
        const clarityScore = this.assessClarity(prompt.content);
        qualityScore += clarityScore * this.qualityMetrics.clarity;

        // Specificity: Check for specific, actionable instructions
        const specificityScore = this.assessSpecificity(prompt.content);
        qualityScore += specificityScore * this.qualityMetrics.specificity;

        // Effectiveness: Based on variables and structure
        const effectivenessScore = this.assessEffectiveness(prompt);
        qualityScore += effectivenessScore * this.qualityMetrics.effectiveness;

        // Reusability: Check for parameterization and generalization
        const reusabilityScore = this.assessReusability(prompt);
        qualityScore += reusabilityScore * this.qualityMetrics.reusability;

        return Math.min(1.0, Math.max(0.1, qualityScore));
    }

    assessClarity(content) {
        let score = 0.5; // Base score

        // Check for clear structure
        if (content.includes('.') || content.includes(':')) score += 0.1;
        
        // Check for action words
        const actionWords = ['create', 'build', 'implement', 'design', 'analyze', 'generate'];
        if (actionWords.some(word => content.toLowerCase().includes(word))) score += 0.2;
        
        // Check for specific requirements
        if (content.includes('include') || content.includes('ensure') || content.includes('with')) score += 0.1;
        
        // Penalize overly long or short prompts
        const wordCount = content.split(' ').length;
        if (wordCount >= 10 && wordCount <= 100) score += 0.1;
        
        return Math.min(1.0, score);
    }

    assessSpecificity(content) {
        let score = 0.4; // Base score

        // Check for technical terms
        const techTerms = ['api', 'component', 'function', 'class', 'method', 'endpoint', 'database'];
        const techTermCount = techTerms.filter(term => content.toLowerCase().includes(term)).length;
        score += Math.min(0.3, techTermCount * 0.1);

        // Check for specific technologies mentioned
        const technologies = ['react', 'python', 'javascript', 'typescript', 'node', 'express', 'mongodb'];
        const techCount = technologies.filter(tech => content.toLowerCase().includes(tech)).length;
        score += Math.min(0.2, techCount * 0.05);

        // Check for specific requirements
        if (content.includes('error handling')) score += 0.05;
        if (content.includes('validation')) score += 0.05;
        if (content.includes('testing')) score += 0.05;

        return Math.min(1.0, score);
    }

    assessEffectiveness(prompt) {
        let score = 0.5; // Base score

        // Check for variables (parameterization)
        score += Math.min(0.3, prompt.variables.length * 0.1);

        // Check for comprehensive instructions
        if (prompt.content.length > 50) score += 0.1;
        if (prompt.content.length > 100) score += 0.1;

        // Check for domain relevance
        if (prompt.domain !== 'general') score += 0.1;

        return Math.min(1.0, score);
    }

    assessReusability(prompt) {
        let score = 0.3; // Base score

        // Variables make prompts more reusable
        score += Math.min(0.4, prompt.variables.length * 0.1);

        // Generic structure increases reusability
        if (!prompt.content.includes('specific') && !prompt.content.includes('exactly')) score += 0.1;

        // Good tagging improves discoverability
        score += Math.min(0.2, prompt.tags.length * 0.05);

        return Math.min(1.0, score);
    }

    async updatePrompt(promptId, updates, authorId) {
        const prompt = this.prompts.get(promptId);
        if (!prompt) {
            throw new Error(`Prompt ${promptId} not found`);
        }

        // Check permissions
        if (prompt.author !== authorId && authorId !== 'admin') {
            throw new Error('Insufficient permissions to update prompt');
        }

        // Create new version
        const currentVersion = prompt.version;
        const newVersion = this.incrementVersion(currentVersion);

        // Store version history
        const versionHistory = this.versions.get(promptId) || [];
        versionHistory.push({
            version: newVersion,
            content: updates.content || prompt.content,
            changes: updates.changes || 'Updated prompt',
            author: authorId,
            timestamp: Date.now(),
            previousVersion: currentVersion
        });

        // Keep only recent versions
        if (versionHistory.length > this.maxVersions) {
            versionHistory.splice(0, versionHistory.length - this.maxVersions);
        }

        this.versions.set(promptId, versionHistory);

        // Update prompt
        const updatedPrompt = {
            ...prompt,
            ...updates,
            version: newVersion,
            updatedAt: Date.now(),
            variables: updates.content ? this.extractVariables(updates.content) : prompt.variables
        };

        // Recalculate quality if content changed
        if (updates.content) {
            updatedPrompt.quality = this.calculatePromptQuality(updatedPrompt);
        }

        this.prompts.set(promptId, updatedPrompt);

        console.log(`📝 Updated prompt: ${updatedPrompt.title} (${promptId}) to v${newVersion}`);

        this.emit('prompt:updated', {
            promptId,
            prompt: updatedPrompt,
            previousVersion: currentVersion,
            newVersion,
            author: authorId
        });

        return newVersion;
    }

    incrementVersion(version) {
        const parts = version.split('.').map(Number);
        parts[2]++; // Increment patch version
        return parts.join('.');
    }

    async createCollection(collectionData, authorId) {
        const collectionId = crypto.randomBytes(8).toString('hex');

        const collection = {
            id: collectionId,
            name: collectionData.name,
            description: collectionData.description || '',
            domain: collectionData.domain || 'general',
            prompts: [],
            author: authorId,
            contributors: [authorId],
            tags: collectionData.tags || [],
            visibility: collectionData.visibility || 'public',
            isDefault: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            metadata: collectionData.metadata || {}
        };

        this.collections.set(collectionId, collection);

        console.log(`📚 Created collection: ${collection.name} (${collectionId})`);

        this.emit('collection:created', {
            collectionId,
            collection,
            author: authorId
        });

        return collectionId;
    }

    async addPromptToCollection(collectionId, promptId, authorId) {
        const collection = this.collections.get(collectionId);
        const prompt = this.prompts.get(promptId);

        if (!collection) {
            throw new Error(`Collection ${collectionId} not found`);
        }

        if (!prompt) {
            throw new Error(`Prompt ${promptId} not found`);
        }

        // Check permissions
        if (collection.author !== authorId && !collection.contributors.includes(authorId) && authorId !== 'admin') {
            throw new Error('Insufficient permissions to modify collection');
        }

        if (!collection.prompts.includes(promptId)) {
            collection.prompts.push(promptId);
            collection.updatedAt = Date.now();

            // Add contributor if not already included
            if (!collection.contributors.includes(authorId)) {
                collection.contributors.push(authorId);
            }

            console.log(`📚 Added prompt ${promptId} to collection ${collectionId}`);

            this.emit('collection:prompt_added', {
                collectionId,
                promptId,
                author: authorId
            });
        }
    }

    async startABTest(testData, authorId) {
        const testId = crypto.randomBytes(8).toString('hex');

        const abTest = {
            id: testId,
            name: testData.name,
            description: testData.description || '',
            promptA: testData.promptA,
            promptB: testData.promptB,
            testType: testData.testType || 'effectiveness', // effectiveness, user_preference, performance
            targetMetric: testData.targetMetric || 'user_rating',
            author: authorId,
            status: 'active',
            startDate: Date.now(),
            endDate: Date.now() + this.abTestDuration,
            participants: [],
            results: {
                promptA: { usage: 0, totalRating: 0, avgRating: 0, successCount: 0 },
                promptB: { usage: 0, totalRating: 0, avgRating: 0, successCount: 0 }
            },
            statisticalSignificance: false,
            winner: null,
            confidence: 0,
            metadata: testData.metadata || {}
        };

        this.abTests.set(testId, abTest);

        console.log(`🧪 Started A/B test: ${abTest.name} (${testId})`);

        this.emit('abtest:started', {
            testId,
            abTest,
            author: authorId
        });

        // Schedule test completion
        setTimeout(() => {
            this.completeABTest(testId);
        }, this.abTestDuration);

        return testId;
    }

    async recordABTestUsage(testId, promptVariant, userId, rating, success = true) {
        const abTest = this.abTests.get(testId);
        if (!abTest || abTest.status !== 'active') {
            return;
        }

        if (promptVariant !== 'A' && promptVariant !== 'B') {
            throw new Error('Prompt variant must be A or B');
        }

        const variant = promptVariant === 'A' ? 'promptA' : 'promptB';
        const results = abTest.results[variant];

        results.usage++;
        results.totalRating += rating;
        results.avgRating = results.totalRating / results.usage;

        if (success) {
            results.successCount++;
        }

        // Add participant if not already included
        if (!abTest.participants.includes(userId)) {
            abTest.participants.push(userId);
        }

        // Check for statistical significance
        this.calculateABTestSignificance(abTest);

        console.log(`🧪 Recorded A/B test usage: ${testId} variant ${promptVariant} (rating: ${rating})`);

        this.emit('abtest:usage_recorded', {
            testId,
            variant: promptVariant,
            userId,
            rating,
            success
        });
    }

    calculateABTestSignificance(abTest) {
        const resultsA = abTest.results.promptA;
        const resultsB = abTest.results.promptB;

        // Need minimum sample size
        if (resultsA.usage < 30 || resultsB.usage < 30) {
            return;
        }

        // Simple statistical significance calculation (simplified t-test)
        const meanA = resultsA.avgRating;
        const meanB = resultsB.avgRating;
        const nA = resultsA.usage;
        const nB = resultsB.usage;

        // Calculate pooled standard deviation (simplified)
        const pooledStd = Math.sqrt(((nA - 1) * 0.5 + (nB - 1) * 0.5) / (nA + nB - 2));
        const standardError = pooledStd * Math.sqrt(1/nA + 1/nB);

        if (standardError > 0) {
            const tStat = Math.abs(meanA - meanB) / standardError;

            // Simplified significance check (t > 1.96 for 95% confidence)
            if (tStat > 1.96) {
                abTest.statisticalSignificance = true;
                abTest.confidence = Math.min(0.99, 0.95 + (tStat - 1.96) * 0.01);
                abTest.winner = meanA > meanB ? 'A' : 'B';
            }
        }
    }

    async completeABTest(testId) {
        const abTest = this.abTests.get(testId);
        if (!abTest || abTest.status !== 'active') {
            return;
        }

        abTest.status = 'completed';
        abTest.endDate = Date.now();

        // Final significance calculation
        this.calculateABTestSignificance(abTest);

        // Determine winner if not already determined
        if (!abTest.winner) {
            const resultsA = abTest.results.promptA;
            const resultsB = abTest.results.promptB;

            if (resultsA.avgRating > resultsB.avgRating) {
                abTest.winner = 'A';
            } else if (resultsB.avgRating > resultsA.avgRating) {
                abTest.winner = 'B';
            } else {
                abTest.winner = 'tie';
            }
        }

        console.log(`🧪 Completed A/B test: ${abTest.name} (winner: ${abTest.winner})`);

        this.emit('abtest:completed', {
            testId,
            abTest,
            winner: abTest.winner,
            significance: abTest.statisticalSignificance
        });

        return abTest;
    }

    async submitCommunityPrompt(promptData, authorId) {
        const contributionId = crypto.randomBytes(8).toString('hex');

        const contribution = {
            id: contributionId,
            type: 'prompt',
            title: promptData.title,
            content: promptData.content,
            description: promptData.description || '',
            domain: promptData.domain || 'general',
            tags: promptData.tags || [],
            author: authorId,
            status: 'pending_review',
            submittedAt: Date.now(),
            reviewedAt: null,
            reviewer: null,
            moderationScore: 0,
            communityVotes: {
                upvotes: 0,
                downvotes: 0,
                voters: []
            },
            feedback: [],
            metadata: promptData.metadata || {}
        };

        // Calculate initial moderation score
        contribution.moderationScore = this.calculateModerationScore(contribution);

        this.communityContributions.set(contributionId, contribution);

        // Auto-approve if score is high enough
        if (contribution.moderationScore >= this.communityModerationThreshold) {
            await this.approveCommunityContribution(contributionId, 'auto-moderator');
        }

        console.log(`🤝 Submitted community prompt: ${contribution.title} (${contributionId})`);

        this.emit('community:prompt_submitted', {
            contributionId,
            contribution,
            author: authorId
        });

        return contributionId;
    }

    calculateModerationScore(contribution) {
        let score = 0.5; // Base score

        // Content quality checks
        const quality = this.calculatePromptQuality({
            content: contribution.content,
            variables: this.extractVariables(contribution.content),
            tags: contribution.tags,
            domain: contribution.domain
        });
        score += quality * 0.3;

        // Length and structure checks
        const wordCount = contribution.content.split(' ').length;
        if (wordCount >= 10 && wordCount <= 200) score += 0.1;
        if (contribution.description.length > 20) score += 0.05;
        if (contribution.tags.length > 0) score += 0.05;

        // Domain relevance
        if (contribution.domain !== 'general') score += 0.1;

        return Math.min(1.0, Math.max(0.0, score));
    }

    async approveCommunityContribution(contributionId, reviewerId) {
        const contribution = this.communityContributions.get(contributionId);
        if (!contribution) {
            throw new Error(`Community contribution ${contributionId} not found`);
        }

        contribution.status = 'approved';
        contribution.reviewedAt = Date.now();
        contribution.reviewer = reviewerId;

        // Create prompt from contribution
        const promptId = await this.createPrompt({
            title: contribution.title,
            content: contribution.content,
            description: contribution.description,
            domain: contribution.domain,
            tags: [...contribution.tags, 'community'],
            isPublic: true,
            metadata: { ...contribution.metadata, communityContribution: contributionId }
        }, contribution.author);

        console.log(`✅ Approved community contribution: ${contributionId} → prompt ${promptId}`);

        this.emit('community:contribution_approved', {
            contributionId,
            promptId,
            reviewer: reviewerId
        });

        return promptId;
    }

    async voteOnCommunityContribution(contributionId, userId, voteType) {
        const contribution = this.communityContributions.get(contributionId);
        if (!contribution) {
            throw new Error(`Community contribution ${contributionId} not found`);
        }

        if (voteType !== 'upvote' && voteType !== 'downvote') {
            throw new Error('Vote type must be upvote or downvote');
        }

        // Remove previous vote if exists
        const previousVoteIndex = contribution.communityVotes.voters.findIndex(v => v.userId === userId);
        if (previousVoteIndex !== -1) {
            const previousVote = contribution.communityVotes.voters[previousVoteIndex];
            if (previousVote.voteType === 'upvote') {
                contribution.communityVotes.upvotes--;
            } else {
                contribution.communityVotes.downvotes--;
            }
            contribution.communityVotes.voters.splice(previousVoteIndex, 1);
        }

        // Add new vote
        contribution.communityVotes.voters.push({
            userId,
            voteType,
            timestamp: Date.now()
        });

        if (voteType === 'upvote') {
            contribution.communityVotes.upvotes++;
        } else {
            contribution.communityVotes.downvotes++;
        }

        // Recalculate moderation score
        contribution.moderationScore = this.calculateModerationScore(contribution);

        console.log(`🗳️ Recorded vote on contribution ${contributionId}: ${voteType} by ${userId}`);

        this.emit('community:vote_recorded', {
            contributionId,
            userId,
            voteType,
            totalUpvotes: contribution.communityVotes.upvotes,
            totalDownvotes: contribution.communityVotes.downvotes
        });
    }

    async recordPromptUsage(promptId, userId, context = {}) {
        const prompt = this.prompts.get(promptId);
        if (!prompt) {
            throw new Error(`Prompt ${promptId} not found`);
        }

        // Update prompt usage
        prompt.usage++;
        prompt.updatedAt = Date.now();

        // Update usage statistics
        let stats = this.promptUsageStats.get(promptId);
        if (!stats) {
            stats = {
                promptId,
                totalUsage: 0,
                successRate: 0,
                avgRating: 0,
                usageHistory: [],
                performanceMetrics: {
                    responseTime: [],
                    userSatisfaction: [],
                    effectiveness: []
                }
            };
            this.promptUsageStats.set(promptId, stats);
        }

        stats.totalUsage++;
        stats.usageHistory.push({
            userId,
            timestamp: Date.now(),
            context
        });

        // Keep only recent usage history
        if (stats.usageHistory.length > 1000) {
            stats.usageHistory = stats.usageHistory.slice(-1000);
        }

        console.log(`📊 Recorded usage for prompt ${promptId} by ${userId}`);

        this.emit('prompt:usage_recorded', {
            promptId,
            userId,
            context,
            totalUsage: stats.totalUsage
        });
    }

    async ratePrompt(promptId, userId, rating, feedback = '') {
        const prompt = this.prompts.get(promptId);
        if (!prompt) {
            throw new Error(`Prompt ${promptId} not found`);
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Add rating
        prompt.ratings.push({
            userId,
            rating,
            feedback,
            timestamp: Date.now()
        });

        // Update average rating
        const totalRating = prompt.ratings.reduce((sum, r) => sum + r.rating, 0);
        prompt.rating = totalRating / prompt.ratings.length;

        // Update usage statistics
        const stats = this.promptUsageStats.get(promptId);
        if (stats) {
            stats.avgRating = prompt.rating;
            stats.performanceMetrics.userSatisfaction.push(rating);

            // Keep only recent metrics
            if (stats.performanceMetrics.userSatisfaction.length > 100) {
                stats.performanceMetrics.userSatisfaction =
                    stats.performanceMetrics.userSatisfaction.slice(-100);
            }
        }

        console.log(`⭐ Rated prompt ${promptId}: ${rating}/5 by ${userId}`);

        this.emit('prompt:rated', {
            promptId,
            userId,
            rating,
            feedback,
            avgRating: prompt.rating
        });
    }

    searchPrompts(query, filters = {}) {
        const results = [];

        for (const [id, prompt] of this.prompts) {
            let matches = true;

            // Text search
            if (query) {
                const searchText = `${prompt.title} ${prompt.content} ${prompt.description} ${prompt.tags.join(' ')}`.toLowerCase();
                if (!searchText.includes(query.toLowerCase())) {
                    matches = false;
                }
            }

            // Domain filter
            if (filters.domain && prompt.domain !== filters.domain) {
                matches = false;
            }

            // Tags filter
            if (filters.tags && filters.tags.length > 0) {
                const hasTag = filters.tags.some(tag => prompt.tags.includes(tag));
                if (!hasTag) {
                    matches = false;
                }
            }

            // Quality filter
            if (filters.minQuality && prompt.quality < filters.minQuality) {
                matches = false;
            }

            // Rating filter
            if (filters.minRating && prompt.rating < filters.minRating) {
                matches = false;
            }

            // Author filter
            if (filters.author && prompt.author !== filters.author) {
                matches = false;
            }

            // Public/private filter
            if (filters.isPublic !== undefined && prompt.isPublic !== filters.isPublic) {
                matches = false;
            }

            if (matches) {
                results.push({
                    ...prompt,
                    relevanceScore: this.calculateRelevanceScore(prompt, query, filters)
                });
            }
        }

        // Sort by relevance and quality
        results.sort((a, b) => {
            const scoreA = a.relevanceScore * 0.6 + a.quality * 0.4;
            const scoreB = b.relevanceScore * 0.6 + b.quality * 0.4;
            return scoreB - scoreA;
        });

        return results;
    }

    calculateRelevanceScore(prompt, query, filters) {
        let score = 0.5; // Base score

        if (query) {
            const queryLower = query.toLowerCase();

            // Title match
            if (prompt.title.toLowerCase().includes(queryLower)) score += 0.3;

            // Content match
            if (prompt.content.toLowerCase().includes(queryLower)) score += 0.2;

            // Tag match
            if (prompt.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 0.2;

            // Domain match
            if (prompt.domain.toLowerCase().includes(queryLower)) score += 0.1;
        }

        // Boost popular prompts
        if (prompt.usage > 10) score += 0.1;
        if (prompt.rating > 4.0) score += 0.1;

        return Math.min(1.0, score);
    }

    getPromptById(promptId) {
        return this.prompts.get(promptId);
    }

    getCollectionById(collectionId) {
        return this.collections.get(collectionId);
    }

    getPromptsByDomain(domain) {
        const collection = this.collections.get(domain);
        if (!collection) return [];

        return collection.prompts.map(promptId => this.prompts.get(promptId)).filter(Boolean);
    }

    getPopularPrompts(limit = 10) {
        const prompts = Array.from(this.prompts.values())
            .filter(prompt => prompt.isPublic && prompt.isApproved !== false)
            .sort((a, b) => {
                const scoreA = a.usage * 0.4 + a.rating * 0.6;
                const scoreB = b.usage * 0.4 + b.rating * 0.6;
                return scoreB - scoreA;
            });

        return prompts.slice(0, limit);
    }

    getRecentPrompts(limit = 10) {
        const prompts = Array.from(this.prompts.values())
            .filter(prompt => prompt.isPublic && prompt.isApproved !== false)
            .sort((a, b) => b.createdAt - a.createdAt);

        return prompts.slice(0, limit);
    }

    getPromptAnalytics() {
        const totalPrompts = this.prompts.size;
        const totalCollections = this.collections.size;
        const totalUsage = Array.from(this.prompts.values()).reduce((sum, p) => sum + p.usage, 0);
        const avgQuality = Array.from(this.prompts.values()).reduce((sum, p) => sum + p.quality, 0) / totalPrompts;
        const avgRating = Array.from(this.prompts.values())
            .filter(p => p.rating > 0)
            .reduce((sum, p) => sum + p.rating, 0) /
            Array.from(this.prompts.values()).filter(p => p.rating > 0).length;

        const domainDistribution = {};
        for (const prompt of this.prompts.values()) {
            domainDistribution[prompt.domain] = (domainDistribution[prompt.domain] || 0) + 1;
        }

        return {
            totalPrompts,
            totalCollections,
            totalUsage,
            avgQuality,
            avgRating: avgRating || 0,
            domainDistribution,
            activeABTests: Array.from(this.abTests.values()).filter(test => test.status === 'active').length,
            pendingContributions: Array.from(this.communityContributions.values())
                .filter(contrib => contrib.status === 'pending_review').length,
            communityContributions: this.communityContributions.size
        };
    }

    async savePrompts() {
        try {
            const promptsFile = path.join(this.libraryDir, 'prompts.json');
            const prompts = Object.fromEntries(this.prompts);
            await fs.writeFile(promptsFile, JSON.stringify(prompts, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save prompts:', error.message);
        }
    }

    async saveCollections() {
        try {
            const collectionsFile = path.join(this.libraryDir, 'collections.json');
            const collections = Object.fromEntries(this.collections);
            await fs.writeFile(collectionsFile, JSON.stringify(collections, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save collections:', error.message);
        }
    }

    async saveUsageStats() {
        try {
            const statsFile = path.join(this.libraryDir, 'usage-stats.json');
            const stats = Object.fromEntries(this.promptUsageStats);
            await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save usage statistics:', error.message);
        }
    }
}
