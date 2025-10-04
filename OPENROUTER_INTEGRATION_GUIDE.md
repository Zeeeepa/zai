# OpenRouter Integration Guide

## Overview

The MCP Infinite Loop Server now integrates with OpenRouter to provide AI-powered improvements using Google's Gemini 2.0 Flash model. This guide explains how to set up and use the AI features.

## Quick Setup

### 1. Get OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Get your API key from the dashboard

### 2. Configure Environment
```bash
export OPENROUTER_API_KEY="your-api-key-here"
export MODEL="google/gemini-2.0-flash-exp:free"
```

### 3. Test the Integration
```bash
npm run test:openrouter
```

## MCP Client Configuration

### For Claude Desktop or other MCP clients:

```json
{
  "mcpServers": {
    "mcp-infinite-loop-server": {
      "command": "npx",
      "args": ["-y", "mcp-infinite-loop-server"],
      "env": {
        "OPENROUTER_API_KEY": "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",
        "MODEL": "google/gemini-2.0-flash-exp:free"
      }
    }
  }
}
```

## New Activation Command

### Simple Format
Use the new simplified activation command:

```
actloop optimize database performance
```

### Examples
- `actloop improve code quality`
- `actloop enhance user experience`
- `actloop refactor legacy systems`
- `actloop optimize API endpoints`

## AI-Powered Improvements

### How It Works
1. **User activates loop** with `actloop {topic}`
2. **Server processes topic** using the specified improvement strategy
3. **AI generates specific suggestions** via OpenRouter/Gemini
4. **Server sends AI-generated improvement** to agent
5. **Waits for agent acknowledgment** before continuing
6. **Repeats with next strategy** (optimization → refactoring → performance → etc.)

### Example AI Output
Instead of generic improvements like:
```
"Optimized database performance for better performance (iteration 1)"
```

You get specific AI suggestions like:
```
"Implement connection pooling with a maximum of 20 connections and add query result caching for frequently accessed data to reduce database load by 40-60%."
```

## Fallback System

### When API Fails
- **Rate limits**: Falls back to local improvements
- **Network issues**: Uses built-in fallback suggestions
- **Invalid API key**: Continues with local generation
- **Model unavailable**: Switches to backup improvements

### No API Key
The server works perfectly without an API key:
- Uses intelligent local improvement templates
- Maintains all loop functionality
- Provides structured improvement suggestions

## Supported Models

### Multi-Model Fallback System
The server automatically tries multiple models when one fails:

1. **google/gemini-2.0-flash-exp:free** (Primary)
2. **meta-llama/llama-4-scout:free** (Fallback 1)
3. **deepseek/deepseek-v3-base:free** (Fallback 2)
4. **meta-llama/llama-4-maverick:free** (Fallback 3)
5. **deepseek/deepseek-r1-zero:free** (Fallback 4)
6. **deepseek/deepseek-r1-0528:free** (Fallback 5)

### How Fallback Works
- **429 Rate Limit**: Automatically tries next model
- **Model Unavailable**: Switches to available model
- **Network Issues**: Retries with different model
- **All Models Failed**: Uses local fallback generation

### Custom Primary Model
You can set any model as primary:
```bash
export MODEL="meta-llama/llama-4-scout:free"
```
The fallback system will still use all available models.

## Cost Management

### Free Tier
- Gemini 2.0 Flash Experimental is free
- Rate limited but sufficient for testing
- No credit card required

### Paid Tiers
- Higher rate limits
- Access to premium models
- Better performance guarantees

## Monitoring and Debugging

### Server Logs
The server provides detailed logging:
```
[COMMAND PROCESSOR] OpenRouter client initialized
[AI GENERATION] Generating improvement for "database optimization" using optimization strategy...
[OPENROUTER] Tokens used: 45 (prompt: 32, completion: 13)
[AI GENERATION] Generated: Implement connection pooling with...
```

### Error Handling
```
[OPENROUTER ERROR] OpenRouter API error: 429 - Rate limited
[AI GENERATION ERROR] Network timeout, falling back to local generation
```

### Testing Commands
```bash
# Test basic functionality
npm test

# Test with OpenRouter integration and fallback models
npm run test:openrouter

# Run agent synchronization demo
npm run demo:sync
```

### Model Management Tools
```json
// Check which models are available/failed
{
  "name": "get_model_status",
  "arguments": {}
}

// Reset failed models to retry them
{
  "name": "reset_failed_models",
  "arguments": {}
}
```

## Best Practices

### 1. API Key Security
- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly

### 2. Rate Limit Management
- Start with free tier to test
- Monitor usage in OpenRouter dashboard
- Implement retry logic for production

### 3. Topic Selection
- Be specific: "optimize database queries" vs "improve performance"
- Use actionable topics: "refactor authentication system"
- Avoid vague topics: "make it better"

### 4. Loop Management
- Set reasonable maxIterations (10-50)
- Use appropriate intervals (2-5 seconds)
- Monitor agent acknowledgments

## Troubleshooting

### Common Issues

**1. Rate Limiting**
```
Error: 429 - Rate limited
Solution: Wait and retry, or upgrade to paid tier
```

**2. Invalid API Key**
```
Error: 401 - Unauthorized
Solution: Check OPENROUTER_API_KEY environment variable
```

**3. Model Not Available**
```
Error: Model not found
Solution: Check MODEL environment variable, use supported model
```

**4. Network Issues**
```
Error: Network timeout
Solution: Check internet connection, server will use fallback
```

### Debug Mode
Set debug environment variable for verbose logging:
```bash
export DEBUG=true
npm start
```

## Integration Examples

### With Claude Desktop
1. Add server to MCP configuration
2. Restart Claude Desktop
3. Use `actloop` commands in conversation
4. Claude will receive AI-generated improvements

### With Custom MCP Client
```javascript
// Send activation request
await client.request('tools/call', {
  name: 'activate_infinite_loop',
  arguments: {
    message: 'actloop optimize API performance'
  }
});

// Handle responses
client.on('agentResponse', (data) => {
  console.log('AI Improvement:', data.improvement);
  
  // Acknowledge when done processing
  client.request('tools/call', {
    name: 'acknowledge_agent_response',
    arguments: { loopId: data.loopId }
  });
});
```

## Performance Optimization

### Token Usage
- Average: 30-50 tokens per improvement
- Cost: ~$0.0001 per improvement (paid tier)
- Free tier: ~1000 improvements per day

### Response Time
- With API: 1-3 seconds per improvement
- Fallback: <100ms per improvement
- Network dependent

### Caching
The server doesn't cache responses to ensure fresh improvements each iteration. For production use, consider implementing caching based on your needs.

## Support

For issues or questions:
1. Check server logs for error messages
2. Test with `npm run test:openrouter`
3. Verify API key and model configuration
4. Review OpenRouter dashboard for usage/limits
