/**
 * Console Error Analyzer - Parses and analyzes JavaScript console errors
 * Provides intelligent error classification, root cause analysis, and fix suggestions
 */

export class ConsoleErrorAnalyzer {
    constructor(multiProviderAI) {
        this.multiProviderAI = multiProviderAI;
        this.errorPatterns = new Map();
        this.knownSolutions = new Map();
        this.initializeErrorPatterns();
        this.initializeKnownSolutions();
        
        console.log('🐛 Console Error Analyzer initialized with intelligent error parsing');
    }

    /**
     * Initialize common error patterns
     */
    initializeErrorPatterns() {
        this.errorPatterns.set('syntax', {
            patterns: [
                /SyntaxError/i,
                /Unexpected token/i,
                /Unexpected end of input/i,
                /Invalid or unexpected token/i
            ],
            severity: 'critical',
            category: 'syntax'
        });

        this.errorPatterns.set('reference', {
            patterns: [
                /ReferenceError/i,
                /is not defined/i,
                /Cannot access.*before initialization/i
            ],
            severity: 'high',
            category: 'reference'
        });

        this.errorPatterns.set('type', {
            patterns: [
                /TypeError/i,
                /Cannot read propert(y|ies) of/i,
                /Cannot set propert(y|ies) of/i,
                /is not a function/i,
                /Cannot destructure/i
            ],
            severity: 'high',
            category: 'type'
        });

        this.errorPatterns.set('network', {
            patterns: [
                /NetworkError/i,
                /Failed to fetch/i,
                /ERR_NETWORK/i,
                /ERR_INTERNET_DISCONNECTED/i,
                /CORS/i
            ],
            severity: 'medium',
            category: 'network'
        });

        this.errorPatterns.set('react', {
            patterns: [
                /Warning: React/i,
                /Warning: Each child in a list should have a unique "key" prop/i,
                /Warning: Failed prop type/i,
                /Cannot update a component while rendering/i
            ],
            severity: 'medium',
            category: 'react'
        });

        this.errorPatterns.set('vue', {
            patterns: [
                /\[Vue warn\]/i,
                /Property or method .* is not defined/i,
                /Invalid prop/i,
                /Unknown custom element/i
            ],
            severity: 'medium',
            category: 'vue'
        });

        this.errorPatterns.set('angular', {
            patterns: [
                /ERROR Error/i,
                /NullInjectorError/i,
                /ExpressionChangedAfterItHasBeenCheckedError/i,
                /Cannot find module/i
            ],
            severity: 'medium',
            category: 'angular'
        });
    }

    /**
     * Initialize known solutions for common errors
     */
    initializeKnownSolutions() {
        this.knownSolutions.set('is not defined', {
            solution: 'Variable or function is not declared. Check spelling and ensure proper import/declaration.',
            fixes: [
                'Check variable spelling',
                'Add proper import statement',
                'Declare variable before use',
                'Check scope and closure issues'
            ]
        });

        this.knownSolutions.set('Cannot read properties of undefined', {
            solution: 'Trying to access property of undefined/null object. Add null checks or optional chaining.',
            fixes: [
                'Add null/undefined checks: if (obj && obj.property)',
                'Use optional chaining: obj?.property',
                'Initialize object with default values',
                'Check async data loading timing'
            ]
        });

        this.knownSolutions.set('is not a function', {
            solution: 'Variable is not a function or method does not exist. Check function name and object type.',
            fixes: [
                'Verify function name spelling',
                'Check if object has the method',
                'Ensure proper function binding',
                'Check async loading of functions'
            ]
        });

        this.knownSolutions.set('Failed to fetch', {
            solution: 'Network request failed. Check URL, CORS settings, and network connectivity.',
            fixes: [
                'Verify API endpoint URL',
                'Check CORS configuration',
                'Add error handling for network requests',
                'Implement retry logic for failed requests'
            ]
        });
    }

