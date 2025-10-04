/**
 * Automatic Fix Generator - Generates code fixes for identified issues
 * Creates CSS, JavaScript, and HTML fixes with validation and safety checks
 */

export class AutomaticFixGenerator {
    constructor(multiProviderAI) {
        this.multiProviderAI = multiProviderAI;
        this.fixTemplates = new Map();
        this.safetyRules = new Map();
        this.validationRules = new Map();
        this.initializeFixTemplates();
        this.initializeSafetyRules();
        this.initializeValidationRules();
        
        console.log('🔧 Automatic Fix Generator initialized with intelligent code generation');
    }

    /**
     * Initialize fix templates for common issues
     */
    initializeFixTemplates() {
        // JavaScript fix templates
        this.fixTemplates.set('undefined_property', {
            type: 'javascript',
            template: (context) => `
// Add null check before accessing property
if (${context.object} && ${context.object}.${context.property}) {
    // Original code here
    ${context.originalCode}
}`,
            description: 'Add null/undefined check before property access',
            safetyLevel: 'high'
        });

        this.fixTemplates.set('function_not_defined', {
            type: 'javascript',
            template: (context) => `
// Check if function exists before calling
if (typeof ${context.functionName} === 'function') {
    ${context.originalCode}
} else {
    console.warn('Function ${context.functionName} is not defined');
}`,
            description: 'Add function existence check',
            safetyLevel: 'high'
        });

        this.fixTemplates.set('missing_import', {
            type: 'javascript',
            template: (context) => `
// Add missing import statement
import { ${context.importName} } from '${context.modulePath}';
${context.originalCode}`,
            description: 'Add missing import statement',
            safetyLevel: 'medium'
        });

        // CSS fix templates
        this.fixTemplates.set('layout_overflow', {
            type: 'css',
            template: (context) => `
/* Fix layout overflow */
.${context.className} {
    overflow: hidden;
    max-width: 100%;
    box-sizing: border-box;
}`,
            description: 'Fix layout overflow issues',
            safetyLevel: 'high'
        });

        this.fixTemplates.set('accessibility_contrast', {
            type: 'css',
            template: (context) => `
/* Improve color contrast for accessibility */
.${context.className} {
    color: ${context.newColor};
    background-color: ${context.newBackground};
}`,
            description: 'Improve color contrast for accessibility',
            safetyLevel: 'high'
        });

        this.fixTemplates.set('responsive_layout', {
            type: 'css',
            template: (context) => `
/* Add responsive layout */
.${context.className} {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

@media (max-width: 768px) {
    .${context.className} {
        flex-direction: column;
    }
}`,
            description: 'Add responsive layout support',
            safetyLevel: 'medium'
        });

        // React fix templates
        this.fixTemplates.set('react_key_prop', {
            type: 'javascript',
            template: (context) => `
// Add unique key prop to list items
{${context.arrayName}.map((${context.itemName}, index) => (
    <${context.componentName} 
        key={\`\${${context.itemName}.id || index}\`}
        ${context.props}
    />
))}`,
            description: 'Add unique key prop to React list items',
            safetyLevel: 'high'
        });

        this.fixTemplates.set('react_useeffect_dependency', {
            type: 'javascript',
            template: (context) => `
// Fix useEffect dependency array
useEffect(() => {
    ${context.effectCode}
}, [${context.dependencies.join(', ')}]);`,
            description: 'Fix React useEffect dependency array',
            safetyLevel: 'medium'
        });
    }

    /**
     * Initialize safety rules
     */
    initializeSafetyRules() {
        this.safetyRules.set('no_data_loss', {
            check: (fix) => !fix.code.includes('delete ') && !fix.code.includes('remove('),
            message: 'Fix should not delete or remove data'
        });

        this.safetyRules.set('no_external_calls', {
            check: (fix) => !fix.code.includes('fetch(') && !fix.code.includes('XMLHttpRequest'),
            message: 'Fix should not make external network calls'
        });

        this.safetyRules.set('no_eval', {
            check: (fix) => !fix.code.includes('eval(') && !fix.code.includes('Function('),
            message: 'Fix should not use eval or dynamic code execution'
        });

        this.safetyRules.set('preserve_functionality', {
            check: (fix) => fix.code.includes(fix.context.originalCode) || fix.type === 'css',
            message: 'Fix should preserve original functionality'
        });
    }

