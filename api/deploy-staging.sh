#!/bin/bash

# Staging Deployment Script for FSW Iron Task API Enhanced Features
# Usage: ./deploy-staging.sh

set -e

echo "🚀 Deploying FSW Iron Task API - Enhanced Features to Staging..."
echo "📁 API Directory: $(pwd)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the api directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Create temporary staging configuration
echo "⚙️ Setting up staging configuration..."
cp vercel.staging.json vercel.json.staging.tmp

# Deploy with staging configuration
echo "📦 Deploying enhanced API to staging..."
vercel --local-config vercel.staging.json --name fsw-iron-task-staging

# Cleanup temporary files
rm -f vercel.json.staging.tmp

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --scope=team 2>/dev/null | grep "fsw-iron-task-staging" | head -1 | awk '{print $2}' || echo "")

if [ -n "$DEPLOYMENT_URL" ]; then
    echo ""
    echo "✅ Staging deployment successful!"
    echo "🌐 Staging URL: https://$DEPLOYMENT_URL"
    echo ""
    echo "🧪 Testing enhanced features..."
    
    # Test enhanced health endpoint
    echo "1. Testing enhanced health check..."
    if curl -f "https://$DEPLOYMENT_URL/api/health/detailed" > /dev/null 2>&1; then
        echo "   ✅ Enhanced health check working"
    else
        echo "   ⚠️  Enhanced health check failed - trying basic"
        if curl -f "https://$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
            echo "   ✅ Basic health check working"
        fi
    fi
    
    # Test system info endpoint
    echo "2. Testing system info endpoint..."
    if curl -f "https://$DEPLOYMENT_URL/api/system/info" > /dev/null 2>&1; then
        echo "   ✅ System info endpoint working"
    else
        echo "   ⚠️  System info endpoint not available"
    fi
    
    # Test API documentation
    echo "3. Testing API documentation..."
    if curl -I "https://$DEPLOYMENT_URL/docs" 2>/dev/null | grep -q "200\|302"; then
        echo "   ✅ API documentation available"
    else
        echo "   ⚠️  API documentation may not be ready yet"
    fi
    
    echo ""
    echo "📋 Staging Environment Ready:"
    echo "🌐 Main API: https://$DEPLOYMENT_URL"
    echo "🏥 Health Check: https://$DEPLOYMENT_URL/api/health"
    echo "📊 System Info: https://$DEPLOYMENT_URL/api/system/info"
    echo "📚 API Docs: https://$DEPLOYMENT_URL/docs"
    echo ""
    echo "🔄 Compare with Production:"
    echo "🟢 Production (Stable): https://api-p1cl5cvid-fsw-iron-task.vercel.app"
    echo "🔵 Staging (Enhanced): https://$DEPLOYMENT_URL"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test all enhanced features in staging"
    echo "2. Validate security and performance improvements"
    echo "3. When ready, promote staging to production"
    
else
    echo "⚠️  Could not determine staging deployment URL. Check Vercel dashboard."
fi

echo ""
echo "📚 For troubleshooting, check Vercel dashboard or run: vercel logs"