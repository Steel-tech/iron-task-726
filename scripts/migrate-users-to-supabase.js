#!/usr/bin/env node

// Migrate existing users to Supabase Auth
// This is a one-time migration script

require('dotenv').config({ path: './api/.env' });
const { supabaseAdmin } = require('../api/src/lib/supabase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('🔄 Starting user migration to Supabase Auth...\n');
  
  try {
    // Get all existing users
    const users = await prisma.user.findMany({
      include: {
        company: true
      }
    });
    
    console.log(`Found ${users.length} users to migrate\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Check if user already exists in Supabase
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
        
        if (existingUser?.user) {
          console.log(`⏭️  Skipping ${user.email} - already exists in Supabase`);
          skipCount++;
          continue;
        }
        
        // Create user in Supabase Auth
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          id: user.id, // Preserve existing ID
          email: user.email,
          email_confirm: true,
          password: 'TempPassword123!', // Temporary password - users must reset
          user_metadata: {
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company?.name,
            needsPasswordReset: true
          }
        });
        
        if (error) {
          console.error(`❌ Error migrating ${user.email}:`, error.message);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Migrated ${user.email}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Already existed: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📧 Total processed: ${users.length}`);
    
    if (successCount > 0) {
      console.log('\n⚠️  Important:');
      console.log('1. All migrated users have temporary password: TempPassword123!');
      console.log('2. Users must reset their password on first login');
      console.log('3. Send password reset emails to all users');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUsers();