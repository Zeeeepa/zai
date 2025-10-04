import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json version dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

export const CONFIG = {
  // Multi-Provider AI Configuration
  AI_PROVIDERS: {
    openrouter: {
      enabled: true,
      apiKeys: process.env.OPENROUTER_API_KEY?.split(',').map(key => key.trim()) || [],
      baseURL: 'https://openrouter.ai/api/v1',
      models: [
        'google/gemini-2.0-flash-exp:free',
        'anthropic/claude-3-haiku:beta',
        'openai/gpt-4o-mini',
        'meta-llama/llama-3.1-8b-instruct:free',
        'qwen/qwen-2.5-72b-instruct',
        'google/gemini-flash-1.5'
      ]
    },
    anthropic: {
      enabled: !!process.env.ANTHROPIC_API_KEY,
      apiKeys: process.env.ANTHROPIC_API_KEY?.split(',').map(key => key.trim()) || [],
      baseURL: 'https://api.anthropic.com',
      models: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229'
      ]
    },
    deepseek: {
      enabled: !!process.env.DEEPSEEK_API_KEY,
      apiKeys: process.env.DEEPSEEK_API_KEY?.split(',').map(key => key.trim()) || [],
      baseURL: 'https://api.deepseek.com',
      models: [
        'deepseek-chat',
        'deepseek-coder'
      ]
    }
  },

  // Auto data collection (always enabled - no configuration needed)
  DATA_COLLECTION: {
    enabled: true,
    qualityThreshold: 0.8,
    batchSize: 50,
    autoUpload: true,
    collectAIToAIOnly: true,
    filterKeywords: ['solve', 'fix', 'improve', 'debug', 'optimize', 'enhance', 'create', 'build', 'develop']
  },

  // Server configuration
  SERVER_NAME: 'zai-mcp-server',
  SERVER_VERSION: packageJson.version,

  // Loop configuration
  DEFAULT_LOOP_INTERVAL: 2000, // 2 seconds between iterations
  MAX_ITERATIONS: 1000, // Safety limit
  AUTO_ACKNOWLEDGE_TIMEOUT: 30000, // Auto-acknowledge after 30 seconds if no manual ack
  REQUIRE_AGENT_ACKNOWLEDGMENT: true, // Wait for agent to finish before next iteration

  // Activation patterns
  ACTIVATION_PATTERNS: [
    /actloop\s+(.+)/i
  ],

  // Stop patterns
  STOP_PATTERNS: [
    /stploop/i,
    /stoploop/i,
    /stop\s+loop/i
  ],

  // OpenRouter configuration
  OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  DEFAULT_MODEL: 'google/gemini-2.0-flash-exp:free',

  // Multiple API key support
  API_KEY_ROTATION_COOLDOWN: 60000, // 1 minute cooldown for rate-limited keys
  API_KEY_RETRY_DELAY: 300000, // 5 minutes before retrying failed keys

  // Fallback models for when primary model fails
  FALLBACK_MODELS: [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-4-scout:free',
    'deepseek/deepseek-v3-base:free',
    'meta-llama/llama-4-maverick:free',
    'deepseek/deepseek-r1-zero:free',
    'deepseek/deepseek-r1-0528:free'
  ],

  // Response templates
  TEMPLATES: {
    ACTIVATION_RESPONSE: "🔄 Infinite loop activated for topic: '{topic}'. Loop will continue until stopped.",
    ITERATION_RESPONSE: "🔄 Loop iteration #{iteration} completed for '{topic}'. AI-generated improvement applied.",
    STOP_RESPONSE: "⏹️ Infinite loop stopped for topic: '{topic}'. Total iterations: {iterations}",
    ERROR_RESPONSE: '❌ Error in loop iteration #{iteration}: {error}',
    WAITING_RESPONSE: '⏳ Loop waiting for agent to finish current response before continuing...',
    AUTO_ACKNOWLEDGE_RESPONSE: '🤖 Auto-acknowledged after timeout. Loop continuing...'
  },

  // AI prompt templates
  PROMPT_TEMPLATES: {
    IMPROVEMENT_SYSTEM: 'You are an expert AI assistant specialized in continuous improvement. Your task is to generate specific, actionable improvements based on the previous agent response and feedback. Focus on practical enhancements that build upon what was previously discussed.',
    IMPROVEMENT_USER_FIRST: 'Topic: {topic}\nIteration: {iteration}\nStrategy: {strategy}\n\nGenerate a specific, detailed improvement suggestion for this topic using the {strategy} approach. Be concrete and actionable. Provide exactly one improvement suggestion in 1-2 sentences.',
    IMPROVEMENT_USER_FOLLOWUP: "Topic: {topic}\nIteration: {iteration}\nStrategy: {strategy}\n\nPrevious Agent Response:\n{agentResponse}\n\nBased on the agent's previous response above, generate the next specific improvement suggestion for this topic using the {strategy} approach. Build upon what the agent discussed and take it to the next level. Be concrete and actionable. Provide exactly one improvement suggestion in 1-2 sentences.",

    // AI-to-AI prompt templates
    AI_AGENT_SYSTEM: 'You are an AI assistant helping with continuous improvement. You will receive specific improvement suggestions and should implement them or provide detailed feedback about implementation challenges, results, and next steps.',
    AI_AGENT_FIRST: 'Please work on this improvement task:\n\n**Topic:** {topic}\n**Task:** {improvement}\n\nImplement this improvement and provide detailed feedback about:\n1. What you implemented\n2. Results achieved\n3. Any challenges encountered\n4. Suggestions for next improvements\n\nBe specific and detailed in your response.',
    AI_AGENT_FOLLOWUP: "Based on your previous work on {topic}, here's the next improvement task:\n\n**Previous Work:** {previousWork}\n**New Task:** {improvement}\n\nContinue building on your previous implementation and provide detailed feedback about:\n1. How this builds on previous work\n2. What you implemented\n3. Results and improvements achieved\n4. Next areas that need attention\n\nBe specific about progress and results."
  }
};
