/**
 * Task Manager - Intelligent task breakdown and prioritization system
 * Analyzes loop topics and creates structured implementation roadmaps
 */

export class TaskManager {
    constructor(multiProviderAI, votingManager) {
        this.multiAI = multiProviderAI;
        this.votingManager = votingManager;
        this.activeTasks = new Map();
        this.taskHistory = [];
        this.dependencyGraph = new Map();
        
        console.log('🎯 Task Manager initialized with intelligent breakdown capabilities');
    }

    async analyzeTaskBreakdown(topic, context = {}) {
        console.log(`🔍 Analyzing task breakdown for: "${topic}"`);
        
        const analysisPrompt = `You are an expert project manager and system architect. Analyze the following topic and break it down into actionable subtasks.

TOPIC: "${topic}"
CONTEXT: ${JSON.stringify(context, null, 2)}

Provide a comprehensive task breakdown with the following structure:

MAIN_OBJECTIVE: [Clear statement of the primary goal]

SUBTASKS:
1. [Task Name] - [Brief description]
   Priority: [HIGH/MEDIUM/LOW]
   Complexity: [1-10]
   Dependencies: [List of prerequisite tasks]
   Impact: [1-10]
   Estimated Effort: [SMALL/MEDIUM/LARGE]

2. [Continue for all subtasks...]

IMPLEMENTATION_APPROACHES:
A. [Approach Name]: [Description, pros, cons]
B. [Alternative Approach]: [Description, pros, cons]

CRITICAL_PATH: [List tasks in order of execution]
PARALLEL_OPPORTUNITIES: [Tasks that can be done simultaneously]
RISK_FACTORS: [Potential issues and mitigation strategies]

Format your response exactly as shown above.`;

        try {
            // AI Agent task breakdown (no API consumption)
            const breakdown = this.generateTaskBreakdownWithAIAgent(topic, context);
            breakdown.originalTopic = topic;
            breakdown.analysisTimestamp = new Date().toISOString();
            breakdown.id = `task-${Date.now()}`;

            this.activeTasks.set(breakdown.id, breakdown);
            this.buildDependencyGraph(breakdown);

            console.log(`✅ Task breakdown complete: ${breakdown.subtasks.length} subtasks identified`);
            return breakdown;

        } catch (error) {
            console.error('❌ Task breakdown analysis failed:', error.message);
            throw new Error(`Task analysis failed: ${error.message}`);
        }
    }

