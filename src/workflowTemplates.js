/**
 * Workflow Templates System
 * Pre-built templates for web development, API development, data analysis, ML pipelines, and DevOps automation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class WorkflowTemplates {
    constructor(options = {}) {
        this.templatesDir = options.templatesDir || './templates';
        this.customTemplatesDir = options.customTemplatesDir || './custom-templates';
        this.maxCustomTemplates = options.maxCustomTemplates || 50;
        
        this.builtInTemplates = new Map();
        this.customTemplates = new Map();
        this.templateUsage = new Map();
        this.templateCategories = new Set();
        
        console.log('📋 Workflow Templates System initialized');

        // Load built-in templates immediately (synchronous)
        this.loadBuiltInTemplates();
        console.log(`✅ Loaded ${this.builtInTemplates.size} built-in templates`);

        // Initialize directories and load custom templates (async)
        this.initializeTemplates();
    }

    async initializeTemplates() {
        try {
            await fs.mkdir(this.templatesDir, { recursive: true });
            await fs.mkdir(this.customTemplatesDir, { recursive: true });

            await this.loadCustomTemplates();

            console.log(`📁 Templates directory initialized: ${this.templatesDir}`);
            console.log(`📁 Custom templates directory: ${this.customTemplatesDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize templates directory:', error.message);
            console.error('Full error:', error);
        }
    }

    loadBuiltInTemplates() {
        // Web Development Templates
        this.addBuiltInTemplate('react-dashboard', {
            name: 'React Dashboard Application',
            category: 'web_development',
            description: 'Complete React dashboard with routing, state management, and UI components',
            framework: 'react',
            complexity: 'medium',
            estimatedTime: '2-3 days',
            tags: ['react', 'dashboard', 'typescript', 'tailwind'],
            steps: [
                {
                    id: 'setup',
                    title: 'Project Setup',
                    description: 'Initialize React project with TypeScript and essential dependencies',
                    tasks: [
                        'Create React app with TypeScript template',
                        'Install UI library (Tailwind CSS, Material-UI, or Chakra UI)',
                        'Setup routing with React Router',
                        'Configure state management (Redux Toolkit or Zustand)',
                        'Setup development tools (ESLint, Prettier, Husky)'
                    ],
                    estimatedTime: '2-4 hours'
                },
                {
                    id: 'layout',
                    title: 'Layout & Navigation',
                    description: 'Create responsive layout with navigation components',
                    tasks: [
                        'Design sidebar navigation component',
                        'Create header with user menu and notifications',
                        'Implement responsive layout container',
                        'Add breadcrumb navigation',
                        'Setup theme provider and dark mode toggle'
                    ],
                    estimatedTime: '4-6 hours'
                },
                {
                    id: 'components',
                    title: 'Dashboard Components',
                    description: 'Build reusable dashboard components',
                    tasks: [
                        'Create data visualization components (charts, graphs)',
                        'Build metric cards and KPI displays',
                        'Implement data tables with sorting and filtering',
                        'Add loading states and error boundaries',
                        'Create modal and notification components'
                    ],
                    estimatedTime: '6-8 hours'
                },
                {
                    id: 'integration',
                    title: 'API Integration',
                    description: 'Connect dashboard to backend APIs',
                    tasks: [
                        'Setup API client (Axios or React Query)',
                        'Implement authentication flow',
                        'Create data fetching hooks',
                        'Add error handling and retry logic',
                        'Implement real-time updates (WebSocket or polling)'
                    ],
                    estimatedTime: '4-6 hours'
                },
                {
                    id: 'testing',
                    title: 'Testing & Deployment',
                    description: 'Test application and prepare for deployment',
                    tasks: [
                        'Write unit tests for components',
                        'Add integration tests for user flows',
                        'Setup end-to-end testing with Cypress',
                        'Configure build optimization',
                        'Deploy to hosting platform (Vercel, Netlify, or AWS)'
                    ],
                    estimatedTime: '3-4 hours'
                }
            ],
            dependencies: ['Node.js 18+', 'npm/yarn', 'Git'],
            resources: [
                'React Documentation: https://react.dev',
                'TypeScript Handbook: https://www.typescriptlang.org/docs',
                'Tailwind CSS: https://tailwindcss.com',
                'React Router: https://reactrouter.com'
            ]
        });

        this.addBuiltInTemplate('rest-api', {
            name: 'REST API with Node.js',
            category: 'api_development',
            description: 'Scalable REST API with authentication, validation, and database integration',
            framework: 'nodejs',
            complexity: 'medium',
            estimatedTime: '2-4 days',
            tags: ['nodejs', 'express', 'mongodb', 'jwt', 'rest'],
            steps: [
                {
                    id: 'setup',
                    title: 'Project Setup',
                    description: 'Initialize Node.js project with essential dependencies',
                    tasks: [
                        'Initialize npm project with TypeScript',
                        'Install Express.js and middleware packages',
                        'Setup database connection (MongoDB/PostgreSQL)',
                        'Configure environment variables',
                        'Setup development tools (nodemon, ts-node)'
                    ],
                    estimatedTime: '1-2 hours'
                },
                {
                    id: 'auth',
                    title: 'Authentication System',
                    description: 'Implement JWT-based authentication',
                    tasks: [
                        'Create user model and schema',
                        'Implement registration and login endpoints',
                        'Setup JWT token generation and validation',
                        'Add password hashing with bcrypt',
                        'Create authentication middleware'
                    ],
                    estimatedTime: '3-4 hours'
                },
                {
                    id: 'crud',
                    title: 'CRUD Operations',
                    description: 'Build core API endpoints with validation',
                    tasks: [
                        'Design database schemas and models',
                        'Implement CRUD endpoints for main entities',
                        'Add input validation with Joi or Yup',
                        'Setup error handling middleware',
                        'Implement pagination and filtering'
                    ],
                    estimatedTime: '4-6 hours'
                },
                {
                    id: 'features',
                    title: 'Advanced Features',
                    description: 'Add advanced API features',
                    tasks: [
                        'Implement rate limiting and security headers',
                        'Add file upload functionality',
                        'Setup email notifications',
                        'Implement search and advanced queries',
                        'Add API documentation with Swagger'
                    ],
                    estimatedTime: '3-5 hours'
                },
                {
                    id: 'deployment',
                    title: 'Testing & Deployment',
                    description: 'Test API and deploy to production',
                    tasks: [
                        'Write unit tests for endpoints',
                        'Add integration tests with supertest',
                        'Setup CI/CD pipeline',
                        'Configure production environment',
                        'Deploy to cloud platform (AWS, Heroku, DigitalOcean)'
                    ],
                    estimatedTime: '2-3 hours'
                }
            ],
            dependencies: ['Node.js 18+', 'MongoDB/PostgreSQL', 'Git'],
            resources: [
                'Express.js Documentation: https://expressjs.com',
                'MongoDB Documentation: https://docs.mongodb.com',
                'JWT.io: https://jwt.io',
                'Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices'
            ]
        });

        this.addBuiltInTemplate('data-analysis', {
            name: 'Data Analysis Pipeline',
            category: 'data_analysis',
            description: 'Complete data analysis workflow with visualization and reporting',
            framework: 'python',
            complexity: 'medium',
            estimatedTime: '1-2 days',
            tags: ['python', 'pandas', 'jupyter', 'visualization', 'analysis'],
            steps: [
                {
                    id: 'setup',
                    title: 'Environment Setup',
                    description: 'Setup Python environment and dependencies',
                    tasks: [
                        'Create virtual environment',
                        'Install data science packages (pandas, numpy, matplotlib)',
                        'Setup Jupyter notebook environment',
                        'Configure data visualization libraries (seaborn, plotly)',
                        'Install additional tools (scikit-learn, statsmodels)'
                    ],
                    estimatedTime: '30-60 minutes'
                },
                {
                    id: 'ingestion',
                    title: 'Data Ingestion',
                    description: 'Load and prepare data for analysis',
                    tasks: [
                        'Load data from various sources (CSV, JSON, databases)',
                        'Perform initial data exploration and profiling',
                        'Handle missing values and data quality issues',
                        'Data type conversion and formatting',
                        'Create data validation checks'
                    ],
                    estimatedTime: '2-3 hours'
                },
                {
                    id: 'cleaning',
                    title: 'Data Cleaning & Preprocessing',
                    description: 'Clean and transform data for analysis',
                    tasks: [
                        'Remove duplicates and outliers',
                        'Handle missing data with appropriate strategies',
                        'Normalize and standardize data',
                        'Feature engineering and transformation',
                        'Create derived variables and aggregations'
                    ],
                    estimatedTime: '2-4 hours'
                },
                {
                    id: 'analysis',
                    title: 'Exploratory Data Analysis',
                    description: 'Perform comprehensive data analysis',
                    tasks: [
                        'Generate descriptive statistics',
                        'Create correlation analysis and heatmaps',
                        'Perform statistical tests and hypothesis testing',
                        'Identify patterns and trends in data',
                        'Segment analysis and cohort studies'
                    ],
                    estimatedTime: '3-5 hours'
                },
                {
                    id: 'visualization',
                    title: 'Data Visualization & Reporting',
                    description: 'Create visualizations and reports',
                    tasks: [
                        'Create interactive dashboards with Plotly/Dash',
                        'Generate static reports with matplotlib/seaborn',
                        'Build automated reporting pipeline',
                        'Export results to various formats (PDF, HTML, Excel)',
                        'Create presentation-ready visualizations'
                    ],
                    estimatedTime: '2-3 hours'
                }
            ],
            dependencies: ['Python 3.8+', 'pip/conda', 'Jupyter'],
            resources: [
                'Pandas Documentation: https://pandas.pydata.org/docs',
                'Matplotlib Gallery: https://matplotlib.org/stable/gallery',
                'Seaborn Tutorial: https://seaborn.pydata.org/tutorial.html',
                'Plotly Documentation: https://plotly.com/python'
            ]
        });

        this.addBuiltInTemplate('ml-pipeline', {
            name: 'Machine Learning Pipeline',
            category: 'machine_learning',
            description: 'End-to-end ML pipeline with model training, evaluation, and deployment',
            framework: 'python',
            complexity: 'high',
            estimatedTime: '3-5 days',
            tags: ['python', 'scikit-learn', 'tensorflow', 'mlops', 'deployment'],
            steps: [
                {
                    id: 'setup',
                    title: 'ML Environment Setup',
                    description: 'Setup machine learning development environment',
                    tasks: [
                        'Create ML-specific virtual environment',
                        'Install ML frameworks (scikit-learn, TensorFlow/PyTorch)',
                        'Setup experiment tracking (MLflow, Weights & Biases)',
                        'Configure data versioning (DVC)',
                        'Setup model registry and artifact storage'
                    ],
                    estimatedTime: '1-2 hours'
                },
                {
                    id: 'data',
                    title: 'Data Preparation',
                    description: 'Prepare and preprocess data for ML',
                    tasks: [
                        'Load and explore dataset',
                        'Perform feature engineering and selection',
                        'Handle categorical variables and encoding',
                        'Split data into train/validation/test sets',
                        'Implement data preprocessing pipeline'
                    ],
                    estimatedTime: '4-6 hours'
                },
                {
                    id: 'modeling',
                    title: 'Model Development',
                    description: 'Train and optimize ML models',
                    tasks: [
                        'Baseline model implementation',
                        'Hyperparameter tuning with cross-validation',
                        'Model comparison and selection',
                        'Feature importance analysis',
                        'Model interpretation and explainability'
                    ],
                    estimatedTime: '6-8 hours'
                },
                {
                    id: 'evaluation',
                    title: 'Model Evaluation',
                    description: 'Comprehensive model evaluation and validation',
                    tasks: [
                        'Performance metrics calculation',
                        'Cross-validation and robustness testing',
                        'Bias and fairness evaluation',
                        'Error analysis and failure cases',
                        'Model comparison and statistical testing'
                    ],
                    estimatedTime: '3-4 hours'
                },
                {
                    id: 'deployment',
                    title: 'Model Deployment',
                    description: 'Deploy model to production environment',
                    tasks: [
                        'Create model serving API (FastAPI/Flask)',
                        'Containerize application with Docker',
                        'Setup monitoring and logging',
                        'Implement A/B testing framework',
                        'Deploy to cloud platform (AWS/GCP/Azure)'
                    ],
                    estimatedTime: '4-6 hours'
                }
            ],
            dependencies: ['Python 3.8+', 'Docker', 'Cloud Platform Account'],
            resources: [
                'Scikit-learn Documentation: https://scikit-learn.org',
                'TensorFlow Guide: https://www.tensorflow.org/guide',
                'MLflow Documentation: https://mlflow.org/docs',
                'FastAPI Documentation: https://fastapi.tiangolo.com'
            ]
        });

        this.addBuiltInTemplate('devops-pipeline', {
            name: 'DevOps CI/CD Pipeline',
            category: 'devops',
            description: 'Complete CI/CD pipeline with automated testing, deployment, and monitoring',
            framework: 'docker',
            complexity: 'high',
            estimatedTime: '2-3 days',
            tags: ['docker', 'kubernetes', 'cicd', 'monitoring', 'automation'],
            steps: [
                {
                    id: 'containerization',
                    title: 'Application Containerization',
                    description: 'Containerize application with Docker',
                    tasks: [
                        'Create optimized Dockerfile',
                        'Setup multi-stage builds for production',
                        'Configure environment variables and secrets',
                        'Create docker-compose for local development',
                        'Implement health checks and monitoring endpoints'
                    ],
                    estimatedTime: '2-3 hours'
                },
                {
                    id: 'cicd',
                    title: 'CI/CD Pipeline Setup',
                    description: 'Implement automated CI/CD pipeline',
                    tasks: [
                        'Setup version control workflow (Git Flow)',
                        'Configure CI pipeline (GitHub Actions/GitLab CI)',
                        'Implement automated testing stages',
                        'Setup code quality checks (linting, security)',
                        'Configure automated deployment stages'
                    ],
                    estimatedTime: '4-5 hours'
                },
                {
                    id: 'orchestration',
                    title: 'Container Orchestration',
                    description: 'Deploy with Kubernetes or container platform',
                    tasks: [
                        'Create Kubernetes manifests (deployments, services)',
                        'Setup ingress and load balancing',
                        'Configure auto-scaling and resource limits',
                        'Implement rolling updates and rollback strategies',
                        'Setup persistent storage and config maps'
                    ],
                    estimatedTime: '4-6 hours'
                },
                {
                    id: 'monitoring',
                    title: 'Monitoring & Observability',
                    description: 'Implement comprehensive monitoring',
                    tasks: [
                        'Setup application metrics (Prometheus)',
                        'Configure log aggregation (ELK stack)',
                        'Implement distributed tracing (Jaeger)',
                        'Create monitoring dashboards (Grafana)',
                        'Setup alerting and incident response'
                    ],
                    estimatedTime: '3-4 hours'
                },
                {
                    id: 'security',
                    title: 'Security & Compliance',
                    description: 'Implement security best practices',
                    tasks: [
                        'Setup vulnerability scanning in CI/CD',
                        'Implement secrets management',
                        'Configure network policies and security groups',
                        'Setup backup and disaster recovery',
                        'Implement compliance monitoring and reporting'
                    ],
                    estimatedTime: '2-3 hours'
                }
            ],
            dependencies: ['Docker', 'Kubernetes/Cloud Platform', 'Git'],
            resources: [
                'Docker Documentation: https://docs.docker.com',
                'Kubernetes Documentation: https://kubernetes.io/docs',
                'Prometheus Documentation: https://prometheus.io/docs',
                'GitHub Actions: https://docs.github.com/en/actions'
            ]
        });
    }

    addBuiltInTemplate(id, template) {
        template.id = id;
        template.type = 'built-in';
        template.createdAt = Date.now();
        template.updatedAt = Date.now();
        template.usageCount = 0;
        
        this.builtInTemplates.set(id, template);
        this.templateCategories.add(template.category);
    }

    async loadCustomTemplates() {
        try {
            const customFile = path.join(this.customTemplatesDir, 'custom-templates.json');
            const usageFile = path.join(this.customTemplatesDir, 'template-usage.json');
            
            // Load custom templates
            try {
                const customData = await fs.readFile(customFile, 'utf8');
                const parsed = JSON.parse(customData);
                this.customTemplates = new Map(Object.entries(parsed));
                console.log(`📥 Loaded ${this.customTemplates.size} custom templates`);
            } catch (error) {
                console.log('📝 No existing custom templates found, starting fresh');
            }
            
            // Load usage data
            try {
                const usageData = await fs.readFile(usageFile, 'utf8');
                const parsed = JSON.parse(usageData);
                this.templateUsage = new Map(Object.entries(parsed));
                console.log(`📊 Loaded template usage data`);
            } catch (error) {
                console.log('📈 No existing usage data found, starting fresh');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load custom templates:', error.message);
        }
    }

    async saveCustomTemplates() {
        try {
            const customFile = path.join(this.customTemplatesDir, 'custom-templates.json');
            const usageFile = path.join(this.customTemplatesDir, 'template-usage.json');
            
            await fs.writeFile(customFile, JSON.stringify(Object.fromEntries(this.customTemplates), null, 2));
            await fs.writeFile(usageFile, JSON.stringify(Object.fromEntries(this.templateUsage), null, 2));
            
            console.log('💾 Custom templates and usage data saved');
        } catch (error) {
            console.warn('⚠️ Failed to save custom templates:', error.message);
        }
    }

    getAllTemplates() {
        const allTemplates = new Map([...this.builtInTemplates, ...this.customTemplates]);
        return Array.from(allTemplates.values()).sort((a, b) => {
            // Sort by usage count (descending) then by name
            const usageA = this.templateUsage.get(a.id)?.count || 0;
            const usageB = this.templateUsage.get(b.id)?.count || 0;
            
            if (usageA !== usageB) {
                return usageB - usageA;
            }
            
            return a.name.localeCompare(b.name);
        });
    }

    getTemplatesByCategory(category) {
        return this.getAllTemplates().filter(template => template.category === category);
    }

    getTemplate(templateId) {
        return this.builtInTemplates.get(templateId) || this.customTemplates.get(templateId);
    }

    searchTemplates(query, filters = {}) {
        const allTemplates = this.getAllTemplates();
        const queryLower = query.toLowerCase();
        
        let results = allTemplates.filter(template => {
            // Text search
            const matchesQuery = !query || 
                template.name.toLowerCase().includes(queryLower) ||
                template.description.toLowerCase().includes(queryLower) ||
                template.tags.some(tag => tag.toLowerCase().includes(queryLower));
            
            // Category filter
            const matchesCategory = !filters.category || template.category === filters.category;
            
            // Framework filter
            const matchesFramework = !filters.framework || template.framework === filters.framework;
            
            // Complexity filter
            const matchesComplexity = !filters.complexity || template.complexity === filters.complexity;
            
            // Tags filter
            const matchesTags = !filters.tags || filters.tags.every(tag => 
                template.tags.some(templateTag => templateTag.toLowerCase().includes(tag.toLowerCase()))
            );
            
            return matchesQuery && matchesCategory && matchesFramework && matchesComplexity && matchesTags;
        });
        
        return results;
    }

    async createCustomTemplate(templateData) {
        const templateId = crypto.randomBytes(8).toString('hex');
        
        const template = {
            id: templateId,
            type: 'custom',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
            ...templateData
        };
        
        // Validate required fields
        const requiredFields = ['name', 'category', 'description', 'steps'];
        for (const field of requiredFields) {
            if (!template[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Check custom template limit
        if (this.customTemplates.size >= this.maxCustomTemplates) {
            throw new Error(`Maximum custom templates limit reached (${this.maxCustomTemplates})`);
        }
        
        this.customTemplates.set(templateId, template);
        this.templateCategories.add(template.category);
        
        await this.saveCustomTemplates();
        
        console.log(`📝 Created custom template: ${template.name} (${templateId})`);
        return templateId;
    }

    async updateCustomTemplate(templateId, updates) {
        const template = this.customTemplates.get(templateId);
        if (!template) {
            throw new Error(`Custom template ${templateId} not found`);
        }
        
        Object.assign(template, updates);
        template.updatedAt = Date.now();
        
        await this.saveCustomTemplates();
        
        console.log(`📝 Updated custom template: ${template.name}`);
        return template;
    }

    async deleteCustomTemplate(templateId) {
        const template = this.customTemplates.get(templateId);
        if (!template) {
            throw new Error(`Custom template ${templateId} not found`);
        }
        
        this.customTemplates.delete(templateId);
        this.templateUsage.delete(templateId);
        
        await this.saveCustomTemplates();
        
        console.log(`🗑️ Deleted custom template: ${template.name}`);
        return true;
    }

    recordTemplateUsage(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) return;
        
        // Update template usage count
        template.usageCount = (template.usageCount || 0) + 1;
        
        // Update usage tracking
        if (!this.templateUsage.has(templateId)) {
            this.templateUsage.set(templateId, {
                count: 0,
                lastUsed: Date.now(),
                firstUsed: Date.now()
            });
        }
        
        const usage = this.templateUsage.get(templateId);
        usage.count++;
        usage.lastUsed = Date.now();
        
        // Save usage data periodically
        if (usage.count % 5 === 0) {
            this.saveCustomTemplates();
        }
        
        console.log(`📊 Recorded usage for template: ${template.name} (${usage.count} times)`);
    }

    getTemplateAnalytics() {
        const allTemplates = this.getAllTemplates();
        const totalTemplates = allTemplates.length;
        const builtInCount = this.builtInTemplates.size;
        const customCount = this.customTemplates.size;
        
        const categoryStats = {};
        const frameworkStats = {};
        const complexityStats = {};
        
        allTemplates.forEach(template => {
            // Category stats
            categoryStats[template.category] = (categoryStats[template.category] || 0) + 1;
            
            // Framework stats
            if (template.framework) {
                frameworkStats[template.framework] = (frameworkStats[template.framework] || 0) + 1;
            }
            
            // Complexity stats
            if (template.complexity) {
                complexityStats[template.complexity] = (complexityStats[template.complexity] || 0) + 1;
            }
        });
        
        const mostUsedTemplates = allTemplates
            .filter(t => t.usageCount > 0)
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5)
            .map(t => ({ id: t.id, name: t.name, usageCount: t.usageCount }));
        
        return {
            totalTemplates,
            builtInCount,
            customCount,
            categories: Object.keys(categoryStats).length,
            categoryStats,
            frameworkStats,
            complexityStats,
            mostUsedTemplates,
            totalUsage: Array.from(this.templateUsage.values()).reduce((sum, usage) => sum + usage.count, 0)
        };
    }

    getRecommendedTemplates(context = {}, limit = 5) {
        const allTemplates = this.getAllTemplates();
        
        // Score templates based on context and usage
        const scoredTemplates = allTemplates.map(template => {
            let score = 0;
            
            // Base score from usage
            score += (template.usageCount || 0) * 0.3;
            
            // Context matching
            if (context.category && template.category === context.category) score += 2;
            if (context.framework && template.framework === context.framework) score += 1.5;
            if (context.complexity && template.complexity === context.complexity) score += 1;
            
            // Tag matching
            if (context.tags && template.tags) {
                const matchingTags = context.tags.filter(tag => 
                    template.tags.some(templateTag => templateTag.toLowerCase().includes(tag.toLowerCase()))
                );
                score += matchingTags.length * 0.5;
            }
            
            // Recency bonus for custom templates
            if (template.type === 'custom') {
                const daysSinceCreated = (Date.now() - template.createdAt) / (1000 * 60 * 60 * 24);
                if (daysSinceCreated < 30) score += 0.5;
            }
            
            return { ...template, score };
        });
        
        return scoredTemplates
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    async clearCustomTemplates() {
        this.customTemplates.clear();
        this.templateUsage.clear();
        
        try {
            await fs.rm(this.customTemplatesDir, { recursive: true, force: true });
            await this.initializeTemplates();
            console.log('🗑️ Custom templates cleared successfully');
        } catch (error) {
            console.warn('⚠️ Failed to clear custom templates directory:', error.message);
        }
    }
}
