import { CONFIG } from './config.js';

export class APIKeyManager {
  constructor(apiKeys) {
    // Parse API keys - can be string or array
    if (typeof apiKeys === 'string') {
      // Check if it's comma-separated keys
      this.apiKeys = apiKeys.includes(',')
        ? apiKeys.split(',').map(key => key.trim()).filter(key => key.length > 0)
        : [apiKeys];
    } else if (Array.isArray(apiKeys)) {
      this.apiKeys = apiKeys.filter(key => key && key.length > 0);
    } else {
      this.apiKeys = [];
    }

    if (this.apiKeys.length === 0) {
      throw new Error('At least one valid API key is required');
    }

    // Track key status
    this.keyStatus = new Map();
    this.currentKeyIndex = 0;
    this.lastUsedTime = new Map();

    // Initialize all keys as available
    this.apiKeys.forEach((key, index) => {
      this.keyStatus.set(index, {
        key: key,
        status: 'available', // available, rate_limited, failed
        lastError: null,
        lastErrorTime: null,
        rateLimitUntil: null,
        usageCount: 0,
        successCount: 0,
        errorCount: 0
      });
    });

    console.error(`[API KEY MANAGER] Initialized with ${this.apiKeys.length} API key(s)`);
    this.logKeyStatus();
  }

  /**
   * Get next available API key
   * @returns {Object|null} - {key, index} or null if no keys available
   */
  getNextAvailableKey() {
    const now = Date.now();

    // First, check if any rate-limited keys can be retried
    this.checkRateLimitedKeys(now);

    // Find available keys
    const availableKeys = [];
    for (const [index, status] of this.keyStatus.entries()) {
      if (status.status === 'available') {
        availableKeys.push({ index, status });
      }
    }

    if (availableKeys.length === 0) {
      console.error('[API KEY MANAGER] No available API keys');
      return null;
    }

    // Use round-robin selection among available keys
    const selectedKey = availableKeys[this.currentKeyIndex % availableKeys.length];
    this.currentKeyIndex++;

    // Update usage tracking
    selectedKey.status.usageCount++;
    this.lastUsedTime.set(selectedKey.index, now);

    console.error(`[API KEY MANAGER] Using API key ${selectedKey.index + 1}/${this.apiKeys.length} (usage: ${selectedKey.status.usageCount})`);

    return {
      key: selectedKey.status.key,
      index: selectedKey.index
    };
  }

  /**
   * Mark an API key as rate limited
   * @param {number} keyIndex - Index of the key
   * @param {string} error - Error message
   */
  markKeyRateLimited(keyIndex, error = 'Rate limited') {
    const status = this.keyStatus.get(keyIndex);
    if (status) {
      status.status = 'rate_limited';
      status.lastError = error;
      status.lastErrorTime = Date.now();
      status.rateLimitUntil = Date.now() + CONFIG.API_KEY_ROTATION_COOLDOWN;
      status.errorCount++;

      console.error(`[API KEY MANAGER] Key ${keyIndex + 1} rate limited: ${error}`);
      console.error(`[API KEY MANAGER] Key ${keyIndex + 1} will be retried after ${CONFIG.API_KEY_ROTATION_COOLDOWN / 1000}s`);

      this.logKeyStatus();
    }
  }

  /**
   * Mark an API key as failed
   * @param {number} keyIndex - Index of the key
   * @param {string} error - Error message
   */
  markKeyFailed(keyIndex, error = 'API error') {
    const status = this.keyStatus.get(keyIndex);
    if (status) {
      status.status = 'failed';
      status.lastError = error;
      status.lastErrorTime = Date.now();
      status.rateLimitUntil = Date.now() + CONFIG.API_KEY_RETRY_DELAY;
      status.errorCount++;

      console.error(`[API KEY MANAGER] Key ${keyIndex + 1} failed: ${error}`);
      console.error(`[API KEY MANAGER] Key ${keyIndex + 1} will be retried after ${CONFIG.API_KEY_RETRY_DELAY / 1000}s`);

      this.logKeyStatus();
    }
  }

  /**
   * Mark an API key as successful
   * @param {number} keyIndex - Index of the key
   */
  markKeySuccess(keyIndex) {
    const status = this.keyStatus.get(keyIndex);
    if (status) {
      status.status = 'available';
      status.lastError = null;
      status.lastErrorTime = null;
      status.rateLimitUntil = null;
      status.successCount++;
    }
  }

  /**
   * Check and restore rate-limited keys that have cooled down
   * @param {number} now - Current timestamp
   */
  checkRateLimitedKeys(now) {
    for (const [index, status] of this.keyStatus.entries()) {
      if ((status.status === 'rate_limited' || status.status === 'failed') &&
          status.rateLimitUntil &&
          now >= status.rateLimitUntil) {

        console.error(`[API KEY MANAGER] Restoring key ${index + 1} after cooldown`);
        status.status = 'available';
        status.rateLimitUntil = null;
        status.lastError = null;
      }
    }
  }

  /**
   * Reset all failed keys
   */
  resetAllKeys() {
    let resetCount = 0;
    for (const [index, status] of this.keyStatus.entries()) {
      if (status.status !== 'available') {
        status.status = 'available';
        status.lastError = null;
        status.lastErrorTime = null;
        status.rateLimitUntil = null;
        resetCount++;
      }
    }

    console.error(`[API KEY MANAGER] Reset ${resetCount} API keys`);
    this.logKeyStatus();
    return resetCount;
  }

  /**
   * Get status of all API keys
   * @returns {Object} - Status summary
   */
  getKeyStatus() {
    const now = Date.now();
    this.checkRateLimitedKeys(now);

    const summary = {
      totalKeys: this.apiKeys.length,
      availableKeys: 0,
      rateLimitedKeys: 0,
      failedKeys: 0,
      keys: []
    };

    for (const [index, status] of this.keyStatus.entries()) {
      const keyInfo = {
        index: index + 1,
        status: status.status,
        usageCount: status.usageCount,
        successCount: status.successCount,
        errorCount: status.errorCount,
        lastError: status.lastError,
        cooldownRemaining: status.rateLimitUntil ? Math.max(0, status.rateLimitUntil - now) : 0
      };

      summary.keys.push(keyInfo);

      switch (status.status) {
        case 'available':
          summary.availableKeys++;
          break;
        case 'rate_limited':
          summary.rateLimitedKeys++;
          break;
        case 'failed':
          summary.failedKeys++;
          break;
      }
    }

    return summary;
  }

  /**
   * Log current key status
   */
  logKeyStatus() {
    const status = this.getKeyStatus();
    console.error(`[API KEY MANAGER] Status: ${status.availableKeys} available, ${status.rateLimitedKeys} rate-limited, ${status.failedKeys} failed`);
  }

  /**
   * Get statistics
   * @returns {Object} - Usage statistics
   */
  getStatistics() {
    const status = this.getKeyStatus();
    const totalUsage = status.keys.reduce((sum, key) => sum + key.usageCount, 0);
    const totalSuccess = status.keys.reduce((sum, key) => sum + key.successCount, 0);
    const totalErrors = status.keys.reduce((sum, key) => sum + key.errorCount, 0);

    return {
      totalKeys: status.totalKeys,
      availableKeys: status.availableKeys,
      totalUsage,
      totalSuccess,
      totalErrors,
      successRate: totalUsage > 0 ? (totalSuccess / totalUsage * 100).toFixed(1) + '%' : '0%',
      keyDetails: status.keys
    };
  }
}