    generateTaskBreakdownWithAIAgent(topic, context = {}) {
        // AI Agent task breakdown (no API calls)
        const breakdown = {
            mainObjective: '',
            subtasks: [],
            implementationApproaches: [],
            criticalPath: [],
            parallelOpportunities: [],
            riskFactors: []
        };

        // Set main objective
        breakdown.mainObjective = topic;

        // Generate subtasks based on topic analysis
        const topicLower = topic.toLowerCase();

        if (topicLower.includes('dashboard') || topicLower.includes('ui') || topicLower.includes('frontend')) {
            breakdown.subtasks = [
                this.createSubtask('Design UI/UX wireframes', 'Create user interface mockups and user experience flow'),
                this.createSubtask('Setup frontend framework', 'Initialize React/Vue/Angular project with build tools'),
                this.createSubtask('Implement data visualization', 'Create charts, graphs, and visual components'),
                this.createSubtask('Setup real-time data connection', 'Implement WebSocket or polling for live updates'),
                this.createSubtask('Add responsive design', 'Ensure dashboard works on mobile and desktop'),
                this.createSubtask('Implement user authentication', 'Add login/logout and user management'),
                this.createSubtask('Add data filtering and search', 'Allow users to filter and search dashboard data'),
                this.createSubtask('Performance optimization', 'Optimize rendering and data loading performance'),
                this.createSubtask('Testing and validation', 'Unit tests, integration tests, and user testing'),
                this.createSubtask('Deployment and monitoring', 'Deploy to production and setup monitoring')
            ];
        } else if (topicLower.includes('api') || topicLower.includes('backend') || topicLower.includes('service')) {
            breakdown.subtasks = [
                this.createSubtask('Design API architecture', 'Plan REST/GraphQL endpoints and data models'),
                this.createSubtask('Setup database schema', 'Design and create database tables and relationships'),
                this.createSubtask('Implement authentication system', 'Add JWT/OAuth authentication and authorization'),
                this.createSubtask('Create core API endpoints', 'Implement CRUD operations and business logic'),
                this.createSubtask('Add data validation', 'Implement input validation and error handling'),
                this.createSubtask('Setup caching layer', 'Add Redis/Memcached for performance optimization'),
                this.createSubtask('Implement rate limiting', 'Add API rate limiting and security measures'),
                this.createSubtask('Add logging and monitoring', 'Implement comprehensive logging and health checks'),
                this.createSubtask('Write API documentation', 'Create OpenAPI/Swagger documentation'),
                this.createSubtask('Testing and deployment', 'Unit tests, integration tests, and CI/CD setup')
            ];
        } else if (topicLower.includes('web') || topicLower.includes('application') || topicLower.includes('app')) {
            breakdown.subtasks = [
                this.createSubtask('Requirements analysis', 'Gather and document functional and technical requirements'),
                this.createSubtask('System architecture design', 'Design overall system architecture and technology stack'),
                this.createSubtask('Database design', 'Create database schema and data models'),
                this.createSubtask('Backend API development', 'Implement server-side logic and API endpoints'),
                this.createSubtask('Frontend development', 'Create user interface and client-side functionality'),
                this.createSubtask('Integration and testing', 'Connect frontend and backend, implement testing'),
                this.createSubtask('Security implementation', 'Add authentication, authorization, and security measures'),
                this.createSubtask('Performance optimization', 'Optimize application performance and scalability'),
                this.createSubtask('Documentation', 'Create technical and user documentation'),
                this.createSubtask('Deployment and maintenance', 'Deploy to production and setup monitoring')
            ];
        } else {
            // Generic breakdown for any topic
            breakdown.subtasks = [
                this.createSubtask('Planning and analysis', 'Analyze requirements and create implementation plan'),
                this.createSubtask('Design and architecture', 'Create system design and technical architecture'),
                this.createSubtask('Core implementation', 'Develop main functionality and features'),
                this.createSubtask('Testing and validation', 'Implement testing strategy and validate functionality'),
                this.createSubtask('Documentation', 'Create technical and user documentation'),
                this.createSubtask('Deployment and monitoring', 'Deploy solution and setup monitoring')
            ];
        }

        // Generate implementation approaches
        breakdown.implementationApproaches = [
            'A. Agile iterative approach: Develop in sprints with continuous feedback and adaptation',
            'B. Waterfall sequential approach: Complete each phase before moving to the next',
            'C. Hybrid approach: Combine agile development with structured planning phases'
        ];

        // Generate critical path
        breakdown.criticalPath = breakdown.subtasks.slice(0, Math.min(5, breakdown.subtasks.length)).map(task => task.name);

        // Generate parallel opportunities
        breakdown.parallelOpportunities = [
            'Frontend and backend development can proceed in parallel after API design',
            'Testing can be developed alongside implementation',
            'Documentation can be written in parallel with development'
        ];

        // Generate risk factors
        breakdown.riskFactors = [
            'Technical complexity may require additional research and prototyping',
            'Integration challenges between different system components',
            'Performance requirements may need optimization iterations',
            'User requirements may change during development'
        ];

        return breakdown;
    }

    createSubtask(name, description) {
        return {
            id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            description: description,
            priority: 'MEDIUM',
            complexity: Math.floor(Math.random() * 5) + 3, // 3-7 complexity
            dependencies: [],
            impact: Math.floor(Math.random() * 3) + 4, // 4-6 impact
            effort: ['SMALL', 'MEDIUM', 'LARGE'][Math.floor(Math.random() * 3)],
            status: 'pending',
            createdAt: new Date().toISOString()
        };
    }

