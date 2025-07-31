#!/bin/bash

echo "🏗️ Starting FSW Iron Task Development Environment..."

# Create necessary directories
mkdir -p api/src/{routes,services,middleware,utils}
mkdir -p web/{app,components,lib,public}
mkdir -p mobile

# Check if .env files exist, create if not
if [ ! -f api/.env ]; then
  cat > api/.env << EOF
NODE_ENV=development
DATABASE_URL=postgresql://fsw:fsw123@postgres:5432/fsw_iron_task
REDIS_URL=redis://redis:6379
JWT_SECRET=your-development-secret-key
S3_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_BUCKET_NAME=fsw-iron-task-dev
AWS_REGION=us-east-1
EOF
  echo "✅ Created api/.env file"
fi

# Start Docker Compose
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Create MinIO bucket
docker exec fsw-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin
docker exec fsw-minio mc mb myminio/fsw-iron-task-dev --ignore-existing

# Run database migrations
echo "🗄️ Running database migrations..."
docker exec fsw-api npm run prisma:migrate

# Seed the database
echo "🌱 Seeding database with test users..."
docker exec fsw-api npm run prisma:seed

echo "✅ Development environment is ready!"
echo ""
echo "📱 Services running:"
echo "   - Web App: http://localhost:3000"
echo "   - API: http://localhost:3001"
echo "   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo "   - PostgreSQL: localhost:5432 (fsw/fsw123)"
echo ""
echo "📝 Next steps:"
echo "   1. Check logs: docker-compose logs -f"
echo "   2. Access Prisma Studio: docker exec -it fsw-api npm run prisma:studio"
echo "   3. Stop services: docker-compose down"