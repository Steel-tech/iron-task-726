#!/usr/bin/env node

// Supabase Migration Helper
// This script helps verify your setup before running the full migration

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.supabase' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVariable(name, value, isSecret = false) {
  if (!value || value.includes('YOUR') || value.includes('your-') || value.includes('...')) {
    log(`❌ ${name} is not set properly`, 'red');
    return false;
  }
  const displayValue = isSecret ? value.substring(0, 20) + '...' : value;
  log(`✅ ${name}: ${displayValue}`, 'green');
  return true;
}

async function main() {
  log('\n🔍 FSW Iron Task - Supabase Migration Helper\n', 'bright');
  
  // Step 1: Check environment variables
  log('Step 1: Checking environment variables...', 'blue');
  
  const envVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  };
  
  let allVarsSet = true;
  allVarsSet &= checkEnvVariable('SUPABASE_URL', envVars.SUPABASE_URL);
  allVarsSet &= checkEnvVariable('SUPABASE_ANON_KEY', envVars.SUPABASE_ANON_KEY, true);
  allVarsSet &= checkEnvVariable('SUPABASE_SERVICE_ROLE_KEY', envVars.SUPABASE_SERVICE_ROLE_KEY, true);
  allVarsSet &= checkEnvVariable('SUPABASE_DATABASE_URL', envVars.SUPABASE_DATABASE_URL, true);
  allVarsSet &= checkEnvVariable('JWT_SECRET', envVars.JWT_SECRET, true);
  
  if (!allVarsSet) {
    log('\n⚠️  Please update your .env.supabase file with actual values', 'yellow');
    log('See SUPABASE_CREDENTIALS_GUIDE.md for help\n', 'yellow');
    process.exit(1);
  }
  
  // Step 2: Test Supabase connection
  log('\nStep 2: Testing Supabase connection...', 'blue');
  
  try {
    const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY);
    
    // Try a simple query
    const { error } = await supabase.from('test_connection').select('*').limit(1);
    
    if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (expected)
      throw error;
    }
    
    log('✅ Successfully connected to Supabase!', 'green');
    
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`, 'red');
    process.exit(1);
  }
  
  // Step 3: Check current database
  log('\nStep 3: Checking local database...', 'blue');
  
  const localDbExists = fs.existsSync(path.join(__dirname, 'docker-compose.yml'));
  if (localDbExists) {
    log('✅ Local database configuration found', 'green');
    log('⚠️  Make sure to stop Docker containers before migration: docker-compose down', 'yellow');
  }
  
  // Step 4: Pre-migration checklist
  log('\n📋 Pre-Migration Checklist:', 'bright');
  log('1. ✓ Supabase project created', 'green');
  log('2. ✓ Credentials configured', 'green');
  log('3. ✓ Connection verified', 'green');
  log('4. ⏳ Stop local Docker containers', 'yellow');
  log('5. ⏳ Run database migration script', 'yellow');
  log('6. ⏳ Set up Row Level Security', 'yellow');
  log('7. ⏳ Create storage buckets', 'yellow');
  
  // Step 5: Next steps
  log('\n🚀 Ready for Migration!', 'bright');
  log('\nNext commands to run:', 'blue');
  log('1. docker-compose down', 'yellow');
  log('2. export SUPABASE_DB_URL="' + envVars.SUPABASE_DATABASE_URL + '"', 'yellow');
  log('3. ./scripts/migrate-to-supabase.sh', 'yellow');
  
  log('\nAfter migration, run SQL scripts in Supabase Dashboard:', 'blue');
  log('1. scripts/setup-rls.sql (for Row Level Security)', 'yellow');
  log('2. scripts/setup-supabase-storage.sql (for storage buckets)', 'yellow');
  
  // Create a quick reference file
  const quickRef = `# Quick Migration Commands

## 1. Stop Docker
\`\`\`bash
docker-compose down
\`\`\`

## 2. Set Database URL
\`\`\`bash
export SUPABASE_DB_URL="${envVars.SUPABASE_DATABASE_URL}"
\`\`\`

## 3. Run Migration
\`\`\`bash
./scripts/migrate-to-supabase.sh
\`\`\`

## 4. In Supabase SQL Editor
- Run contents of scripts/setup-rls.sql
- Run contents of scripts/setup-supabase-storage.sql

## 5. Update App Config
\`\`\`bash
# Copy Supabase config to main env files
cp .env.supabase api/.env
cp .env.supabase web/.env.local
\`\`\`
`;
  
  fs.writeFileSync('MIGRATION_COMMANDS.md', quickRef);
  log('\n📝 Quick reference saved to MIGRATION_COMMANDS.md', 'green');
}

main().catch(console.error);