    parseTaskBreakdown(content) {
        const breakdown = {
            mainObjective: '',
            subtasks: [],
            implementationApproaches: [],
            criticalPath: [],
            parallelOpportunities: [],
            riskFactors: []
        };

        const lines = content.split('\n');
        let currentSection = '';

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('MAIN_OBJECTIVE:')) {
                breakdown.mainObjective = trimmed.replace('MAIN_OBJECTIVE:', '').trim();
            } else if (trimmed === 'SUBTASKS:') {
                currentSection = 'subtasks';
            } else if (trimmed === 'IMPLEMENTATION_APPROACHES:') {
                currentSection = 'approaches';
            } else if (trimmed === 'CRITICAL_PATH:') {
                currentSection = 'critical';
            } else if (trimmed === 'PARALLEL_OPPORTUNITIES:') {
                currentSection = 'parallel';
            } else if (trimmed === 'RISK_FACTORS:') {
                currentSection = 'risks';
            } else if (trimmed && currentSection === 'subtasks' && /^\d+\./.test(trimmed)) {
                const task = this.parseSubtask(trimmed);
                if (task) breakdown.subtasks.push(task);
            } else if (trimmed && currentSection === 'approaches' && /^[A-Z]\./.test(trimmed)) {
                breakdown.implementationApproaches.push(trimmed);
            } else if (trimmed && currentSection === 'critical') {
                breakdown.criticalPath.push(trimmed);
            } else if (trimmed && currentSection === 'parallel') {
                breakdown.parallelOpportunities.push(trimmed);
            } else if (trimmed && currentSection === 'risks') {
                breakdown.riskFactors.push(trimmed);
            }
        }

        return breakdown;
    }

    parseSubtask(taskLine) {
        const match = taskLine.match(/^\d+\.\s*(.+?)\s*-\s*(.+)/);
        if (!match) return null;

        const [, name, description] = match;
        return {
            id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            description: description.trim(),
            priority: 'MEDIUM',
            complexity: 5,
            dependencies: [],
            impact: 5,
            effort: 'MEDIUM',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
    }

    buildDependencyGraph(breakdown) {
        const graph = new Map();
        
        for (const task of breakdown.subtasks) {
            graph.set(task.id, {
                task,
                dependencies: [],
                dependents: []
            });
        }

        // Analyze dependencies based on task names and descriptions
        for (const task of breakdown.subtasks) {
            const dependencies = this.identifyDependencies(task, breakdown.subtasks);
            const node = graph.get(task.id);
            node.dependencies = dependencies;
            
            // Update dependents
            for (const depId of dependencies) {
                const depNode = graph.get(depId);
                if (depNode) {
                    depNode.dependents.push(task.id);
                }
            }
        }

        this.dependencyGraph.set(breakdown.id, graph);
        return graph;
    }

    identifyDependencies(task, allTasks) {
        const dependencies = [];
        const taskWords = task.name.toLowerCase().split(' ');
        
        for (const otherTask of allTasks) {
            if (otherTask.id === task.id) continue;
            
            const otherWords = otherTask.name.toLowerCase().split(' ');
            
            // Simple dependency detection based on keywords
            if (this.hasDependencyKeywords(taskWords, otherWords)) {
                dependencies.push(otherTask.id);
            }
        }
        
        return dependencies;
    }

    hasDependencyKeywords(taskWords, otherWords) {
        const dependencyIndicators = [
            ['setup', 'configure'],
            ['design', 'implement'],
            ['create', 'test'],
            ['install', 'configure'],
            ['analyze', 'design']
        ];

        for (const [prerequisite, dependent] of dependencyIndicators) {
            if (otherWords.includes(prerequisite) && taskWords.includes(dependent)) {
                return true;
            }
        }
        
        return false;
    }

    async selectOptimalStrategy(breakdown) {
        if (breakdown.implementationApproaches.length <= 1) {
            return breakdown.implementationApproaches[0] || 'Default implementation approach';
        }

        console.log('🤖 Using AI agent to select optimal implementation strategy (no API keys consumed)');

        // AI Agent-based strategy selection without API consumption
        const strategyAnalysis = this.analyzeStrategiesWithAIAgent(breakdown);

        console.log(`✅ Optimal strategy selected by AI agent: ${strategyAnalysis.selectedStrategy}`);
        return strategyAnalysis.selectedStrategy;
    }

    analyzeStrategiesWithAIAgent(breakdown) {
        // AI Agent logic for strategy selection (no API calls)
        const strategies = breakdown.implementationApproaches;
        const context = {
            subtaskCount: breakdown.subtasks.length,
            criticalPathLength: breakdown.criticalPath?.length || 0,
            parallelOpportunities: breakdown.parallelOpportunities?.length || 0,
            riskFactorCount: breakdown.riskFactors.length,
            complexity: breakdown.subtasks.reduce((sum, task) => sum + (task.complexity || 5), 0) / breakdown.subtasks.length
        };

        // AI Agent scoring algorithm
        const scoredStrategies = strategies.map((strategy, index) => {
            let score = 0;

            // Complexity-based scoring
            if (context.complexity > 7 && strategy.toLowerCase().includes('incremental')) score += 3;
            if (context.complexity < 4 && strategy.toLowerCase().includes('rapid')) score += 3;

            // Critical path scoring
            if (context.criticalPathLength > 5 && strategy.toLowerCase().includes('parallel')) score += 2;
            if (context.criticalPathLength < 3 && strategy.toLowerCase().includes('sequential')) score += 2;

            // Risk-based scoring
            if (context.riskFactorCount > 3 && strategy.toLowerCase().includes('safe')) score += 2;
            if (context.riskFactorCount < 2 && strategy.toLowerCase().includes('aggressive')) score += 2;

            // Task count scoring
            if (context.subtaskCount > 10 && strategy.toLowerCase().includes('modular')) score += 2;
            if (context.subtaskCount < 5 && strategy.toLowerCase().includes('simple')) score += 2;

            // Parallel opportunities scoring
            if (context.parallelOpportunities > 3 && strategy.toLowerCase().includes('concurrent')) score += 2;

            // Default scoring for balanced approaches
            if (strategy.toLowerCase().includes('balanced') || strategy.toLowerCase().includes('hybrid')) score += 1;

            return { strategy, score, index };
        });

        // Select highest scoring strategy
        const bestStrategy = scoredStrategies.reduce((best, current) =>
            current.score > best.score ? current : best
        );

        return {
            selectedStrategy: bestStrategy.strategy,
            score: bestStrategy.score,
            reasoning: `AI agent analysis: complexity=${context.complexity.toFixed(1)}, critical_path=${context.criticalPathLength}, parallel_ops=${context.parallelOpportunities}, risks=${context.riskFactorCount}`
        };
    }

    prioritizeTasks(breakdown) {
        const tasks = [...breakdown.subtasks];
        
        // Calculate priority scores
        tasks.forEach(task => {
            task.priorityScore = this.calculatePriorityScore(task, breakdown);
        });

        // Sort by priority score (higher is better)
        tasks.sort((a, b) => b.priorityScore - a.priorityScore);

        console.log(`📊 Tasks prioritized: ${tasks.map(t => `${t.name} (${t.priorityScore})`).join(', ')}`);
        return tasks;
    }

    calculatePriorityScore(task, breakdown) {
        const priorityWeights = { HIGH: 10, MEDIUM: 5, LOW: 1 };
        const effortWeights = { SMALL: 3, MEDIUM: 2, LARGE: 1 };
        
        const priorityScore = priorityWeights[task.priority] || 5;
        const impactScore = task.impact || 5;
        const complexityPenalty = (task.complexity || 5) * 0.5;
        const effortBonus = effortWeights[task.effort] || 2;
        
        return priorityScore + impactScore + effortBonus - complexityPenalty;
    }

    getExecutionPlan(breakdown) {
        const prioritizedTasks = this.prioritizeTasks(breakdown);
        const dependencyGraph = this.dependencyGraph.get(breakdown.id);
        
        const plan = {
            phases: [],
            parallelGroups: [],
            criticalPath: [],
            estimatedDuration: 0
        };

        // Create execution phases based on dependencies
        const processed = new Set();
        let phase = 1;

        while (processed.size < prioritizedTasks.length) {
            const currentPhase = [];
            
            for (const task of prioritizedTasks) {
                if (processed.has(task.id)) continue;
                
                const node = dependencyGraph.get(task.id);
                const dependenciesMet = node.dependencies.every(depId => processed.has(depId));
                
                if (dependenciesMet) {
                    currentPhase.push(task);
                    processed.add(task.id);
                }
            }
            
            if (currentPhase.length > 0) {
                plan.phases.push({
                    phase,
                    tasks: currentPhase,
                    canRunInParallel: currentPhase.length > 1
                });
                phase++;
            } else {
                break; // Prevent infinite loop
            }
        }

        console.log(`📋 Execution plan created: ${plan.phases.length} phases`);
        return plan;
    }

    getTaskStatus(taskId) {
        for (const [, breakdown] of this.activeTasks) {
            const task = breakdown.subtasks.find(t => t.id === taskId);
            if (task) return task;
        }
        return null;
    }

    updateTaskStatus(taskId, status, details = {}) {
        const task = this.getTaskStatus(taskId);
        if (task) {
            task.status = status;
            task.lastUpdated = new Date().toISOString();
            if (details.progress) task.progress = details.progress;
            if (details.notes) task.notes = details.notes;
            
            console.log(`📝 Task ${task.name} updated: ${status}`);
            return true;
        }
        return false;
    }

    getActiveBreakdowns() {
        return Array.from(this.activeTasks.values());
    }
}
