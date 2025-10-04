/**
 * Android Fix Generator - Generates Android-specific code fixes
 * Creates XML layout fixes, Kotlin/Java code fixes, and Material Design improvements
 */

export class AndroidFixGenerator {
    constructor(multiProviderAI) {
        this.multiProviderAI = multiProviderAI;
        this.androidFixTemplates = new Map();
        this.materialDesignTemplates = new Map();
        this.accessibilityTemplates = new Map();
        this.initializeAndroidFixTemplates();
        
        console.log('🔧 Android Fix Generator initialized with mobile-specific templates');
    }

    /**
     * Initialize Android-specific fix templates
     */
    initializeAndroidFixTemplates() {
        // Layout fix templates
        this.androidFixTemplates.set('touch_target_small', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Increase touch target size to meet accessibility guidelines -->
<${context.viewType}
    android:layout_width="${Math.max(context.currentWidth, 48)}dp"
    android:layout_height="${Math.max(context.currentHeight, 48)}dp"
    android:minWidth="48dp"
    android:minHeight="48dp"
    ${context.existingAttributes} />`,
            description: 'Increase touch target size to minimum 48dp',
            confidence: 95
        });

        this.androidFixTemplates.set('missing_content_description', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Add content description for accessibility -->
<${context.viewType}
    android:contentDescription="${context.suggestedDescription}"
    ${context.existingAttributes} />`,
            description: 'Add content description for screen reader accessibility',
            confidence: 90
        });

