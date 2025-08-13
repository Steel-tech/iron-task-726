# 🚀 Vercel Deployment Guide - Iron Task 726

## 📋 **IMMEDIATE DEPLOYMENT STEPS**

### **Step 1: Set Up Environment Variables in Vercel**

Go to your Vercel dashboard for the API project and add these environment variables:

#### **Required Environment Variables**:
```bash
# Security (CRITICAL - Generate secure values)
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
COOKIE_SECRET=your-secure-cookie-secret-minimum-32-characters

# CORS (Your web app domain)
CORS_ORIGIN=https://web-omega-blush-64.vercel.app

# Node Environment
NODE_ENV=production

# Demo User (Optional - for testing)
DEMO_USER_EMAIL=demo@fsw.local
DEMO_USER_NAME=Demo User
DEMO_USER_PASSWORD=DemoPassword123!

# Database (When you set up production database)
DATABASE_URL=your-production-database-url

# Supabase (When configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### **Step 2: Generate Secure Secrets**

Use these commands to generate secure secrets:

```bash
# For JWT_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# For COOKIE_SECRET (Node.js)  
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use online tools:
# https://www.uuidgenerator.net/guid
```

### **Step 3: Deploy the API**

1. **Commit and Push** (already done):
   ```bash
   git push origin chore/test-and-security-hardening
   ```

2. **Trigger Vercel Deployment**:
   - Go to your Vercel dashboard
   - Select the API project
   - Click "Deploy" or wait for automatic deployment

3. **Verify Deployment**:
   - Check: `https://api-sable-kappa-60.vercel.app/api/health`
   - Should return: `{"status":"healthy",...}`

### **Step 4: Deploy the Web App**

1. **Automatic Deployment**: 
   - The web app should auto-deploy with the updated API URL
   - Check: `https://web-omega-blush-64.vercel.app/`

2. **Manual Trigger** (if needed):
   - Go to Vercel dashboard for web project
   - Click "Deploy"

## 🔍 **VERIFICATION CHECKLIST**

### **API Health Checks**:
- [ ] `https://api-sable-kappa-60.vercel.app/` - Shows API info
- [ ] `https://api-sable-kappa-60.vercel.app/api/health` - Returns healthy status
- [ ] `https://api-sable-kappa-60.vercel.app/api/health/detailed` - Shows security features

### **Authentication Test**:
```bash
# Test login endpoint
curl -X POST https://api-sable-kappa-60.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fsw.local","password":"DemoPassword123!"}'
```

### **Web App Connection**:
- [ ] Web app loads: `https://web-omega-blush-64.vercel.app/`
- [ ] Can attempt login (should connect to API)
- [ ] No CORS errors in browser console

## 🛡️ **SECURITY FEATURES ACTIVE**

Your deployment now includes:

### **✅ Enhanced Security**:
- WebSocket authentication bypass fixed
- CSRF protection active
- Rate limiting with IP validation
- Secure file upload validation
- Input sanitization for all parameters
- Real-time security monitoring

### **✅ Production Configuration**:
- Helmet.js security headers
- Proper CORS for your domains
- Secure cookie handling
- Enhanced logging and monitoring

## 🔧 **TROUBLESHOOTING**

### **If API Returns 500 Error**:
1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard > API Project > Functions tab
   - Click on latest deployment to see logs

2. **Common Issues**:
   - Missing environment variables
   - Database connection issues (if using database)
   - Memory/timeout limits exceeded

3. **Environment Variable Check**:
   ```bash
   # Test if environment variables are set
   curl https://api-sable-kappa-60.vercel.app/api/health/detailed
   ```

### **If CORS Errors**:
1. **Check Environment Variables**:
   - Ensure `CORS_ORIGIN` includes your web app domain
   - Format: `https://web-omega-blush-64.vercel.app`

2. **Update CORS_ORIGIN** if needed:
   - Go to Vercel Dashboard > API Project > Settings > Environment Variables
   - Update `CORS_ORIGIN` value

### **If Web App Can't Connect**:
1. **Check Browser Console** for errors
2. **Verify API URL** in web app environment:
   - Should be: `https://api-sable-kappa-60.vercel.app`
3. **Check Network Tab** for failed requests

## 📱 **DEMO LOGIN CREDENTIALS**

Once deployed, you can test with:

**Email**: `demo@fsw.local`  
**Password**: `DemoPassword123!`

## 🎯 **NEXT STEPS**

### **For Full Production**:
1. **Set up Production Database**:
   - Configure Supabase or PostgreSQL
   - Add `DATABASE_URL` environment variable
   - Run database migrations

2. **Enhanced Features**:
   - Real user registration/login
   - File upload functionality
   - Real-time WebSocket features
   - Full construction project management

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Monitor performance metrics
   - Set up health check alerts

## ✅ **SUCCESS INDICATORS**

Your deployment is successful when:

- ✅ API health check returns `{"status":"healthy"}`
- ✅ Web app loads without errors
- ✅ Login attempt connects to API (even if demo)
- ✅ No CORS errors in browser console
- ✅ All security features active in API response

---

## 🆘 **NEED HELP?**

If you encounter issues:

1. **Check Vercel Function Logs** first
2. **Verify Environment Variables** are set correctly
3. **Test API endpoints** individually
4. **Check browser console** for client-side errors

Your Iron Task 726 construction documentation system is now ready for production with enterprise-grade security! 🏗️