import { EventEmitter } from 'events';

/**
 * Intelligent Iteration Planning for AI-to-AI Communication
 * Plans iteration sequences and manages dependencies
 */
export class IterationPlanner extends EventEmitter {
  constructor() {
    super();
    this.iterationPlans = new Map(); // loopId -> iteration plan
    this.dependencyGraph = new Map(); // task -> dependencies
    this.completedTasks = new Map(); // loopId -> completed tasks
    this.planningStrategies = this.initializePlanningStrategies();
  }

  /**
   * Initialize planning strategies
   * @returns {Object} - Planning strategies
   */
  initializePlanningStrategies() {
    return {
      ui_ux: {
        phases: ['foundation', 'components', 'interactions', 'optimization', 'accessibility'],
        dependencies: {
          'components': ['foundation'],
          'interactions': ['components'],
          'optimization': ['interactions'],
          'accessibility': ['components', 'interactions']
        }
      },
      performance: {
        phases: ['analysis', 'bottlenecks', 'optimization', 'caching', 'monitoring'],
        dependencies: {
          'bottlenecks': ['analysis'],
          'optimization': ['bottlenecks'],
          'caching': ['optimization'],
          'monitoring': ['optimization', 'caching']
        }
      },
      api: {
        phases: ['design', 'implementation', 'validation', 'documentation', 'testing'],
        dependencies: {
          'implementation': ['design'],
          'validation': ['implementation'],
          'documentation': ['implementation'],
          'testing': ['implementation', 'validation']
        }
      },
      testing: {
        phases: ['setup', 'unit_tests', 'integration_tests', 'e2e_tests', 'coverage'],
        dependencies: {
          'unit_tests': ['setup'],
          'integration_tests': ['unit_tests'],
          'e2e_tests': ['integration_tests'],
          'coverage': ['unit_tests', 'integration_tests']
        }
      }
    };
  }

  /**
   * Plan iteration sequence based on codebase and user goal
   * @param {string} loopId - Loop ID
   * @param {string} codebaseSummary - Codebase summary
   * @param {string} userGoal - User's goal
   * @returns {Promise<Object>} - Iteration plan
   */
  async planIterationSequence(loopId, codebaseSummary, userGoal) {
    console.error(`[ITERATION PLANNER] Planning sequence for loop ${loopId}`);

    const strategy = this.determineStrategy(userGoal);
    const complexity = this.assessComplexity(codebaseSummary);
    const currentState = this.analyzeCurrentState(codebaseSummary);

    const plan = {
      loopId,
      strategy,
      complexity,
      totalPhases: strategy.phases.length,
      currentPhase: 0,
      phases: this.generateDetailedPhases(strategy, complexity, currentState),
      dependencies: strategy.dependencies,
      estimatedIterations: this.estimateIterations(strategy, complexity),
      milestones: this.defineMilestones(strategy),
      adaptationPoints: this.defineAdaptationPoints(strategy),
      riskFactors: this.identifyRiskFactors(codebaseSummary, userGoal)
    };

    this.iterationPlans.set(loopId, plan);
    this.completedTasks.set(loopId, new Set());

    console.error(`[ITERATION PLANNER] Plan created: ${plan.totalPhases} phases, ~${plan.estimatedIterations} iterations`);

    this.emit('planCreated', { loopId, plan });

    return plan;
  }

  /**
   * Determine strategy based on user goal
   * @param {string} userGoal - User's goal
   * @returns {Object} - Strategy
   */
  determineStrategy(userGoal) {
    const goalLower = userGoal.toLowerCase();

    if (goalLower.includes('ui') || goalLower.includes('ux') || goalLower.includes('design')) {
      return this.planningStrategies.ui_ux;
    } else if (goalLower.includes('performance') || goalLower.includes('optimization')) {
      return this.planningStrategies.performance;
    } else if (goalLower.includes('api') || goalLower.includes('backend')) {
      return this.planningStrategies.api;
    } else if (goalLower.includes('test') || goalLower.includes('coverage')) {
      return this.planningStrategies.testing;
    } else {
      // Default to UI/UX for general improvements
      return this.planningStrategies.ui_ux;
    }
  }

