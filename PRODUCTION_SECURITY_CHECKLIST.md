# 🔐 FSW Iron Task - Production Security Checklist

## Before Deployment

### 🔑 Secrets & Keys
- [ ] Generate new JWT_SECRET (min 64 chars)
  ```bash
  openssl rand -base64 64
  ```
- [ ] Generate new COOKIE_SECRET (min 32 chars)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Verify Supabase keys are correct
- [ ] Never commit real secrets to git

### 🗄️ Database
- [ ] Run refresh token migration in Supabase SQL Editor
- [ ] Verify RefreshToken table created with all indexes
- [ ] Test database connection from API
- [ ] Enable Row Level Security (RLS) on sensitive tables

### 🌐 Environment Configuration
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN to exact frontend URL
- [ ] No wildcards (*) in CORS settings
- [ ] Enable HTTPS on all endpoints

## During Deployment

### 🚀 API Deployment
- [ ] Verify all environment variables set correctly
- [ ] Check build logs for errors
- [ ] Test health endpoint: `/api/health`
- [ ] Verify database connectivity

### 💻 Frontend Deployment
- [ ] Set correct API URL
- [ ] Verify WebSocket URL (if different)
- [ ] Check build optimization
- [ ] Test in production mode locally first

## After Deployment

### ✅ Functional Testing
- [ ] User registration works
- [ ] Login returns access + refresh tokens
- [ ] Refresh token rotation works
- [ ] Logout revokes tokens properly
- [ ] Session management page loads
- [ ] File uploads work
- [ ] Real-time features connect

### 🔒 Security Testing
- [ ] HTTPS enforced on all routes
- [ ] Cookies have secure flags set
- [ ] No sensitive data in responses
- [ ] Rate limiting active on auth endpoints
- [ ] CORS properly restricted

### 📊 Monitoring Setup
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Security alerts configured
- [ ] Database query monitoring

### 🔄 Scheduled Jobs
- [ ] Token cleanup job scheduled (daily 3 AM)
- [ ] Verify job runs successfully
- [ ] Monitor job execution logs

## Post-Launch Tasks

### 👥 User Management
- [ ] Change default admin password
- [ ] Create production user accounts
- [ ] Set appropriate user roles
- [ ] Document admin procedures

### 📝 Documentation
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Share credentials securely

### 🔍 Ongoing Security
- [ ] Schedule security audit (quarterly)
- [ ] Plan secret rotation (quarterly)
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated

## Emergency Procedures

### 🚨 If Compromised
1. Revoke all refresh tokens:
   ```sql
   UPDATE "RefreshToken" 
   SET "revokedAt" = NOW(), 
       "revokedReason" = 'security_incident'
   WHERE "revokedAt" IS NULL;
   ```

2. Rotate all secrets immediately
3. Force all users to re-login
4. Review audit logs

### 🔄 Rollback Plan
1. Keep previous deployment version tagged
2. Database migration rollback ready
3. Environment variable backup
4. Quick revert procedure documented

## Contact Information
- Technical Lead: _______________
- Security Contact: _____________
- Database Admin: ______________
- On-call Engineer: ____________

---
Remember: Security is not a one-time task but an ongoing responsibility!