    /**
     * Analyze console errors
     */
    async analyzeErrors(consoleErrors, options = {}) {
        console.log(`🔍 Analyzing ${consoleErrors.length} console errors...`);

        const errors = [];
        const issues = [];
        const patterns = new Map();

        // Process each error
        for (let i = 0; i < consoleErrors.length; i++) {
            const rawError = consoleErrors[i];
            const processedError = await this.processError(rawError, i, options);
            
            errors.push(processedError);
            
            // Convert to issue format
            const issue = this.errorToIssue(processedError);
            issues.push(issue);

            // Track patterns
            const pattern = processedError.pattern || 'unknown';
            patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }

        // Analyze error relationships
        const relationships = this.analyzeErrorRelationships(errors);
        
        // Generate summary
        const summary = this.generateErrorSummary(errors, patterns, relationships);

        console.log(`✅ Error analysis completed: ${issues.length} issues identified`);

        return {
            errors,
            issues,
            patterns: Object.fromEntries(patterns),
            relationships,
            summary
        };
    }

    /**
     * Process individual error
     */
    async processError(rawError, index, options) {
        const error = {
            id: `error_${index}_${Date.now()}`,
            raw: rawError,
            timestamp: this.extractTimestamp(rawError),
            message: this.extractMessage(rawError),
            stack: this.extractStackTrace(rawError),
            file: this.extractFile(rawError),
            line: this.extractLine(rawError),
            column: this.extractColumn(rawError),
            type: 'unknown',
            category: 'unknown',
            severity: 'medium',
            pattern: null,
            rootCause: null,
            suggestions: []
        };

        // Classify error
        this.classifyError(error);

        // Extract root cause
        if (options.findRootCause !== false) {
            error.rootCause = await this.findRootCause(error);
        }

        // Generate suggestions
        error.suggestions = this.generateSuggestions(error);

        return error;
    }

    /**
     * Extract timestamp from error
     */
    extractTimestamp(rawError) {
        if (typeof rawError === 'object' && rawError.timestamp) {
            return rawError.timestamp;
        }
        
        // Try to extract from error string
        const timestampMatch = rawError.toString().match(/(\d{2}:\d{2}:\d{2})/);
        return timestampMatch ? timestampMatch[1] : new Date().toISOString();
    }

    /**
     * Extract error message
     */
    extractMessage(rawError) {
        if (typeof rawError === 'string') {
            return rawError.split('\n')[0].trim();
        }
        
        if (typeof rawError === 'object') {
            return rawError.message || rawError.error || rawError.toString();
        }
        
        return rawError.toString();
    }

    /**
     * Extract stack trace
     */
    extractStackTrace(rawError) {
        if (typeof rawError === 'object' && rawError.stack) {
            return rawError.stack.split('\n').slice(1); // Remove first line (message)
        }
        
        if (typeof rawError === 'string') {
            const lines = rawError.split('\n');
            return lines.slice(1).filter(line => line.trim().startsWith('at '));
        }
        
        return [];
    }