  /**
   * Assess complexity from codebase summary
   * @param {string} codebaseSummary - Codebase summary
   * @returns {string} - Complexity level
   */
  assessComplexity(codebaseSummary) {
    const summary = codebaseSummary.toLowerCase();
    let complexityScore = 0;

    // Technology complexity indicators
    if (summary.includes('microservice') || summary.includes('distributed')) {complexityScore += 3;}
    if (summary.includes('react') || summary.includes('vue') || summary.includes('angular')) {complexityScore += 2;}
    if (summary.includes('typescript')) {complexityScore += 1;}
    if (summary.includes('webpack') || summary.includes('vite')) {complexityScore += 1;}
    if (summary.includes('docker') || summary.includes('kubernetes')) {complexityScore += 2;}
    if (summary.includes('database') || summary.includes('sql')) {complexityScore += 1;}

    // Size indicators
    if (summary.includes('large') || summary.includes('enterprise')) {complexityScore += 2;}
    if (summary.includes('multiple') && summary.includes('service')) {complexityScore += 2;}

    if (complexityScore >= 6) {return 'enterprise';}
    if (complexityScore >= 4) {return 'complex';}
    if (complexityScore >= 2) {return 'medium';}
    return 'simple';
  }

  /**
   * Analyze current state from codebase summary
   * @param {string} codebaseSummary - Codebase summary
   * @returns {Object} - Current state analysis
   */
  analyzeCurrentState(codebaseSummary) {
    const summary = codebaseSummary.toLowerCase();

    return {
      hasTests: summary.includes('test') || summary.includes('jest') || summary.includes('mocha'),
      hasLinting: summary.includes('eslint') || summary.includes('lint'),
      hasTypeScript: summary.includes('typescript'),
      hasFramework: summary.includes('react') || summary.includes('vue') || summary.includes('angular'),
      hasBuildTools: summary.includes('webpack') || summary.includes('vite') || summary.includes('rollup'),
      hasDocumentation: summary.includes('documentation') || summary.includes('readme'),
      hasCI: summary.includes('ci') || summary.includes('github actions') || summary.includes('jenkins'),
      hasDatabase: summary.includes('database') || summary.includes('sql') || summary.includes('mongodb')
    };
  }

  /**
   * Generate detailed phases
   * @param {Object} strategy - Strategy
   * @param {string} complexity - Complexity level
   * @param {Object} currentState - Current state
   * @returns {Array} - Detailed phases
   */
  generateDetailedPhases(strategy, complexity, currentState) {
    const complexityMultiplier = {
      simple: 1,
      medium: 1.5,
      complex: 2,
      enterprise: 3
    };

    const multiplier = complexityMultiplier[complexity] || 1;

    return strategy.phases.map((phase, index) => ({
      name: phase,
      index,
      estimatedIterations: Math.ceil(this.getPhaseBaseIterations(phase) * multiplier),
      prerequisites: strategy.dependencies[phase] || [],
      tasks: this.generatePhaseTasks(phase, currentState),
      status: 'pending',
      startIteration: null,
      endIteration: null,
      adaptable: this.isPhaseAdaptable(phase)
    }));
  }

  /**
   * Get base iterations for a phase
   * @param {string} phase - Phase name
   * @returns {number} - Base iterations
   */
  getPhaseBaseIterations(phase) {
    const baseIterations = {
      foundation: 3,
      components: 4,
      interactions: 3,
      optimization: 5,
      accessibility: 3,
      analysis: 2,
      bottlenecks: 3,
      caching: 4,
      monitoring: 2,
      design: 3,
      implementation: 6,
      validation: 3,
      documentation: 2,
      testing: 4,
      setup: 2,
      unit_tests: 4,
      integration_tests: 3,
      e2e_tests: 3,
      coverage: 2
    };

    return baseIterations[phase] || 3;
  }

