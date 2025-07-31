#!/bin/bash

# FSW Iron Task - Production Build Script
# This script builds the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting FSW Iron Task Production Build..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.production.yml" ]; then
    print_error "docker-compose.production.yml not found. Make sure you're in the project root directory."
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.production" ]; then
    print_warning "Production environment file (.env.production) not found."
    print_warning "Please copy .env.production.template to .env.production and configure it."
    
    read -p "Do you want to continue with the template file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Aborting build. Please configure .env.production first."
        exit 1
    fi
    
    if [ -f ".env.production.template" ]; then
        print_warning "Using .env.production.template (REMEMBER TO CONFIGURE REAL VALUES)"
        cp .env.production.template .env.production
    else
        print_error ".env.production.template not found either. Cannot proceed."
        exit 1
    fi
fi

print_status "Building production Docker images..."

# Build API image
print_status "Building API production image..."
cd api
if docker build -f Dockerfile.production -t fsw-api:latest .; then
    print_success "API image built successfully"
else
    print_error "Failed to build API image"
    exit 1
fi
cd ..

# Build Web image
print_status "Building Web production image..."
cd web
if docker build -f Dockerfile.production -t fsw-web:latest .; then
    print_success "Web image built successfully"
else
    print_error "Failed to build Web image"
    exit 1
fi
cd ..

print_status "Running security checks..."

# Security audit for both projects
print_status "Running security audit on API..."
cd api
npm audit --audit-level=moderate || print_warning "API security audit found issues"
cd ..

print_status "Running security audit on Web..."
cd web
npm audit --audit-level=moderate || print_warning "Web security audit found issues"
cd ..

print_status "Testing production configuration..."

# Test environment file validation
print_status "Validating environment configuration..."
if docker run --rm --env-file .env.production fsw-api:latest node -e "
const env = require('./src/config/env');
console.log('✅ Environment validation passed');
console.log('✅ Node ENV:', env.NODE_ENV);
console.log('✅ Database configured:', !!env.DATABASE_URL);
console.log('✅ Supabase configured:', !!env.SUPABASE_URL);
"; then
    print_success "Environment validation passed"
else
    print_error "Environment validation failed"
    exit 1
fi

print_status "Creating production deployment files..."

# Create production docker-compose override if it doesn't exist
if [ ! -f "docker-compose.override.yml" ]; then
    cat > docker-compose.override.yml << EOF
# Production overrides for docker-compose.production.yml
# Uncomment and modify as needed for your deployment

version: '3.8'

services:
  api:
    # Uncomment to bind to specific port
    # ports:
    #   - "3001:3001"
    
    # Uncomment to add custom environment variables
    # environment:
    #   - CUSTOM_VAR=value
    
    # Uncomment to add custom volumes
    # volumes:
    #   - /host/path:/container/path

  web:
    # Uncomment to bind to specific port
    # ports:
    #   - "3000:3000"
EOF
    print_success "Created docker-compose.override.yml template"
fi

# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash

# FSW Iron Task - Production Deployment Script
set -e

echo "🚀 Deploying FSW Iron Task to production..."

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Pull/use latest images
echo "Using latest built images..."

# Start services
echo "Starting production services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "Waiting for services to become healthy..."
sleep 30

# Check API health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    docker-compose -f docker-compose.production.yml logs api
    exit 1
fi

# Check Web health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Web is healthy"
else
    echo "❌ Web health check failed"
    docker-compose -f docker-compose.production.yml logs web
    exit 1
fi

echo "🎉 Deployment successful!"
echo "🌐 Web application: http://localhost:3000"
echo "🔗 API endpoint: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"

echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  Stop: docker-compose -f docker-compose.production.yml down"
echo "  Scale: docker-compose -f docker-compose.production.yml up -d --scale api=2"
EOF

chmod +x deploy.sh
print_success "Created deploy.sh script"

print_success "Production build completed successfully! 🎉"
echo
echo "📋 Next steps:"
echo "1. Review and configure .env.production with your actual values"
echo "2. Run './deploy.sh' to deploy to production"
echo "3. Configure your reverse proxy/load balancer to point to the containers"
echo "4. Set up SSL/TLS certificates for HTTPS"
echo
echo "📊 Built images:"
echo "  - fsw-api:latest"
echo "  - fsw-web:latest"
echo
echo "🔧 Configuration files created:"
echo "  - docker-compose.override.yml (for custom deployment settings)"
echo "  - deploy.sh (deployment script)"
echo
print_warning "IMPORTANT: Remember to:"
print_warning "  - Configure .env.production with real secrets"
print_warning "  - Set up proper SSL/TLS certificates"
print_warning "  - Configure your domain and DNS"
print_warning "  - Set up monitoring and backups"