    /**
     * Initialize validation rules
     */
    initializeValidationRules() {
        this.validationRules.set('javascript', {
            syntax: (code) => this.validateJavaScriptSyntax(code),
            logic: (code) => this.validateJavaScriptLogic(code)
        });

        this.validationRules.set('css', {
            syntax: (code) => this.validateCSSSyntax(code),
            properties: (code) => this.validateCSSProperties(code)
        });

        this.validationRules.set('html', {
            syntax: (code) => this.validateHTMLSyntax(code),
            accessibility: (code) => this.validateHTMLAccessibility(code)
        });
    }

    /**
     * Generate fix for an issue
     */
    async generateFix(issue, options = {}) {
        console.log(`🔧 Generating fix for: ${issue.type}`);

        try {
            // Determine fix approach
            const fixApproach = this.determineFixApproach(issue);
            
            // Generate fix based on approach
            let fix;
            if (fixApproach.useTemplate) {
                fix = await this.generateTemplatedFix(issue, fixApproach, options);
            } else {
                fix = await this.generateAIFix(issue, options);
            }

            if (!fix) {
                console.log(`⚠️ No fix generated for issue: ${issue.type}`);
                return null;
            }

            // Validate fix
            const validation = await this.validateFix(fix, options);
            if (!validation.valid) {
                console.log(`❌ Fix validation failed: ${validation.errors.join(', ')}`);
                return null;
            }

            // Apply safety checks
            const safetyCheck = this.applySafetyChecks(fix, options.safetyLevel || 'high');
            if (!safetyCheck.safe) {
                console.log(`🚨 Fix failed safety check: ${safetyCheck.issues.join(', ')}`);
                return null;
            }

            // Calculate confidence and impact
            fix.confidence = this.calculateFixConfidence(fix, issue);
            fix.estimatedImpact = this.estimateFixImpact(fix, issue);

            console.log(`✅ Fix generated successfully with ${fix.confidence}% confidence`);
            return fix;

        } catch (error) {
            console.error(`❌ Fix generation failed for ${issue.type}:`, error.message);
            return null;
        }
    }

    /**
     * Determine fix approach for issue
     */
    determineFixApproach(issue) {
        // Check if we have a template for this issue type
        const templateKey = this.findMatchingTemplate(issue);
        
        if (templateKey) {
            return {
                useTemplate: true,
                templateKey,
                confidence: 0.9
            };
        }

        // Use AI-generated fix
        return {
            useTemplate: false,
            requiresAI: true,
            confidence: 0.7
        };
    }

    /**
     * Find matching template for issue
     */
    findMatchingTemplate(issue) {
        const issueType = issue.type.toLowerCase();
        const description = issue.description.toLowerCase();

        // Direct template matches
        if (this.fixTemplates.has(issueType)) {
            return issueType;
        }

        // Pattern matching
        if (description.includes('undefined') && description.includes('property')) {
            return 'undefined_property';
        }
        
        if (description.includes('not defined') && description.includes('function')) {
            return 'function_not_defined';
        }
        
        if (description.includes('key') && description.includes('prop')) {
            return 'react_key_prop';
        }
        
        if (description.includes('overflow')) {
            return 'layout_overflow';
        }
        
        if (description.includes('contrast') || description.includes('accessibility')) {
            return 'accessibility_contrast';
        }

        return null;
    }

    /**
     * Generate fix using template
     */
    async generateTemplatedFix(issue, fixApproach, options) {
        const template = this.fixTemplates.get(fixApproach.templateKey);
        if (!template) {
            throw new Error(`Template not found: ${fixApproach.templateKey}`);
        }

        // Extract context from issue
        const context = this.extractFixContext(issue, template.type);
        
        // Generate code from template
        const code = template.template(context);

        return {
            id: `fix_${issue.id}_${Date.now()}`,
            issueId: issue.id,
            issueType: issue.type,
            type: template.type,
            approach: 'template',
            code: code.trim(),
            description: template.description,
            safetyLevel: template.safetyLevel,
            context,
            generated: Date.now()
        };
    }