  /**
   * Generate tasks for a phase
   * @param {string} phase - Phase name
   * @param {Object} currentState - Current state
   * @returns {Array} - Phase tasks
   */
  generatePhaseTasks(phase, currentState) {
    const phaseTasks = {
      foundation: [
        'Set up project structure',
        'Configure build tools',
        'Establish coding standards',
        'Create base components'
      ],
      components: [
        'Design component architecture',
        'Implement core components',
        'Add component documentation',
        'Create component tests'
      ],
      interactions: [
        'Implement user interactions',
        'Add event handling',
        'Create feedback mechanisms',
        'Optimize interaction performance'
      ],
      optimization: [
        'Analyze performance bottlenecks',
        'Implement code splitting',
        'Optimize bundle size',
        'Add performance monitoring'
      ],
      accessibility: [
        'Add ARIA labels',
        'Implement keyboard navigation',
        'Ensure color contrast',
        'Test with screen readers'
      ]
    };

    let tasks = phaseTasks[phase] || [`Implement ${phase}`, `Test ${phase}`, `Document ${phase}`];

    // Filter tasks based on current state
    if (currentState.hasTests && tasks.some(t => t.includes('test'))) {
      tasks = tasks.filter(t => !t.includes('Create') || !t.includes('test'));
      tasks.push('Enhance existing tests');
    }

    return tasks.map((task, index) => ({
      name: task,
      index,
      status: 'pending',
      iteration: null,
      dependencies: []
    }));
  }

  /**
   * Check if phase is adaptable
   * @param {string} phase - Phase name
   * @returns {boolean} - Whether phase is adaptable
   */
  isPhaseAdaptable(phase) {
    const adaptablePhases = ['optimization', 'interactions', 'testing', 'validation'];
    return adaptablePhases.includes(phase);
  }

  /**
   * Estimate total iterations
   * @param {Object} strategy - Strategy
   * @param {string} complexity - Complexity level
   * @returns {number} - Estimated iterations
   */
  estimateIterations(strategy, complexity) {
    const complexityMultiplier = {
      simple: 1,
      medium: 1.5,
      complex: 2,
      enterprise: 3
    };

    const baseIterations = strategy.phases.reduce((total, phase) => {
      return total + this.getPhaseBaseIterations(phase);
    }, 0);

    return Math.ceil(baseIterations * (complexityMultiplier[complexity] || 1));
  }

  /**
   * Define milestones
   * @param {Object} strategy - Strategy
   * @returns {Array} - Milestones
   */
  defineMilestones(strategy) {
    const milestonePhases = {
      ui_ux: ['foundation', 'components', 'optimization'],
      performance: ['analysis', 'optimization', 'monitoring'],
      api: ['design', 'implementation', 'testing'],
      testing: ['setup', 'unit_tests', 'coverage']
    };

    const strategyKey = Object.keys(this.planningStrategies).find(key =>
      this.planningStrategies[key] === strategy
    );

    const phases = milestonePhases[strategyKey] || strategy.phases.filter((_, i) => i % 2 === 0);

    return phases.map(phase => ({
      phase,
      description: `Complete ${phase} phase`,
      criteria: this.getMilestoneCriteria(phase)
    }));
  }

  /**
   * Get milestone criteria
   * @param {string} phase - Phase name
   * @returns {Array} - Criteria
   */
  getMilestoneCriteria(phase) {
    const criteria = {
      foundation: ['Project structure established', 'Build tools configured', 'Standards defined'],
      components: ['Core components implemented', 'Component tests passing', 'Documentation complete'],
      optimization: ['Performance improved by 20%', 'Bundle size reduced', 'Monitoring in place'],
      analysis: ['Bottlenecks identified', 'Performance baseline established'],
      implementation: ['Core functionality complete', 'API endpoints working', 'Basic validation in place'],
      testing: ['Test coverage > 80%', 'All tests passing', 'CI/CD pipeline working']
    };

    return criteria[phase] || [`${phase} phase completed`, `${phase} tests passing`];
  }

  /**
   * Define adaptation points
   * @param {Object} strategy - Strategy
   * @returns {Array} - Adaptation points
   */
  defineAdaptationPoints(strategy) {
    return strategy.phases.map((phase, index) => ({
      iteration: Math.ceil((index + 1) * 3), // Every 3 iterations
      phase,
      type: 'review',
      description: `Review and adapt ${phase} approach based on results`
    }));
  }

