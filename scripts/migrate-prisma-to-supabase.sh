#!/bin/bash

# Prisma-based Supabase Migration Script
# This script uses Prisma to set up your Supabase database

set -e

echo "=== FSW Iron Task - Prisma to Supabase Migration ==="
echo ""

# Load Supabase credentials
source .env.supabase

if [ -z "$SUPABASE_DATABASE_URL" ]; then
    echo "❌ Error: SUPABASE_DATABASE_URL not found"
    echo "Please ensure .env.supabase is properly configured"
    exit 1
fi

echo "📋 Migration Steps:"
echo "1. Setting up Prisma with Supabase database"
echo "2. Running Prisma migrations"
echo "3. Seeding initial data"
echo ""

# Step 1: Update API environment
echo "Step 1: Updating API configuration..."
cd api

# Create or update .env with Supabase URL
cat > .env << EOF
# Database
DATABASE_URL="${SUPABASE_DATABASE_URL}"

# Supabase
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# JWT
JWT_SECRET="${JWT_SECRET}"

# Redis (temporary - will use Supabase later)
REDIS_URL=redis://localhost:6379

# AWS (temporary - will use Supabase Storage later)
AWS_ACCESS_KEY_ID=temp
AWS_SECRET_ACCESS_KEY=temp
AWS_BUCKET_NAME=temp
AWS_REGION=us-west-2
EOF

echo "✅ API configuration updated"

# Step 2: Run Prisma migrations
echo ""
echo "Step 2: Running Prisma migrations..."
npx prisma migrate deploy || {
    echo "⚠️  No existing migrations found. Creating new migration..."
    npx prisma migrate dev --name initial_setup
}

# Step 3: Generate Prisma client
echo ""
echo "Step 3: Generating Prisma client..."
npx prisma generate

# Step 4: Seed database
echo ""
echo "Step 4: Seeding database..."
if [ -f "prisma/seed.js" ]; then
    npm run seed || echo "⚠️  Seeding failed - you may need to run it manually"
else
    echo "⚠️  No seed file found"
fi

# Return to project root
cd ..

# Step 5: Update web environment
echo ""
echo "Step 5: Updating web configuration..."
cat > web/.env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# API (temporary - will use Supabase directly later)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
EOF

echo "✅ Web configuration updated"

echo ""
echo "=== Migration Complete! ==="
echo ""
echo "✅ Database schema migrated to Supabase"
echo "✅ Environment files updated"
echo ""
echo "⚠️  Important Next Steps:"
echo "1. Go to Supabase Dashboard > SQL Editor"
echo "2. Run the contents of scripts/setup-rls.sql"
echo "3. Run the contents of scripts/setup-supabase-storage.sql"
echo ""
echo "📝 To test locally:"
echo "   cd api && npm run dev"
echo "   cd web && npm run dev"
echo ""
echo "🚀 Your app is now connected to Supabase!"