/**
 * Multi-Provider AI Client
 * Supports OpenRouter, Anthropic, and DeepSeek with automatic failover
 */

import fetch from 'node-fetch';
import { CONFIG } from './config.js';

class MultiProviderAI {
    constructor(smartCache = null, modelAnalytics = null) {
        this.providers = new Map();
        this.currentProvider = null;
        this.currentModel = null;
        this.requestCount = 0;
        this.smartCache = smartCache;
        this.modelAnalytics = modelAnalytics;
        this.failedProviders = new Set();
        
        this.initializeProviders();
        console.log('🤖 Multi-Provider AI initialized with automatic failover');
    }

    initializeProviders() {
        // Get API keys from environment with fallback
        const openrouterKeys = process.env.OPENROUTER_API_KEY?.split(',').map(key => key.trim()) ||
            CONFIG.AI_PROVIDERS?.openrouter?.apiKeys || [];
        const anthropicKeys = process.env.ANTHROPIC_API_KEY?.split(',').map(key => key.trim()) || [];
        const deepseekKeys = process.env.DEEPSEEK_API_KEY?.split(',').map(key => key.trim()) || [];
        const geminiKeys = process.env.GEMINI_API_KEY?.split(',').map(key => key.trim()) || [];

        // Initialize OpenRouter
        if (openrouterKeys.length > 0) {
            this.providers.set('openrouter', {
                enabled: true,
                apiKeys: openrouterKeys,
                baseURL: 'https://openrouter.ai/api/v1',
                models: [
                    'google/gemini-2.0-flash-exp:free',
                    'anthropic/claude-3-haiku:beta',
                    'openai/gpt-4o-mini',
                    'meta-llama/llama-3.1-8b-instruct:free',
                    'qwen/qwen-2.5-72b-instruct',
                    'google/gemini-flash-1.5'
                ],
                currentKeyIndex: 0,
                currentModelIndex: 0,
                requestCount: 0,
                lastUsed: 0
            });
            console.log(`✅ OpenRouter: ${openrouterKeys.length} keys, 6 models`);
        }

        // Initialize Anthropic
        if (anthropicKeys.length > 0) {
            this.providers.set('anthropic', {
                enabled: true,
                apiKeys: anthropicKeys,
                baseURL: 'https://api.anthropic.com',
                models: [
                    'claude-3-5-sonnet-20241022',
                    'claude-3-5-haiku-20241022',
                    'claude-3-opus-20240229'
                ],
                currentKeyIndex: 0,
                currentModelIndex: 0,
                requestCount: 0,
                lastUsed: 0
            });
            console.log(`✅ Anthropic: ${anthropicKeys.length} keys, 3 models`);
        }

        // Initialize DeepSeek
        if (deepseekKeys.length > 0) {
            this.providers.set('deepseek', {
                enabled: true,
                apiKeys: deepseekKeys,
                baseURL: 'https://api.deepseek.com',
                models: [
                    'deepseek-chat',
                    'deepseek-coder'
                ],
                currentKeyIndex: 0,
                currentModelIndex: 0,
                requestCount: 0,
                lastUsed: 0
            });
            console.log(`✅ DeepSeek: ${deepseekKeys.length} keys, 2 models`);
        }

        // Initialize Gemini
        if (geminiKeys.length > 0) {
            this.providers.set('gemini', {
                enabled: true,
                apiKeys: geminiKeys,
                baseURL: 'https://generativelanguage.googleapis.com/v1beta',
                models: [
                    'gemini-2.5-flash-preview-05-20',
                    'gemini-2.0-flash',
                    'gemini-1.5-flash-latest',
                    'gemini-1.5-flash-8b-latest'
                ],
                currentKeyIndex: 0,
                currentModelIndex: 0,
                requestCount: 0,
                lastUsed: 0
            });
            console.log(`✅ Gemini: ${geminiKeys.length} keys, 4 models`);
        }

        // Set initial provider (prefer OpenRouter, then Gemini, then Anthropic, then DeepSeek)
        if (this.providers.has('openrouter')) {
            this.currentProvider = 'openrouter';
        } else if (this.providers.has('gemini')) {
            this.currentProvider = 'gemini';
        } else if (this.providers.has('anthropic')) {
            this.currentProvider = 'anthropic';
        } else if (this.providers.has('deepseek')) {
            this.currentProvider = 'deepseek';
        }

        if (this.currentProvider) {
            const provider = this.providers.get(this.currentProvider);
            this.currentModel = provider.models[0];
            console.log(`🎯 Primary provider: ${this.currentProvider} with model: ${this.currentModel}`);
        } else {
            console.warn('⚠️ No AI providers configured! Please set API keys in environment variables:');
            console.warn('   OPENROUTER_API_KEY=your_key_here');
            console.warn('   ANTHROPIC_API_KEY=your_key_here');
            console.warn('   DEEPSEEK_API_KEY=your_key_here');
            console.warn('   GEMINI_API_KEY=your_key_here');

            // Add a mock provider for testing
            this.addMockProvider();
        }
    }