  /**
   * Identify risk factors
   * @param {string} codebaseSummary - Codebase summary
   * @param {string} userGoal - User goal
   * @returns {Array} - Risk factors
   */
  identifyRiskFactors(codebaseSummary, userGoal) {
    const risks = [];
    const summary = codebaseSummary.toLowerCase();

    if (!summary.includes('test')) {
      risks.push({
        type: 'quality',
        level: 'high',
        description: 'No testing infrastructure detected',
        mitigation: 'Prioritize test setup in early iterations'
      });
    }

    if (summary.includes('legacy') || summary.includes('old')) {
      risks.push({
        type: 'technical_debt',
        level: 'medium',
        description: 'Legacy code detected',
        mitigation: 'Plan gradual refactoring approach'
      });
    }

    if (userGoal.includes('performance') && !summary.includes('monitoring')) {
      risks.push({
        type: 'visibility',
        level: 'medium',
        description: 'No performance monitoring detected',
        mitigation: 'Implement monitoring before optimization'
      });
    }

    return risks;
  }

  /**
   * Get next iteration plan
   * @param {string} loopId - Loop ID
   * @param {number} currentIteration - Current iteration
   * @param {Object} lastResult - Last iteration result
   * @returns {Object} - Next iteration plan
   */
  getNextIterationPlan(loopId, currentIteration, lastResult = null) {
    const plan = this.iterationPlans.get(loopId);
    if (!plan) {return null;}

    // Update plan based on results
    if (lastResult) {
      this.updatePlanWithResults(plan, currentIteration, lastResult);
    }

    const currentPhase = this.getCurrentPhase(plan, currentIteration);
    const nextTasks = this.getNextTasks(plan, currentPhase);
    const dependencies = this.checkDependencies(plan, currentPhase);

    return {
      iteration: currentIteration + 1,
      phase: currentPhase,
      tasks: nextTasks,
      dependencies,
      focus: this.getIterationFocus(plan, currentPhase, currentIteration),
      adaptationNeeded: this.checkAdaptationNeeded(plan, currentIteration),
      milestoneProgress: this.getMilestoneProgress(plan, currentIteration)
    };
  }

  /**
   * Update plan with results
   * @param {Object} plan - Iteration plan
   * @param {number} iteration - Current iteration
   * @param {Object} result - Iteration result
   */
  updatePlanWithResults(plan, iteration, result) {
    const completed = this.completedTasks.get(plan.loopId);

    if (result.success) {
      // Mark tasks as completed
      if (result.completedTasks) {
        result.completedTasks.forEach(task => completed.add(task));
      }

      // Update phase progress
      const currentPhase = this.getCurrentPhase(plan, iteration);
      if (currentPhase) {
        const phase = plan.phases.find(p => p.name === currentPhase.name);
        if (phase && !phase.startIteration) {
          phase.startIteration = iteration;
        }
      }
    }

    // Adapt plan if needed
    if (result.adaptationSuggested) {
      this.adaptPlan(plan, iteration, result.adaptationReason);
    }
  }

  /**
   * Get current phase
   * @param {Object} plan - Iteration plan
   * @param {number} iteration - Current iteration
   * @returns {Object} - Current phase
   */
  getCurrentPhase(plan, iteration) {
    // Simple phase progression based on iteration count
    const iterationsPerPhase = Math.ceil(plan.estimatedIterations / plan.totalPhases);
    const phaseIndex = Math.min(
      Math.floor((iteration - 1) / iterationsPerPhase),
      plan.totalPhases - 1
    );

    return plan.phases[phaseIndex];
  }

  /**
   * Get next tasks for phase
   * @param {Object} plan - Iteration plan
   * @param {Object} phase - Current phase
   * @returns {Array} - Next tasks
   */
  getNextTasks(plan, phase) {
    if (!phase) {return [];}

    const completed = this.completedTasks.get(plan.loopId);
    const pendingTasks = phase.tasks.filter(task =>
      !completed.has(task.name) && task.status === 'pending'
    );

    return pendingTasks.slice(0, 2); // Return next 2 tasks
  }

