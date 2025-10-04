/**
 * Real-time Code Generation & Review System
 * Live coding assistance with real-time suggestions, bug detection, performance optimization, and security scanning
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class RealTimeCodeGeneration extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.codeGenDir = options.codeGenDir || './codegen';
        this.maxSuggestions = options.maxSuggestions || 5;
        this.analysisInterval = options.analysisInterval || 1000; // 1 second
        this.maxCodeHistory = options.maxCodeHistory || 100;
        
        this.activeSessions = new Map();
        this.codeAnalyzers = new Map();
        this.suggestionEngines = new Map();
        this.securityScanners = new Map();
        this.performanceOptimizers = new Map();
        this.codeHistory = [];
        this.patterns = new Map();
        this.bugDetectors = new Map();
        
        // Language support
        this.supportedLanguages = [
            'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
            'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css'
        ];
        
        // Analysis weights
        this.analysisWeights = {
            syntax: 0.25,
            performance: 0.20,
            security: 0.25,
            maintainability: 0.15,
            style: 0.10,
            bugs: 0.05
        };
        
        console.log('💻 Real-time Code Generation & Review System initialized');

        // Initialize patterns immediately (synchronous)
        this.initializeDefaultPatterns();

        // Initialize directories and load patterns (async)
        this.initializeCodeGenSystem();
        this.initializeAnalyzers();
    }

    async initializeCodeGenSystem() {
        try {
            await fs.mkdir(this.codeGenDir, { recursive: true });
            await this.loadCodePatterns();
            await this.loadCodeHistory();
            console.log(`📁 Code generation directory initialized: ${this.codeGenDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize code generation system:', error.message);
        }
    }

    initializeAnalyzers() {
        // Initialize syntax analyzers
        this.codeAnalyzers.set('syntax', {
            name: 'Syntax Analyzer',
            analyze: this.analyzeSyntax.bind(this),
            languages: this.supportedLanguages,
            priority: 'high'
        });

        // Initialize performance analyzers
        this.codeAnalyzers.set('performance', {
            name: 'Performance Analyzer',
            analyze: this.analyzePerformance.bind(this),
            languages: this.supportedLanguages,
            priority: 'medium'
        });

        // Initialize security scanners
        this.securityScanners.set('vulnerability', {
            name: 'Vulnerability Scanner',
            scan: this.scanVulnerabilities.bind(this),
            languages: this.supportedLanguages,
            priority: 'high'
        });

        // Initialize suggestion engines
        this.suggestionEngines.set('completion', {
            name: 'Code Completion Engine',
            suggest: this.generateCompletions.bind(this),
            languages: this.supportedLanguages,
            priority: 'high'
        });

        this.suggestionEngines.set('refactoring', {
            name: 'Refactoring Engine',
            suggest: this.generateRefactoringSuggestions.bind(this),
            languages: this.supportedLanguages,
            priority: 'medium'
        });

        // Initialize bug detectors
        this.bugDetectors.set('common', {
            name: 'Common Bug Detector',
            detect: this.detectCommonBugs.bind(this),
            languages: this.supportedLanguages,
            priority: 'high'
        });

        console.log(`🔧 Initialized ${this.codeAnalyzers.size} analyzers, ${this.suggestionEngines.size} suggestion engines`);
    }

    async loadCodePatterns() {
        try {
            const patternsFile = path.join(this.codeGenDir, 'patterns.json');
            const data = await fs.readFile(patternsFile, 'utf8');
            const patterns = JSON.parse(data);
            
            for (const [key, pattern] of Object.entries(patterns)) {
                this.patterns.set(key, pattern);
            }
            
            console.log(`📥 Loaded ${this.patterns.size} code patterns`);
        } catch (error) {
            console.log('📝 No existing patterns found, initializing default patterns');
            this.initializeDefaultPatterns();
        }
    }

    initializeDefaultPatterns() {
        // JavaScript/TypeScript patterns
        this.patterns.set('js_function', {
            language: 'javascript',
            pattern: 'function declaration',
            template: 'function ${name}(${params}) {\n  ${body}\n}',
            description: 'Standard function declaration'
        });

        this.patterns.set('js_arrow_function', {
            language: 'javascript',
            pattern: 'arrow function',
            template: 'const ${name} = (${params}) => {\n  ${body}\n};',
            description: 'Arrow function expression'
        });

        this.patterns.set('js_async_function', {
            language: 'javascript',
            pattern: 'async function',
            template: 'async function ${name}(${params}) {\n  try {\n    ${body}\n  } catch (error) {\n    console.error(error);\n  }\n}',
            description: 'Async function with error handling'
        });

        // Python patterns
        this.patterns.set('py_function', {
            language: 'python',
            pattern: 'function definition',
            template: 'def ${name}(${params}):\n    """${docstring}"""\n    ${body}',
            description: 'Python function with docstring'
        });

        this.patterns.set('py_class', {
            language: 'python',
            pattern: 'class definition',
            template: 'class ${name}:\n    """${docstring}"""\n    \n    def __init__(self, ${params}):\n        ${init_body}',
            description: 'Python class with constructor'
        });

        // Java patterns
        this.patterns.set('java_method', {
            language: 'java',
            pattern: 'method definition',
            template: 'public ${return_type} ${name}(${params}) {\n    ${body}\n}',
            description: 'Java public method'
        });

        console.log(`🔧 Initialized ${this.patterns.size} default patterns`);
    }

    async loadCodeHistory() {
        try {
            const historyFile = path.join(this.codeGenDir, 'code-history.json');
            const data = await fs.readFile(historyFile, 'utf8');
            this.codeHistory = JSON.parse(data);
            console.log(`📥 Loaded ${this.codeHistory.length} code history entries`);
        } catch (error) {
            console.log('📝 No existing code history found, starting fresh');
        }
    }

    async saveCodeHistory() {
        try {
            const historyFile = path.join(this.codeGenDir, 'code-history.json');
            await fs.writeFile(historyFile, JSON.stringify(this.codeHistory, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save code history:', error.message);
        }
    }

    async startCodeSession(sessionData) {
        const sessionId = crypto.randomBytes(8).toString('hex');
        
        const session = {
            id: sessionId,
            userId: sessionData.userId,
            projectId: sessionData.projectId,
            language: sessionData.language || 'javascript',
            fileName: sessionData.fileName,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            code: sessionData.initialCode || '',
            cursor: { line: 0, column: 0 },
            suggestions: [],
            issues: [],
            metrics: {
                linesOfCode: 0,
                complexity: 0,
                maintainabilityIndex: 0,
                securityScore: 100
            },
            history: [],
            isActive: true
        };

        this.activeSessions.set(sessionId, session);
        
        // Start real-time analysis
        this.startRealTimeAnalysis(sessionId);
        
        console.log(`💻 Started code session: ${sessionId} for ${sessionData.language}`);
        
        this.emit('session:started', {
            sessionId,
            session,
            language: session.language
        });
        
        return sessionId;
    }

    async updateCode(sessionId, codeUpdate) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Code session ${sessionId} not found`);
        }

        // Update session data
        session.code = codeUpdate.code;
        session.cursor = codeUpdate.cursor || session.cursor;
        session.lastActivity = Date.now();

        // Add to history
        session.history.push({
            timestamp: Date.now(),
            code: codeUpdate.code,
            cursor: codeUpdate.cursor,
            changeType: codeUpdate.changeType || 'edit'
        });

        // Keep only recent history
        if (session.history.length > 50) {
            session.history = session.history.slice(-50);
        }

        // Trigger real-time analysis
        await this.analyzeCodeRealTime(sessionId);

        console.log(`📝 Updated code for session ${sessionId}: ${codeUpdate.code.length} characters`);

        this.emit('code:updated', {
            sessionId,
            codeUpdate,
            suggestions: session.suggestions,
            issues: session.issues
        });

        return {
            suggestions: session.suggestions,
            issues: session.issues,
            metrics: session.metrics
        };
    }

    startRealTimeAnalysis(sessionId) {
        const analysisTimer = setInterval(async () => {
            const session = this.activeSessions.get(sessionId);
            if (!session || !session.isActive) {
                clearInterval(analysisTimer);
                return;
            }

            try {
                await this.analyzeCodeRealTime(sessionId);
            } catch (error) {
                console.error(`Analysis error for session ${sessionId}:`, error.message);
            }
        }, this.analysisInterval);

        // Store timer reference for cleanup
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.analysisTimer = analysisTimer;
        }
    }

    async analyzeCodeRealTime(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        const analysisResults = {
            suggestions: [],
            issues: [],
            metrics: {},
            timestamp: Date.now()
        };

        // Run all analyzers
        for (const [analyzerId, analyzer] of this.codeAnalyzers) {
            if (analyzer.languages.includes(session.language)) {
                try {
                    const result = await analyzer.analyze(session.code, session.language, session);
                    analysisResults[analyzerId] = result;

                    // Combine suggestions and issues from analyzers
                    if (result.suggestions) {
                        analysisResults.suggestions.push(...result.suggestions);
                    }
                    if (result.issues) {
                        analysisResults.issues.push(...result.issues);
                    }
                } catch (error) {
                    console.warn(`Analyzer ${analyzerId} failed:`, error.message);
                }
            }
        }

        // Run suggestion engines
        for (const [engineId, engine] of this.suggestionEngines) {
            if (engine.languages.includes(session.language)) {
                try {
                    const suggestions = await engine.suggest(session.code, session.cursor, session.language, session);
                    analysisResults.suggestions.push(...suggestions);
                } catch (error) {
                    console.warn(`Suggestion engine ${engineId} failed:`, error.message);
                }
            }
        }

        // Run security scanners
        for (const [scannerId, scanner] of this.securityScanners) {
            if (scanner.languages.includes(session.language)) {
                try {
                    const securityIssues = await scanner.scan(session.code, session.language, session);
                    analysisResults.issues.push(...securityIssues);
                } catch (error) {
                    console.warn(`Security scanner ${scannerId} failed:`, error.message);
                }
            }
        }

        // Run bug detectors
        for (const [detectorId, detector] of this.bugDetectors) {
            if (detector.languages.includes(session.language)) {
                try {
                    const bugs = await detector.detect(session.code, session.language, session);
                    analysisResults.issues.push(...bugs);
                } catch (error) {
                    console.warn(`Bug detector ${detectorId} failed:`, error.message);
                }
            }
        }

        // Calculate overall metrics
        analysisResults.metrics = this.calculateCodeMetrics(session.code, session.language, analysisResults);

        // Update session
        session.suggestions = analysisResults.suggestions.slice(0, this.maxSuggestions);
        session.issues = analysisResults.issues;
        session.metrics = analysisResults.metrics;

        // Emit real-time updates
        this.emit('analysis:completed', {
            sessionId,
            analysisResults,
            session
        });

        return analysisResults;
    }

    async analyzeSyntax(code, language, session) {
        const issues = [];
        const suggestions = [];

        // Basic syntax checks (simplified)
        if (language === 'javascript' || language === 'typescript') {
            // Check for missing semicolons
            const lines = code.split('\n');
            lines.forEach((line, index) => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && 
                    !trimmed.endsWith('}') && !trimmed.startsWith('//') && 
                    !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
                    suggestions.push({
                        type: 'syntax',
                        severity: 'info',
                        line: index + 1,
                        message: 'Consider adding semicolon',
                        suggestion: trimmed + ';'
                    });
                }
            });

            // Check for console.log statements
            if (code.includes('console.log')) {
                issues.push({
                    type: 'syntax',
                    severity: 'warning',
                    message: 'Remove console.log statements before production',
                    line: code.split('\n').findIndex(line => line.includes('console.log')) + 1
                });
            }
        }

        if (language === 'python') {
            // Check for missing docstrings
            if (code.includes('def ') && !code.includes('"""')) {
                suggestions.push({
                    type: 'syntax',
                    severity: 'info',
                    message: 'Consider adding docstrings to functions',
                    suggestion: 'Add """Function description""" after function definition'
                });
            }
        }

        return { issues, suggestions };
    }

    async analyzePerformance(code, language, session) {
        const issues = [];
        const suggestions = [];

        if (language === 'javascript' || language === 'typescript') {
            // Check for inefficient loops
            if (code.includes('for (') && code.includes('.length')) {
                const forLoopRegex = /for\s*\([^)]*\.length[^)]*\)/g;
                if (forLoopRegex.test(code)) {
                    suggestions.push({
                        type: 'performance',
                        severity: 'info',
                        message: 'Cache array length in loop for better performance',
                        suggestion: 'const len = array.length; for (let i = 0; i < len; i++)'
                    });
                }
            }

            // Check for synchronous operations that could be async
            if (code.includes('fs.readFileSync') || code.includes('fs.writeFileSync')) {
                issues.push({
                    type: 'performance',
                    severity: 'warning',
                    message: 'Consider using async file operations',
                    suggestion: 'Use fs.readFile() or fs.promises.readFile() instead'
                });
            }
        }

        if (language === 'python') {
            // Check for inefficient string concatenation
            if (code.includes('+=') && code.includes('str')) {
                suggestions.push({
                    type: 'performance',
                    severity: 'info',
                    message: 'Consider using join() for string concatenation in loops',
                    suggestion: 'Use "".join(list) instead of += for better performance'
                });
            }
        }

        return { issues, suggestions };
    }

    async scanVulnerabilities(code, language, session) {
        const issues = [];

        if (language === 'javascript' || language === 'typescript') {
            // Check for eval usage
            if (code.includes('eval(')) {
                issues.push({
                    type: 'security',
                    severity: 'critical',
                    message: 'Avoid using eval() - security risk',
                    line: code.split('\n').findIndex(line => line.includes('eval(')) + 1,
                    cwe: 'CWE-95'
                });
            }

            // Check for innerHTML usage
            if (code.includes('innerHTML')) {
                issues.push({
                    type: 'security',
                    severity: 'high',
                    message: 'innerHTML can lead to XSS vulnerabilities',
                    suggestion: 'Use textContent or sanitize input',
                    cwe: 'CWE-79'
                });
            }

            // Check for hardcoded credentials
            const credentialPatterns = [
                /password\s*=\s*["'][^"']+["']/i,
                /api[_-]?key\s*=\s*["'][^"']+["']/i,
                /secret\s*=\s*["'][^"']+["']/i
            ];

            credentialPatterns.forEach(pattern => {
                if (pattern.test(code)) {
                    issues.push({
                        type: 'security',
                        severity: 'critical',
                        message: 'Hardcoded credentials detected',
                        suggestion: 'Use environment variables or secure configuration',
                        cwe: 'CWE-798'
                    });
                }
            });
        }

        if (language === 'python') {
            // Check for SQL injection risks
            if (code.includes('execute(') && code.includes('%') && code.includes('SELECT')) {
                issues.push({
                    type: 'security',
                    severity: 'critical',
                    message: 'Potential SQL injection vulnerability',
                    suggestion: 'Use parameterized queries',
                    cwe: 'CWE-89'
                });
            }

            // Check for pickle usage
            if (code.includes('pickle.load')) {
                issues.push({
                    type: 'security',
                    severity: 'high',
                    message: 'pickle.load can execute arbitrary code',
                    suggestion: 'Use safer serialization methods like json',
                    cwe: 'CWE-502'
                });
            }
        }

        return issues;
    }

    async generateCompletions(code, cursor, language, session) {
        const suggestions = [];
        const lines = code.split('\n');
        const currentLine = lines[cursor.line] || '';
        const beforeCursor = currentLine.substring(0, cursor.column);

        // Function completion suggestions
        if (beforeCursor.trim().startsWith('function ') || beforeCursor.trim().startsWith('def ')) {
            const pattern = this.patterns.get(`${language === 'python' ? 'py' : 'js'}_function`);
            if (pattern) {
                suggestions.push({
                    type: 'completion',
                    priority: 'high',
                    text: pattern.template,
                    description: pattern.description,
                    insertText: this.generateFunctionCompletion(language, beforeCursor)
                });
            }
        }

        // Import/require suggestions
        if (beforeCursor.includes('import ') || beforeCursor.includes('require(')) {
            suggestions.push({
                type: 'completion',
                priority: 'medium',
                text: 'Common imports',
                description: 'Frequently used imports',
                insertText: this.generateImportSuggestions(language)
            });
        }

        // Error handling suggestions
        if (beforeCursor.includes('try') || beforeCursor.includes('catch')) {
            suggestions.push({
                type: 'completion',
                priority: 'high',
                text: 'Error handling block',
                description: 'Complete try-catch block',
                insertText: this.generateErrorHandlingBlock(language)
            });
        }

        return suggestions;
    }

    async generateRefactoringSuggestions(code, cursor, language, session) {
        const suggestions = [];

        // Extract method suggestions
        const longFunctions = this.findLongFunctions(code, language);
        if (longFunctions.length > 0) {
            suggestions.push({
                type: 'refactoring',
                priority: 'medium',
                message: 'Consider extracting methods from long functions',
                functions: longFunctions,
                suggestion: 'Break down functions with more than 20 lines'
            });
        }

        // Duplicate code detection
        const duplicates = this.findDuplicateCode(code);
        if (duplicates.length > 0) {
            suggestions.push({
                type: 'refactoring',
                priority: 'high',
                message: 'Duplicate code detected',
                duplicates: duplicates,
                suggestion: 'Extract common code into reusable functions'
            });
        }

        return suggestions;
    }

    async detectCommonBugs(code, language, session) {
        const bugs = [];

        if (language === 'javascript' || language === 'typescript') {
            // Check for == vs === usage
            if (code.includes('==') && !code.includes('===')) {
                bugs.push({
                    type: 'bug',
                    severity: 'medium',
                    message: 'Use === instead of == for strict equality',
                    line: code.split('\n').findIndex(line => line.includes('==')) + 1
                });
            }

            // Check for var usage in modern JS
            if (code.includes('var ')) {
                bugs.push({
                    type: 'bug',
                    severity: 'low',
                    message: 'Consider using let or const instead of var',
                    suggestion: 'Use let for mutable variables, const for immutable'
                });
            }

            // Check for missing return statements
            const functionRegex = /function\s+\w+\([^)]*\)\s*{[^}]*}/g;
            const functions = code.match(functionRegex) || [];
            functions.forEach(func => {
                if (!func.includes('return') && !func.includes('void')) {
                    bugs.push({
                        type: 'bug',
                        severity: 'info',
                        message: 'Function may be missing return statement',
                        suggestion: 'Add return statement if function should return a value'
                    });
                }
            });
        }

        return bugs;
    }

    calculateCodeMetrics(code, language, analysisResults) {
        const lines = code.split('\n').filter(line => line.trim().length > 0);
        const linesOfCode = lines.length;

        // Calculate cyclomatic complexity (simplified)
        const complexity = this.calculateComplexity(code, language);

        // Calculate maintainability index (simplified)
        const maintainabilityIndex = this.calculateMaintainabilityIndex(code, complexity);

        // Calculate security score
        const securityIssues = analysisResults.issues?.filter(issue => issue.type === 'security') || [];
        const securityScore = Math.max(0, 100 - (securityIssues.length * 10));

        return {
            linesOfCode,
            complexity,
            maintainabilityIndex,
            securityScore,
            issueCount: analysisResults.issues?.length || 0,
            suggestionCount: analysisResults.suggestions?.length || 0
        };
    }

    calculateComplexity(code, language) {
        let complexity = 1; // Base complexity

        // Count decision points
        const decisionKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];

        decisionKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = code.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        });

        // Count ternary operators separately (? character)
        const ternaryMatches = code.match(/\?/g);
        if (ternaryMatches) {
            complexity += ternaryMatches.length;
        }

        return complexity;
    }

    calculateMaintainabilityIndex(code, complexity) {
        const linesOfCode = code.split('\n').filter(line => line.trim().length > 0).length;
        const halsteadVolume = Math.log2(linesOfCode) * linesOfCode; // Simplified

        // Simplified maintainability index calculation
        const mi = Math.max(0, 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode));

        return Math.round(mi);
    }

    generateFunctionCompletion(language, beforeCursor) {
        if (language === 'javascript' || language === 'typescript') {
            return `function functionName(params) {
    // TODO: Implement function logic
    return result;
}`;
        } else if (language === 'python') {
            return `def function_name(params):
    """Function description."""
    # TODO: Implement function logic
    return result`;
        }

        return 'function() { /* TODO */ }';
    }

    generateImportSuggestions(language) {
        const suggestions = {
            javascript: [
                "import React from 'react';",
                "import { useState, useEffect } from 'react';",
                "import axios from 'axios';",
                "const fs = require('fs');",
                "const path = require('path');"
            ],
            python: [
                "import os",
                "import sys",
                "import json",
                "import requests",
                "from datetime import datetime"
            ],
            java: [
                "import java.util.*;",
                "import java.io.*;",
                "import java.time.LocalDateTime;"
            ]
        };

        return suggestions[language] || [];
    }

    generateErrorHandlingBlock(language) {
        if (language === 'javascript' || language === 'typescript') {
            return `try {
    // Code that might throw an error
} catch (error) {
    console.error('Error:', error);
    // Handle error appropriately
}`;
        } else if (language === 'python') {
            return `try:
    # Code that might raise an exception
    pass
except Exception as e:
    print(f"Error: {e}")
    # Handle exception appropriately`;
        } else if (language === 'java') {
            return `try {
    // Code that might throw an exception
} catch (Exception e) {
    System.err.println("Error: " + e.getMessage());
    // Handle exception appropriately
}`;
        }

        return 'try { /* code */ } catch (error) { /* handle */ }';
    }

    findLongFunctions(code, language) {
        const longFunctions = [];
        const lines = code.split('\n');

        let currentFunction = null;
        let braceCount = 0;
        let functionStart = -1;

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // Detect function start (simplified)
            if ((language === 'javascript' || language === 'typescript') &&
                (trimmed.includes('function ') || trimmed.includes('=> {'))) {
                currentFunction = trimmed;
                functionStart = index;
                braceCount = 0;
            } else if (language === 'python' && trimmed.startsWith('def ')) {
                currentFunction = trimmed;
                functionStart = index;
            }

            // Count braces for JS/TS
            if (language === 'javascript' || language === 'typescript') {
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                if (currentFunction && braceCount === 0 && functionStart !== -1) {
                    const functionLength = index - functionStart + 1;
                    if (functionLength > 20) {
                        longFunctions.push({
                            name: currentFunction,
                            startLine: functionStart + 1,
                            endLine: index + 1,
                            length: functionLength
                        });
                    }
                    currentFunction = null;
                    functionStart = -1;
                }
            }

            // For Python, detect function end by indentation
            if (language === 'python' && currentFunction) {
                if (trimmed && !line.startsWith('    ') && !line.startsWith('\t') &&
                    index > functionStart) {
                    const functionLength = index - functionStart;
                    if (functionLength > 15) {
                        longFunctions.push({
                            name: currentFunction,
                            startLine: functionStart + 1,
                            endLine: index,
                            length: functionLength
                        });
                    }
                    currentFunction = null;
                    functionStart = -1;
                }
            }
        });

        return longFunctions;
    }

    findDuplicateCode(code) {
        const duplicates = [];
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Look for sequences of 3+ identical lines
        for (let i = 0; i < lines.length - 2; i++) {
            for (let j = i + 3; j < lines.length - 2; j++) {
                let matchLength = 0;

                while (i + matchLength < lines.length &&
                       j + matchLength < lines.length &&
                       lines[i + matchLength] === lines[j + matchLength]) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    duplicates.push({
                        firstOccurrence: { start: i + 1, end: i + matchLength },
                        secondOccurrence: { start: j + 1, end: j + matchLength },
                        lines: matchLength
                    });
                }
            }
        }

        return duplicates;
    }

    async generateCode(prompt, language, context = {}) {
        const generationId = crypto.randomBytes(8).toString('hex');

        try {
            // Analyze prompt to understand intent
            const intent = this.analyzePromptIntent(prompt, language);

            // Generate code based on intent and patterns
            const generatedCode = await this.generateCodeFromIntent(intent, language, context);

            // Add to history
            this.addToCodeHistory({
                id: generationId,
                prompt,
                language,
                intent,
                generatedCode,
                context,
                timestamp: Date.now()
            });

            console.log(`🤖 Generated code for prompt: "${prompt.substring(0, 50)}..."`);

            return {
                id: generationId,
                code: generatedCode,
                language,
                intent,
                suggestions: await this.generateCodeSuggestions(generatedCode, language),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`Code generation failed for ${generationId}:`, error.message);
            throw error;
        }
    }

    analyzePromptIntent(prompt, language) {
        const intent = {
            type: 'unknown',
            entities: [],
            patterns: [],
            complexity: 'medium'
        };

        const promptLower = prompt.toLowerCase();

        // Detect intent type
        if (promptLower.includes('function') || promptLower.includes('method')) {
            intent.type = 'function';
        } else if (promptLower.includes('class')) {
            intent.type = 'class';
        } else if (promptLower.includes('api') || promptLower.includes('endpoint')) {
            intent.type = 'api';
        } else if (promptLower.includes('component') && (language === 'javascript' || language === 'typescript')) {
            intent.type = 'component';
        } else if (promptLower.includes('test') || promptLower.includes('unit test')) {
            intent.type = 'test';
        } else if (promptLower.includes('algorithm') || promptLower.includes('sort') || promptLower.includes('search')) {
            intent.type = 'algorithm';
        }

        // Extract entities (simplified)
        const words = prompt.split(' ');
        intent.entities = words.filter(word =>
            word.length > 3 &&
            !['function', 'class', 'method', 'create', 'make', 'build'].includes(word.toLowerCase())
        );

        // Determine complexity
        if (promptLower.includes('simple') || promptLower.includes('basic')) {
            intent.complexity = 'low';
        } else if (promptLower.includes('complex') || promptLower.includes('advanced') ||
                   promptLower.includes('sophisticated')) {
            intent.complexity = 'high';
        }

        return intent;
    }

    async generateCodeFromIntent(intent, language, context) {
        let code = '';

        switch (intent.type) {
            case 'function':
                code = this.generateFunction(intent, language, context);
                break;
            case 'class':
                code = this.generateClass(intent, language, context);
                break;
            case 'api':
                code = this.generateAPICode(intent, language, context);
                break;
            case 'component':
                code = this.generateComponent(intent, language, context);
                break;
            case 'test':
                code = this.generateTest(intent, language, context);
                break;
            case 'algorithm':
                code = this.generateAlgorithm(intent, language, context);
                break;
            default:
                code = this.generateGenericCode(intent, language, context);
        }

        return code;
    }

    generateFunction(intent, language, context) {
        const functionName = intent.entities[0] || 'newFunction';

        if (language === 'javascript' || language === 'typescript') {
            return `/**
 * ${intent.entities.join(' ')} function
 * @param {*} params - Function parameters
 * @returns {*} Function result
 */
function ${functionName}(params) {
    // TODO: Implement ${intent.entities.join(' ')} logic
    try {
        // Your implementation here
        return result;
    } catch (error) {
        console.error('Error in ${functionName}:', error);
        throw error;
    }
}`;
        } else if (language === 'python') {
            return `def ${functionName}(params):
    """
    ${intent.entities.join(' ')} function

    Args:
        params: Function parameters

    Returns:
        Function result
    """
    try:
        # TODO: Implement ${intent.entities.join(' ')} logic
        # Your implementation here
        return result
    except Exception as e:
        print(f"Error in ${functionName}: {e}")
        raise`;
        }

        return `// ${intent.entities.join(' ')} function\nfunction ${functionName}() {\n    // TODO: Implement\n}`;
    }

    generateClass(intent, language, context) {
        const className = intent.entities[0] || 'NewClass';

        if (language === 'javascript' || language === 'typescript') {
            return `/**
 * ${intent.entities.join(' ')} class
 */
class ${className} {
    constructor(options = {}) {
        // Initialize class properties
        this.options = options;
    }

    // TODO: Add class methods

    toString() {
        return \`${className} instance\`;
    }
}`;
        } else if (language === 'python') {
            return `class ${className}:
    """
    ${intent.entities.join(' ')} class
    """

    def __init__(self, options=None):
        """Initialize ${className} instance."""
        self.options = options or {}

    # TODO: Add class methods

    def __str__(self):
        return f"${className} instance"`;
        } else if (language === 'java') {
            return `/**
 * ${intent.entities.join(' ')} class
 */
public class ${className} {
    private Object options;

    public ${className}(Object options) {
        this.options = options;
    }

    // TODO: Add class methods

    @Override
    public String toString() {
        return "${className} instance";
    }
}`;
        }

        return `class ${className} {\n    // TODO: Implement\n}`;
    }

    generateAPICode(intent, language, context) {
        if (language === 'javascript' || language === 'typescript') {
            return `/**
 * ${intent.entities.join(' ')} API endpoint
 */
app.get('/api/${intent.entities[0] || 'endpoint'}', async (req, res) => {
    try {
        // TODO: Implement API logic
        const result = await processRequest(req.query);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});`;
        } else if (language === 'python') {
            return `@app.route('/api/${intent.entities[0] || 'endpoint'}', methods=['GET'])
def ${intent.entities[0] || 'endpoint'}():
    """${intent.entities.join(' ')} API endpoint."""
    try:
        # TODO: Implement API logic
        result = process_request(request.args)

        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500`;
        }

        return `// ${intent.entities.join(' ')} API\napp.get('/api/endpoint', (req, res) => {\n    // TODO: Implement\n});`;
    }

    generateComponent(intent, language, context) {
        const componentName = intent.entities[0] || 'NewComponent';

        if (language === 'javascript' || language === 'typescript') {
            return `import React, { useState, useEffect } from 'react';

/**
 * ${intent.entities.join(' ')} component
 */
const ${componentName} = ({ ...props }) => {
    const [state, setState] = useState({});

    useEffect(() => {
        // TODO: Component initialization
    }, []);

    return (
        <div className="${componentName.toLowerCase()}">
            <h2>${componentName}</h2>
            {/* TODO: Component content */}
        </div>
    );
};

export default ${componentName};`;
        }

        return `// ${componentName} component\nconst ${componentName} = () => {\n    return <div>TODO: Implement</div>;\n};`;
    }

    generateTest(intent, language, context) {
        const testName = intent.entities[0] || 'newFunction';

        if (language === 'javascript' || language === 'typescript') {
            return `describe('${testName}', () => {
    test('should ${intent.entities.join(' ')}', () => {
        // Arrange
        const input = {};
        const expected = {};

        // Act
        const result = ${testName}(input);

        // Assert
        expect(result).toEqual(expected);
    });

    test('should handle edge cases', () => {
        // TODO: Add edge case tests
    });

    test('should handle errors', () => {
        // TODO: Add error handling tests
    });
});`;
        } else if (language === 'python') {
            return `import unittest

class Test${testName.charAt(0).toUpperCase() + testName.slice(1)}(unittest.TestCase):
    """Test cases for ${testName}."""

    def test_${testName}(self):
        """Test ${intent.entities.join(' ')}."""
        # Arrange
        input_data = {}
        expected = {}

        # Act
        result = ${testName}(input_data)

        # Assert
        self.assertEqual(result, expected)

    def test_edge_cases(self):
        """Test edge cases."""
        # TODO: Add edge case tests
        pass

    def test_error_handling(self):
        """Test error handling."""
        # TODO: Add error handling tests
        pass

if __name__ == '__main__':
    unittest.main()`;
        }

        return `// Test for ${testName}\ntest('${testName}', () => {\n    // TODO: Implement test\n});`;
    }

    generateAlgorithm(intent, language, context) {
        const algorithmName = intent.entities[0] || 'algorithm';

        if (language === 'javascript' || language === 'typescript') {
            return `/**
 * ${intent.entities.join(' ')} algorithm
 * @param {Array} data - Input data
 * @returns {*} Algorithm result
 */
function ${algorithmName}(data) {
    // TODO: Implement ${intent.entities.join(' ')} algorithm

    // Base case or initialization
    if (!data || data.length === 0) {
        return [];
    }

    // Algorithm implementation
    let result = [];

    for (let i = 0; i < data.length; i++) {
        // Process each element
        // TODO: Add algorithm logic
    }

    return result;
}`;
        } else if (language === 'python') {
            return `def ${algorithmName}(data):
    """
    ${intent.entities.join(' ')} algorithm

    Args:
        data: Input data

    Returns:
        Algorithm result
    """
    # TODO: Implement ${intent.entities.join(' ')} algorithm

    # Base case or initialization
    if not data:
        return []

    # Algorithm implementation
    result = []

    for item in data:
        # Process each element
        # TODO: Add algorithm logic
        pass

    return result`;
        }

        return `// ${algorithmName} algorithm\nfunction ${algorithmName}(data) {\n    // TODO: Implement\n}`;
    }

    generateGenericCode(intent, language, context) {
        return `// Generated code for: ${intent.entities.join(' ')}\n// TODO: Implement functionality`;
    }

    async generateCodeSuggestions(code, language) {
        const suggestions = [];

        // Add documentation suggestion
        if (!code.includes('/**') && !code.includes('"""')) {
            suggestions.push({
                type: 'documentation',
                priority: 'medium',
                message: 'Add documentation to improve code maintainability',
                suggestion: 'Add JSDoc comments for JavaScript or docstrings for Python'
            });
        }

        // Add error handling suggestion
        if (!code.includes('try') && !code.includes('catch') && !code.includes('except')) {
            suggestions.push({
                type: 'error_handling',
                priority: 'high',
                message: 'Consider adding error handling',
                suggestion: 'Add try-catch blocks for robust error handling'
            });
        }

        // Add testing suggestion
        suggestions.push({
            type: 'testing',
            priority: 'medium',
            message: 'Consider writing tests for this code',
            suggestion: 'Add unit tests to ensure code reliability'
        });

        return suggestions;
    }

    addToCodeHistory(entry) {
        this.codeHistory.push(entry);

        // Keep only recent history
        if (this.codeHistory.length > this.maxCodeHistory) {
            this.codeHistory = this.codeHistory.slice(-this.maxCodeHistory);
        }

        // Save periodically
        if (this.codeHistory.length % 10 === 0) {
            this.saveCodeHistory();
        }
    }

    async endCodeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Code session ${sessionId} not found`);
        }

        session.isActive = false;
        session.endedAt = Date.now();

        // Clear analysis timer
        if (session.analysisTimer) {
            clearInterval(session.analysisTimer);
        }

        // Add session to history
        this.addToCodeHistory({
            type: 'session',
            sessionId,
            language: session.language,
            duration: session.endedAt - session.createdAt,
            linesOfCode: session.metrics.linesOfCode,
            issuesFound: session.issues.length,
            suggestionsProvided: session.suggestions.length,
            timestamp: session.endedAt
        });

        this.activeSessions.delete(sessionId);

        console.log(`💻 Ended code session: ${sessionId}`);

        this.emit('session:ended', {
            sessionId,
            session,
            summary: {
                duration: session.endedAt - session.createdAt,
                linesOfCode: session.metrics.linesOfCode,
                issuesFound: session.issues.length,
                suggestionsProvided: session.suggestions.length
            }
        });

        return {
            sessionId,
            summary: {
                duration: session.endedAt - session.createdAt,
                linesOfCode: session.metrics.linesOfCode,
                issuesFound: session.issues.length,
                suggestionsProvided: session.suggestions.length
            }
        };
    }

    getCodeGenAnalytics() {
        const activeSessions = this.activeSessions.size;
        const totalSessions = this.codeHistory.filter(entry => entry.type === 'session').length;
        const totalGenerations = this.codeHistory.filter(entry => entry.type !== 'session').length;

        const languageStats = new Map();
        const avgMetrics = {
            linesOfCode: 0,
            issuesFound: 0,
            suggestionsProvided: 0
        };

        let sessionCount = 0;

        for (const entry of this.codeHistory) {
            if (entry.type === 'session') {
                sessionCount++;
                avgMetrics.linesOfCode += entry.linesOfCode || 0;
                avgMetrics.issuesFound += entry.issuesFound || 0;
                avgMetrics.suggestionsProvided += entry.suggestionsProvided || 0;
            }

            if (entry.language) {
                languageStats.set(entry.language, (languageStats.get(entry.language) || 0) + 1);
            }
        }

        if (sessionCount > 0) {
            avgMetrics.linesOfCode = Math.round(avgMetrics.linesOfCode / sessionCount);
            avgMetrics.issuesFound = Math.round(avgMetrics.issuesFound / sessionCount);
            avgMetrics.suggestionsProvided = Math.round(avgMetrics.suggestionsProvided / sessionCount);
        }

        return {
            activeSessions,
            totalSessions,
            totalGenerations,
            supportedLanguages: this.supportedLanguages.length,
            languageStats: Object.fromEntries(languageStats),
            avgMetrics,
            analyzers: this.codeAnalyzers.size,
            suggestionEngines: this.suggestionEngines.size,
            securityScanners: this.securityScanners.size
        };
    }

    getSessionStatus(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return null;

        return {
            id: session.id,
            language: session.language,
            fileName: session.fileName,
            isActive: session.isActive,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            metrics: session.metrics,
            issueCount: session.issues.length,
            suggestionCount: session.suggestions.length,
            codeLength: session.code.length
        };
    }
}
