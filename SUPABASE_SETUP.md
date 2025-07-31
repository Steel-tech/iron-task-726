# Supabase Setup Guide

This guide will help you set up Supabase for the FSW Iron Task application.

## Prerequisites

- Supabase account (free tier available at https://supabase.com)
- Existing PostgreSQL database to migrate (optional)

## Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New project"
3. Choose your organization
4. Set project details:
   - Name: `fsw-iron-task` (or your preferred name)
   - Database Password: Save this securely!
   - Region: Choose closest to your users
   - Pricing Plan: Free tier is fine for development

## Step 2: Get Your API Keys

After project creation, go to Settings > API:

1. **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
2. **Anon/Public Key**: Safe for client-side use
3. **Service Role Key**: Server-side only (keep secret!)

## Step 3: Configure Environment Variables

### API Backend (`/api/.env`):
```env
# Update these values with your Supabase project details
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
SUPABASE_ANON_KEY=eyJ...your-anon-key

# Update database URL (get from Settings > Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Web Frontend (`/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

## Step 4: Database Migration

### Option A: Fresh Start
1. Run Prisma migrations against Supabase:
   ```bash
   cd api
   npx prisma migrate deploy
   ```

### Option B: Migrate Existing Data
1. Export from current database:
   ```bash
   pg_dump -h localhost -U fsw -d fsw_iron_task > backup.sql
   ```

2. Import to Supabase:
   ```bash
   psql -h db.[YOUR-PROJECT-REF].supabase.co -U postgres -d postgres < backup.sql
   ```

## Step 5: Enable Row Level Security (RLS)

In Supabase Dashboard > SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
```

## Step 6: Set Up Storage Buckets

In Supabase Dashboard > Storage:

1. Create buckets:
   - `photos` - For project photos
   - `documents` - For PDF documents
   - `media` - For other media files

2. Set bucket policies:
   ```sql
   -- Public read for photos
   CREATE POLICY "Public photo access" ON storage.objects
     FOR SELECT USING (bucket_id = 'photos');
   
   -- Authenticated upload
   CREATE POLICY "Authenticated users can upload" ON storage.objects
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   ```

## Step 7: Test Connection

```bash
# Test API connection
cd api
npm run dev

# Check logs for successful Supabase connection
```

## Development vs Production

- **Development**: Can use Docker PostgreSQL or Supabase
- **Production**: Use Supabase for all services

To switch between local and Supabase:
1. Comment/uncomment the appropriate `DATABASE_URL` in `.env`
2. Restart the API server

## Troubleshooting

- **Connection refused**: Check if your IP is allowed in Supabase settings
- **Permission denied**: Ensure RLS policies are correctly set
- **Migration errors**: Run `npx prisma generate` after schema changes

## Next Steps

1. Install Supabase client libraries: `npm install @supabase/supabase-js`
2. Create Supabase service wrapper in `/api/src/lib/supabase.js`
3. Update authentication to use Supabase Auth
4. Migrate file uploads to Supabase Storage