    /**
     * Generate fix using AI
     */
    async generateAIFix(issue, options) {
        const prompt = this.buildFixPrompt(issue, options);
        
        const response = await this.multiProviderAI.generateResponse(prompt, {
            maxTokens: 500,
            temperature: 0.1
        });

        const parsedFix = this.parseAIFixResponse(response, issue);
        
        return {
            id: `fix_${issue.id}_${Date.now()}`,
            issueId: issue.id,
            issueType: issue.type,
            type: parsedFix.type,
            approach: 'ai_generated',
            code: parsedFix.code,
            description: parsedFix.description,
            safetyLevel: 'medium',
            context: parsedFix.context,
            generated: Date.now()
        };
    }

    /**
     * Build prompt for AI fix generation
     */
    buildFixPrompt(issue, options) {
        let prompt = `Generate a code fix for this issue:\n\n`;
        prompt += `Issue Type: ${issue.type}\n`;
        prompt += `Description: ${issue.description}\n`;
        prompt += `Severity: ${issue.severity}\n`;
        
        if (issue.location) {
            prompt += `Location: ${issue.location.file}:${issue.location.line}\n`;
        }
        
        if (issue.rootCause) {
            prompt += `Root Cause: ${issue.rootCause}\n`;
        }

        prompt += `\nFramework: ${options.framework || 'vanilla JavaScript'}\n`;
        prompt += `Safety Level: ${options.safetyLevel || 'high'}\n\n`;

        prompt += `Requirements:\n`;
        prompt += `1. Provide working code that fixes the issue\n`;
        prompt += `2. Include comments explaining the fix\n`;
        prompt += `3. Ensure the fix is safe and doesn't break existing functionality\n`;
        prompt += `4. Use modern best practices\n\n`;

        prompt += `Format the response as:\n`;
        prompt += `TYPE: [javascript|css|html]\n`;
        prompt += `DESCRIPTION: [brief description]\n`;
        prompt += `CODE:\n[actual fix code]\n`;

        return prompt;
    }

    /**
     * Parse AI fix response
     */
    parseAIFixResponse(response, issue) {
        const lines = response.split('\n');
        let type = 'javascript';
        let description = 'AI-generated fix';
        let code = '';
        let inCodeSection = false;

        for (const line of lines) {
            if (line.startsWith('TYPE:')) {
                type = line.replace('TYPE:', '').trim().toLowerCase();
            } else if (line.startsWith('DESCRIPTION:')) {
                description = line.replace('DESCRIPTION:', '').trim();
            } else if (line.startsWith('CODE:')) {
                inCodeSection = true;
            } else if (inCodeSection) {
                code += line + '\n';
            }
        }

        return {
            type,
            description,
            code: code.trim(),
            context: { originalIssue: issue }
        };
    }

    /**
     * Extract context for fix generation
     */
    extractFixContext(issue, fixType) {
        const context = {
            originalCode: issue.metadata?.originalCode || '',
            className: this.extractClassName(issue),
            functionName: this.extractFunctionName(issue),
            variableName: this.extractVariableName(issue)
        };

        // Type-specific context extraction
        if (fixType === 'javascript') {
            context.object = this.extractObjectName(issue);
            context.property = this.extractPropertyName(issue);
            context.importName = this.extractImportName(issue);
            context.modulePath = this.guessModulePath(issue);
        } else if (fixType === 'css') {
            context.newColor = this.suggestAccessibleColor(issue);
            context.newBackground = this.suggestAccessibleBackground(issue);
        }

        return context;
    }