    async makeRequest(prompt, options = {}) {
        const maxRetries = 3;
        let lastError = null;

        // Check cache first if available
        if (this.smartCache) {
            const cachedResponse = await this.smartCache.getCachedResponse(
                prompt,
                this.currentModel,
                options
            );

            if (cachedResponse) {
                return cachedResponse;
            }
        }

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await this.attemptRequest(prompt, options);

                // Cache the successful response if caching is enabled
                if (this.smartCache && result && result.content) {
                    const shouldCache = this.smartCache.shouldCache(
                        this.currentModel,
                        result.content.length,
                        options.complexity || 5
                    );

                    if (shouldCache) {
                        await this.smartCache.setCachedResponse(
                            prompt,
                            this.currentModel,
                            result,
                            options
                        );
                    }
                }

                // Record analytics if analytics is enabled
                if (this.modelAnalytics && result) {
                    this.modelAnalytics.recordModelPerformance(
                        this.currentModel,
                        options.taskType || 'general',
                        {
                            success: true,
                            responseTime: result.responseTime || 0,
                            inputTokens: result.usage?.prompt_tokens || result.usage?.input_tokens || 0,
                            outputTokens: result.usage?.completion_tokens || result.usage?.output_tokens || 0,
                            qualityScore: options.qualityScore || this.estimateQualityScore(result.content)
                        }
                    );
                }

                // Reset failed providers on success
                this.failedProviders.clear();

                return result;
            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);

                // Record failed attempt in analytics
                if (this.modelAnalytics) {
                    this.modelAnalytics.recordModelPerformance(
                        this.currentModel,
                        options.taskType || 'general',
                        {
                            success: false,
                            responseTime: 0,
                            inputTokens: 0,
                            outputTokens: 0,
                            error: error.message
                        }
                    );
                }

