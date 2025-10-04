/**
 * Debugging Orchestrator - Central coordinator for all debugging operations
 * Manages screenshot analysis, console error parsing, and automated fix generation
 */

import { EventEmitter } from 'events';

export class DebuggingOrchestrator extends EventEmitter {
    constructor(multiProviderAI, specializedAgentSystem) {
        super();
        this.multiProviderAI = multiProviderAI;
        this.specializedAgentSystem = specializedAgentSystem;
        this.debuggingSessions = new Map();
        this.sessionCounter = 0;
        
        // Initialize debugging components
        this.visualAnalysisEngine = null;
        this.consoleErrorAnalyzer = null;
        this.automaticFixGenerator = null;
        this.screenshotProcessor = null;
        this.codeAnalysisEngine = null;
        
        // Debugging agents
        this.debuggingAgents = new Map();
        this.initializeDebuggingAgents();
        
        // Analysis history and learning
        this.analysisHistory = [];
        this.fixSuccessRate = new Map();
        this.issuePatterns = new Map();
        
        console.log('🔧 Debugging Orchestrator initialized with advanced analysis capabilities');
    }

    /**
     * Initialize specialized debugging agents
     */
    initializeDebuggingAgents() {
        const agentRoles = [
            {
                id: 'visual_analyst',
                name: 'Visual Analyst Agent',
                specialization: 'UI/UX issue detection and layout analysis',
                capabilities: ['screenshot_analysis', 'layout_detection', 'accessibility_audit', 'responsive_analysis']
            },
            {
                id: 'error_detective',
                name: 'Error Detective Agent',
                specialization: 'Console error analysis and root cause detection',
                capabilities: ['error_parsing', 'stack_trace_analysis', 'error_classification', 'dependency_tracking']
            },
            {
                id: 'fix_generator',
                name: 'Fix Generator Agent',
                specialization: 'Automated code fix generation and validation',
                capabilities: ['code_generation', 'fix_validation', 'testing_integration', 'safety_checks']
            },
            {
                id: 'performance_optimizer',
                name: 'Performance Optimizer Agent',
                specialization: 'Performance issue detection and optimization',
                capabilities: ['performance_analysis', 'bottleneck_detection', 'optimization_suggestions', 'monitoring']
            },
            {
                id: 'security_auditor',
                name: 'Security Auditor Agent',
                specialization: 'Security vulnerability detection and fixes',
                capabilities: ['security_analysis', 'vulnerability_scanning', 'security_fixes', 'compliance_checks']
            }
        ];

        for (const role of agentRoles) {
            this.debuggingAgents.set(role.id, {
                ...role,
                active: true,
                successRate: 0.85,
                totalAnalyses: 0,
                lastUsed: null
            });
        }

        console.log(`🤖 Initialized ${agentRoles.length} specialized debugging agents`);
    }

    /**
     * Start a comprehensive debugging session
     */
    async startDebugSession(options = {}) {
        const sessionId = `debug_session_${++this.sessionCounter}_${Date.now()}`;
        
        const session = {
            id: sessionId,
            startTime: Date.now(),
            status: 'active',
            options: {
                includeScreenshot: options.includeScreenshot || false,
                includeConsoleErrors: options.includeConsoleErrors || false,
                autoFix: options.autoFix || false,
                framework: options.framework || 'auto-detect',
                priority: options.priority || 'medium',
                ...options
            },
            analysis: {
                screenshot: null,
                consoleErrors: [],
                issues: [],
                fixes: [],
                recommendations: []
            },
            agents: [],
            progress: {
                phase: 'initialization',
                completion: 0,
                currentTask: 'Setting up debugging session'
            }
        };

        this.debuggingSessions.set(sessionId, session);
        
        console.log(`🔧 [${sessionId}] Debug session started with options:`, session.options);
        
        // Emit session started event
        this.emit('sessionStarted', {
            sessionId,
            options: session.options,
            timestamp: session.startTime
        });

        return {
            sessionId,
            status: 'initialized',
            message: 'Debug session created successfully',
            nextSteps: [
                'Upload screenshot using analyze_screenshot',
                'Provide console errors using analyze_console_errors',
                'Or use auto_debug_application for comprehensive analysis'
            ]
        };
    }

    /**
     * Analyze screenshot for UI issues
     */
    async analyzeScreenshot(sessionId, screenshotData, options = {}) {
        const session = this.debuggingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }

        console.log(`🖼️ [${sessionId}] Starting screenshot analysis...`);
        session.progress = {
            phase: 'screenshot_analysis',
            completion: 20,
            currentTask: 'Processing screenshot'
        };

