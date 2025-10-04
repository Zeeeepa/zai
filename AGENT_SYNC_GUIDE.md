# Agent Synchronization Guide

## Overview

The MCP Infinite Loop Server now includes **agent synchronization** to ensure proper conversation flow. When a loop iteration completes, the server waits for the agent to finish processing the current response before sending the next iteration.

## How Agent Synchronization Works

### 1. Loop Iteration Process
```
1. Loop processes topic → 2. Sends response to agent → 3. WAITS for agent acknowledgment → 4. Continues to next iteration
```

### 2. Agent States
- **🟢 Available**: Agent can receive new loop responses
- **🔴 Busy**: Agent is processing a response, loops wait
- **⏳ Pending**: Responses waiting for acknowledgment

### 3. Automatic Timeout
- If no acknowledgment is received within 30 seconds (configurable), the loop auto-continues
- This prevents infinite waiting if acknowledgment is missed

## Usage Examples

### Basic Loop with Manual Acknowledgment

1. **Activate Loop:**
```json
{
  "name": "activate_infinite_loop",
  "arguments": {
    "message": "Activate Loop Command like improve database performance"
  }
}
```

2. **Loop Sends First Response:**
```
🔄 Loop iteration #1 completed for 'improve database performance'. Improvements applied.
[IMPROVEMENT] Optimized improve database performance for better performance (iteration 1)
[NEXT ACTION] Analyze performance metrics
[WAITING] Loop loop_1_1234567890 waiting for agent acknowledgment...
```

3. **Agent Acknowledges (when ready):**
```json
{
  "name": "acknowledge_agent_response",
  "arguments": {
    "loopId": "loop_1_1234567890"
  }
}
```

4. **Loop Continues:**
```
✅ Agent response acknowledged for loop loop_1_1234567890. Loop can continue.
🔄 Loop iteration #2 completed for 'improve database performance'. Improvements applied.
```

### Monitoring Agent Status

**Check if agent is busy:**
```json
{
  "name": "check_agent_status",
  "arguments": {}
}
```

**Response:**
```
📊 Agent Status
Status: 🔴 Busy
Pending Responses: 2
Loops are waiting for acknowledgment before continuing.
```

**Get pending responses:**
```json
{
  "name": "get_pending_responses",
  "arguments": {}
}
```

**Response:**
```
⏳ Pending Responses (2)

loop_1_1234567890
  Iteration: 3
  Waiting: 15s
  Since: 2:30:45 PM

loop_2_1234567891
  Iteration: 1
  Waiting: 5s
  Since: 2:30:55 PM

Use 'acknowledge_agent_response' to allow loops to continue.
```

## Emergency Controls

### Force Clear Busy State
If the agent gets stuck, you can force clear the busy state:

```json
{
  "name": "clear_agent_busy_state",
  "arguments": {}
}
```

This will:
- Clear all pending responses
- Set agent status to available
- Allow all loops to continue immediately

## Configuration Options

Edit `src/config.js`:

```javascript
export const CONFIG = {
  // Agent synchronization settings
  AUTO_ACKNOWLEDGE_TIMEOUT: 30000, // Auto-acknowledge after 30 seconds
  REQUIRE_AGENT_ACKNOWLEDGMENT: true, // Enable/disable synchronization
  
  // Other settings...
};
```

### Disable Synchronization
Set `REQUIRE_AGENT_ACKNOWLEDGMENT: false` to disable waiting and run loops continuously without acknowledgment.

## Best Practices

### 1. Acknowledge Promptly
- Acknowledge responses as soon as the agent finishes processing
- Don't let responses pile up unnecessarily

### 2. Monitor Pending Responses
- Regularly check `get_pending_responses` to see waiting loops
- Use `check_agent_status` to monitor overall state

### 3. Use Auto-Acknowledgment
- The 30-second timeout prevents infinite waiting
- Adjust timeout based on your agent's typical response time

### 4. Emergency Recovery
- Use `clear_agent_busy_state` if the system gets stuck
- This is safe and will not harm running loops

## Workflow Integration

### For MCP Clients
1. **Receive loop response** from server
2. **Process the response** (generate reply, update UI, etc.)
3. **Call acknowledge_agent_response** when done
4. **Loop continues** with next iteration

### For Automated Systems
```javascript
// Pseudo-code for automated acknowledgment
server.on('agentResponse', async (data) => {
  if (data.requiresAcknowledgment) {
    // Process the response
    await processLoopResponse(data);
    
    // Acknowledge when done
    await server.call('acknowledge_agent_response', {
      loopId: data.loopId
    });
  }
});
```

## Troubleshooting

### Loop Not Continuing
1. Check if agent is busy: `check_agent_status`
2. Look for pending responses: `get_pending_responses`
3. Acknowledge pending responses manually
4. If stuck, use `clear_agent_busy_state`

### Multiple Loops Interfering
- Each loop waits independently
- Acknowledging one loop doesn't affect others
- Use `get_pending_responses` to see all waiting loops

### Auto-Acknowledgment Not Working
- Check `AUTO_ACKNOWLEDGE_TIMEOUT` setting
- Verify timeout is greater than 0
- Look for timeout messages in server logs

## Example Complete Workflow

```bash
# 1. Start server
npm start

# 2. Activate loop
curl -X POST -d '{"name":"activate_infinite_loop","arguments":{"message":"Activate Loop Command like optimize code"}}' 

# 3. Loop sends first response and waits

# 4. Check status
curl -X POST -d '{"name":"check_agent_status","arguments":{}}'

# 5. Process response (your agent logic here)

# 6. Acknowledge when done
curl -X POST -d '{"name":"acknowledge_agent_response","arguments":{"loopId":"loop_1_xxx"}}'

# 7. Loop continues with next iteration
```

This synchronization ensures that your agent has full control over the conversation flow while maintaining the infinite loop functionality.
