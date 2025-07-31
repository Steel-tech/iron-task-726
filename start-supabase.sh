#!/bin/bash

echo "🏗️ Starting FSW Iron Task with Supabase..."

# Check if .env.supabase exists
if [ ! -f .env.supabase ]; then
  echo "❌ Error: .env.supabase file not found!"
  echo "Please copy .env.supabase.example to .env.supabase and fill in your Supabase credentials."
  exit 1
fi

# Load Supabase environment variables
export $(cat .env.supabase | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_DATABASE_URL" ]; then
  echo "❌ Error: Missing required Supabase configuration in .env.supabase"
  echo "Please ensure all variables are set correctly."
  exit 1
fi

echo "✅ Supabase configuration loaded"

# Create necessary directories
mkdir -p api/src/{routes,services,middleware,utils}
mkdir -p web/{app,components,lib,public}

# Start Docker Compose with Supabase configuration
echo "🚀 Starting services with Supabase..."
docker-compose -f docker-compose.supabase.yml --env-file .env.supabase up -d

echo "⏳ Waiting for services to start..."
sleep 5

# Check if API is healthy
echo "🔍 Checking API health..."
for i in {1..10}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API is ready!"
    break
  else
    echo "⏳ Waiting for API... ($i/10)"
    sleep 2
  fi
done

echo "✅ Development environment with Supabase is ready!"
echo ""
echo "📱 Services running:"
echo "   - Web App: http://localhost:3000"
echo "   - API: http://localhost:3001"
echo "   - Supabase Dashboard: ${SUPABASE_URL}"
echo "   - Redis: localhost:6379"
echo ""
echo "📝 Important notes:"
echo "   - Database is hosted on Supabase"
echo "   - File storage will use Supabase Storage (when implemented)"
echo "   - Authentication can use Supabase Auth or existing JWT"
echo ""
echo "🛠️ Useful commands:"
echo "   - Check logs: docker-compose -f docker-compose.supabase.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.supabase.yml down"
echo "   - Run migrations: cd api && npx prisma migrate deploy"
echo "   - Open Prisma Studio: cd api && npx prisma studio"