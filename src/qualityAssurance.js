import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Quality Assurance Integration for AI-to-AI Communication
 * Handles automated testing and code quality metrics
 */
export class QualityAssurance extends EventEmitter {
  constructor(workspaceRoot = process.cwd()) {
    super();
    this.workspaceRoot = workspaceRoot;
    this.testResults = new Map(); // loopId -> test results
    this.qualityMetrics = new Map(); // loopId -> quality metrics
    this.testCommands = this.detectTestCommands();
    this.lintCommands = this.detectLintCommands();
  }

  /**
   * Detect available test commands
   * @returns {Array} - Array of test commands
   */
  detectTestCommands() {
    const commands = [];
    const packageJsonPath = join(this.workspaceRoot, 'package.json');

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = require(packageJsonPath);
        const scripts = packageJson.scripts || {};

        // Common test script names
        const testScripts = ['test', 'test:unit', 'test:integration', 'jest', 'mocha', 'vitest'];

        testScripts.forEach(script => {
          if (scripts[script]) {
            commands.push({
              name: script,
              command: `npm run ${script}`,
              type: 'npm'
            });
          }
        });

        // Check for direct test runners
        if (packageJson.devDependencies || packageJson.dependencies) {
          const deps = { ...packageJson.devDependencies, ...packageJson.dependencies };

          if (deps.jest) {
            commands.push({ name: 'jest', command: 'npx jest', type: 'direct' });
          }
          if (deps.mocha) {
            commands.push({ name: 'mocha', command: 'npx mocha', type: 'direct' });
          }
          if (deps.vitest) {
            commands.push({ name: 'vitest', command: 'npx vitest run', type: 'direct' });
          }
        }
      } catch (error) {
        console.error('[QA] Error reading package.json:', error.message);
      }
    }

    return commands;
  }

  /**
   * Detect available lint commands
   * @returns {Array} - Array of lint commands
   */
  detectLintCommands() {
    const commands = [];
    const packageJsonPath = join(this.workspaceRoot, 'package.json');

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = require(packageJsonPath);
        const scripts = packageJson.scripts || {};

        // Common lint script names
        const lintScripts = ['lint', 'lint:js', 'lint:css', 'eslint', 'stylelint'];

        lintScripts.forEach(script => {
          if (scripts[script]) {
            commands.push({
              name: script,
              command: `npm run ${script}`,
              type: 'npm'
            });
          }
        });

        // Check for direct linters
        if (packageJson.devDependencies || packageJson.dependencies) {
          const deps = { ...packageJson.devDependencies, ...packageJson.dependencies };

          if (deps.eslint) {
            commands.push({ name: 'eslint', command: 'npx eslint .', type: 'direct' });
          }
          if (deps.stylelint) {
            commands.push({ name: 'stylelint', command: 'npx stylelint "**/*.css"', type: 'direct' });
          }
        }
      } catch (error) {
        console.error('[QA] Error reading package.json for lint commands:', error.message);
      }
    }

    return commands;
  }

  /**
   * Run tests after implementation
   * @param {string} loopId - Loop ID
   * @param {Array} changedFiles - Files that were changed
   * @returns {Promise<Object>} - Test results
   */
  async runTestsAfterImplementation(loopId, changedFiles = []) {
    console.error(`[QA] Running tests for loop ${loopId}`);

    const results = {
      timestamp: new Date(),
      success: false,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      coverage: null,
      duration: 0,
      errors: []
    };

    const startTime = Date.now();

    try {
      // Run available test commands
      for (const testCmd of this.testCommands.slice(0, 2)) { // Limit to 2 commands
        try {
          console.error(`[QA] Running: ${testCmd.command}`);

          const { stdout, stderr } = await execAsync(testCmd.command, {
            cwd: this.workspaceRoot,
            timeout: 60000 // 1 minute timeout
          });

          const testResult = this.parseTestOutput(testCmd.name, stdout, stderr);
          results.tests.push(testResult);

          // Update summary
          results.summary.total += testResult.total;
          results.summary.passed += testResult.passed;
          results.summary.failed += testResult.failed;
          results.summary.skipped += testResult.skipped;

        } catch (error) {
          console.error(`[QA] Test command failed: ${testCmd.command}`, error.message);
          results.errors.push({
            command: testCmd.command,
            error: error.message
          });
        }
      }

      results.success = results.summary.failed === 0 && results.summary.total > 0;
      results.duration = Date.now() - startTime;

      // Store results
      this.testResults.set(loopId, results);

      this.emit('testsCompleted', {
        loopId,
        results,
        changedFiles
      });

    } catch (error) {
      results.errors.push({ error: error.message });
      console.error(`[QA] Error running tests: ${error.message}`);
    }

    return results;
  }

  /**
   * Parse test output
   * @param {string} testRunner - Test runner name
   * @param {string} stdout - Standard output
   * @param {string} stderr - Standard error
   * @returns {Object} - Parsed test result
   */
  parseTestOutput(testRunner, stdout, stderr) {
    const result = {
      runner: testRunner,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: null,
      output: stdout,
      errors: stderr
    };

    const output = stdout + stderr;

    // Jest parsing
    if (testRunner.includes('jest')) {
      const testMatch = output.match(/Tests:\s*(\d+)\s*failed,\s*(\d+)\s*passed,\s*(\d+)\s*total/);
      if (testMatch) {
        result.failed = parseInt(testMatch[1]);
        result.passed = parseInt(testMatch[2]);
        result.total = parseInt(testMatch[3]);
      }

      // Coverage
      const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)/);
      if (coverageMatch) {
        result.coverage = parseFloat(coverageMatch[1]);
      }
    }

    // Mocha parsing
    if (testRunner.includes('mocha')) {
      const passMatch = output.match(/(\d+)\s*passing/);
      const failMatch = output.match(/(\d+)\s*failing/);

      if (passMatch) {result.passed = parseInt(passMatch[1]);}
      if (failMatch) {result.failed = parseInt(failMatch[1]);}
      result.total = result.passed + result.failed;
    }

    // Vitest parsing
    if (testRunner.includes('vitest')) {
      const testMatch = output.match(/Test Files\s*(\d+)\s*passed/);
      if (testMatch) {
        result.passed = parseInt(testMatch[1]);
        result.total = result.passed;
      }
    }

    return result;
  }

  /**
   * Measure code quality metrics
   * @param {string} loopId - Loop ID
   * @param {Object} beforeState - State before changes
   * @param {Object} afterState - State after changes
   * @returns {Promise<Object>} - Quality metrics
   */
  async measureCodeQuality(loopId, beforeState = null, afterState = null) {
    console.error(`[QA] Measuring code quality for loop ${loopId}`);

    const metrics = {
      timestamp: new Date(),
      linting: await this.runLinting(),
      complexity: await this.analyzeComplexity(),
      maintainability: await this.analyzeMaintainability(),
      performance: await this.analyzePerformance(),
      security: await this.analyzeSecurity(),
      improvement: this.calculateImprovement(beforeState, afterState)
    };

    this.qualityMetrics.set(loopId, metrics);

    this.emit('qualityMeasured', {
      loopId,
      metrics
    });

    return metrics;
  }

  /**
   * Run linting
   * @returns {Promise<Object>} - Linting results
   */
  async runLinting() {
    const results = {
      success: false,
      errors: 0,
      warnings: 0,
      issues: [],
      tools: []
    };

    for (const lintCmd of this.lintCommands.slice(0, 2)) { // Limit to 2 commands
      try {
        console.error(`[QA] Running lint: ${lintCmd.command}`);

        const { stdout, stderr } = await execAsync(lintCmd.command, {
          cwd: this.workspaceRoot,
          timeout: 30000 // 30 seconds timeout
        });

        const lintResult = this.parseLintOutput(lintCmd.name, stdout, stderr);
        results.tools.push(lintResult);
        results.errors += lintResult.errors;
        results.warnings += lintResult.warnings;
        results.issues.push(...lintResult.issues);

      } catch (error) {
        // Linting often exits with non-zero code when issues found
        if (error.stdout || error.stderr) {
          const lintResult = this.parseLintOutput(lintCmd.name, error.stdout || '', error.stderr || '');
          results.tools.push(lintResult);
          results.errors += lintResult.errors;
          results.warnings += lintResult.warnings;
        }
      }
    }

    results.success = results.errors === 0;
    return results;
  }

  /**
   * Parse lint output
   * @param {string} linter - Linter name
   * @param {string} stdout - Standard output
   * @param {string} stderr - Standard error
   * @returns {Object} - Parsed lint result
   */
  parseLintOutput(linter, stdout, stderr) {
    const result = {
      linter,
      errors: 0,
      warnings: 0,
      issues: []
    };

    const output = stdout + stderr;

    // ESLint parsing
    if (linter.includes('eslint')) {
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.includes('error')) {result.errors++;}
        if (line.includes('warning')) {result.warnings++;}

        // Extract issue details
        const issueMatch = line.match(/(.+):(\d+):(\d+):\s*(error|warning)\s*(.+)/);
        if (issueMatch) {
          result.issues.push({
            file: issueMatch[1],
            line: parseInt(issueMatch[2]),
            column: parseInt(issueMatch[3]),
            severity: issueMatch[4],
            message: issueMatch[5]
          });
        }
      });
    }

    return result;
  }

  /**
   * Analyze code complexity
   * @returns {Promise<Object>} - Complexity analysis
   */
  async analyzeComplexity() {
    // This would integrate with complexity analysis tools
    // For now, return a placeholder
    return {
      average: 5.2,
      max: 15,
      files: [],
      trend: 'stable'
    };
  }

  /**
   * Analyze maintainability
   * @returns {Promise<Object>} - Maintainability analysis
   */
  async analyzeMaintainability() {
    // This would analyze code maintainability metrics
    return {
      score: 7.8,
      factors: {
        duplication: 'low',
        coupling: 'medium',
        cohesion: 'high'
      }
    };
  }

  /**
   * Analyze performance
   * @returns {Promise<Object>} - Performance analysis
   */
  async analyzePerformance() {
    // This would run performance analysis
    return {
      score: 8.5,
      metrics: {
        bundleSize: 'optimal',
        loadTime: 'fast',
        memoryUsage: 'efficient'
      }
    };
  }

  /**
   * Analyze security
   * @returns {Promise<Object>} - Security analysis
   */
  async analyzeSecurity() {
    // This would run security analysis
    return {
      score: 9.0,
      vulnerabilities: 0,
      warnings: 1,
      recommendations: ['Update dependencies']
    };
  }

  /**
   * Calculate improvement between states
   * @param {Object} beforeState - Before state
   * @param {Object} afterState - After state
   * @returns {Object} - Improvement calculation
   */
  calculateImprovement(beforeState, afterState) {
    if (!beforeState || !afterState) {
      return { available: false };
    }

    return {
      available: true,
      testCoverage: this.calculateDelta(beforeState.coverage, afterState.coverage),
      lintErrors: this.calculateDelta(beforeState.lintErrors, afterState.lintErrors, true),
      complexity: this.calculateDelta(beforeState.complexity, afterState.complexity, true),
      performance: this.calculateDelta(beforeState.performance, afterState.performance)
    };
  }

  /**
   * Calculate delta between two values
   * @param {number} before - Before value
   * @param {number} after - After value
   * @param {boolean} lowerIsBetter - Whether lower values are better
   * @returns {Object} - Delta calculation
   */
  calculateDelta(before, after, lowerIsBetter = false) {
    if (before === undefined || after === undefined) {
      return { change: 0, direction: 'unchanged' };
    }

    const change = after - before;
    let direction = 'unchanged';

    if (change > 0) {
      direction = lowerIsBetter ? 'worse' : 'better';
    } else if (change < 0) {
      direction = lowerIsBetter ? 'better' : 'worse';
    }

    return {
      change: Math.abs(change),
      direction,
      percentage: before !== 0 ? Math.abs((change / before) * 100) : 0
    };
  }

  /**
   * Generate quality report
   * @param {string} loopId - Loop ID
   * @returns {Object} - Quality report
   */
  generateQualityReport(loopId) {
    const testResults = this.testResults.get(loopId);
    const qualityMetrics = this.qualityMetrics.get(loopId);

    const report = {
      loopId,
      timestamp: new Date(),
      overall: 'unknown',
      tests: testResults || null,
      quality: qualityMetrics || null,
      recommendations: []
    };

    // Calculate overall score
    let score = 0;
    let factors = 0;

    if (testResults) {
      if (testResults.success) {score += 30;}
      factors++;
    }

    if (qualityMetrics) {
      if (qualityMetrics.linting.success) {score += 20;}
      score += (qualityMetrics.complexity.average < 10 ? 15 : 5);
      score += (qualityMetrics.maintainability.score * 2);
      score += (qualityMetrics.performance.score * 2);
      score += (qualityMetrics.security.score * 1);
      factors += 5;
    }

    const overallScore = factors > 0 ? score / factors : 0;

    if (overallScore >= 80) {report.overall = 'excellent';}
    else if (overallScore >= 60) {report.overall = 'good';}
    else if (overallScore >= 40) {report.overall = 'fair';}
    else {report.overall = 'poor';}

    // Generate recommendations
    if (testResults && !testResults.success) {
      report.recommendations.push('Fix failing tests before proceeding');
    }

    if (qualityMetrics && qualityMetrics.linting.errors > 0) {
      report.recommendations.push('Address linting errors');
    }

    if (qualityMetrics && qualityMetrics.complexity.average > 10) {
      report.recommendations.push('Reduce code complexity');
    }

    return report;
  }

  /**
   * Get test results for loop
   * @param {string} loopId - Loop ID
   * @returns {Object|null} - Test results
   */
  getTestResults(loopId) {
    return this.testResults.get(loopId) || null;
  }

  /**
   * Get quality metrics for loop
   * @param {string} loopId - Loop ID
   * @returns {Object|null} - Quality metrics
   */
  getQualityMetrics(loopId) {
    return this.qualityMetrics.get(loopId) || null;
  }
}
