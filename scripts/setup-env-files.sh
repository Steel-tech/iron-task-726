#!/bin/bash

# Setup environment files for Supabase integration

echo "Setting up environment files for Supabase..."

# Load Supabase credentials
source .env.supabase

# Update API .env
cat > api/.env << EOF
# Database (Supabase)
DATABASE_URL="${SUPABASE_DATABASE_URL}"

# Supabase
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# JWT
JWT_SECRET="${JWT_SECRET}"

# Redis (temporary - will migrate to Supabase later)
REDIS_URL=redis://localhost:6379

# Port
PORT=3001
EOF

# Update Web .env.local
cat > web/.env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# API URL (for development - will use Supabase directly in production)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
EOF

echo "✅ Environment files updated!"
echo ""
echo "Next steps:"
echo "1. cd api && npm install @supabase/supabase-js"
echo "2. cd web && npm install @supabase/supabase-js"
echo "3. We'll update the auth system to use Supabase Auth"