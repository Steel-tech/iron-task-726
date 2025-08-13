/**
 * Account Lockout Middleware
 * Implements progressive account lockout to prevent brute force attacks
 * Uses cryptographically secure hashing (SHA-256) and timing-safe operations
 */

const crypto = require('crypto');

/**
 * In-memory store for development, Redis for production
 * Tracks failed login attempts and lockout status
 */
class AccountLockoutManager {
  constructor(options = {}) {
    this.attempts = new Map(); // Store failed attempts
    this.lockouts = new Map(); // Store active lockouts
    
    // Configuration
    this.maxAttempts = options.maxAttempts || 5;
    this.lockoutDuration = options.lockoutDuration || 15 * 60 * 1000; // 15 minutes
    this.progressiveLockout = options.progressiveLockout !== false;
    this.useRedis = options.redis && process.env.NODE_ENV === 'production';
    this.redisClient = options.redis;
    
    // Progressive lockout durations (in minutes)
    this.lockoutProgression = [
      5,    // 1st lockout: 5 minutes
      15,   // 2nd lockout: 15 minutes  
      60,   // 3rd lockout: 1 hour
      240,  // 4th lockout: 4 hours
      1440  // 5th+ lockout: 24 hours
    ];
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Generate unique key for tracking attempts using cryptographically secure SHA-256
   * Truncates to reasonable length while maintaining security
   */
  generateSecureKey(identifier, type = 'email') {
    // Use SHA-256 with salt for additional security
    const salt = process.env.LOCKOUT_SALT || 'fsw-iron-task-lockout-salt-2025';
    const data = `${salt}:${type}:${identifier}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `lockout:${type}:${hash.substring(0, 16)}`;
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  secureCompare(a, b) {
    if (!a || !b || a.length !== b.length) {
      return false;
    }
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(email, ip, userAgent = '') {
    // Sanitize inputs
    const sanitizedEmail = this.sanitizeInput(email);
    const sanitizedIp = this.sanitizeInput(ip);
    
    const emailKey = this.generateSecureKey(sanitizedEmail, 'email');
    const ipKey = this.generateSecureKey(sanitizedIp, 'ip');
    const timestamp = Date.now();

    try {
      if (this.useRedis && this.redisClient) {
        // Redis implementation for production
        await this.redisRecordAttempt(emailKey, ipKey, timestamp, sanitizedEmail, sanitizedIp, userAgent);
      } else {
        // Memory implementation for development
        this.memoryRecordAttempt(emailKey, ipKey, timestamp, sanitizedEmail, sanitizedIp, userAgent);
      }

      // Check if lockout threshold reached
      const emailAttempts = await this.getAttempts(emailKey);
      const ipAttempts = await this.getAttempts(ipKey);

      if (emailAttempts.count >= this.maxAttempts || ipAttempts.count >= this.maxAttempts) {
        await this.createLockout(sanitizedEmail, sanitizedIp, Math.max(emailAttempts.count, ipAttempts.count));
        return true; // Lockout created
      }

      return false; // No lockout yet

    } catch (error) {
      console.error('Failed to record login attempt:', error);
      return false;
    }
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove potential malicious characters and limit length
    return input
      .replace(/[<>'"&]/g, '')  // Remove HTML/SQL injection chars
      .substring(0, 255)        // Limit length
      .toLowerCase()            // Normalize case
      .trim();                  // Remove whitespace
  }

  /**
   * Redis implementation for recording attempts
   */
  async redisRecordAttempt(emailKey, ipKey, timestamp, email, ip, userAgent) {
    const pipeline = this.redisClient.pipeline();
    
    // Increment attempt counters
    pipeline.hincrby(emailKey, 'count', 1);
    pipeline.hincrby(ipKey, 'count', 1);
    
    // Set metadata (don't store sensitive data directly)
    pipeline.hset(emailKey, 'lastAttempt', timestamp);
    pipeline.hset(emailKey, 'emailHash', this.generateSecureKey(email, 'hash'));
    pipeline.hset(ipKey, 'lastAttempt', timestamp);
    pipeline.hset(ipKey, 'ipHash', this.generateSecureKey(ip, 'hash'));
    pipeline.hset(ipKey, 'userAgentHash', this.generateSecureKey(userAgent, 'ua'));
    
    // Set expiration (attempts expire after lockout duration)
    pipeline.expire(emailKey, Math.floor(this.lockoutDuration / 1000));
    pipeline.expire(ipKey, Math.floor(this.lockoutDuration / 1000));
    
    await pipeline.exec();
  }

  /**
   * Memory implementation for recording attempts
   */
  memoryRecordAttempt(emailKey, ipKey, timestamp, email, ip, userAgent) {
    // Update email attempts
    const emailAttempt = this.attempts.get(emailKey) || { count: 0, attempts: [] };
    emailAttempt.count++;
    emailAttempt.lastAttempt = timestamp;
    emailAttempt.emailHash = this.generateSecureKey(email, 'hash');
    emailAttempt.attempts.push({ 
      timestamp, 
      ipHash: this.generateSecureKey(ip, 'hash'), 
      userAgentHash: this.generateSecureKey(userAgent, 'ua')
    });
    
    // Keep only recent attempts
    emailAttempt.attempts = emailAttempt.attempts.filter(
      a => timestamp - a.timestamp < this.lockoutDuration
    );
    emailAttempt.count = emailAttempt.attempts.length;
    
    this.attempts.set(emailKey, emailAttempt);

    // Update IP attempts
    const ipAttempt = this.attempts.get(ipKey) || { count: 0, attempts: [] };
    ipAttempt.count++;
    ipAttempt.lastAttempt = timestamp;
    ipAttempt.ipHash = this.generateSecureKey(ip, 'hash');
    ipAttempt.attempts.push({ 
      timestamp, 
      emailHash: this.generateSecureKey(email, 'hash'),
      userAgentHash: this.generateSecureKey(userAgent, 'ua')
    });
    
    ipAttempt.attempts = ipAttempt.attempts.filter(
      a => timestamp - a.timestamp < this.lockoutDuration
    );
    ipAttempt.count = ipAttempt.attempts.length;
    
    this.attempts.set(ipKey, ipAttempt);
  }

  /**
   * Get attempt count for a key
   */
  async getAttempts(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.hmget(key, 'count', 'lastAttempt');
        return {
          count: parseInt(result[0] || '0'),
          lastAttempt: parseInt(result[1] || '0')
        };
      } else {
        const attempt = this.attempts.get(key);
        return attempt ? {
          count: attempt.count,
          lastAttempt: attempt.lastAttempt
        } : { count: 0, lastAttempt: 0 };
      }
    } catch (error) {
      console.error('Failed to get attempts:', error);
      return { count: 0, lastAttempt: 0 };
    }
  }

  /**
   * Create account lockout with secure random lockout ID
   */
  async createLockout(email, ip, attemptCount) {
    const lockoutId = crypto.randomBytes(16).toString('hex');
    const lockoutKey = `lockout:active:${lockoutId}`;
    const timestamp = Date.now();
    
    // Calculate lockout duration based on attempt count
    let duration = this.lockoutDuration;
    if (this.progressiveLockout) {
      const lockoutIndex = Math.min(
        Math.floor(attemptCount / this.maxAttempts) - 1,
        this.lockoutProgression.length - 1
      );
      duration = this.lockoutProgression[Math.max(0, lockoutIndex)] * 60 * 1000;
    }
    
    const expiresAt = timestamp + duration;
    const lockout = {
      id: lockoutId,
      emailHash: this.generateSecureKey(email, 'hash'),
      ipHash: this.generateSecureKey(ip, 'hash'),
      createdAt: timestamp,
      expiresAt,
      attemptCount,
      duration,
      reason: `Too many failed login attempts (${attemptCount})`,
      type: attemptCount >= this.maxAttempts * 2 ? 'severe' : 'standard'
    };

    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setex(
          lockoutKey,
          Math.floor(duration / 1000),
          JSON.stringify(lockout)
        );
        
        // Also store reverse lookup for email/IP
        await this.redisClient.setex(
          this.generateSecureKey(email, 'lockout'),
          Math.floor(duration / 1000),
          lockoutId
        );
      } else {
        this.lockouts.set(lockoutKey, lockout);
        this.lockouts.set(this.generateSecureKey(email, 'lockout'), lockoutId);
      }

      // Log security event (without sensitive data)
      console.warn('Account lockout created:', {
        lockoutId,
        attemptCount,
        duration: `${Math.round(duration / 1000 / 60)} minutes`,
        expiresAt: new Date(expiresAt).toISOString(),
        type: lockout.type
      });

      return lockout;

    } catch (error) {
      console.error('Failed to create lockout:', error);
      return null;
    }
  }

  /**
   * Check if account/IP is currently locked
   */
  async isLocked(email, ip) {
    const sanitizedEmail = this.sanitizeInput(email);
    const sanitizedIp = this.sanitizeInput(ip);
    
    const emailLookupKey = this.generateSecureKey(sanitizedEmail, 'lockout');
    const ipLookupKey = this.generateSecureKey(sanitizedIp, 'lockout');
    const timestamp = Date.now();

    try {
      // Get lockout IDs
      const [emailLockoutId, ipLockoutId] = await Promise.all([
        this.getLockoutId(emailLookupKey),
        this.getLockoutId(ipLookupKey)
      ]);

      // Check email lockout
      if (emailLockoutId) {
        const lockout = await this.getLockout(`lockout:active:${emailLockoutId}`);
        if (lockout && lockout.expiresAt > timestamp) {
          return {
            isLocked: true,
            type: 'email',
            lockout: lockout,
            remainingTime: lockout.expiresAt - timestamp
          };
        }
      }

      // Check IP lockout
      if (ipLockoutId) {
        const lockout = await this.getLockout(`lockout:active:${ipLockoutId}`);
        if (lockout && lockout.expiresAt > timestamp) {
          return {
            isLocked: true,
            type: 'ip',
            lockout: lockout,
            remainingTime: lockout.expiresAt - timestamp
          };
        }
      }

      return { isLocked: false };

    } catch (error) {
      console.error('Failed to check lockout status:', error);
      return { isLocked: false };
    }
  }

  /**
   * Get lockout ID from lookup key
   */
  async getLockoutId(key) {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.get(key);
      } else {
        return this.lockouts.get(key) || null;
      }
    } catch (error) {
      console.error('Failed to get lockout ID:', error);
      return null;
    }
  }

  /**
   * Get lockout information
   */
  async getLockout(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.get(key);
        return result ? JSON.parse(result) : null;
      } else {
        return this.lockouts.get(key) || null;
      }
    } catch (error) {
      console.error('Failed to get lockout:', error);
      return null;
    }
  }

  /**
   * Clear failed attempts after successful login
   */
  async clearAttempts(email, ip) {
    const sanitizedEmail = this.sanitizeInput(email);
    const sanitizedIp = this.sanitizeInput(ip);
    
    const emailKey = this.generateSecureKey(sanitizedEmail, 'email');
    const ipKey = this.generateSecureKey(sanitizedIp, 'ip');
    const lockoutKey = this.generateSecureKey(sanitizedEmail, 'lockout');

    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(emailKey, ipKey, lockoutKey);
      } else {
        this.attempts.delete(emailKey);
        this.attempts.delete(ipKey);
        
        // Clear lockout lookup
        const lockoutId = this.lockouts.get(lockoutKey);
        if (lockoutId) {
          this.lockouts.delete(`lockout:active:${lockoutId}`);
          this.lockouts.delete(lockoutKey);
        }
      }

      console.info('Cleared failed attempts after successful login');

    } catch (error) {
      console.error('Failed to clear attempts:', error);
    }
  }

  /**
   * Admin function to manually unlock account
   */
  async unlockAccount(email, adminUser = 'system') {
    const sanitizedEmail = this.sanitizeInput(email);
    const lockoutKey = this.generateSecureKey(sanitizedEmail, 'lockout');
    const emailKey = this.generateSecureKey(sanitizedEmail, 'email');

    try {
      if (this.useRedis && this.redisClient) {
        const lockoutId = await this.redisClient.get(lockoutKey);
        if (lockoutId) {
          await this.redisClient.del(`lockout:active:${lockoutId}`, lockoutKey, emailKey);
        }
      } else {
        const lockoutId = this.lockouts.get(lockoutKey);
        if (lockoutId) {
          this.lockouts.delete(`lockout:active:${lockoutId}`);
        }
        this.lockouts.delete(lockoutKey);
        this.attempts.delete(emailKey);
      }

      console.warn('Account manually unlocked:', { 
        adminUser, 
        timestamp: new Date().toISOString(),
        action: 'manual_unlock'
      });
      return true;

    } catch (error) {
      console.error('Failed to unlock account:', error);
      return false;
    }
  }

  /**
   * Get lockout statistics (anonymized)
   */
  async getLockoutStats() {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys('lockout:active:*');
        return {
          activeLockouts: keys.length,
          cacheType: 'redis',
          timestamp: new Date().toISOString()
        };
      } else {
        const activeLockouts = Array.from(this.lockouts.keys())
          .filter(key => key.startsWith('lockout:active:'))
          .length;
          
        return {
          activeLockouts,
          totalAttempts: this.attempts.size,
          cacheType: 'memory',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to get lockout stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Cleanup expired entries (memory implementation only)
   */
  cleanup() {
    if (this.useRedis) return; // Redis handles expiration automatically

    const now = Date.now();
    
    // Clean up expired attempts
    for (const [key, attempt] of this.attempts.entries()) {
      if (attempt.lastAttempt && (now - attempt.lastAttempt) > this.lockoutDuration) {
        this.attempts.delete(key);
      }
    }

    // Clean up expired lockouts
    for (const [key, lockout] of this.lockouts.entries()) {
      if (key.startsWith('lockout:active:') && lockout.expiresAt && lockout.expiresAt < now) {
        this.lockouts.delete(key);
      }
    }
  }
}

/**
 * Fastify middleware for account lockout protection
 */
function createAccountLockoutMiddleware(options = {}) {
  const lockoutManager = new AccountLockoutManager(options);

  return {
    middleware: async function accountLockoutMiddleware(request, reply) {
      // Only apply to auth endpoints
      if (!request.url.includes('/auth/')) {
        return;
      }

      const ip = request.realIp || request.ip;
      const userAgent = request.headers['user-agent'] || '';

      // For login attempts
      if (request.method === 'POST' && request.url.includes('/login')) {
        const body = request.body || {};
        const email = body.email;

        if (email) {
          // Check if already locked
          const lockStatus = await lockoutManager.isLocked(email, ip);
          
          if (lockStatus.isLocked) {
            const remainingMinutes = Math.ceil(lockStatus.remainingTime / 1000 / 60);
            
            return reply.code(423).send({
              error: 'Account temporarily locked',
              message: `Too many failed login attempts. Account is locked for ${remainingMinutes} more minutes.`,
              code: 'ACCOUNT_LOCKED',
              lockoutExpiresAt: new Date(Date.now() + lockStatus.remainingTime).toISOString(),
              remainingTime: lockStatus.remainingTime,
              type: lockStatus.type
            });
          }

          // Attach lockout manager to request for use in auth route
          request.lockoutManager = lockoutManager;
          request.loginAttemptData = { email, ip, userAgent };
        }
      }
    },

    manager: lockoutManager // Expose manager for admin functions
  };
}

module.exports = {
  AccountLockoutManager,
  createAccountLockoutMiddleware
};