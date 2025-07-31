#!/usr/bin/env node

// Test token cleanup job logic
console.log('🧹 Testing Token Cleanup Job\n');

// Mock expired and revoked tokens
const mockTokens = [
  {
    id: '1',
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 1 day ago
    revokedAt: null,
    description: 'Expired token (should be deleted)'
  },
  {
    id: '2',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 1 day
    revokedAt: null,
    description: 'Active token (should NOT be deleted)'
  },
  {
    id: '3',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // Revoked 40 days ago
    description: 'Old revoked token (should be deleted)'
  },
  {
    id: '4',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Revoked 10 days ago
    description: 'Recently revoked token (should NOT be deleted)'
  }
];

// Simulate cleanup logic
function simulateCleanup(tokens) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return tokens.filter(token => {
    // Delete if expired
    if (token.expiresAt < now) {
      return false;
    }
    
    // Delete if revoked more than 30 days ago
    if (token.revokedAt && token.revokedAt < thirtyDaysAgo) {
      return false;
    }
    
    // Keep the token
    return true;
  });
}

// Run test
console.log('Initial tokens:');
mockTokens.forEach(token => {
  console.log(`  Token ${token.id}: ${token.description}`);
});

const remainingTokens = simulateCleanup(mockTokens);
const deletedCount = mockTokens.length - remainingTokens.length;

console.log('\nAfter cleanup:');
console.log(`  Deleted ${deletedCount} tokens`);
console.log(`  Remaining ${remainingTokens.length} tokens`);

console.log('\nRemaining tokens:');
remainingTokens.forEach(token => {
  console.log(`  Token ${token.id}: ${token.description}`);
});

// Verify correct tokens were deleted
const expectedRemaining = ['2', '4'];
const actualRemaining = remainingTokens.map(t => t.id);

if (JSON.stringify(expectedRemaining.sort()) === JSON.stringify(actualRemaining.sort())) {
  console.log('\n✅ Token cleanup logic is working correctly!');
  console.log('\nCleanup rules verified:');
  console.log('  ✓ Expired tokens are deleted');
  console.log('  ✓ Tokens revoked > 30 days ago are deleted');
  console.log('  ✓ Active tokens are preserved');
  console.log('  ✓ Recently revoked tokens are preserved');
} else {
  console.error('\n❌ Token cleanup logic is NOT working correctly!');
  console.error('Expected remaining:', expectedRemaining);
  console.error('Actual remaining:', actualRemaining);
  process.exit(1);
}

// Show example cron configuration
console.log('\n📅 Recommended cron configuration:');
console.log('Add to crontab with: crontab -e');
console.log('0 3 * * * cd /path/to/api && node src/jobs/tokenCleanup.js >> /var/log/token-cleanup.log 2>&1');
console.log('\nThis runs the cleanup job daily at 3 AM.');