#!/bin/bash

# Vercel Deployment Script for FSW Iron Task API
# Usage: ./deploy-vercel.sh [preview|production]

set -e

DEPLOYMENT_TYPE=${1:-preview}
API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying FSW Iron Task API to Vercel..."
echo "📁 API Directory: $API_DIR"
echo "🎯 Deployment Type: $DEPLOYMENT_TYPE"

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

# Run deployment
echo "📦 Deploying to Vercel..."
if [ "$DEPLOYMENT_TYPE" = "production" ]; then
    vercel --prod
else
    vercel
fi

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --scope=team 2>/dev/null | grep "iron-task-api" | head -1 | awk '{print $2}' || echo "")

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 URL: https://$DEPLOYMENT_URL"
    echo ""
    echo "🧪 Testing deployment..."
    
    # Test health endpoint
    if curl -f "https://$DEPLOYMENT_URL/health" > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check failed - check logs with: vercel logs https://$DEPLOYMENT_URL"
    fi
    
    # Test API info endpoint
    if curl -f "https://$DEPLOYMENT_URL/api" > /dev/null 2>&1; then
        echo "✅ API info endpoint working"
    else
        echo "⚠️  API info endpoint failed"
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your frontend NEXT_PUBLIC_API_URL to: https://$DEPLOYMENT_URL"
    echo "2. Test authentication endpoints"
    echo "3. Verify all environment variables are set correctly"
    
else
    echo "⚠️  Could not determine deployment URL. Check Vercel dashboard."
fi

echo ""
echo "📚 For troubleshooting, see: VERCEL_DEPLOYMENT.md"