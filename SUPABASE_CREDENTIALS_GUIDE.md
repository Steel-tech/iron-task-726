# Supabase Credentials Guide

## Where to Find Your Credentials

### 1. Project URL & API Keys
Go to **Settings > API** in your Supabase dashboard:

- **Project URL**: Look for "Project URL" (format: `https://xxxxx.supabase.co`)
- **Anon Key**: Under "Project API keys" - this is safe for client-side
- **Service Role Key**: Under "Project API keys" - KEEP THIS SECRET!

### 2. Database Connection String
Go to **Settings > Database**:

- Click on "Connection string" tab
- Select "URI" mode
- Copy the connection string
- Replace `[YOUR-PASSWORD]` with your database password

### 3. JWT Secret
Go to **Project Settings > General**:

- Scroll down to "JWT Settings"
- Copy the JWT secret

## Update Your .env.supabase File

Replace the placeholders with your actual values:

```bash
# From Settings > API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# From Settings > Database
SUPABASE_DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres

# From Project Settings > General > JWT Settings
JWT_SECRET=your-jwt-secret-here
```

## Quick Test

After updating `.env.supabase`, run:

```bash
node test-supabase.js
```

You should see "✅ Successfully connected to Supabase!"