                // Try next provider/model combination
                if (!this.switchToNextOption()) {
                    break;
                }
            }
        }

        throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
    }

    async attemptRequest(prompt, options = {}) {
        if (!this.currentProvider) {
            throw new Error('No AI providers available');
        }

        const provider = this.providers.get(this.currentProvider);
        const apiKey = provider.apiKeys[provider.currentKeyIndex];

        console.log(`🔄 Using ${this.currentProvider} with model ${this.currentModel}`);

        const startTime = Date.now();
        let result;

        switch (this.currentProvider) {
            case 'openrouter':
                result = await this.makeOpenRouterRequest(prompt, apiKey, options);
                break;
            case 'anthropic':
                result = await this.makeAnthropicRequest(prompt, apiKey, options);
                break;
            case 'deepseek':
                result = await this.makeDeepSeekRequest(prompt, apiKey, options);
                break;
            case 'gemini':
                result = await this.makeGeminiRequest(prompt, apiKey, options);
                break;
            case 'mock':
                result = await this.makeMockRequest(prompt, options);
                break;
            default:
                throw new Error(`Unknown provider: ${this.currentProvider}`);
        }

        // Add response time to result
        result.responseTime = Date.now() - startTime;
        provider.requestCount++;
        provider.lastUsed = Date.now();

        return result;
    }

    async makeOpenRouterRequest(prompt, apiKey, options = {}) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://zai-platform.com',
                'X-Title': 'ZAI MCP Server'
            },
            body: JSON.stringify({
                model: this.currentModel,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: options.maxTokens || 4000,
                temperature: options.temperature || 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            provider: 'openrouter',
            model: this.currentModel,
            usage: data.usage
        };
    }

    async makeAnthropicRequest(prompt, apiKey, options = {}) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.currentModel,
                max_tokens: options.maxTokens || 4000,
                temperature: options.temperature || 0.7,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text,
            provider: 'anthropic',
            model: this.currentModel,
            usage: data.usage
        };
    }

    async makeDeepSeekRequest(prompt, apiKey, options = {}) {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.currentModel,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: options.maxTokens || 4000,
                temperature: options.temperature || 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            provider: 'deepseek',
            model: this.currentModel,
            usage: data.usage
        };
    }

    async makeGeminiRequest(prompt, apiKey, options = {}) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.currentModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 4000,
                    temperature: options.temperature || 0.7
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid Gemini response format');
        }

        return {
            content: data.candidates[0].content.parts[0].text,
            provider: 'gemini',
            model: this.currentModel,
            usage: data.usageMetadata || {}
        };
    }

    switchToNextOption() {
        if (!this.currentProvider) return false;

        const provider = this.providers.get(this.currentProvider);
        
        // Try next model with current provider
        provider.currentModelIndex = (provider.currentModelIndex + 1) % provider.models.length;
        
        // If we've cycled through all models, try next API key
        if (provider.currentModelIndex === 0) {
            provider.currentKeyIndex = (provider.currentKeyIndex + 1) % provider.apiKeys.length;
            
            // If we've cycled through all keys, try next provider
            if (provider.currentKeyIndex === 0) {
                this.failedProviders.add(this.currentProvider);
                return this.switchToNextProvider();
            }
        }

        this.currentModel = provider.models[provider.currentModelIndex];
        console.log(`🔄 Switched to ${this.currentProvider} model: ${this.currentModel}`);
        return true;
    }

    switchToNextProvider() {
        const availableProviders = Array.from(this.providers.keys())
            .filter(name => !this.failedProviders.has(name));

        if (availableProviders.length === 0) {
            console.error('❌ All providers have failed');
            return false;
        }

        // Find next provider
        const currentIndex = availableProviders.indexOf(this.currentProvider);
        const nextIndex = (currentIndex + 1) % availableProviders.length;
        this.currentProvider = availableProviders[nextIndex];

        const provider = this.providers.get(this.currentProvider);
        this.currentModel = provider.models[0];
        
        console.log(`🔄 Switched to provider: ${this.currentProvider} with model: ${this.currentModel}`);
        return true;
    }

    resetFailedProviders() {
        this.failedProviders.clear();
        console.log('🔄 Reset all failed providers');
    }

    resetProviders() {
        // Reset all provider states
        this.failedProviders.clear();

        for (const [name, provider] of this.providers) {
            provider.currentKeyIndex = 0;
            provider.currentModelIndex = 0;
            provider.requestCount = 0;
            provider.lastUsed = 0;
        }

        // Reset to primary provider
        if (this.providers.has('openrouter')) {
            this.currentProvider = 'openrouter';
        } else if (this.providers.has('gemini')) {
            this.currentProvider = 'gemini';
        } else if (this.providers.has('anthropic')) {
            this.currentProvider = 'anthropic';
        } else if (this.providers.has('deepseek')) {
            this.currentProvider = 'deepseek';
        }

        if (this.currentProvider) {
            const provider = this.providers.get(this.currentProvider);
            this.currentModel = provider.models[0];
        }

        console.log('🔄 All providers reset to initial state');
    }

    getStatus() {
        const totalRequests = Array.from(this.providers.values())
            .reduce((sum, provider) => sum + provider.requestCount, 0);

        const successCount = totalRequests - this.failedProviders.size;
        const successRate = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0;

        const status = {
            currentProvider: this.currentProvider,
            currentModel: this.currentModel,
            totalRequests,
            successCount,
            errorCount: this.failedProviders.size,
            successRate,
            providers: {}
        };

        for (const [name, provider] of this.providers) {
            status.providers[name] = {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                enabled: !this.failedProviders.has(name),
                apiKeys: provider.apiKeys.length,
                models: provider.models.length,
                currentModel: provider.models[provider.currentModelIndex],
                requestCount: provider.requestCount,
                failed: this.failedProviders.has(name)
            };
        }

        return status;
    }

    estimateQualityScore(content) {
        // Simple quality estimation based on content characteristics
        if (!content || typeof content !== 'string') return 5;

        let score = 5; // Base score

        // Length factor (reasonable length gets bonus)
        const length = content.length;
        if (length > 50 && length < 2000) score += 1;
        if (length > 200 && length < 1000) score += 0.5;

        // Structure factor (presence of formatting, lists, etc.)
        if (content.includes('\n') || content.includes('•') || content.includes('-')) score += 0.5;
        if (content.includes('```') || content.includes('**')) score += 0.5;

        // Content quality indicators
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length > 2) score += 0.5;

        // Avoid very short or very long responses
        if (length < 20) score -= 2;
        if (length > 3000) score -= 1;

        // Check for error indicators
        if (content.toLowerCase().includes('error') ||
            content.toLowerCase().includes('sorry') ||
            content.toLowerCase().includes('cannot') ||
            content.toLowerCase().includes('unable')) {
            score -= 1;
        }

        // Ensure score is within bounds
        return Math.max(1, Math.min(10, score));
    }

    addMockProvider() {
        // Add a mock provider for testing when no API keys are available
        this.providers.set('mock', {
            enabled: true,
            apiKeys: ['mock-key'],
            baseURL: 'mock://localhost',
            models: ['mock-model'],
            currentKeyIndex: 0,
            currentModelIndex: 0,
            requestCount: 0,
            lastUsed: 0
        });

        this.currentProvider = 'mock';
        this.currentModel = 'mock-model';
        console.log('🤖 Mock provider activated for testing (no API keys configured)');
    }

    async makeMockRequest(prompt, options = {}) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

        // Check if the prompt expects JSON response
        const expectsJson = prompt.includes('JSON') || prompt.includes('json') ||
                           prompt.includes('Format as') || prompt.includes('format:') ||
                           prompt.includes('{') || prompt.includes('}');

        let selectedResponse;

        if (expectsJson) {
            // Generate appropriate JSON responses based on prompt content
            selectedResponse = this.generateMockJsonResponse(prompt);
        } else {
            // Generate regular text responses
            const responses = [
                `Mock AI response for: "${prompt.substring(0, 50)}..."`,
                `This is a simulated response to help test the system without API keys.`,
                `Mock analysis: The prompt appears to be about ${this.extractTopic(prompt)}.`,
                `Simulated AI insight: Based on the input, I would recommend focusing on ${this.generateRecommendation()}.`
            ];
            selectedResponse = responses[Math.floor(Math.random() * responses.length)];
        }

        return {
            content: selectedResponse,
            provider: 'mock',
            model: 'mock-model',
            usage: {
                prompt_tokens: Math.floor(prompt.length / 4),
                completion_tokens: Math.floor(selectedResponse.length / 4),
                total_tokens: Math.floor((prompt.length + selectedResponse.length) / 4)
            }
        };
    }

    extractTopic(prompt) {
        const topics = ['optimization', 'analysis', 'implementation', 'testing', 'collaboration', 'innovation'];
        return topics[Math.floor(Math.random() * topics.length)];
    }

    generateRecommendation() {
        const recommendations = [
            'iterative improvement',
            'collaborative approaches',
            'performance optimization',
            'quality assurance',
            'user experience enhancement',
            'scalability considerations'
        ];
        return recommendations[Math.floor(Math.random() * recommendations.length)];
    }

    /**
     * Generate appropriate JSON responses based on prompt content
     */
    generateMockJsonResponse(prompt) {
        const lowerPrompt = prompt.toLowerCase();

        // Integration discovery response
        if (lowerPrompt.includes('integration') && lowerPrompt.includes('recommend')) {
            return JSON.stringify({
                recommendations: [
                    { connector: "github", reason: "Popular version control system", priority: "high" },
                    { connector: "slack", reason: "Excellent for team communication", priority: "medium" },
                    { connector: "jira", reason: "Comprehensive project management", priority: "medium" }
                ]
            });
        }

        // Integration analysis response
        if (lowerPrompt.includes('integration') && lowerPrompt.includes('analysis')) {
            return JSON.stringify({
                dataFlow: "bidirectional",
                syncFrequency: "real_time",
                dataTypes: ["json", "text", "files"],
                transformationsNeeded: ["format_conversion", "field_mapping"],
                potentialChallenges: ["rate_limiting", "authentication"],
                recommendedApproach: "Use REST API with webhook notifications",
                estimatedComplexity: "medium"
            });
        }

        // Problem analysis response
        if (lowerPrompt.includes('problem') && lowerPrompt.includes('analyz')) {
            return JSON.stringify({
                complexity: "high",
                domain: "technical",
                requiredSkills: ["frontend", "backend", "devops"],
                estimatedEffort: "medium",
                riskFactors: ["scalability", "performance"],
                recommendedApproach: "agile_development"
            });
        }

        // Template selection response
        if (lowerPrompt.includes('template') && lowerPrompt.includes('select')) {
            return JSON.stringify({
                selectedTemplate: "implementation_deployment",
                confidence: 0.85,
                reasoning: "Best match for technical implementation requirements",
                alternatives: ["research_analysis", "creative_problem_solving"]
            });
        }

        // Voting response
        if (lowerPrompt.includes('vote') || lowerPrompt.includes('compare')) {
            return JSON.stringify({
                analysis: "Comprehensive comparison of options",
                recommendation: "Option A provides better scalability",
                confidence: 0.9,
                reasoning: "Based on technical requirements and constraints"
            });
        }

        // Default JSON response
        return JSON.stringify({
            analysis: `Mock analysis for: ${prompt.substring(0, 50)}...`,
            result: "success",
            confidence: 0.8,
            recommendations: ["Consider implementation approach", "Review requirements"],
            metadata: {
                timestamp: new Date().toISOString(),
                provider: "mock",
                model: "mock-model"
            }
        });
    }
}

export { MultiProviderAI };