        this.androidFixTemplates.set('color_contrast_low', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Improve color contrast for accessibility -->
<${context.viewType}
    android:textColor="${context.improvedTextColor}"
    android:background="${context.improvedBackgroundColor}"
    ${context.existingAttributes} />`,
            description: 'Improve color contrast to meet WCAG guidelines',
            confidence: 85
        });

        this.androidFixTemplates.set('spacing_inconsistent', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Apply consistent 8dp baseline grid spacing -->
<${context.viewType}
    android:layout_margin="${context.baselineSpacing}dp"
    android:padding="${context.baselinePadding}dp"
    ${context.existingAttributes} />`,
            description: 'Apply Material Design 8dp baseline grid',
            confidence: 88
        });

        this.androidFixTemplates.set('layout_complex', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Flatten layout hierarchy using ConstraintLayout -->
<androidx.constraintlayout.widget.ConstraintLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content">
    
    ${context.optimizedChildViews}
    
</androidx.constraintlayout.widget.ConstraintLayout>`,
            description: 'Optimize layout hierarchy with ConstraintLayout',
            confidence: 80
        });

        // Kotlin/Java fix templates
        this.androidFixTemplates.set('memory_leak', {
            type: 'kotlin',
            template: (context) => `
// Fix: Prevent memory leak by using WeakReference
class ${context.className} {
    private var ${context.variableName}: WeakReference<${context.type}>? = null
    
    fun set${context.capitalizedName}(${context.paramName}: ${context.type}) {
        this.${context.variableName} = WeakReference(${context.paramName})
    }
    
    fun get${context.capitalizedName}(): ${context.type}? {
        return ${context.variableName}?.get()
    }
}`,
            description: 'Fix memory leak using WeakReference',
            confidence: 85
        });

        this.androidFixTemplates.set('network_error_handling', {
            type: 'kotlin',
            template: (context) => `
// Fix: Add proper network error handling
suspend fun ${context.functionName}(): Result<${context.returnType}> {
    return try {
        val response = ${context.networkCall}
        if (response.isSuccessful) {
            Result.success(response.body()!!)
        } else {
            Result.failure(HttpException(response))
        }
    } catch (e: IOException) {
        Result.failure(NetworkException("Network connection failed", e))
    } catch (e: Exception) {
        Result.failure(UnknownException("Unexpected error", e))
    }
}`,
            description: 'Add comprehensive network error handling',
            confidence: 90
        });

        this.androidFixTemplates.set('ui_thread_violation', {
            type: 'kotlin',
            template: (context) => `
// Fix: Move network operation off UI thread
class ${context.className} {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    
    fun ${context.functionName}() {
        scope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    ${context.networkOperation}
                }
                // Update UI on main thread
                ${context.uiUpdate}
            } catch (e: Exception) {
                handleError(e)
            }
        }
    }
    
    private fun handleError(error: Exception) {
        // Show error message to user
        Log.e("${context.className}", "Operation failed", error)
    }
}`,
            description: 'Move network operations to background thread',
            confidence: 92
        });

        // Material Design fix templates
        this.materialDesignTemplates.set('elevation_excessive', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Reduce elevation to Material Design recommendations -->
<${context.viewType}
    android:elevation="${Math.min(context.currentElevation, 24)}dp"
    ${context.existingAttributes} />`,
            description: 'Reduce elevation to maximum 24dp',
            confidence: 95
        });

        this.materialDesignTemplates.set('typography_non_standard', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Use Material Design typography scale -->
<TextView
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:textAppearance="?attr/textAppearance${context.materialTextStyle}"
    android:textSize="${context.materialTextSize}sp"
    ${context.existingAttributes} />`,
            description: 'Apply Material Design typography scale',
            confidence: 88
        });

        // Accessibility fix templates
        this.accessibilityTemplates.set('focus_order_illogical', {
            type: 'xml',
            template: (context) => `
<!-- Fix: Improve focus order for accessibility -->
<${context.viewType}
    android:nextFocusDown="@id/${context.nextFocusDown}"
    android:nextFocusUp="@id/${context.nextFocusUp}"
    android:nextFocusLeft="@id/${context.nextFocusLeft}"
    android:nextFocusRight="@id/${context.nextFocusRight}"
    ${context.existingAttributes} />`,
            description: 'Define logical focus order for keyboard navigation',
            confidence: 85
        });
    }

    /**
     * Generate Android-specific fix for an issue
     */
    async generateAndroidFix(issue, deviceInfo, options = {}) {
        console.log(`🔧 Generating Android fix for: ${issue.type}`);

        try {
            // Determine fix approach
            const fixApproach = this.determineAndroidFixApproach(issue);
            
            let fix;
            if (fixApproach.useTemplate) {
                fix = await this.generateTemplatedAndroidFix(issue, fixApproach, deviceInfo, options);
            } else {
                fix = await this.generateAIAndroidFix(issue, deviceInfo, options);
            }

            if (!fix) {
                console.log(`⚠️ No Android fix generated for issue: ${issue.type}`);
                return null;
            }

            // Add Android-specific metadata
            fix.platform = 'android';
            fix.deviceInfo = deviceInfo;
            fix.materialDesignCompliant = this.checkMaterialDesignCompliance(fix);
            fix.accessibilityImproved = this.checkAccessibilityImprovement(fix, issue);

            // Validate Android fix
            const validation = this.validateAndroidFix(fix, options);
            if (!validation.valid) {
                console.log(`❌ Android fix validation failed: ${validation.errors.join(', ')}`);
                return null;
            }

            console.log(`✅ Android fix generated successfully`);
            return fix;

        } catch (error) {
            console.error(`❌ Android fix generation failed for ${issue.type}:`, error.message);
            return null;
        }
    }

    /**
     * Determine Android fix approach
     */
    determineAndroidFixApproach(issue) {
        // Check Android-specific templates first
        if (this.androidFixTemplates.has(issue.type)) {
            return {
                useTemplate: true,
                templateKey: issue.type,
                templateSource: 'android',
                confidence: 0.9
            };
        }

        // Check Material Design templates
        if (this.materialDesignTemplates.has(issue.type)) {
            return {
                useTemplate: true,
                templateKey: issue.type,
                templateSource: 'material',
                confidence: 0.85
            };
        }

        // Check accessibility templates
        if (this.accessibilityTemplates.has(issue.type)) {
            return {
                useTemplate: true,
                templateKey: issue.type,
                templateSource: 'accessibility',
                confidence: 0.88
            };
        }

        // Use AI for complex Android fixes
        return {
            useTemplate: false,
            requiresAI: true,
            confidence: 0.7
        };
    }

    /**
     * Generate fix using Android templates
     */
    async generateTemplatedAndroidFix(issue, fixApproach, deviceInfo, options) {
        let template;
        
        // Get template from appropriate source
        switch (fixApproach.templateSource) {
            case 'android':
                template = this.androidFixTemplates.get(fixApproach.templateKey);
                break;
            case 'material':
                template = this.materialDesignTemplates.get(fixApproach.templateKey);
                break;
            case 'accessibility':
                template = this.accessibilityTemplates.get(fixApproach.templateKey);
                break;
            default:
                throw new Error(`Unknown template source: ${fixApproach.templateSource}`);
        }

        if (!template) {
            throw new Error(`Template not found: ${fixApproach.templateKey}`);
        }

        // Extract Android-specific context
        const context = this.extractAndroidContext(issue, template.type, deviceInfo);
        
        // Generate code from template
        const code = template.template(context);

        return {
            id: `android_fix_${issue.id}_${Date.now()}`,
            issueId: issue.id,
            issueType: issue.type,
            type: template.type,
            approach: 'template',
            code: code.trim(),
            description: template.description,
            confidence: template.confidence,
            context,
            generated: Date.now(),
            platform: 'android'
        };
    }

    /**
     * Generate fix using AI for Android
     */
    async generateAIAndroidFix(issue, deviceInfo, options) {
        const prompt = this.buildAndroidFixPrompt(issue, deviceInfo, options);
        
        const response = await this.multiProviderAI.generateResponse(prompt, {
            maxTokens: 600,
            temperature: 0.1
        });

        const parsedFix = this.parseAndroidFixResponse(response, issue);
        
        return {
            id: `android_fix_${issue.id}_${Date.now()}`,
            issueId: issue.id,
            issueType: issue.type,
            type: parsedFix.type,
            approach: 'ai_generated',
            code: parsedFix.code,
            description: parsedFix.description,
            confidence: 75,
            context: parsedFix.context,
            generated: Date.now(),
            platform: 'android'
        };
    }

    /**
     * Build prompt for Android AI fix generation
     */
    buildAndroidFixPrompt(issue, deviceInfo, options) {
        let prompt = `Generate an Android-specific code fix for this mobile app issue:\n\n`;
        prompt += `Issue Type: ${issue.type}\n`;
        prompt += `Description: ${issue.description}\n`;
        prompt += `Severity: ${issue.severity}\n`;
        prompt += `Category: ${issue.category}\n\n`;
        
        prompt += `Device Information:\n`;
        prompt += `- Model: ${deviceInfo.model}\n`;
        prompt += `- Android Version: ${deviceInfo.version}\n`;
        prompt += `- SDK Level: ${deviceInfo.sdk}\n\n`;
        
        if (issue.location) {
            prompt += `UI Location: x=${issue.location.x}, y=${issue.location.y}, `;
            prompt += `width=${issue.location.width}, height=${issue.location.height}\n\n`;
        }

        prompt += `Requirements:\n`;
        prompt += `1. Provide Android-specific code (XML layout, Kotlin, or Java)\n`;
        prompt += `2. Follow Material Design guidelines\n`;
        prompt += `3. Ensure accessibility compliance\n`;
        prompt += `4. Include proper comments explaining the fix\n`;
        prompt += `5. Consider mobile performance implications\n\n`;

        prompt += `Format the response as:\n`;
        prompt += `TYPE: [xml|kotlin|java|gradle]\n`;
        prompt += `DESCRIPTION: [brief description]\n`;
        prompt += `CODE:\n[actual Android fix code]\n`;

        return prompt;
    }

    /**
     * Parse Android AI fix response
     */
    parseAndroidFixResponse(response, issue) {
        const lines = response.split('\n');
        let type = 'xml';
        let description = 'AI-generated Android fix';
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
     * Extract Android-specific context for fix generation
     */
    extractAndroidContext(issue, fixType, deviceInfo) {
        const context = {
            deviceInfo,
            viewType: this.extractViewType(issue),
            existingAttributes: this.extractExistingAttributes(issue),
            baselineSpacing: 8, // Material Design baseline
            baselinePadding: 16
        };

        // Type-specific context extraction
        if (fixType === 'xml') {
            context.currentWidth = issue.location?.width || 48;
            context.currentHeight = issue.location?.height || 48;
            context.suggestedDescription = this.generateContentDescription(issue);
            context.improvedTextColor = this.suggestAccessibleTextColor(issue);
            context.improvedBackgroundColor = this.suggestAccessibleBackgroundColor(issue);
        } else if (fixType === 'kotlin' || fixType === 'java') {
            context.className = this.extractClassName(issue);
            context.functionName = this.extractFunctionName(issue);
            context.variableName = this.extractVariableName(issue);
            context.networkCall = this.extractNetworkCall(issue);
            context.returnType = this.extractReturnType(issue);
        }

        return context;
    }

    /**
     * Validate Android fix
     */
    validateAndroidFix(fix, options) {
        const errors = [];
        const warnings = [];

        // Android-specific validation
        if (fix.type === 'xml') {
            const xmlValidation = this.validateAndroidXML(fix.code);
            if (!xmlValidation.valid) {
                errors.push(`XML validation: ${xmlValidation.message}`);
            }
        } else if (fix.type === 'kotlin') {
            const kotlinValidation = this.validateKotlinSyntax(fix.code);
            if (!kotlinValidation.valid) {
                errors.push(`Kotlin validation: ${kotlinValidation.message}`);
            }
        }

        // Material Design compliance check
        if (!this.checkMaterialDesignCompliance(fix)) {
            warnings.push('Fix may not fully comply with Material Design guidelines');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Helper methods for context extraction
    extractViewType(issue) {
        const typeMap = {
            'touch_target_small': 'Button',
            'missing_content_description': 'ImageView',
            'color_contrast_low': 'TextView',
            'spacing_inconsistent': 'View'
        };
        return typeMap[issue.type] || 'View';
    }

    extractExistingAttributes(issue) {
        return 'android:layout_width="wrap_content"\n    android:layout_height="wrap_content"';
    }

    generateContentDescription(issue) {
        const descriptions = {
            'missing_content_description': 'Button to perform action',
            'touch_target_small': 'Interactive element'
        };
        return descriptions[issue.type] || 'UI element';
    }

    suggestAccessibleTextColor(issue) {
        return '@color/material_on_surface_emphasis_high_type';
    }

    suggestAccessibleBackgroundColor(issue) {
        return '@color/material_surface';
    }

    extractClassName(issue) {
        return 'MainActivity';
    }

    extractFunctionName(issue) {
        return 'performNetworkOperation';
    }

    extractVariableName(issue) {
        return 'activityRef';
    }

    extractNetworkCall(issue) {
        return 'apiService.getData()';
    }

    extractReturnType(issue) {
        return 'ApiResponse';
    }

    // Validation methods
    validateAndroidXML(code) {
        // Basic XML validation
        const openTags = (code.match(/</g) || []).length;
        const closeTags = (code.match(/>/g) || []).length;
        
        if (openTags !== closeTags) {
            return { valid: false, message: 'Unmatched XML tags' };
        }
        
        return { valid: true };
    }

    validateKotlinSyntax(code) {
        // Basic Kotlin syntax validation
        const braceCount = (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
        
        if (braceCount !== 0) {
            return { valid: false, message: 'Unmatched braces in Kotlin code' };
        }
        
        return { valid: true };
    }

    checkMaterialDesignCompliance(fix) {
        // Check if fix follows Material Design principles
        const materialKeywords = ['material', 'dp', 'sp', 'elevation', 'textAppearance'];
        return materialKeywords.some(keyword => fix.code.toLowerCase().includes(keyword));
    }

    checkAccessibilityImprovement(fix, issue) {
        // Check if fix improves accessibility
        const accessibilityKeywords = ['contentDescription', 'minWidth', 'minHeight', 'nextFocus'];
        return accessibilityKeywords.some(keyword => fix.code.includes(keyword));
    }
}