  /**
   * Check dependencies
   * @param {Object} plan - Iteration plan
   * @param {Object} phase - Current phase
   * @returns {Object} - Dependency status
   */
  checkDependencies(plan, phase) {
    if (!phase || !phase.prerequisites.length) {
      return { satisfied: true, missing: [] };
    }

    const completed = this.completedTasks.get(plan.loopId);
    const missing = phase.prerequisites.filter(prereq => {
      const prereqPhase = plan.phases.find(p => p.name === prereq);
      return !prereqPhase || prereqPhase.status !== 'completed';
    });

    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  /**
   * Get iteration focus
   * @param {Object} plan - Iteration plan
   * @param {Object} phase - Current phase
   * @param {number} iteration - Current iteration
   * @returns {string} - Iteration focus
   */
  getIterationFocus(plan, phase, iteration) {
    if (!phase) {return 'general improvement';}

    const phaseProgress = this.getPhaseProgress(plan, phase, iteration);

    if (phaseProgress < 0.3) {
      return `Start ${phase.name} phase`;
    } else if (phaseProgress < 0.7) {
      return `Continue ${phase.name} development`;
    } else {
      return `Complete ${phase.name} phase`;
    }
  }

  /**
   * Get phase progress
   * @param {Object} plan - Iteration plan
   * @param {Object} phase - Current phase
   * @param {number} iteration - Current iteration
   * @returns {number} - Progress (0-1)
   */
  getPhaseProgress(plan, phase, iteration) {
    if (!phase.startIteration) {return 0;}

    const phaseIterations = iteration - phase.startIteration + 1;
    return Math.min(phaseIterations / phase.estimatedIterations, 1);
  }

  /**
   * Check if adaptation is needed
   * @param {Object} plan - Iteration plan
   * @param {number} iteration - Current iteration
   * @returns {boolean} - Whether adaptation is needed
   */
  checkAdaptationNeeded(plan, iteration) {
    return plan.adaptationPoints.some(point => point.iteration === iteration);
  }

  /**
   * Get milestone progress
   * @param {Object} plan - Iteration plan
   * @param {number} iteration - Current iteration
   * @returns {Object} - Milestone progress
   */
  getMilestoneProgress(plan, iteration) {
    const completed = this.completedTasks.get(plan.loopId);
    const totalMilestones = plan.milestones.length;
    const completedMilestones = plan.milestones.filter(milestone => {
      const phase = plan.phases.find(p => p.name === milestone.phase);
      return phase && phase.status === 'completed';
    }).length;

    return {
      completed: completedMilestones,
      total: totalMilestones,
      percentage: Math.round((completedMilestones / totalMilestones) * 100),
      nextMilestone: plan.milestones.find(m => {
        const phase = plan.phases.find(p => p.name === m.phase);
        return phase && phase.status !== 'completed';
      })
    };
  }

  /**
   * Adapt plan based on results
   * @param {Object} plan - Iteration plan
   * @param {number} iteration - Current iteration
   * @param {string} reason - Adaptation reason
   */
  adaptPlan(plan, iteration, reason) {
    console.error(`[ITERATION PLANNER] Adapting plan for loop ${plan.loopId}: ${reason}`);

    // Simple adaptation logic - can be enhanced
    const currentPhase = this.getCurrentPhase(plan, iteration);
    if (currentPhase && currentPhase.adaptable) {
      currentPhase.estimatedIterations += 2; // Extend phase if needed
      plan.estimatedIterations += 2;
    }

    this.emit('planAdapted', { loopId: plan.loopId, iteration, reason, plan });
  }

  /**
   * Get plan summary
   * @param {string} loopId - Loop ID
   * @returns {Object} - Plan summary
   */
  getPlanSummary(loopId) {
    const plan = this.iterationPlans.get(loopId);
    if (!plan) {return null;}

    const completed = this.completedTasks.get(loopId);

    return {
      strategy: Object.keys(this.planningStrategies).find(key =>
        this.planningStrategies[key] === plan.strategy
      ),
      complexity: plan.complexity,
      totalPhases: plan.totalPhases,
      estimatedIterations: plan.estimatedIterations,
      completedTasks: completed.size,
      milestones: plan.milestones.length,
      riskFactors: plan.riskFactors.length
    };
  }
}
