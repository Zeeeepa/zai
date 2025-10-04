/**
 * AI Voting Manager - Handles multi-model consensus and decision making
 * Implements sophisticated voting strategies and agent management
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AIVotingManager {
    constructor(multiProviderAI) {
        this.multiAI = multiProviderAI;
        this.config = this.loadAgentConfig();
        this.votingHistory = [];
        this.agentPerformance = new Map();
        
        console.log('🗳️ AI Voting Manager initialized with agent configurations');
    }

    loadAgentConfig() {
        try {
            const configPath = path.join(__dirname, 'ai-agents-config.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('❌ Failed to load AI agent config:', error.message);
            return this.getDefaultConfig();
        }
    }

    async conductVoting(prompt, options = {}) {
        const {
            panel = 'general',
            strategy = 'consensus',
            maxAgents = 5,
            timeout = 60000,
            enableDebug = false
        } = options;

        console.log(`🗳️ Starting voting session: Panel=${panel}, Strategy=${strategy}`);

        const startTime = Date.now();
        const panelConfig = this.config.aiAgents.votingPanels[panel];
        
        if (!panelConfig) {
            throw new Error(`Unknown voting panel: ${panel}`);
        }

        // Select agents for voting
        const selectedAgents = this.selectAgents(panelConfig, maxAgents);
        
        // Phase 1: Generate responses from selected agents
        const responses = await this.generateAgentResponses(prompt, selectedAgents, timeout);
        
        // Phase 2: Conduct voting among agents
        const votes = await this.collectVotes(prompt, responses, selectedAgents);
        
        // Phase 3: Calculate consensus based on strategy
        const consensus = this.calculateConsensus(votes, responses, strategy, panelConfig);
        
        // Phase 4: Record voting session
        const votingSession = {
            id: `vote-${Date.now()}`,
            timestamp: new Date().toISOString(),
            prompt: prompt.substring(0, 200) + '...',
            panel,
            strategy,
            selectedAgents: selectedAgents.map(a => a.id),
            responses: responses.length,
            votes: votes.length,
            consensus,
            duration: Date.now() - startTime
        };
        
        this.votingHistory.push(votingSession);
        this.updateAgentPerformance(votes, consensus);
        
        if (enableDebug) {
            console.log('🔍 Voting Debug:', JSON.stringify(votingSession, null, 2));
        }

        console.log(`✅ Voting complete: ${consensus.winner.id} selected with ${consensus.confidence}% confidence`);

        return {
            winningResponse: {
                content: consensus.selectedResponse,
                agentId: consensus.winner.id
            },
            totalAgents: selectedAgents.length,
            consensusScore: consensus.confidence / 100,
            duration: Date.now() - startTime,
            votes: votes,
            responses: responses,
            sessionId: votingSession.id
        };
    }

    selectAgents(panelConfig, maxAgents) {
        let availableAgents = panelConfig.agents.filter(agent => {
            // Check if agent requires paid API and if we have it
            if (agent.requiresPaid) {
                return this.multiAI.providers.openrouter.enabled || 
                       this.multiAI.providers.anthropic.enabled;
            }
            return true;
        });

        // Sort by performance and weight
        availableAgents.sort((a, b) => {
            const perfA = this.agentPerformance.get(a.id)?.successRate || 0.5;
            const perfB = this.agentPerformance.get(b.id)?.successRate || 0.5;
            const scoreA = (a.weight || 1.0) * perfA;
            const scoreB = (b.weight || 1.0) * perfB;
            return scoreB - scoreA;
        });

        return availableAgents.slice(0, maxAgents);
    }

    async generateAgentResponses(prompt, agents, timeout) {
        const responses = [];
        const promises = agents.map(async (agent) => {
            try {
                const startTime = Date.now();
                
                const response = await Promise.race([
                    this.multiAI.makeRequest(prompt, {
                        maxTokens: 1000,
                        temperature: 0.7,
                        model: agent.model
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), timeout / agents.length)
                    )
                ]);

                const responseTime = Date.now() - startTime;
                
                return {
                    agent,
                    response: response.content,
                    model: response.model,
                    responseTime,
                    success: true
                };
            } catch (error) {
                console.warn(`⚠️ Agent ${agent.id} failed: ${error.message}`);
                return {
                    agent,
                    response: null,
                    error: error.message,
                    success: false
                };
            }
        });

        const results = await Promise.allSettled(promises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
                responses.push(result.value);
            }
        });

        console.log(`📝 Generated ${responses.length}/${agents.length} responses`);
        return responses;
    }

    async collectVotes(originalPrompt, responses, agents) {
        const votes = [];
        
        // Create voting prompt
        const votingPrompt = this.createVotingPrompt(originalPrompt, responses);
        
        for (const agent of agents) {
            try {
                const voteResponse = await this.multiAI.makeRequest(
                    votingPrompt,
                    {
                        maxTokens: 300,
                        temperature: 0.2, // Low temperature for consistent voting
                        model: agent.model
                    }
                );

                const parsedVote = this.parseVote(voteResponse.content);
                
                votes.push({
                    voter: agent,
                    selectedResponseIndex: parsedVote.selectedResponse - 1, // Convert to 0-based
                    confidence: parsedVote.confidence,
                    reasoning: parsedVote.reasoning,
                    weight: agent.weight || 1.0
                });

                console.log(`🗳️ ${agent.id} voted for Response ${parsedVote.selectedResponse} (confidence: ${parsedVote.confidence})`);

            } catch (error) {
                console.warn(`⚠️ Voting failed for ${agent.id}: ${error.message}`);
            }
        }

        return votes;
    }

    createVotingPrompt(originalPrompt, responses) {
        let prompt = `You are an expert AI evaluator. Analyze these responses to determine which is BEST.

ORIGINAL PROMPT:
"${originalPrompt}"

RESPONSES TO EVALUATE:
`;

        responses.forEach((resp, index) => {
            prompt += `
RESPONSE ${index + 1} (${resp.agent.name} - ${resp.agent.specialty}):
${resp.response}

---
`;
        });

        prompt += `
EVALUATION CRITERIA:
- Accuracy and correctness
- Helpfulness and relevance
- Clarity and completeness
- Technical quality (if applicable)
- Innovation and creativity

VOTE FORMAT (respond EXACTLY in this format):
VOTE: [1-${responses.length}]
CONFIDENCE: [1-10]
REASONING: [brief explanation]

Choose the response number that best addresses the original prompt.`;

        return prompt;
    }

    parseVote(voteContent) {
        const voteMatch = voteContent.match(/VOTE:\s*(\d+)/i);
        const confidenceMatch = voteContent.match(/CONFIDENCE:\s*(\d+)/i);
        const reasoningMatch = voteContent.match(/REASONING:\s*(.+?)(?:\n|$)/is);

        return {
            selectedResponse: voteMatch ? parseInt(voteMatch[1]) : 1,
            confidence: confidenceMatch ? Math.min(parseInt(confidenceMatch[1]), 10) : 5,
            reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided'
        };
    }

    calculateConsensus(votes, responses, strategy, panelConfig) {
        const strategyConfig = this.config.aiAgents.votingStrategies[strategy];
        const threshold = strategyConfig?.threshold || 0.6;
        const useWeights = strategyConfig?.useWeights || false;

        // Count votes for each response
        const voteCounts = new Array(responses.length).fill(0);
        const weightedVotes = new Array(responses.length).fill(0);
        let totalVotes = 0;
        let totalWeight = 0;

        votes.forEach(vote => {
            const index = vote.selectedResponseIndex;
            if (index >= 0 && index < responses.length) {
                voteCounts[index]++;
                totalVotes++;
                
                if (useWeights) {
                    const weight = vote.weight * (vote.confidence / 10);
                    weightedVotes[index] += weight;
                    totalWeight += weight;
                }
            }
        });

        // Determine winner
        let winnerIndex;
        let winnerScore;
        let confidence;

        if (useWeights && totalWeight > 0) {
            // Weighted voting
            winnerIndex = weightedVotes.indexOf(Math.max(...weightedVotes));
            winnerScore = weightedVotes[winnerIndex];
            confidence = (winnerScore / totalWeight) * 100;
        } else {
            // Simple majority
            winnerIndex = voteCounts.indexOf(Math.max(...voteCounts));
            winnerScore = voteCounts[winnerIndex];
            confidence = totalVotes > 0 ? (winnerScore / totalVotes) * 100 : 0;
        }

        const hasConsensus = confidence >= (threshold * 100);
        const winner = responses[winnerIndex];

        return {
            winner: winner.agent,
            selectedResponse: winner.response,
            confidence: Math.round(confidence),
            hasConsensus,
            threshold: threshold * 100,
            strategy,
            voteCounts,
            weightedVotes: useWeights ? weightedVotes : null,
            totalVotes,
            winnerIndex
        };
    }

    updateAgentPerformance(votes, consensus) {
        votes.forEach(vote => {
            const agentId = vote.voter.id;
            const current = this.agentPerformance.get(agentId) || {
                totalVotes: 0,
                correctVotes: 0,
                successRate: 0.5
            };

            current.totalVotes++;
            
            // Agent was "correct" if they voted for the winning response
            if (vote.selectedResponseIndex === consensus.winnerIndex) {
                current.correctVotes++;
            }
            
            current.successRate = current.correctVotes / current.totalVotes;
            this.agentPerformance.set(agentId, current);
        });
    }

    getVotingHistory(limit = 10) {
        return this.votingHistory.slice(-limit).map(session => ({
            sessionId: session.id,
            prompt: session.prompt,
            panel: session.panel,
            strategy: session.strategy,
            winner: session.consensus?.winner?.id || 'unknown',
            consensusScore: session.consensus?.confidence / 100 || 0,
            timestamp: session.timestamp
        }));
    }

    getAgentPerformance(agentId = null) {
        const performance = {};

        this.agentPerformance.forEach((stats, id) => {
            performance[id] = {
                totalResponses: stats.totalVotes || 0,
                wins: stats.correctVotes || 0,
                winRate: stats.successRate || 0,
                averageConfidence: 7.5, // Mock data
                averageResponseTime: 2500, // Mock data
                recentWins: Math.min(stats.correctVotes || 0, 5),
                trend: stats.successRate > 0.6 ? '📈 Improving' : stats.successRate > 0.4 ? '➡️ Stable' : '📉 Declining'
            };
        });

        // Add default agents if no performance data
        if (Object.keys(performance).length === 0) {
            const defaultAgents = ['deepseek-r1', 'mistral-devstral', 'phi-4', 'qwen3-14b'];
            defaultAgents.forEach(id => {
                performance[id] = {
                    totalResponses: 0,
                    wins: 0,
                    winRate: 0.5,
                    averageConfidence: 7.5,
                    averageResponseTime: 2500,
                    recentWins: 0,
                    trend: '➡️ No data'
                };
            });
        }

        return agentId ? { [agentId]: performance[agentId] } : performance;
    }

    getDefaultConfig() {
        return {
            aiAgents: {
                votingPanels: {
                    general: {
                        name: "Default Panel",
                        consensusThreshold: 0.6,
                        agents: [
                            {
                                id: "default-agent",
                                name: "Default Agent",
                                provider: "openrouter",
                                model: "deepseek/deepseek-r1-0528:free",
                                specialty: "general",
                                weight: 1.0
                            }
                        ]
                    }
                },
                votingStrategies: {
                    consensus: { threshold: 0.6 }
                }
            }
        };
    }
}