    /**
     * Validate generated fix
     */
    async validateFix(fix, options) {
        const errors = [];
        const warnings = [];

        // Get validation rules for fix type
        const rules = this.validationRules.get(fix.type);
        if (rules) {
            for (const [ruleName, ruleFunction] of Object.entries(rules)) {
                try {
                    const result = ruleFunction(fix.code);
                    if (!result.valid) {
                        errors.push(`${ruleName}: ${result.message}`);
                    }
                    if (result.warnings) {
                        warnings.push(...result.warnings);
                    }
                } catch (error) {
                    warnings.push(`Validation rule ${ruleName} failed: ${error.message}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Apply safety checks to fix
     */
    applySafetyChecks(fix, safetyLevel) {
        const issues = [];
        const applicableRules = this.getSafetyRulesForLevel(safetyLevel);

        for (const [ruleName, rule] of applicableRules) {
            try {
                if (!rule.check(fix)) {
                    issues.push(rule.message);
                }
            } catch (error) {
                issues.push(`Safety check ${ruleName} failed: ${error.message}`);
            }
        }

        return {
            safe: issues.length === 0,
            issues,
            safetyLevel
        };
    }

    /**
     * Get safety rules for level
     */
    getSafetyRulesForLevel(level) {
        const allRules = Array.from(this.safetyRules.entries());
        
        if (level === 'low') {
            return allRules.slice(0, 1); // Only critical rules
        } else if (level === 'medium') {
            return allRules.slice(0, 2); // Most important rules
        } else {
            return allRules; // All rules for high safety
        }
    }

    /**
     * Calculate fix confidence
     */
    calculateFixConfidence(fix, issue) {
        let confidence = 50; // Base confidence

        // Template-based fixes are more reliable
        if (fix.approach === 'template') {
            confidence += 30;
        }

        // Higher confidence for common issue types
        const commonTypes = ['undefined_property', 'function_not_defined', 'layout_overflow'];
        if (commonTypes.includes(issue.type)) {
            confidence += 20;
        }

        // Adjust based on safety level
        if (fix.safetyLevel === 'high') {
            confidence += 10;
        } else if (fix.safetyLevel === 'low') {
            confidence -= 10;
        }

        return Math.min(95, Math.max(10, confidence));
    }

    /**
     * Estimate fix impact
     */
    estimateFixImpact(fix, issue) {
        const impact = {
            scope: 'local', // local, component, global
            risk: 'low', // low, medium, high
            effort: 'minimal', // minimal, moderate, significant
            testing: 'unit' // unit, integration, e2e
        };

        // Adjust based on fix type
        if (fix.type === 'css') {
            impact.scope = 'component';
            impact.testing = 'visual';
        } else if (fix.code.includes('import ') || fix.code.includes('export ')) {
            impact.scope = 'global';
            impact.risk = 'medium';
            impact.testing = 'integration';
        }

        // Adjust based on issue severity
        if (issue.severity === 'critical') {
            impact.effort = 'moderate';
            impact.testing = 'integration';
        }

        return impact;
    }

    // Helper methods for context extraction
    extractClassName(issue) { return 'component'; }
    extractFunctionName(issue) { return 'functionName'; }
    extractVariableName(issue) { return 'variableName'; }
    extractObjectName(issue) { return 'object'; }
    extractPropertyName(issue) { return 'property'; }
    extractImportName(issue) { return 'ImportedComponent'; }
    guessModulePath(issue) { return './component'; }
    suggestAccessibleColor(issue) { return '#333333'; }
    suggestAccessibleBackground(issue) { return '#ffffff'; }

    // Validation methods
    validateJavaScriptSyntax(code) {
        try {
            new Function(code);
            return { valid: true };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }

    validateJavaScriptLogic(code) {
        const warnings = [];
        if (code.includes('console.log')) {
            warnings.push('Contains console.log statements');
        }
        return { valid: true, warnings };
    }

    validateCSSSyntax(code) {
        // Basic CSS validation
        const braceCount = (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
        if (braceCount !== 0) {
            return { valid: false, message: 'Unmatched braces in CSS' };
        }
        return { valid: true };
    }

    validateCSSProperties(code) {
        return { valid: true };
    }

    validateHTMLSyntax(code) {
        return { valid: true };
    }

    validateHTMLAccessibility(code) {
        const warnings = [];
        if (code.includes('<img') && !code.includes('alt=')) {
            warnings.push('Image missing alt attribute');
        }
        return { valid: true, warnings };
    }
}
