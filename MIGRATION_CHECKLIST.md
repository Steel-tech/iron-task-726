# FSW Iron Task - Supabase Migration Checklist

## 📋 Pre-Migration Tasks

### 1. Supabase Setup ✅
- [x] Created Supabase project
- [ ] Collected all credentials from dashboard
- [ ] Updated `.env.supabase` with actual values
- [ ] Tested connection with `node test-supabase.js`

### 2. Prepare for Migration
- [ ] Stop Docker containers: `docker-compose down`
- [ ] Backup local data (optional): `pg_dump -h localhost -U fsw -d fsw_iron_task > backup.sql`
- [ ] Review migration script: `cat scripts/migrate-to-supabase.sh`

## 🚀 Migration Steps

### 3. Database Migration
- [ ] Set environment variable: `export SUPABASE_DB_URL="your-database-url"`
- [ ] Run migration: `./scripts/migrate-to-supabase.sh`
- [ ] Verify tables created in Supabase dashboard

### 4. Security Setup (in Supabase SQL Editor)
- [ ] Run Row Level Security script: `scripts/setup-rls.sql`
- [ ] Run storage setup script: `scripts/setup-supabase-storage.sql`
- [ ] Verify RLS policies are active

### 5. Update Application Configuration
- [ ] Copy Supabase env to API: `cp .env.supabase api/.env`
- [ ] Copy Supabase env to Web: `cp .env.supabase web/.env.local`
- [ ] Update any hardcoded database references

## 🔧 Code Migration Tasks

### 6. Authentication Migration
- [ ] Replace JWT auth with Supabase Auth in API
- [ ] Update login/register endpoints
- [ ] Implement password reset with Supabase
- [ ] Update auth middleware
- [ ] Test user login/logout

### 7. Storage Migration
- [ ] Replace MinIO with Supabase Storage
- [ ] Update file upload endpoints
- [ ] Update file URL generation
- [ ] Test photo/video uploads
- [ ] Verify thumbnail generation

### 8. Database Connection
- [ ] Ensure Prisma uses Supabase URL
- [ ] Run `npx prisma generate` in API folder
- [ ] Test all CRUD operations
- [ ] Verify real-time subscriptions

## 🎯 MVP Features

### 9. AI Report Generation
- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Add OpenAI API key to environment
- [ ] Implement report generation logic
- [ ] Test all 3 report types
- [ ] Add basic error handling

### 10. Security Fixes
- [ ] Move all secrets to env variables
- [ ] Update CORS for production domains
- [ ] Add rate limiting to auth endpoints
- [ ] Remove debug console.logs
- [ ] Update CSP headers

## 🚢 Deployment Preparation

### 11. Vercel Setup
- [ ] Create Vercel project
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set up custom domain (if available)
- [ ] Test deployment

### 12. Final Testing
- [ ] Test user registration/login
- [ ] Upload photos/videos
- [ ] Generate AI reports
- [ ] Check real-time features
- [ ] Verify mobile responsiveness

## 📊 Post-Launch

### 13. Monitoring
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Monitor Supabase usage
- [ ] Set up uptime monitoring
- [ ] Create backup strategy

### 14. Documentation
- [ ] Update README with Supabase setup
- [ ] Document API changes
- [ ] Create deployment guide
- [ ] Update environment variable list
- [ ] Add troubleshooting section

---

## Quick Commands Reference

```bash
# Test connection
node test-supabase.js

# Run migration helper
node supabase-migration-helper.js

# Start migration
export SUPABASE_DB_URL="your-database-url"
./scripts/migrate-to-supabase.sh

# Update Prisma
cd api && npx prisma generate

# Test locally with Supabase
cd api && npm run dev
cd web && npm run dev
```

## Need Help?

1. Check `SUPABASE_CREDENTIALS_GUIDE.md` for credential locations
2. Review `MIGRATION_COMMANDS.md` for quick commands
3. Check Supabase logs in dashboard for errors
4. Verify all environment variables are set correctly

## 🎯 **Your Next Steps Summary:**

### **Immediate Actions (Today):**

1. **Set up your Supabase database:**
   ```bash
   # Copy SUPABASE_SETUP_SCRIPT.sql into your Supabase SQL Editor
   # Run it to create all 30 tables with sample data
   ```

2. **Create storage buckets:**
   - Go to Supabase Dashboard → Storage → Buckets
   - Create: `media`, `thumbnails`, `reports`, `avatars`

3. **Set up RLS policies:**
   ```bash
   # Copy SUPABASE_RLS_POLICIES.sql into Supabase SQL Editor
   # This secures your data with proper access control
   ```

### **Integration Steps (This Week):**

4. **Update your environment variables** using `SUPABASE_INTEGRATION_GUIDE.md`

5. **Install Supabase SDKs:**
   ```bash
   cd api && npm install @supabase/supabase-js
   cd web && npm install @supabase/supabase-js
   ```

6. **Test the integration:**
   ```bash
   node test-supabase-integration.js
   ```

### **What You'll Have After These Steps:**

✅ **Complete database schema** (30 tables)  
✅ **Secure data access** (RLS policies)  
✅ **File storage** (Supabase Storage)  
✅ **User authentication** (Supabase Auth)  
✅ **Sample data** to test with  
✅ **Integration guides** for your app  

### **Ready to Start?**

The database schema I designed covers everything your FSW Iron Task app needs:
- **Construction documentation** (photos, videos, annotations)
- **Team collaboration** (comments, chat, notifications)
- **Project management** (projects, members, activities)
- **AI reports** (progress recaps, summaries, daily logs)
- **Safety compliance** (forms, inspections)
- **Sharing features** (galleries, timelines)

Would you like me to help you with any specific step, or do you have questions about the database design?