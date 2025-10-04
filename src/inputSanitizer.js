/**
 * Input Sanitizer
 * Sanitizes and validates user inputs to prevent security vulnerabilities
 */

export class InputSanitizer {
    constructor() {
        // Patterns for detecting malicious input
        this.maliciousPatterns = [
            // SQL Injection patterns
            /('|;|--|\/\*)/i,
            /\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|MERGE|SELECT|UNION|UPDATE)\b/i,

            // XSS patterns
            /<script[^>]*>/gi,
            /<\/script>/gi,
            /<iframe[^>]*>/gi,
            /<object[^>]*>/gi,
            /<embed[^>]*>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,

            // Path traversal patterns
            /\.\.\//g,
            /\.\.\\/g,
            /\/etc\//gi,
            /\\etc\\/gi,
            /\/proc\//gi,
            /\/sys\//gi,

            // Template injection patterns
            /\{\{.*?\}\}/g,
            /\$\{.*?\}/g,
            /%\{.*?\}/g,

            // LDAP injection patterns
            /\$\{jndi:/gi,

            // Command injection patterns
            /[;&|`$()]/g,

            // Null bytes and control characters
            /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
        ];
        
        // Maximum lengths for different input types
        this.maxLengths = {
            title: 200,
            content: 50000, // 50KB
            description: 1000,
            userId: 100,
            category: 50,
            domain: 50,
            tag: 30,
            feedback: 2000
        };
    }

    /**
     * Sanitize a string input
     * @param {string} input - The input to sanitize
     * @param {string} type - The type of input (title, content, etc.)
     * @returns {string} - Sanitized input
     */
    sanitizeString(input, type = 'general') {
        if (typeof input !== 'string') {
            return '';
        }

        // Check length limits
        const maxLength = this.maxLengths[type] || 1000;
        if (input.length > maxLength) {
            throw new Error(`Input too long. Maximum ${maxLength} characters allowed for ${type}.`);
        }

        // Remove malicious patterns
        let sanitized = input;
        
        for (const pattern of this.maliciousPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }

        // Additional sanitization
        sanitized = sanitized
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters

        // If sanitization removed everything, throw error
        if (sanitized.length === 0 && input.length > 0) {
            throw new Error(`Input contains only malicious content and cannot be sanitized`);
        }

        return sanitized;
    }

    /**
     * Validate and sanitize user ID
     * @param {string} userId - User ID to validate
     * @returns {string} - Sanitized user ID
     */
    sanitizeUserId(userId) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('User ID is required and must be a string');
        }

        const sanitized = this.sanitizeString(userId, 'userId');
        
        if (sanitized.length === 0) {
            throw new Error('User ID cannot be empty after sanitization');
        }

        // Only allow alphanumeric, hyphens, and underscores
        if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
            throw new Error('User ID contains invalid characters');
        }

        return sanitized;
    }

    /**
     * Validate and sanitize prompt title
     * @param {string} title - Title to validate
     * @returns {string} - Sanitized title
     */
    sanitizeTitle(title) {
        if (!title || typeof title !== 'string') {
            throw new Error('Title is required and must be a string');
        }

        const sanitized = this.sanitizeString(title, 'title');
        
        if (sanitized.length === 0) {
            throw new Error('Title cannot be empty after sanitization');
        }

        return sanitized;
    }

    /**
     * Validate and sanitize prompt content
     * @param {string} content - Content to validate
     * @returns {string} - Sanitized content
     */
    sanitizeContent(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Content is required and must be a string');
        }

        const sanitized = this.sanitizeString(content, 'content');
        
        if (sanitized.length === 0) {
            throw new Error('Content cannot be empty after sanitization');
        }

        return sanitized;
    }

    /**
     * Validate rating value
     * @param {number} rating - Rating to validate
     * @returns {number} - Validated rating
     */
    validateRating(rating) {
        if (typeof rating !== 'number' || isNaN(rating)) {
            throw new Error('Rating must be a number');
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        return Math.round(rating);
    }

    /**
     * Validate and sanitize domain
     * @param {string} domain - Domain to validate
     * @returns {string} - Sanitized domain
     */
    sanitizeDomain(domain) {
        if (!domain || typeof domain !== 'string') {
            return 'general';
        }

        const sanitized = this.sanitizeString(domain, 'domain');
        
        // Only allow alphanumeric and underscores
        const cleanDomain = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
        
        return cleanDomain || 'general';
    }

    /**
     * Validate and sanitize tags array
     * @param {Array} tags - Tags to validate
     * @returns {Array} - Sanitized tags
     */
    sanitizeTags(tags) {
        if (!Array.isArray(tags)) {
            return [];
        }

        return tags
            .filter(tag => typeof tag === 'string')
            .map(tag => this.sanitizeString(tag, 'tag'))
            .filter(tag => tag.length > 0)
            .slice(0, 10); // Limit to 10 tags
    }

    /**
     * Validate and sanitize feedback content
     * @param {string} feedback - Feedback to validate
     * @returns {string} - Sanitized feedback
     */
    sanitizeFeedback(feedback) {
        if (!feedback || typeof feedback !== 'string') {
            return '';
        }

        return this.sanitizeString(feedback, 'feedback');
    }

    /**
     * Validate numeric input with bounds
     * @param {number} value - Value to validate
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {string} name - Name of the field for error messages
     * @returns {number} - Validated value
     */
    validateNumeric(value, min, max, name = 'value') {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`${name} must be a number`);
        }

        if (value < min || value > max) {
            throw new Error(`${name} must be between ${min} and ${max}`);
        }

        return value;
    }

    /**
     * Validate limit parameter for search/pagination
     * @param {number} limit - Limit to validate
     * @returns {number} - Validated limit
     */
    validateLimit(limit) {
        if (limit === undefined || limit === null) {
            return 10; // Default limit
        }

        if (typeof limit !== 'number' || isNaN(limit)) {
            return 10;
        }

        // Ensure positive number with reasonable maximum
        return Math.max(1, Math.min(100, Math.round(limit)));
    }

    /**
     * Comprehensive input validation for prompt creation
     * @param {Object} promptData - Prompt data to validate
     * @returns {Object} - Sanitized prompt data
     */
    validatePromptData(promptData) {
        if (!promptData || typeof promptData !== 'object') {
            throw new Error('Prompt data is required and must be an object');
        }

        return {
            title: this.sanitizeTitle(promptData.title),
            content: this.sanitizeContent(promptData.content),
            description: this.sanitizeString(promptData.description || '', 'description'),
            domain: this.sanitizeDomain(promptData.domain),
            tags: this.sanitizeTags(promptData.tags),
            isPublic: Boolean(promptData.isPublic !== false) // Default to true
        };
    }

    /**
     * Comprehensive input validation for user feedback
     * @param {Object} feedbackData - Feedback data to validate
     * @returns {Object} - Sanitized feedback data
     */
    validateFeedbackData(feedbackData) {
        if (!feedbackData || typeof feedbackData !== 'object') {
            throw new Error('Feedback data is required and must be an object');
        }

        const validTypes = ['positive', 'negative', 'neutral'];
        const type = feedbackData.type;
        
        if (!validTypes.includes(type)) {
            throw new Error('Feedback type must be one of: positive, negative, neutral');
        }

        return {
            type: type,
            category: this.sanitizeString(feedbackData.category || 'general', 'category'),
            content: this.sanitizeContent(feedbackData.content),
            rating: this.validateRating(feedbackData.rating),
            context: this.sanitizeContext(feedbackData.context)
        };
    }

    /**
     * Sanitize context object
     * @param {Object} context - Context to sanitize
     * @returns {Object} - Sanitized context
     */
    sanitizeContext(context) {
        if (!context || typeof context !== 'object') {
            return {};
        }

        const sanitized = {};
        
        // Only allow specific context fields with sanitization
        const allowedFields = ['language', 'taskType', 'complexity', 'framework', 'approach'];
        
        for (const field of allowedFields) {
            if (context[field] && typeof context[field] === 'string') {
                sanitized[field] = this.sanitizeString(context[field], 'category');
            }
        }

        return sanitized;
    }

    /**
     * Check if input contains potentially malicious content
     * @param {string} input - Input to check
     * @returns {boolean} - True if malicious content detected
     */
    containsMaliciousContent(input) {
        if (typeof input !== 'string') {
            return false;
        }

        return this.maliciousPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Get sanitization report for debugging
     * @param {string} original - Original input
     * @param {string} sanitized - Sanitized input
     * @returns {Object} - Sanitization report
     */
    getSanitizationReport(original, sanitized) {
        return {
            original: original,
            sanitized: sanitized,
            changed: original !== sanitized,
            lengthReduction: original.length - sanitized.length,
            maliciousContentDetected: this.containsMaliciousContent(original)
        };
    }
}
