#!/bin/bash

echo "🚀 Setting up FSW Iron Task environment variables..."

# Navigate to API directory
cd api

echo "📡 Setting API environment variables..."

# Set each environment variable for production
echo "Setting DATABASE_URL..."
echo "postgresql://postgres:66YCqzOAYDFLKRVD@db.fjoscpvmmcvbgnwxsysp.supabase.co:5432/postgres" | vercel env add DATABASE_URL production

echo "Setting JWT_SECRET..."
echo "22ad83824ce05c5613c4db3670d9ebacfb0cb7f74ad6f75bc51fc0b65bf30a0d5a488a40e9724d063602595790c10b6255473749e6ae44fb8f5b6d464cd98972" | vercel env add JWT_SECRET production

echo "Setting COOKIE_SECRET..."
echo "3602c1b19b05a6c3c43ff9867313a4ebad3dc5833ff4549d81311f0ca40aeb4527f42f0e871dd43b0439a3e4463607168601ae4479f1c3d7eee1c13b5ccb3dcd" | vercel env add COOKIE_SECRET production

echo "Setting SUPABASE_URL..."
echo "https://fjoscpvmmcvbgnwxsysp.supabase.co" | vercel env add SUPABASE_URL production

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwNzAzMywiZXhwIjoyMDY3NzgzMDMzfQ.z5xnKlXn33niHGPq5-Ad9fla6iwZwKcLIIGFWvvMTPI" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo "Setting SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDcwMzMsImV4cCI6MjA2Nzc4MzAzM30.GFfazb2vdG5mQMmwXxhVflng_6Ir4vksdN7GDAxpXp0" | vercel env add SUPABASE_ANON_KEY production

echo "Setting NODE_ENV..."
echo "production" | vercel env add NODE_ENV production

echo "Setting CORS_ORIGIN..."
echo "https://fsw-iron-task-o8o4f5da1-fsw-iron-task.vercel.app" | vercel env add CORS_ORIGIN production

# Navigate to web directory
cd ../web

echo "🌐 Setting Frontend environment variables..."

echo "Setting NEXT_PUBLIC_API_URL..."
echo "https://api-na3bd6jsl-fsw-iron-task.vercel.app" | vercel env add NEXT_PUBLIC_API_URL production

echo "✅ Environment variables setup complete!"
echo "🚀 Now redeploying both projects..."

# Redeploy API
cd ../api
vercel --prod --yes

# Redeploy Frontend
cd ../web  
vercel --prod --yes

echo "🎉 Deployment complete! Check the URLs for updated apps."