        try {
            // Initialize screenshot processor if not already done
            if (!this.screenshotProcessor) {
                const { ScreenshotProcessor } = await import('./screenshotProcessor.js');
                this.screenshotProcessor = new ScreenshotProcessor(this.multiProviderAI);
            }

            // Process screenshot
            const screenshotAnalysis = await this.screenshotProcessor.processScreenshot(screenshotData, {
                framework: session.options.framework,
                analysisDepth: options.analysisDepth || 'comprehensive',
                includeAccessibility: options.includeAccessibility !== false,
                detectComponents: options.detectComponents !== false
            });

            // Get visual analyst agent
            const visualAgent = this.debuggingAgents.get('visual_analyst');
            if (visualAgent) {
                session.agents.push('visual_analyst');
                visualAgent.totalAnalyses++;
                visualAgent.lastUsed = Date.now();
            }

            // Store analysis results
            session.analysis.screenshot = screenshotAnalysis;
            session.analysis.issues.push(...screenshotAnalysis.issues);

            session.progress = {
                phase: 'screenshot_analysis',
                completion: 60,
                currentTask: 'Analyzing UI components and layout'
            };

            // Generate AI-powered insights
            const aiInsights = await this.generateAIInsights(screenshotAnalysis, 'screenshot');
            session.analysis.recommendations.push(...aiInsights.recommendations);

            session.progress = {
                phase: 'screenshot_analysis',
                completion: 100,
                currentTask: 'Screenshot analysis completed'
            };

            console.log(`✅ [${sessionId}] Screenshot analysis completed: ${screenshotAnalysis.issues.length} issues found`);

            return {
                sessionId,
                analysis: screenshotAnalysis,
                issuesFound: screenshotAnalysis.issues.length,
                recommendations: aiInsights.recommendations,
                nextSteps: this.generateNextSteps(session)
            };

        } catch (error) {
            console.error(`❌ [${sessionId}] Screenshot analysis failed:`, error.message);
            session.progress = {
                phase: 'screenshot_analysis',
                completion: 0,
                currentTask: `Error: ${error.message}`
            };
            throw error;
        }
    }

    /**
     * Analyze console errors
     */
    async analyzeConsoleErrors(sessionId, consoleErrors, options = {}) {
        const session = this.debuggingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }

        console.log(`🐛 [${sessionId}] Starting console error analysis...`);
        session.progress = {
            phase: 'error_analysis',
            completion: 20,
            currentTask: 'Parsing console errors'
        };

        try {
            // Initialize console error analyzer if not already done
            if (!this.consoleErrorAnalyzer) {
                const { ConsoleErrorAnalyzer } = await import('./consoleErrorAnalyzer.js');
                this.consoleErrorAnalyzer = new ConsoleErrorAnalyzer(this.multiProviderAI);
            }

            // Parse and analyze errors
            const errorAnalysis = await this.consoleErrorAnalyzer.analyzeErrors(consoleErrors, {
                framework: session.options.framework,
                includeStackTrace: options.includeStackTrace !== false,
                categorizeErrors: options.categorizeErrors !== false,
                findRootCause: options.findRootCause !== false
            });

            // Get error detective agent
            const errorAgent = this.debuggingAgents.get('error_detective');
            if (errorAgent) {
                session.agents.push('error_detective');
                errorAgent.totalAnalyses++;
                errorAgent.lastUsed = Date.now();
            }

            // Store analysis results
            session.analysis.consoleErrors = errorAnalysis.errors;
            session.analysis.issues.push(...errorAnalysis.issues);

            session.progress = {
                phase: 'error_analysis',
                completion: 60,
                currentTask: 'Categorizing and prioritizing errors'
            };

            // Generate AI-powered insights
            const aiInsights = await this.generateAIInsights(errorAnalysis, 'console_errors');
            session.analysis.recommendations.push(...aiInsights.recommendations);

            session.progress = {
                phase: 'error_analysis',
                completion: 100,
                currentTask: 'Console error analysis completed'
            };

            console.log(`✅ [${sessionId}] Console error analysis completed: ${errorAnalysis.issues.length} issues found`);

            return {
                sessionId,
                analysis: errorAnalysis,
                issuesFound: errorAnalysis.issues.length,
                recommendations: aiInsights.recommendations,
                nextSteps: this.generateNextSteps(session)
            };

        } catch (error) {
            console.error(`❌ [${sessionId}] Console error analysis failed:`, error.message);
            session.progress = {
                phase: 'error_analysis',
                completion: 0,
                currentTask: `Error: ${error.message}`
            };
            throw error;
        }
    }

    /**
     * Generate automated fixes for identified issues
     */
    async generateFixes(sessionId, options = {}) {
        const session = this.debuggingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }

        if (session.analysis.issues.length === 0) {
            return {
                sessionId,
                message: 'No issues found to generate fixes for',
                fixes: []
            };
        }

        console.log(`🔧 [${sessionId}] Generating fixes for ${session.analysis.issues.length} issues...`);
        session.progress = {
            phase: 'fix_generation',
            completion: 20,
            currentTask: 'Analyzing issues for fix generation'
        };

        try {
            // Initialize automatic fix generator if not already done
            if (!this.automaticFixGenerator) {
                const { AutomaticFixGenerator } = await import('./automaticFixGenerator.js');
                this.automaticFixGenerator = new AutomaticFixGenerator(this.multiProviderAI);
            }

            // Generate fixes for all issues
            const fixes = [];
            const totalIssues = session.analysis.issues.length;

            for (let i = 0; i < totalIssues; i++) {
                const issue = session.analysis.issues[i];
                
                session.progress = {
                    phase: 'fix_generation',
                    completion: 20 + (i / totalIssues) * 60,
                    currentTask: `Generating fix for: ${issue.type}`
                };

                const fix = await this.automaticFixGenerator.generateFix(issue, {
                    framework: session.options.framework,
                    safetyLevel: options.safetyLevel || 'high',
                    includeTests: options.includeTests !== false,
                    validateFix: options.validateFix !== false
                });

                if (fix) {
                    fixes.push(fix);
                }
            }

            // Get fix generator agent
            const fixAgent = this.debuggingAgents.get('fix_generator');
            if (fixAgent) {
                if (!session.agents.includes('fix_generator')) {
                    session.agents.push('fix_generator');
                }
                fixAgent.totalAnalyses++;
                fixAgent.lastUsed = Date.now();
            }

            // Store generated fixes
            session.analysis.fixes = fixes;

            session.progress = {
                phase: 'fix_generation',
                completion: 100,
                currentTask: 'Fix generation completed'
            };

            console.log(`✅ [${sessionId}] Generated ${fixes.length} fixes for ${totalIssues} issues`);

            return {
                sessionId,
                fixes,
                totalIssues,
                fixesGenerated: fixes.length,
                nextSteps: this.generateNextSteps(session)
            };

        } catch (error) {
            console.error(`❌ [${sessionId}] Fix generation failed:`, error.message);
            session.progress = {
                phase: 'fix_generation',
                completion: 0,
                currentTask: `Error: ${error.message}`
            };
            throw error;
        }
    }

    /**
     * Get debug session status
     */
    getSessionStatus(sessionId) {
        const session = this.debuggingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }

        return {
            sessionId,
            status: session.status,
            progress: session.progress,
            duration: Date.now() - session.startTime,
            agents: session.agents,
            summary: {
                issuesFound: session.analysis.issues.length,
                fixesGenerated: session.analysis.fixes.length,
                recommendations: session.analysis.recommendations.length
            }
        };
    }

    /**
     * Generate comprehensive debug report
     */
    async generateDebugReport(sessionId) {
        const session = this.debuggingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }

        const report = {
            sessionId,
            timestamp: new Date().toISOString(),
            duration: Date.now() - session.startTime,
            summary: {
                totalIssues: session.analysis.issues.length,
                criticalIssues: session.analysis.issues.filter(i => i.severity === 'critical').length,
                fixesGenerated: session.analysis.fixes.length,
                agentsUsed: session.agents.length
            },
            analysis: {
                screenshot: session.analysis.screenshot ? {
                    issuesFound: session.analysis.screenshot.issues.length,
                    layoutIssues: session.analysis.screenshot.issues.filter(i => i.category === 'layout').length,
                    accessibilityIssues: session.analysis.screenshot.issues.filter(i => i.category === 'accessibility').length
                } : null,
                consoleErrors: {
                    totalErrors: session.analysis.consoleErrors.length,
                    errorTypes: [...new Set(session.analysis.consoleErrors.map(e => e.type))],
                    criticalErrors: session.analysis.consoleErrors.filter(e => e.severity === 'critical').length
                }
            },
            fixes: session.analysis.fixes.map(fix => ({
                issueType: fix.issueType,
                fixType: fix.type,
                confidence: fix.confidence,
                safetyLevel: fix.safetyLevel,
                estimated_impact: fix.estimatedImpact
            })),
            recommendations: session.analysis.recommendations,
            nextSteps: this.generateNextSteps(session)
        };

        console.log(`📊 [${sessionId}] Debug report generated`);
        return report;
    }

    /**
     * Generate AI-powered insights
     */
    async generateAIInsights(analysisData, analysisType) {
        try {
            const prompt = this.buildInsightPrompt(analysisData, analysisType);
            const response = await this.multiProviderAI.generateResponse(prompt, {
                maxTokens: 1000,
                temperature: 0.3
            });

            return {
                recommendations: this.parseRecommendations(response),
                insights: response
            };
        } catch (error) {
            console.error('Failed to generate AI insights:', error.message);
            return {
                recommendations: [],
                insights: 'AI insights unavailable'
            };
        }
    }

    /**
     * Build prompt for AI insights
     */
    buildInsightPrompt(analysisData, analysisType) {
        let prompt = `As an expert debugging assistant, analyze the following ${analysisType} data and provide insights:\n\n`;
        
        if (analysisType === 'screenshot') {
            prompt += `Screenshot Analysis Results:\n`;
            prompt += `- Issues found: ${analysisData.issues.length}\n`;
            prompt += `- Layout problems: ${analysisData.issues.filter(i => i.category === 'layout').length}\n`;
            prompt += `- Accessibility issues: ${analysisData.issues.filter(i => i.category === 'accessibility').length}\n`;
        } else if (analysisType === 'console_errors') {
            prompt += `Console Error Analysis Results:\n`;
            prompt += `- Total errors: ${analysisData.errors.length}\n`;
            prompt += `- Error types: ${[...new Set(analysisData.errors.map(e => e.type))].join(', ')}\n`;
            prompt += `- Critical errors: ${analysisData.errors.filter(e => e.severity === 'critical').length}\n`;
        }

        prompt += `\nProvide 3-5 specific recommendations for fixing these issues. Focus on:\n`;
        prompt += `1. Priority order for fixes\n`;
        prompt += `2. Potential root causes\n`;
        prompt += `3. Best practices to prevent similar issues\n`;
        prompt += `4. Tools or techniques that could help\n\n`;
        prompt += `Format as numbered list with brief explanations.`;

        return prompt;
    }

    /**
     * Parse recommendations from AI response
     */
    parseRecommendations(response) {
        const lines = response.split('\n').filter(line => line.trim());
        const recommendations = [];

        for (const line of lines) {
            if (/^\d+\./.test(line.trim())) {
                recommendations.push(line.trim());
            }
        }

        return recommendations.length > 0 ? recommendations : ['Review analysis results and apply suggested fixes'];
    }

    /**
     * Generate next steps based on session state
     */
    generateNextSteps(session) {
        const steps = [];

        if (!session.analysis.screenshot && !session.analysis.consoleErrors.length) {
            steps.push('Upload a screenshot or provide console errors to begin analysis');
        }

        if (session.analysis.issues.length > 0 && session.analysis.fixes.length === 0) {
            steps.push('Generate fixes for identified issues using generate_fixes');
        }

        if (session.analysis.fixes.length > 0) {
            steps.push('Review and apply the generated fixes');
            steps.push('Test the application after applying fixes');
        }

        if (session.analysis.issues.length === 0) {
            steps.push('No issues found - consider running additional analysis');
        }

        steps.push('Generate a comprehensive debug report');

        return steps;
    }

    /**
     * Clean up completed sessions
     */
    cleanupSession(sessionId) {
        const session = this.debuggingSessions.get(sessionId);
        if (session) {
            session.status = 'completed';
            session.endTime = Date.now();
            
            // Archive session data
            this.analysisHistory.push({
                sessionId,
                duration: session.endTime - session.startTime,
                issuesFound: session.analysis.issues.length,
                fixesGenerated: session.analysis.fixes.length,
                agentsUsed: session.agents.length,
                timestamp: session.endTime
            });

            // Remove from active sessions after 1 hour
            setTimeout(() => {
                this.debuggingSessions.delete(sessionId);
            }, 3600000);

            console.log(`🧹 [${sessionId}] Session cleaned up and archived`);
        }
    }

    /**
     * Get debugging statistics
     */
    getDebuggingStats() {
        return {
            activeSessions: this.debuggingSessions.size,
            totalSessions: this.analysisHistory.length + this.debuggingSessions.size,
            agents: Array.from(this.debuggingAgents.values()).map(agent => ({
                id: agent.id,
                name: agent.name,
                totalAnalyses: agent.totalAnalyses,
                successRate: agent.successRate,
                lastUsed: agent.lastUsed
            })),
            recentSessions: this.analysisHistory.slice(-10)
        };
    }
}