    /**
     * Extract file name from error
     */
    extractFile(rawError) {
        const stack = this.extractStackTrace(rawError);
        if (stack.length > 0) {
            const match = stack[0].match(/\(([^:]+):/);
            return match ? match[1] : 'unknown';
        }
        
        const message = this.extractMessage(rawError);
        const fileMatch = message.match(/at ([^:]+):/);
        return fileMatch ? fileMatch[1] : 'unknown';
    }

    /**
     * Extract line number from error
     */
    extractLine(rawError) {
        const stack = this.extractStackTrace(rawError);
        if (stack.length > 0) {
            const match = stack[0].match(/:(\d+):/);
            return match ? parseInt(match[1]) : null;
        }
        
        const message = this.extractMessage(rawError);
        const lineMatch = message.match(/:(\d+):/);
        return lineMatch ? parseInt(lineMatch[1]) : null;
    }

    /**
     * Extract column number from error
     */
    extractColumn(rawError) {
        const stack = this.extractStackTrace(rawError);
        if (stack.length > 0) {
            const match = stack[0].match(/:(\d+):(\d+)/);
            return match ? parseInt(match[2]) : null;
        }
        
        return null;
    }

    /**
     * Classify error type and category
     */
    classifyError(error) {
        const message = error.message.toLowerCase();
        
        for (const [type, config] of this.errorPatterns) {
            for (const pattern of config.patterns) {
                if (pattern.test(error.message)) {
                    error.type = type;
                    error.category = config.category;
                    error.severity = config.severity;
                    error.pattern = type;
                    return;
                }
            }
        }

        // Fallback classification
        if (message.includes('error')) {
            error.type = 'runtime';
            error.category = 'runtime';
            error.severity = 'medium';
        }
    }

    /**
     * Find root cause of error
     */
    async findRootCause(error) {
        try {
            const prompt = this.buildRootCausePrompt(error);
            const response = await this.multiProviderAI.generateResponse(prompt, {
                maxTokens: 300,
                temperature: 0.1
            });

            return this.parseRootCause(response);
        } catch (aiError) {
            console.error('Failed to generate AI root cause analysis:', aiError.message);
            return this.generateBasicRootCause(error);
        }
    }

    /**
     * Build prompt for root cause analysis
     */
    buildRootCausePrompt(error) {
        let prompt = `Analyze this JavaScript error and identify the root cause:\n\n`;
        prompt += `Error: ${error.message}\n`;
        prompt += `Type: ${error.type}\n`;
        prompt += `File: ${error.file}:${error.line}\n`;
        
        if (error.stack.length > 0) {
            prompt += `Stack trace:\n${error.stack.slice(0, 3).join('\n')}\n`;
        }
        
        prompt += `\nProvide a concise root cause analysis focusing on:\n`;
        prompt += `1. What specifically caused this error\n`;
        prompt += `2. Why it occurred (timing, logic, data issues)\n`;
        prompt += `3. The most likely fix approach\n\n`;
        prompt += `Keep response under 100 words.`;

        return prompt;
    }

    /**
     * Parse root cause from AI response
     */
    parseRootCause(response) {
        return response.trim().split('\n')[0]; // Take first line as primary cause
    }

    /**
     * Generate basic root cause without AI
     */
    generateBasicRootCause(error) {
        const knownCauses = {
            'syntax': 'Invalid JavaScript syntax in the code',
            'reference': 'Variable or function not properly declared or imported',
            'type': 'Incorrect data type or null/undefined value access',
            'network': 'Network connectivity or API endpoint issue',
            'react': 'React component or prop configuration issue',
            'vue': 'Vue component or directive configuration issue',
            'angular': 'Angular dependency injection or component issue'
        };

        return knownCauses[error.type] || 'Unknown error cause - requires manual investigation';
    }

    /**
     * Generate fix suggestions
     */
    generateSuggestions(error) {
        const suggestions = [];

        // Check known solutions
        for (const [pattern, solution] of this.knownSolutions) {
            if (error.message.toLowerCase().includes(pattern.toLowerCase())) {
                suggestions.push(...solution.fixes);
                break;
            }
        }

        // Add category-specific suggestions
        const categorySuggestions = this.getCategorySuggestions(error.category);
        suggestions.push(...categorySuggestions);

        // Remove duplicates and limit to 5
        return [...new Set(suggestions)].slice(0, 5);
    }

    /**
     * Get category-specific suggestions
     */
    getCategorySuggestions(category) {
        const suggestions = {
            'syntax': ['Check for missing brackets, semicolons, or quotes', 'Validate JavaScript syntax'],
            'reference': ['Check variable declarations and imports', 'Verify function and variable names'],
            'type': ['Add null/undefined checks', 'Validate data types before operations'],
            'network': ['Check API endpoints and CORS settings', 'Add network error handling'],
            'react': ['Check component props and state', 'Verify React hooks usage'],
            'vue': ['Check Vue component configuration', 'Verify directive usage'],
            'angular': ['Check dependency injection', 'Verify component lifecycle']
        };

        return suggestions[category] || ['Review error details and check documentation'];
    }

    /**
     * Analyze relationships between errors
     */
    analyzeErrorRelationships(errors) {
        const relationships = [];

        // Group by file
        const fileGroups = new Map();
        errors.forEach(error => {
            const file = error.file;
            if (!fileGroups.has(file)) {
                fileGroups.set(file, []);
            }
            fileGroups.get(file).push(error);
        });

        // Find cascading errors
        for (const [file, fileErrors] of fileGroups) {
            if (fileErrors.length > 1) {
                relationships.push({
                    type: 'cascading',
                    file,
                    errors: fileErrors.map(e => e.id),
                    description: `Multiple errors in ${file} may be related`
                });
            }
        }

        // Find timing-related errors
        const timeGroups = this.groupErrorsByTime(errors);
        for (const group of timeGroups) {
            if (group.length > 1) {
                relationships.push({
                    type: 'timing',
                    errors: group.map(e => e.id),
                    description: 'Errors occurred within short time window'
                });
            }
        }

        return relationships;
    }

    /**
     * Group errors by time proximity
     */
    groupErrorsByTime(errors) {
        const groups = [];
        const timeWindow = 1000; // 1 second

        for (const error of errors) {
            const errorTime = new Date(error.timestamp).getTime();
            let addedToGroup = false;

            for (const group of groups) {
                const groupTime = new Date(group[0].timestamp).getTime();
                if (Math.abs(errorTime - groupTime) <= timeWindow) {
                    group.push(error);
                    addedToGroup = true;
                    break;
                }
            }

            if (!addedToGroup) {
                groups.push([error]);
            }
        }

        return groups.filter(group => group.length > 1);
    }

    /**
     * Generate error summary
     */
    generateErrorSummary(errors, patterns, relationships) {
        const totalErrors = errors.length;
        const criticalErrors = errors.filter(e => e.severity === 'critical').length;
        const highErrors = errors.filter(e => e.severity === 'high').length;
        
        const topPatterns = Array.from(patterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return {
            total: totalErrors,
            critical: criticalErrors,
            high: highErrors,
            medium: errors.filter(e => e.severity === 'medium').length,
            low: errors.filter(e => e.severity === 'low').length,
            topPatterns: topPatterns.map(([pattern, count]) => ({ pattern, count })),
            relationships: relationships.length,
            recommendation: this.generateOverallRecommendation(errors, patterns)
        };
    }

    /**
     * Generate overall recommendation
     */
    generateOverallRecommendation(errors, patterns) {
        const criticalCount = errors.filter(e => e.severity === 'critical').length;
        const highCount = errors.filter(e => e.severity === 'high').length;

        if (criticalCount > 0) {
            return 'Fix critical syntax and reference errors immediately';
        }
        
        if (highCount > 3) {
            return 'Address high-priority type and reference errors first';
        }
        
        const topPattern = Array.from(patterns.entries()).sort((a, b) => b[1] - a[1])[0];
        if (topPattern && topPattern[1] > 2) {
            return `Focus on resolving ${topPattern[0]} errors (${topPattern[1]} occurrences)`;
        }
        
        return 'Review and fix errors in order of severity';
    }

    /**
     * Convert error to issue format
     */
    errorToIssue(error) {
        return {
            id: error.id,
            type: `console_error_${error.type}`,
            category: 'javascript',
            severity: error.severity,
            title: `${error.type.charAt(0).toUpperCase() + error.type.slice(1)} Error`,
            description: error.message,
            location: {
                file: error.file,
                line: error.line,
                column: error.column
            },
            rootCause: error.rootCause,
            suggestions: error.suggestions,
            metadata: {
                pattern: error.pattern,
                stack: error.stack,
                timestamp: error.timestamp
            }
        };
    }
}
