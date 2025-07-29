const TokenService = require('../services/tokenService');

/**
 * Scheduled job to clean up expired refresh tokens
 * Should be run daily via cron or similar scheduler
 */
async function cleanupExpiredTokens() {
  console.log('[Token Cleanup] Starting cleanup job...');
  
  try {
    const deletedCount = await TokenService.cleanupExpiredTokens();
    console.log(`[Token Cleanup] Removed ${deletedCount} expired tokens`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('[Token Cleanup] Error during cleanup:', error);
    return { success: false, error: error.message };
  }
}

// If running directly
if (require.main === module) {
  cleanupExpiredTokens()
    .then(result => {
      console.log('[Token Cleanup] Job completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('[Token Cleanup] Job failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupExpiredTokens;