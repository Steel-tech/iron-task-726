# 🚀 FSW Iron Task - Deployment Guide

## 🔐 New Security Features
This deployment includes enhanced refresh token security with:
- Token rotation (each token can only be used once)
- Token families for detecting reuse attacks
- Session management (view/revoke sessions)
- Automatic cleanup of expired tokens

## Option A: Deploy to Vercel (Recommended)

### Prerequisites
1. GitHub account
2. Vercel account (free at vercel.com)
3. Your Supabase credentials

### Step 1: Push to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment - FSW Iron Task MVP"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fsw-iron-task.git
git push -u origin main
```

### Step 2: Deploy Backend API
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. **IMPORTANT**: Set root directory to `api`
5. Add these environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres:AB7XcyTB9B6Sp9pe@db.fjoscpvmmcvbgnwxsysp.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://fjoscpvmmcvbgnwxsysp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDcwMzMsImV4cCI6MjA2Nzc4MzAzM30.GFfazb2vdG5mQMmwXxhVflng_6Ir4vksdN7GDAxpXp0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwNzAzMywiZXhwIjoyMDY3NzgzMDMzfQ.z5xnKlXn33niHGPq5-Ad9fla6iwZwKcLIIGFWvvMTPI

# Security (IMPORTANT: Generate new values for production!)
JWT_SECRET=nUXcjCRyI9d6QZw5Ogdd5ytc3qLMaSAouGVTzWKqShN+C6Pv5S8ZuJELiPWZt5boNT9cZI1BQdfCsW9EHpRMyw==
COOKIE_SECRET=your-secure-cookie-secret-min-32-chars

# Server
NODE_ENV=production
CORS_ORIGIN=https://YOUR-FRONTEND-URL.vercel.app
```

6. Deploy! Note your API URL (e.g., `https://fsw-api.vercel.app`)

### Step 3: Deploy Frontend
1. Create another new project in Vercel
2. Import the same GitHub repository
3. **IMPORTANT**: Set root directory to `web`
4. Add these environment variables:

```env
NEXT_PUBLIC_API_URL=https://YOUR-API-URL.vercel.app/api
NEXT_PUBLIC_WS_URL=wss://YOUR-API-URL.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://fjoscpvmmcvbgnwxsysp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDcwMzMsImV4cCI6MjA2Nzc4MzAzM30.GFfazb2vdG5mQMmwXxhVflng_6Ir4vksdN7GDAxpXp0
```

5. Deploy!

### Step 4: Database Migration & Setup
1. **Run the refresh token migration**:
   - Go to Supabase Dashboard > SQL Editor
   - Copy and run the migration from `api/prisma/migrations/20250114_add_refresh_tokens/migration.sql`
   
2. **Update CORS**:
   - Go to your API project settings in Vercel
   - Update the `CORS_ORIGIN` environment variable to your frontend URL
   - Redeploy the API

### Step 5: Set Up Token Cleanup (Optional but Recommended)
1. Use a service like [cron-job.org](https://cron-job.org) or Vercel Cron Jobs
2. Set up a daily job to call: `https://YOUR-API-URL.vercel.app/api/jobs/token-cleanup`
3. Schedule for 3 AM daily

## 🎉 You're Live!

### Default Login
- Email: admin@fsw-denver.com
- Password: Test1234!

### What's Working
- ✅ User authentication (JWT + Refresh Tokens)
- ✅ Secure session management
- ✅ Project management
- ✅ Photo/video upload (using Supabase database)
- ✅ Tagging system
- ✅ Real-time chat
- ✅ Basic reporting
- ✅ Token rotation security

### What's Coming Next
- 🔄 Supabase Auth integration
- 🔄 Supabase Storage for files
- 🔄 AI report generation
- 🔄 Password reset
- 🔄 Enhanced security

## Troubleshooting

### CORS Issues
- Make sure `CORS_ORIGIN` in API matches your frontend URL exactly
- Include `https://` in the URL

### Database Connection
- Verify DATABASE_URL is correct
- Check Supabase dashboard to ensure project is active

### File Uploads
- Currently using temporary storage
- Will migrate to Supabase Storage soon

## Next Steps
1. **Generate secure secrets for production**:
   ```bash
   # Generate JWT Secret
   openssl rand -base64 64
   
   # Generate Cookie Secret
   openssl rand -base64 32
   ```
2. Update environment variables with generated secrets
3. Test authentication flow (login, refresh, logout)
4. Update admin password
5. Add your company users
6. Start documenting projects!

## Security Notes
- The refresh token system prevents token theft
- Each token can only be used once
- If a token is reused, the entire session family is revoked
- Users can manage their sessions from the settings page

Need help? Check the logs in Vercel dashboard or reach out!