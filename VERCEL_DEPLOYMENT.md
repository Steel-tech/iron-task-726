# Vercel Deployment Guide

## Prerequisites

1. Vercel CLI installed: `npm i -g vercel`
2. Vercel account set up
3. Supabase project configured

## Environment Variables

Set these environment variables in your Vercel dashboard or via CLI:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]?pgbouncer=true&connection_limit=1"

# Supabase (Required)
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_ANON_KEY="eyJ..."

# Security (Required - generate 32+ character strings)
JWT_SECRET="your-jwt-secret-min-32-chars"
COOKIE_SECRET="your-cookie-secret-min-32-chars"

# Server Configuration
NODE_ENV="production"
PORT="3001"
HOST="0.0.0.0"
CORS_ORIGIN="https://your-frontend-domain.vercel.app"

# Default Company (Optional)
DEFAULT_COMPANY_ID="fsw-default-company"

# Demo Credentials (Optional)
DEMO_USER_EMAIL="demo@fsw.local"
DEMO_USER_NAME="Demo User" 
DEMO_USER_PASSWORD="DemoPassword123!"

# Debug Credentials (Development only)
DEBUG_TEST_EMAIL="dev@localhost.local"
DEBUG_TEST_PASSWORD="DevPassword123!"
```

### Storage (Optional - for file uploads)
```bash
# S3 Compatible Storage
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_BUCKET_NAME="your-bucket"
AWS_REGION="us-east-1"
S3_ENDPOINT="https://your-s3-endpoint.com"

# Redis (Optional - for caching)
REDIS_URL="redis://localhost:6379"
```

## Deployment Steps

### 1. Via Vercel CLI

```bash
# Navigate to API directory
cd api

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add SUPABASE_URL
vercel env add JWT_SECRET
# ... add all required variables
```

### 2. Via Vercel Dashboard

1. Connect your GitHub repository
2. Set framework preset to "Other"
3. Set build command: `npm run build`
4. Set output directory: Leave empty
5. Set install command: `npm install`
6. Add all environment variables in Settings > Environment Variables

### 3. Database Setup

Ensure your Supabase database has the correct schema:

```sql
-- Run in Supabase SQL Editor
-- Check SUPABASE_SETUP_SCRIPT.sql for complete setup
```

## Testing Deployment

Test these endpoints after deployment:

```bash
# Health check
curl https://your-api.vercel.app/health

# API info
curl https://your-api.vercel.app/api

# Authentication (with demo credentials)
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fsw.local","password":"DemoPassword123!"}'
```

## Troubleshooting

### Common Issues

1. **Cold Start Timeouts**: Increase function timeout in vercel.json
2. **Database Connection Issues**: Use connection pooling in DATABASE_URL
3. **CORS Errors**: Verify CORS_ORIGIN environment variable
4. **Missing Dependencies**: Ensure all dependencies are in package.json

### Logs

View logs in Vercel dashboard or via CLI:
```bash
vercel logs your-deployment-url
```

## Production Considerations

1. **Database**: Use Supabase connection pooling (port 6543)
2. **Security**: Ensure all secrets are properly set
3. **Monitoring**: Set up alerts for errors
4. **Performance**: Monitor cold start times

## File Structure

The API is now organized for Vercel serverless deployment:

```
api/
├── index.js              # Vercel entry point
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
├── src/
│   ├── app.js            # App factory
│   ├── middleware/
│   │   └── setup.js      # Middleware setup
│   ├── routes/
│   │   └── setup.js      # Route setup
│   └── ...               # Other source files
```

## Next Steps

1. Deploy to Vercel
2. Test all endpoints
3. Update frontend NEXT_PUBLIC_API_URL to point to Vercel deployment
4. Monitor performance and errors