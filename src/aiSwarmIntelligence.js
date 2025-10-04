/**
 * AI Swarm Intelligence System
 * Specialized AI agents (Frontend, Backend, DevOps, Testing, Security) with inter-agent communication and coordination protocols
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class AISwarmIntelligence extends EventEmitter {
    constructor(options = {}) {
        super();

        this.swarmDir = options.swarmDir || './swarm';
        this.maxActiveSwarms = options.maxActiveSwarms || 10;
        this.agentTimeout = options.agentTimeout || 5 * 60 * 1000; // 5 minutes
        this.coordinationStrategy = options.coordinationStrategy || 'democratic';

        this.activeSwarms = new Map();
        this.agentDefinitions = new Map();
        this.communicationProtocols = new Map();
        this.swarmHistory = [];
        this.performanceMetrics = new Map();

        console.log('🤖 AI Swarm Intelligence System initialized');
        this.initializeAgentDefinitions();
        this.initializeSwarmSystem();
    }

    async initializeSwarmSystem() {
        try {
            await fs.mkdir(this.swarmDir, { recursive: true });
            await this.loadSwarmHistory();
            console.log(`📁 Swarm directory initialized: ${this.swarmDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize swarm directory:', error.message);
        }
    }

    initializeAgentDefinitions() {
        // Frontend Specialist Agent
        this.agentDefinitions.set('frontend', {
            id: 'frontend',
            name: 'Frontend Specialist',
            role: 'frontend_development',
            expertise: [
                'React/Vue/Angular development',
                'UI/UX design implementation',
                'CSS/SCSS styling',
                'JavaScript/TypeScript',
                'State management (Redux, Vuex)',
                'Component architecture',
                'Performance optimization',
                'Accessibility (a11y)',
                'Responsive design',
                'Browser compatibility'
            ],
            capabilities: [
                'component_design',
                'ui_implementation',
                'state_management',
                'performance_optimization',
                'accessibility_audit',
                'responsive_design',
                'browser_testing'
            ],
            communicationStyle: 'visual_focused',
            decisionWeight: 1.0,
            collaborationPreferences: ['backend', 'testing', 'security']
        });

        // Backend Specialist Agent
        this.agentDefinitions.set('backend', {
            id: 'backend',
            name: 'Backend Specialist',
            role: 'backend_development',
            expertise: [
                'API design and development',
                'Database design and optimization',
                'Server architecture',
                'Microservices patterns',
                'Authentication and authorization',
                'Data modeling',
                'Performance optimization',
                'Caching strategies',
                'Message queues',
                'Scalability planning'
            ],
            capabilities: [
                'api_design',
                'database_optimization',
                'architecture_planning',
                'security_implementation',
                'performance_tuning',
                'data_modeling',
                'integration_design'
            ],
            communicationStyle: 'technical_detailed',
            decisionWeight: 1.2,
            collaborationPreferences: ['frontend', 'devops', 'security']
        });

        // DevOps Specialist Agent
        this.agentDefinitions.set('devops', {
            id: 'devops',
            name: 'DevOps Specialist',
            role: 'infrastructure_operations',
            expertise: [
                'CI/CD pipeline design',
                'Container orchestration (Docker, Kubernetes)',
                'Cloud infrastructure (AWS, GCP, Azure)',
                'Infrastructure as Code (Terraform, CloudFormation)',
                'Monitoring and logging',
                'Security automation',
                'Performance monitoring',
                'Disaster recovery',
                'Scalability planning',
                'Cost optimization'
            ],
            capabilities: [
                'pipeline_design',
                'infrastructure_automation',
                'monitoring_setup',
                'security_automation',
                'performance_monitoring',
                'cost_optimization',
                'disaster_recovery'
            ],
            communicationStyle: 'process_oriented',
            decisionWeight: 1.1,
            collaborationPreferences: ['backend', 'security', 'testing']
        });

        // Testing Specialist Agent
        this.agentDefinitions.set('testing', {
            id: 'testing',
            name: 'Testing Specialist',
            role: 'quality_assurance',
            expertise: [
                'Test strategy and planning',
                'Unit testing frameworks',
                'Integration testing',
                'End-to-end testing',
                'Performance testing',
                'Security testing',
                'Test automation',
                'Bug tracking and reporting',
                'Quality metrics',
                'Continuous testing'
            ],
            capabilities: [
                'test_planning',
                'test_automation',
                'performance_testing',
                'security_testing',
                'quality_assessment',
                'bug_analysis',
                'coverage_analysis'
            ],
            communicationStyle: 'quality_focused',
            decisionWeight: 1.0,
            collaborationPreferences: ['frontend', 'backend', 'security']
        });

        // Security Specialist Agent
        this.agentDefinitions.set('security', {
            id: 'security',
            name: 'Security Specialist',
            role: 'security_engineering',
            expertise: [
                'Security architecture design',
                'Vulnerability assessment',
                'Penetration testing',
                'Secure coding practices',
                'Authentication systems',
                'Encryption and cryptography',
                'Compliance and regulations',
                'Incident response',
                'Security monitoring',
                'Risk assessment'
            ],
            capabilities: [
                'security_audit',
                'vulnerability_scanning',
                'threat_modeling',
                'secure_design',
                'compliance_check',
                'incident_response',
                'risk_assessment'
            ],
            communicationStyle: 'security_focused',
            decisionWeight: 1.3,
            collaborationPreferences: ['backend', 'devops', 'testing']
        });

        console.log(`🤖 Initialized ${this.agentDefinitions.size} specialized AI agents`);
    }

    async createSwarm(taskDescription, requiredAgents = [], options = {}) {
        const swarmId = crypto.randomBytes(8).toString('hex');

        // Determine optimal agent composition
        const selectedAgents = this.selectOptimalAgents(taskDescription, requiredAgents);

        const swarm = {
            id: swarmId,
            taskDescription: taskDescription,
            agents: selectedAgents,
            status: 'initializing',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            coordinationStrategy: options.coordinationStrategy || this.coordinationStrategy,
            communicationLog: [],
            decisions: [],
            currentPhase: 'planning',
            progress: {
                planning: 0,
                execution: 0,
                review: 0,
                completion: 0
            },
            results: {
                deliverables: [],
                recommendations: [],
                issues: [],
                metrics: {}
            },
            settings: {
                maxIterations: options.maxIterations || 10,
                consensusThreshold: options.consensusThreshold || 0.7,
                timeoutMinutes: options.timeoutMinutes || 30,
                ...options.settings
            }
        };

        this.activeSwarms.set(swarmId, swarm);

        // Initialize agent states
        for (const agentId of selectedAgents) {
            await this.initializeAgent(swarmId, agentId);
        }

        console.log(`🤖 Created AI swarm: ${swarmId} with agents: ${selectedAgents.join(', ')}`);

        // Start swarm coordination
        this.startSwarmCoordination(swarmId);

        return swarmId;
    }

    selectOptimalAgents(taskDescription, requiredAgents) {
        const taskLower = taskDescription.toLowerCase();
        const selectedAgents = new Set(requiredAgents);

        // Analyze task description to determine needed expertise
        const keywords = {
            frontend: ['ui', 'frontend', 'react', 'vue', 'angular', 'component', 'styling', 'responsive', 'dashboard', 'admin'],
            backend: ['api', 'backend', 'database', 'server', 'microservice', 'authentication', 'payment', 'processing', 'e-commerce'],
            devops: ['deploy', 'infrastructure', 'docker', 'kubernetes', 'ci/cd', 'pipeline'],
            testing: ['test', 'quality', 'bug', 'automation', 'coverage', 'validation'],
            security: ['security', 'auth', 'encryption', 'vulnerability', 'compliance', 'secure']
        };

        // Score agents based on task relevance
        const agentScores = new Map();
        for (const [agentId, agentKeywords] of Object.entries(keywords)) {
            let score = 0;
            for (const keyword of agentKeywords) {
                if (taskLower.includes(keyword)) {
                    score += 1;
                }
            }
            agentScores.set(agentId, score);
        }

        // Select top scoring agents (minimum 2, maximum 4)
        const sortedAgents = Array.from(agentScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([agentId]) => agentId);

        // Add high-scoring agents
        for (const agentId of sortedAgents) {
            if (agentScores.get(agentId) > 0 && selectedAgents.size < 4) {
                selectedAgents.add(agentId);
            }
        }

        // Ensure minimum of 2 agents
        if (selectedAgents.size < 2) {
            selectedAgents.add('backend');
            selectedAgents.add('frontend');
        }

        return Array.from(selectedAgents);
    }

    async initializeAgent(swarmId, agentId) {
        const agentDef = this.agentDefinitions.get(agentId);
        if (!agentDef) {
            throw new Error(`Agent definition not found: ${agentId}`);
        }

        const agentState = {
            id: agentId,
            swarmId: swarmId,
            status: 'active',
            currentTask: null,
            knowledge: new Map(),
            decisions: [],
            communications: [],
            performance: {
                tasksCompleted: 0,
                averageResponseTime: 0,
                successRate: 1.0,
                collaborationScore: 0.8
            },
            lastActivity: Date.now()
        };

        // Store agent state
        if (!this.performanceMetrics.has(swarmId)) {
            this.performanceMetrics.set(swarmId, new Map());
        }
        this.performanceMetrics.get(swarmId).set(agentId, agentState);

        console.log(`🤖 Initialized agent ${agentId} for swarm ${swarmId}`);
    }

    async startSwarmCoordination(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);
        if (!swarm) return;

        swarm.status = 'active';

        try {
            // Phase 1: Planning
            await this.executeSwarmPhase(swarmId, 'planning');

            // Phase 2: Execution
            await this.executeSwarmPhase(swarmId, 'execution');

            // Phase 3: Review
            await this.executeSwarmPhase(swarmId, 'review');

            // Phase 4: Completion
            await this.executeSwarmPhase(swarmId, 'completion');

            swarm.status = 'completed';

        } catch (error) {
            swarm.status = 'failed';
            swarm.error = error.message;
            console.error(`❌ Swarm ${swarmId} failed:`, error.message);
        }

        // Save swarm results
        await this.saveSwarmResults(swarmId);
    }

    async executeSwarmPhase(swarmId, phase) {
        const swarm = this.activeSwarms.get(swarmId);
        if (!swarm) return;

        swarm.currentPhase = phase;
        console.log(`🔄 Swarm ${swarmId} entering ${phase} phase`);

        switch (phase) {
            case 'planning':
                await this.executePlanningPhase(swarmId);
                break;
            case 'execution':
                await this.executeExecutionPhase(swarmId);
                break;
            case 'review':
                await this.executeReviewPhase(swarmId);
                break;
            case 'completion':
                await this.executeCompletionPhase(swarmId);
                break;
        }

        swarm.progress[phase] = 100;
        swarm.lastActivity = Date.now();
    }

    async executePlanningPhase(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);

        // Each agent analyzes the task and proposes approach
        const proposals = [];

        for (const agentId of swarm.agents) {
            const proposal = await this.getAgentProposal(swarmId, agentId, swarm.taskDescription);
            proposals.push(proposal);

            // Log communication
            this.logCommunication(swarmId, agentId, 'proposal', proposal);
        }

        // Coordinate and merge proposals
        const coordinatedPlan = await this.coordinateProposals(swarmId, proposals);
        swarm.coordinatedPlan = coordinatedPlan;

        // Distribute plan to all agents
        for (const agentId of swarm.agents) {
            await this.distributeInformation(swarmId, agentId, 'plan', coordinatedPlan);
        }

        console.log(`📋 Planning phase completed for swarm ${swarmId}`);
    }

    async executeExecutionPhase(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);

        // Execute coordinated plan with inter-agent communication
        const executionResults = [];

        for (const task of swarm.coordinatedPlan.tasks) {
            const result = await this.executeCoordinatedTask(swarmId, task);
            executionResults.push(result);

            // Update progress
            const completedTasks = executionResults.filter(r => r.status === 'completed').length;
            swarm.progress.execution = (completedTasks / swarm.coordinatedPlan.tasks.length) * 100;
        }

        swarm.executionResults = executionResults;
        console.log(`⚡ Execution phase completed for swarm ${swarmId}`);
    }

    async executeReviewPhase(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);

        // Each agent reviews the execution results
        const reviews = [];

        for (const agentId of swarm.agents) {
            const review = await this.getAgentReview(swarmId, agentId, swarm.executionResults);
            reviews.push(review);

            this.logCommunication(swarmId, agentId, 'review', review);
        }

        // Consolidate reviews and identify issues
        const consolidatedReview = await this.consolidateReviews(swarmId, reviews);
        swarm.consolidatedReview = consolidatedReview;

        console.log(`🔍 Review phase completed for swarm ${swarmId}`);
    }

    async executeCompletionPhase(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);

        // Generate final deliverables and recommendations
        swarm.results.deliverables = await this.generateDeliverables(swarmId);
        swarm.results.recommendations = await this.generateRecommendations(swarmId);
        swarm.results.issues = swarm.consolidatedReview?.issues || [];
        swarm.results.metrics = await this.calculateSwarmMetrics(swarmId);

        console.log(`✅ Completion phase finished for swarm ${swarmId}`);
    }

    async getAgentProposal(swarmId, agentId, taskDescription) {
        const agentDef = this.agentDefinitions.get(agentId);

        // Simulate agent analysis and proposal generation
        const proposal = {
            agentId: agentId,
            timestamp: Date.now(),
            approach: this.generateAgentApproach(agentDef, taskDescription),
            estimatedEffort: this.estimateEffort(agentDef, taskDescription),
            dependencies: this.identifyDependencies(agentDef, taskDescription),
            risks: this.identifyRisks(agentDef, taskDescription),
            recommendations: this.generateAgentRecommendations(agentDef, taskDescription)
        };

        return proposal;
    }

    generateAgentApproach(agentDef, taskDescription) {
        const approaches = {
            frontend: [
                'Component-based architecture design',
                'Responsive UI implementation',
                'State management setup',
                'Performance optimization',
                'Accessibility compliance'
            ],
            backend: [
                'API design and documentation',
                'Database schema design',
                'Authentication implementation',
                'Performance optimization',
                'Error handling and logging'
            ],
            devops: [
                'Infrastructure planning',
                'CI/CD pipeline setup',
                'Monitoring and alerting',
                'Security automation',
                'Deployment strategy'
            ],
            testing: [
                'Test strategy development',
                'Automated test suite creation',
                'Performance testing',
                'Security testing',
                'Quality metrics tracking'
            ],
            security: [
                'Security architecture review',
                'Vulnerability assessment',
                'Secure coding guidelines',
                'Compliance verification',
                'Incident response planning'
            ]
        };

        return approaches[agentDef.id] || ['General analysis and recommendations'];
    }

    estimateEffort(agentDef, taskDescription) {
        // Simple effort estimation based on task complexity
        const complexity = this.analyzeTaskComplexity(taskDescription);
        const baseEffort = {
            low: { hours: 4, confidence: 0.9 },
            medium: { hours: 12, confidence: 0.7 },
            high: { hours: 24, confidence: 0.5 }
        };

        return baseEffort[complexity] || baseEffort.medium;
    }

    analyzeTaskComplexity(taskDescription) {
        const complexityIndicators = {
            high: ['microservice', 'distributed', 'scalable', 'enterprise', 'complex'],
            medium: ['api', 'database', 'authentication', 'integration'],
            low: ['simple', 'basic', 'prototype', 'demo']
        };

        const taskLower = taskDescription.toLowerCase();

        for (const [level, indicators] of Object.entries(complexityIndicators)) {
            if (indicators.some(indicator => taskLower.includes(indicator))) {
                return level;
            }
        }

        return 'medium';
    }

    identifyDependencies(agentDef, taskDescription) {
        const dependencies = {
            frontend: ['backend API endpoints', 'design system', 'authentication'],
            backend: ['database setup', 'external APIs', 'infrastructure'],
            devops: ['application code', 'infrastructure requirements', 'security policies'],
            testing: ['application features', 'test data', 'environments'],
            security: ['system architecture', 'compliance requirements', 'threat model']
        };

        return dependencies[agentDef.id] || [];
    }

    identifyRisks(agentDef, taskDescription) {
        const risks = {
            frontend: ['Browser compatibility', 'Performance on mobile', 'Accessibility compliance'],
            backend: ['Scalability bottlenecks', 'Data consistency', 'Security vulnerabilities'],
            devops: ['Infrastructure costs', 'Deployment complexity', 'Monitoring gaps'],
            testing: ['Test coverage gaps', 'Environment differences', 'Test data quality'],
            security: ['Compliance violations', 'Data breaches', 'Authentication bypass']
        };

        return risks[agentDef.id] || [];
    }

    generateAgentRecommendations(agentDef, taskDescription) {
        const recommendations = {
            frontend: ['Use TypeScript for better type safety', 'Implement lazy loading', 'Add error boundaries'],
            backend: ['Use connection pooling', 'Implement rate limiting', 'Add comprehensive logging'],
            devops: ['Use Infrastructure as Code', 'Implement blue-green deployment', 'Set up monitoring'],
            testing: ['Implement test automation', 'Use test-driven development', 'Add performance tests'],
            security: ['Implement security headers', 'Use HTTPS everywhere', 'Regular security audits']
        };

        return recommendations[agentDef.id] || [];
    }

    async coordinateProposals(swarmId, proposals) {
        const swarm = this.activeSwarms.get(swarmId);

        // Merge proposals into coordinated plan
        const coordinatedPlan = {
            id: crypto.randomBytes(8).toString('hex'),
            swarmId: swarmId,
            timestamp: Date.now(),
            strategy: swarm.coordinationStrategy,
            tasks: [],
            timeline: {},
            resourceRequirements: {},
            riskMitigation: []
        };

        // Extract and prioritize tasks from all proposals
        const allTasks = [];
        for (const proposal of proposals) {
            for (const approach of proposal.approach) {
                allTasks.push({
                    id: crypto.randomBytes(4).toString('hex'),
                    description: approach,
                    assignedAgent: proposal.agentId,
                    priority: this.calculateTaskPriority(approach, proposals),
                    dependencies: proposal.dependencies,
                    estimatedEffort: proposal.estimatedEffort
                });
            }
        }

        // Sort tasks by priority and dependencies
        coordinatedPlan.tasks = this.optimizeTaskOrder(allTasks);

        // Consolidate risks and recommendations
        coordinatedPlan.riskMitigation = this.consolidateRisks(proposals);

        return coordinatedPlan;
    }

    calculateTaskPriority(taskDescription, proposals) {
        // Simple priority calculation based on agent consensus
        let priority = 0.5;

        // Higher priority for tasks mentioned by multiple agents
        const mentionCount = proposals.filter(p =>
            p.approach.some(a => a.toLowerCase().includes(taskDescription.toLowerCase()))
        ).length;

        priority += mentionCount * 0.2;

        // Higher priority for security and testing tasks
        if (taskDescription.toLowerCase().includes('security') ||
            taskDescription.toLowerCase().includes('test')) {
            priority += 0.3;
        }

        return Math.min(priority, 1.0);
    }

    optimizeTaskOrder(tasks) {
        // Simple dependency-aware task ordering
        const orderedTasks = [];
        const remaining = [...tasks];

        while (remaining.length > 0) {
            // Find tasks with no unmet dependencies
            const readyTasks = remaining.filter(task =>
                task.dependencies.every(dep =>
                    orderedTasks.some(completed =>
                        completed.description.toLowerCase().includes(dep.toLowerCase())
                    )
                ) || task.dependencies.length === 0
            );

            if (readyTasks.length === 0) {
                // If no tasks are ready, take the highest priority one
                readyTasks.push(remaining.sort((a, b) => b.priority - a.priority)[0]);
            }

            // Add highest priority ready task
            const nextTask = readyTasks.sort((a, b) => b.priority - a.priority)[0];
            orderedTasks.push(nextTask);
            remaining.splice(remaining.indexOf(nextTask), 1);
        }

        return orderedTasks;
    }

    consolidateRisks(proposals) {
        const allRisks = [];
        for (const proposal of proposals) {
            allRisks.push(...proposal.risks);
        }

        // Remove duplicates and prioritize
        const uniqueRisks = [...new Set(allRisks)];
        return uniqueRisks.map(risk => ({
            description: risk,
            severity: this.assessRiskSeverity(risk),
            mitigation: this.suggestMitigation(risk)
        }));
    }

    assessRiskSeverity(risk) {
        const highSeverityKeywords = ['security', 'breach', 'compliance', 'data'];
        const mediumSeverityKeywords = ['performance', 'scalability', 'compatibility'];

        const riskLower = risk.toLowerCase();

        if (highSeverityKeywords.some(keyword => riskLower.includes(keyword))) {
            return 'high';
        } else if (mediumSeverityKeywords.some(keyword => riskLower.includes(keyword))) {
            return 'medium';
        }

        return 'low';
    }

    suggestMitigation(risk) {
        const mitigations = {
            'security': 'Implement security best practices and regular audits',
            'performance': 'Conduct performance testing and optimization',
            'compatibility': 'Test across multiple browsers and devices',
            'scalability': 'Design for horizontal scaling and load testing',
            'compliance': 'Regular compliance reviews and documentation'
        };

        const riskLower = risk.toLowerCase();
        for (const [keyword, mitigation] of Object.entries(mitigations)) {
            if (riskLower.includes(keyword)) {
                return mitigation;
            }
        }

        return 'Monitor and review regularly';
    }

    async executeCoordinatedTask(swarmId, task) {
        const startTime = Date.now();

        // Simulate task execution with agent collaboration
        const result = {
            taskId: task.id,
            description: task.description,
            assignedAgent: task.assignedAgent,
            status: 'in_progress',
            startTime: startTime,
            progress: 0,
            collaborations: [],
            deliverables: []
        };

        // Simulate agent work with potential collaboration
        const collaboratingAgents = await this.identifyCollaboratingAgents(swarmId, task);

        for (const collaboratorId of collaboratingAgents) {
            const collaboration = await this.simulateCollaboration(swarmId, task.assignedAgent, collaboratorId, task);
            result.collaborations.push(collaboration);

            this.logCommunication(swarmId, task.assignedAgent, 'collaboration', {
                with: collaboratorId,
                about: task.description,
                outcome: collaboration.outcome
            });
        }

        // Complete task
        result.status = 'completed';
        result.endTime = Date.now();
        result.duration = result.endTime - result.startTime;
        result.progress = 100;
        result.deliverables = this.generateTaskDeliverables(task);

        return result;
    }

    async identifyCollaboratingAgents(swarmId, task) {
        const swarm = this.activeSwarms.get(swarmId);
        const assignedAgent = this.agentDefinitions.get(task.assignedAgent);

        // Find agents that should collaborate based on preferences and task type
        const collaborators = [];

        for (const agentId of swarm.agents) {
            if (agentId !== task.assignedAgent &&
                assignedAgent.collaborationPreferences.includes(agentId)) {
                collaborators.push(agentId);
            }
        }

        return collaborators.slice(0, 2); // Limit to 2 collaborators per task
    }

    async simulateCollaboration(swarmId, primaryAgent, collaboratorAgent, task) {
        const collaboration = {
            primaryAgent: primaryAgent,
            collaboratorAgent: collaboratorAgent,
            task: task.description,
            timestamp: Date.now(),
            type: this.determineCollaborationType(primaryAgent, collaboratorAgent),
            outcome: 'successful',
            insights: [],
            recommendations: []
        };

        // Generate collaboration insights based on agent types
        collaboration.insights = this.generateCollaborationInsights(primaryAgent, collaboratorAgent, task);
        collaboration.recommendations = this.generateCollaborationRecommendations(primaryAgent, collaboratorAgent, task);

        return collaboration;
    }

    determineCollaborationType(primaryAgent, collaboratorAgent) {
        const collaborationTypes = {
            'backend-frontend': 'API integration planning',
            'backend-devops': 'Infrastructure requirements',
            'frontend-testing': 'UI testing strategy',
            'backend-security': 'Security implementation',
            'devops-security': 'Security automation',
            'security-testing': 'Security testing'
        };

        const key = [primaryAgent, collaboratorAgent].sort().join('-');
        return collaborationTypes[key] || 'General consultation';
    }

    generateCollaborationInsights(primaryAgent, collaboratorAgent, task) {
        const insights = {
            'backend-frontend': ['API endpoint requirements', 'Data format specifications', 'Error handling patterns'],
            'backend-devops': ['Scalability requirements', 'Resource utilization', 'Deployment considerations'],
            'frontend-testing': ['Component testing strategy', 'User interaction flows', 'Accessibility testing'],
            'backend-security': ['Authentication mechanisms', 'Data encryption', 'Input validation'],
            'devops-security': ['Infrastructure security', 'Automated security scanning', 'Compliance monitoring'],
            'security-testing': ['Security test cases', 'Vulnerability testing', 'Penetration testing']
        };

        const key = [primaryAgent, collaboratorAgent].sort().join('-');
        return insights[key] || ['General best practices', 'Quality considerations'];
    }

    generateCollaborationRecommendations(primaryAgent, collaboratorAgent, task) {
        const recommendations = {
            'backend-frontend': ['Use consistent error codes', 'Implement proper CORS', 'Add request validation'],
            'backend-devops': ['Use health checks', 'Implement graceful shutdown', 'Add metrics endpoints'],
            'frontend-testing': ['Add data-testid attributes', 'Mock external dependencies', 'Test responsive design'],
            'backend-security': ['Use parameterized queries', 'Implement rate limiting', 'Add security headers'],
            'devops-security': ['Scan container images', 'Use secrets management', 'Enable audit logging'],
            'security-testing': ['Test authentication flows', 'Validate input sanitization', 'Check authorization']
        };

        const key = [primaryAgent, collaboratorAgent].sort().join('-');
        return recommendations[key] || ['Follow industry standards', 'Document decisions'];
    }

    generateTaskDeliverables(task) {
        const deliverableTypes = {
            frontend: ['Component specifications', 'UI mockups', 'Style guide'],
            backend: ['API documentation', 'Database schema', 'Service architecture'],
            devops: ['Infrastructure diagram', 'Deployment scripts', 'Monitoring setup'],
            testing: ['Test plan', 'Test cases', 'Quality metrics'],
            security: ['Security assessment', 'Threat model', 'Security guidelines']
        };

        const agentDeliverables = deliverableTypes[task.assignedAgent] || ['Task documentation'];

        return agentDeliverables.map(deliverable => ({
            type: deliverable,
            description: `${deliverable} for ${task.description}`,
            status: 'completed',
            timestamp: Date.now()
        }));
    }

    async getAgentReview(swarmId, agentId, executionResults) {
        const agentDef = this.agentDefinitions.get(agentId);

        const review = {
            agentId: agentId,
            timestamp: Date.now(),
            overallAssessment: this.assessOverallQuality(agentDef, executionResults),
            specificFindings: this.generateSpecificFindings(agentDef, executionResults),
            recommendations: this.generateReviewRecommendations(agentDef, executionResults),
            qualityScore: this.calculateQualityScore(agentDef, executionResults),
            issues: this.identifyIssues(agentDef, executionResults)
        };

        return review;
    }

    assessOverallQuality(agentDef, executionResults) {
        const assessments = {
            frontend: 'UI components are well-structured and responsive',
            backend: 'API design follows REST principles with proper error handling',
            devops: 'Infrastructure is scalable and properly monitored',
            testing: 'Test coverage is comprehensive with automated execution',
            security: 'Security measures are properly implemented and documented'
        };

        return assessments[agentDef.id] || 'Implementation meets basic requirements';
    }

    generateSpecificFindings(agentDef, executionResults) {
        const findings = {
            frontend: [
                'Component reusability is well implemented',
                'State management follows best practices',
                'Accessibility standards are met'
            ],
            backend: [
                'Database queries are optimized',
                'Authentication is properly secured',
                'Error handling is comprehensive'
            ],
            devops: [
                'CI/CD pipeline is efficient',
                'Monitoring covers all critical metrics',
                'Infrastructure is cost-optimized'
            ],
            testing: [
                'Unit test coverage exceeds 80%',
                'Integration tests cover critical paths',
                'Performance tests validate requirements'
            ],
            security: [
                'No critical vulnerabilities detected',
                'Compliance requirements are met',
                'Security documentation is complete'
            ]
        };

        return findings[agentDef.id] || ['Implementation is functional'];
    }

    generateReviewRecommendations(agentDef, executionResults) {
        const recommendations = {
            frontend: [
                'Consider implementing progressive web app features',
                'Add more comprehensive error boundaries',
                'Optimize bundle size for better performance'
            ],
            backend: [
                'Implement caching for frequently accessed data',
                'Add more detailed API documentation',
                'Consider implementing GraphQL for complex queries'
            ],
            devops: [
                'Implement infrastructure as code',
                'Add automated security scanning',
                'Set up disaster recovery procedures'
            ],
            testing: [
                'Add visual regression testing',
                'Implement chaos engineering practices',
                'Expand performance testing scenarios'
            ],
            security: [
                'Conduct regular penetration testing',
                'Implement security awareness training',
                'Add runtime application self-protection'
            ]
        };

        return recommendations[agentDef.id] || ['Continue following best practices'];
    }

    calculateQualityScore(agentDef, executionResults) {
        // Simple quality scoring based on agent type and results
        let baseScore = 0.8;

        // Adjust based on agent expertise weight
        baseScore *= agentDef.decisionWeight;

        // Adjust based on execution success rate
        const successfulTasks = executionResults.filter(r => r.status === 'completed').length;
        const successRate = successfulTasks / executionResults.length;
        baseScore *= successRate;

        return Math.min(baseScore, 1.0);
    }

    identifyIssues(agentDef, executionResults) {
        const issues = [];

        // Check for failed tasks
        const failedTasks = executionResults.filter(r => r.status === 'failed');
        if (failedTasks.length > 0) {
            issues.push({
                type: 'task_failure',
                severity: 'high',
                description: `${failedTasks.length} tasks failed to complete`,
                recommendation: 'Review failed tasks and address root causes'
            });
        }

        // Check for long-running tasks
        const longTasks = executionResults.filter(r => r.duration > 300000); // 5 minutes
        if (longTasks.length > 0) {
            issues.push({
                type: 'performance',
                severity: 'medium',
                description: `${longTasks.length} tasks took longer than expected`,
                recommendation: 'Optimize task execution or break down complex tasks'
            });
        }

        return issues;
    }

    async consolidateReviews(swarmId, reviews) {
        const consolidatedReview = {
            swarmId: swarmId,
            timestamp: Date.now(),
            overallQuality: this.calculateOverallQuality(reviews),
            consensusLevel: this.calculateConsensusLevel(reviews),
            criticalIssues: this.identifyCriticalIssues(reviews),
            recommendations: this.consolidateRecommendations(reviews),
            qualityMetrics: this.calculateQualityMetrics(reviews)
        };

        return consolidatedReview;
    }

    calculateOverallQuality(reviews) {
        const totalScore = reviews.reduce((sum, review) => sum + review.qualityScore, 0);
        const averageScore = totalScore / reviews.length;

        if (averageScore >= 0.9) return 'excellent';
        if (averageScore >= 0.8) return 'good';
        if (averageScore >= 0.7) return 'satisfactory';
        if (averageScore >= 0.6) return 'needs_improvement';
        return 'poor';
    }

    calculateConsensusLevel(reviews) {
        // Simple consensus calculation based on recommendation overlap
        const allRecommendations = reviews.flatMap(r => r.recommendations);
        const uniqueRecommendations = new Set(allRecommendations);

        const consensusRatio = 1 - (uniqueRecommendations.size / allRecommendations.length);
        return Math.max(consensusRatio, 0.3); // Minimum 30% consensus
    }

    identifyCriticalIssues(reviews) {
        const criticalIssues = [];

        for (const review of reviews) {
            const highSeverityIssues = review.issues.filter(issue => issue.severity === 'high');
            criticalIssues.push(...highSeverityIssues);
        }

        return criticalIssues;
    }

    consolidateRecommendations(reviews) {
        const allRecommendations = reviews.flatMap(r => r.recommendations);
        const recommendationCounts = new Map();

        for (const recommendation of allRecommendations) {
            recommendationCounts.set(recommendation, (recommendationCounts.get(recommendation) || 0) + 1);
        }

        // Return recommendations mentioned by multiple agents
        return Array.from(recommendationCounts.entries())
            .filter(([rec, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .map(([rec]) => rec);
    }

    calculateQualityMetrics(reviews) {
        const metrics = {
            averageQualityScore: reviews.reduce((sum, r) => sum + r.qualityScore, 0) / reviews.length,
            issueCount: reviews.reduce((sum, r) => sum + r.issues.length, 0),
            recommendationCount: reviews.reduce((sum, r) => sum + r.recommendations.length, 0),
            agentConsensus: this.calculateConsensusLevel(reviews)
        };

        return metrics;
    }

    async generateDeliverables(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);
        const deliverables = [];

        // Collect all deliverables from execution results
        for (const result of swarm.executionResults) {
            deliverables.push(...result.deliverables);
        }

        // Add swarm-level deliverables
        deliverables.push({
            type: 'Coordination Report',
            description: 'AI Swarm coordination and collaboration summary',
            status: 'completed',
            timestamp: Date.now(),
            content: {
                swarmComposition: swarm.agents,
                coordinationStrategy: swarm.coordinationStrategy,
                communicationLog: swarm.communicationLog.slice(-10), // Last 10 communications
                overallProgress: swarm.progress
            }
        });

        return deliverables;
    }

    async generateRecommendations(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);
        const recommendations = [];

        // Collect recommendations from consolidated review
        if (swarm.consolidatedReview) {
            recommendations.push(...swarm.consolidatedReview.recommendations);
        }

        // Add swarm-specific recommendations
        recommendations.push({
            category: 'Collaboration',
            priority: 'medium',
            description: 'Continue using AI swarm approach for complex tasks',
            rationale: 'Multi-agent collaboration improved solution quality'
        });

        if (swarm.consolidatedReview?.criticalIssues.length > 0) {
            recommendations.push({
                category: 'Quality',
                priority: 'high',
                description: 'Address critical issues identified during review',
                rationale: 'Critical issues may impact system reliability'
            });
        }

        return recommendations;
    }

    async calculateSwarmMetrics(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);
        const agentMetrics = this.performanceMetrics.get(swarmId);

        const metrics = {
            swarmId: swarmId,
            duration: Date.now() - swarm.createdAt,
            agentCount: swarm.agents.length,
            taskCount: swarm.coordinatedPlan?.tasks.length || 0,
            completedTasks: swarm.executionResults?.filter(r => r.status === 'completed').length || 0,
            communicationCount: swarm.communicationLog.length,
            overallQuality: swarm.consolidatedReview?.overallQuality || 'unknown',
            consensusLevel: swarm.consolidatedReview?.consensusLevel || 0,
            agentPerformance: {}
        };

        // Calculate per-agent metrics
        if (agentMetrics) {
            for (const [agentId, agentState] of agentMetrics) {
                metrics.agentPerformance[agentId] = {
                    tasksCompleted: agentState.performance.tasksCompleted,
                    collaborationScore: agentState.performance.collaborationScore,
                    communicationCount: agentState.communications.length
                };
            }
        }

        return metrics;
    }

    logCommunication(swarmId, agentId, type, content) {
        const swarm = this.activeSwarms.get(swarmId);
        if (!swarm) return;

        const communication = {
            id: crypto.randomBytes(4).toString('hex'),
            timestamp: Date.now(),
            swarmId: swarmId,
            agentId: agentId,
            type: type,
            content: content
        };

        swarm.communicationLog.push(communication);

        // Update agent state
        const agentMetrics = this.performanceMetrics.get(swarmId);
        if (agentMetrics && agentMetrics.has(agentId)) {
            const agentState = agentMetrics.get(agentId);
            agentState.communications.push(communication);
            agentState.lastActivity = Date.now();
        }

        // Keep only recent communications (last 100)
        if (swarm.communicationLog.length > 100) {
            swarm.communicationLog = swarm.communicationLog.slice(-100);
        }
    }

    async distributeInformation(swarmId, agentId, type, information) {
        const agentMetrics = this.performanceMetrics.get(swarmId);
        if (agentMetrics && agentMetrics.has(agentId)) {
            const agentState = agentMetrics.get(agentId);
            agentState.knowledge.set(type, information);
            agentState.lastActivity = Date.now();
        }

        this.logCommunication(swarmId, agentId, 'information_received', {
            type: type,
            summary: typeof information === 'object' ?
                `${Object.keys(information).length} items` :
                information.toString().substring(0, 100)
        });
    }

    async saveSwarmResults(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);
        if (!swarm) return;

        try {
            const swarmFile = path.join(this.swarmDir, `swarm-${swarmId}.json`);

            // Prepare swarm data for serialization
            const swarmData = {
                ...swarm,
                communicationLog: swarm.communicationLog.slice(-50), // Keep last 50 communications
                performanceMetrics: Object.fromEntries(
                    this.performanceMetrics.get(swarmId) || new Map()
                )
            };

            await fs.writeFile(swarmFile, JSON.stringify(swarmData, null, 2));

            // Add to history
            this.swarmHistory.push({
                id: swarmId,
                taskDescription: swarm.taskDescription,
                agents: swarm.agents,
                status: swarm.status,
                duration: Date.now() - swarm.createdAt,
                qualityScore: swarm.results.metrics?.averageQualityScore || 0,
                timestamp: Date.now()
            });

            // Keep only recent history (last 100)
            if (this.swarmHistory.length > 100) {
                this.swarmHistory = this.swarmHistory.slice(-100);
            }

            await this.saveSwarmHistory();
            console.log(`💾 Swarm ${swarmId} results saved`);

        } catch (error) {
            console.warn(`⚠️ Failed to save swarm ${swarmId} results:`, error.message);
        }
    }

    async loadSwarmHistory() {
        try {
            const historyFile = path.join(this.swarmDir, 'swarm-history.json');
            const data = await fs.readFile(historyFile, 'utf8');
            this.swarmHistory = JSON.parse(data);
            console.log(`📥 Loaded ${this.swarmHistory.length} swarm history entries`);
        } catch (error) {
            console.log('📝 No existing swarm history found, starting fresh');
        }
    }

    async saveSwarmHistory() {
        try {
            const historyFile = path.join(this.swarmDir, 'swarm-history.json');
            await fs.writeFile(historyFile, JSON.stringify(this.swarmHistory, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save swarm history:', error.message);
        }
    }

    getSwarmStatus(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);
        if (!swarm) return null;

        return {
            id: swarm.id,
            status: swarm.status,
            currentPhase: swarm.currentPhase,
            progress: swarm.progress,
            agents: swarm.agents,
            taskDescription: swarm.taskDescription,
            createdAt: swarm.createdAt,
            lastActivity: swarm.lastActivity,
            communicationCount: swarm.communicationLog.length,
            results: swarm.results
        };
    }

    getSwarmAnalytics() {
        const totalSwarms = this.swarmHistory.length + this.activeSwarms.size;
        const activeSwarms = this.activeSwarms.size;
        const completedSwarms = this.swarmHistory.filter(s => s.status === 'completed').length;

        const agentUsage = new Map();
        const averageQuality = this.swarmHistory.reduce((sum, s) => sum + s.qualityScore, 0) /
                              Math.max(this.swarmHistory.length, 1);

        // Count agent usage
        for (const swarm of this.swarmHistory) {
            for (const agentId of swarm.agents) {
                agentUsage.set(agentId, (agentUsage.get(agentId) || 0) + 1);
            }
        }

        return {
            totalSwarms,
            activeSwarms,
            completedSwarms,
            averageQuality,
            agentUsage: Object.fromEntries(agentUsage),
            averageDuration: this.swarmHistory.reduce((sum, s) => sum + s.duration, 0) /
                           Math.max(this.swarmHistory.length, 1),
            successRate: completedSwarms / Math.max(this.swarmHistory.length, 1)
        };
    }

    async terminateSwarm(swarmId) {
        const swarm = this.activeSwarms.get(swarmId);
        if (!swarm) return false;

        swarm.status = 'terminated';
        swarm.terminatedAt = Date.now();

        await this.saveSwarmResults(swarmId);
        this.activeSwarms.delete(swarmId);
        this.performanceMetrics.delete(swarmId);

        console.log(`🛑 Swarm ${swarmId} terminated`);
        return true;
    }
}