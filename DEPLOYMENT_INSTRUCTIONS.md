# 🚀 FSW Iron Task Deployment Instructions

## Quick Deploy (5 minutes)

### Step 1: Deploy API Backend to Railway

1. **Sign up/Login to Railway**: https://railway.app
2. **Create New Project** → **Deploy from GitHub repo**
3. **Connect Repository**: `iron-task-726`
4. **Select Service**: Choose `api` folder
5. **Environment Variables** (add these in Railway dashboard):
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=mock://production
   JWT_SECRET=your-secure-jwt-secret-32-chars-minimum
   COOKIE_SECRET=your-secure-cookie-secret-32-chars
   ```
6. **Deploy** - Railway will automatically deploy using `railway.toml`

### Step 2: Deploy Frontend to Vercel

1. **Sign up/Login to Vercel**: https://vercel.com
2. **Import Project** → **Import from Git**
3. **Select Repository**: `iron-task-726`
4. **Framework Preset**: Next.js
5. **Root Directory**: `web`
6. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-app-url.up.railway.app
   ```
7. **Deploy** - Vercel will build and deploy automatically

### Step 3: Update CORS Settings

After both are deployed:
1. **Get your Vercel URL** (e.g., `https://fsw-iron-task.vercel.app`)
2. **Update Railway environment**:
   ```
   CORS_ORIGIN=https://your-vercel-url.vercel.app
   ```
3. **Redeploy** both services

## Alternative: One-Click Deploy

### Railway Template Deploy
```bash
# Clone and deploy to Railway
git clone <your-repo>
cd iron-task-726
railway login
railway link
railway up
```

### Vercel CLI Deploy
```bash
# Deploy frontend to Vercel
cd web
npx vercel --prod
```

## Testing Deployment

1. **API Health Check**: `https://your-api-url.railway.app/api/health`
2. **Frontend**: `https://your-app.vercel.app`
3. **Login Test**: Use `test@example.com` / `Test123@`

## Environment Variables Checklist

### Railway (API):
- [x] NODE_ENV=production
- [x] PORT=3001
- [x] DATABASE_URL=mock://production
- [x] JWT_SECRET (32+ characters)
- [x] COOKIE_SECRET (32+ characters)
- [x] CORS_ORIGIN (your Vercel URL)

### Vercel (Frontend):
- [x] NEXT_PUBLIC_API_URL (your Railway URL)

## Post-Deployment

1. **Test all functionality**
2. **Update domain names** in CORS settings
3. **Monitor logs** for any issues
4. **Set up custom domains** (optional)

## Troubleshooting

- **CORS Issues**: Ensure CORS_ORIGIN matches exactly
- **API Not Found**: Check Railway URL in Vercel env vars
- **Build Failures**: Check logs in respective platforms
- **Login Issues**: Verify API health endpoint first

Your FSW Iron Task app will be live and fully functional! 🎉