#!/bin/bash

echo "Setting up API environment variables..."

# Database
echo "postgresql://postgres:AB7XcyTB9B6Sp9pe@db.fjoscpvmmcvbgnwxsysp.supabase.co:5432/postgres" | vercel env add DATABASE_URL production

# Supabase
echo "https://fjoscpvmmcvbgnwxsysp.supabase.co" | vercel env add SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDcwMzMsImV4cCI6MjA2Nzc4MzAzM30.GFfazb2vdG5mQMmwXxhVflng_6Ir4vksdN7GDAxpXp0" | vercel env add SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3NjcHZtbWN2Ymdud3hzeXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwNzAzMywiZXhwIjoyMDY3NzgzMDMzfQ.z5xnKlXn33niHGPq5-Ad9fla6iwZwKcLIIGFWvvMTPI" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Security
echo "09i2s0gJ2dySf66SJRZ3Ha1xU/9kaalFnnV9Vv9peZ0abcovHoVxdrQJBMeXvTr3PKhDP10vBVA7+ub2q/6BqA==" | vercel env add JWT_SECRET production
echo "lB5PhBtNUgqsPapx5ReKi5IRsY5vh82Pj8LDRFQb64g=" | vercel env add COOKIE_SECRET production

# Server config
echo "production" | vercel env add NODE_ENV production
echo "https://FRONTEND_URL_TO_BE_UPDATED.vercel.app" | vercel env add CORS_ORIGIN production

echo "API environment variables setup complete!"
