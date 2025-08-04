#!/bin/bash

# Test Vercel deployment endpoints
# Usage: ./test-vercel.sh [deployment-url]

DEPLOYMENT_URL=${1:-"your-deployment.vercel.app"}

if [ "$DEPLOYMENT_URL" = "your-deployment.vercel.app" ]; then
    echo "❌ Please provide your Vercel deployment URL:"
    echo "Usage: ./test-vercel.sh your-api-deployment.vercel.app"
    exit 1
fi

# Ensure URL has https://
if [[ ! "$DEPLOYMENT_URL" =~ ^https?:// ]]; then
    DEPLOYMENT_URL="https://$DEPLOYMENT_URL"
fi

echo "🧪 Testing FSW Iron Task API deployment..."
echo "🌐 URL: $DEPLOYMENT_URL"
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
if curl -f -s "$DEPLOYMENT_URL/health" | jq . > /dev/null 2>&1; then
    echo "✅ Health check passed"
    curl -s "$DEPLOYMENT_URL/health" | jq .
else
    echo "❌ Health check failed"
fi

echo ""

# Test API info endpoint
echo "2. Testing API info endpoint..."
if curl -f -s "$DEPLOYMENT_URL/api" | jq . > /dev/null 2>&1; then
    echo "✅ API info endpoint working"
    curl -s "$DEPLOYMENT_URL/api" | jq .
else
    echo "❌ API info endpoint failed"
fi

echo ""

# Test authentication endpoint (should fail without credentials)
echo "3. Testing auth endpoint structure..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/auth/login" -X POST -H "Content-Type: application/json" -d '{}')
if [ "$HTTP_STATUS" = "400" ] || [ "$HTTP_STATUS" = "422" ]; then
    echo "✅ Auth endpoint responding (returns $HTTP_STATUS as expected for empty request)"
else
    echo "⚠️  Auth endpoint returned unexpected status: $HTTP_STATUS"
fi

echo ""

# Test with demo credentials if available
echo "4. Testing demo login (if configured)..."
DEMO_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/auth/login" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@fsw.local","password":"SecureDemoPass123!"}')

if echo "$DEMO_RESPONSE" | jq -e .accessToken > /dev/null 2>&1; then
    echo "✅ Demo login successful"
    echo "Access token received: $(echo "$DEMO_RESPONSE" | jq -r .accessToken | cut -c1-20)..."
else
    echo "⚠️  Demo login failed or not configured"
    echo "Response: $DEMO_RESPONSE"
fi

echo ""
echo "🎯 Test Summary:"
echo "- Health Check: $(curl -f -s "$DEPLOYMENT_URL/health" > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL")"
echo "- API Info: $(curl -f -s "$DEPLOYMENT_URL/api" > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL")"
echo "- Auth Structure: $([ "$HTTP_STATUS" = "400" ] || [ "$HTTP_STATUS" = "422" ] && echo "✅ PASS" || echo "⚠️  CHECK")"
echo ""
echo "📋 If tests fail, check:"
echo "1. Environment variables in Vercel dashboard"
echo "2. Database connection (Supabase)"
echo "3. Function logs: vercel logs $DEPLOYMENT_URL"