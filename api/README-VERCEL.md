# FSW Iron Task API - Vercel Deployment

## Quick Start

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   cd api
   ./deploy-vercel.sh production
   ```

4. **Test deployment**:
   ```bash
   ./test-vercel.sh your-deployment-url.vercel.app
   ```

## Environment Variables

Set these in your Vercel dashboard before deployment:

### Required
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `JWT_SECRET` - 32+ character secret for JWT tokens
- `COOKIE_SECRET` - 32+ character secret for cookies
- `CORS_ORIGIN` - Your frontend domain(s)

### Optional
- `DEFAULT_COMPANY_ID` - Default company ID for new users
- `DEMO_USER_EMAIL` - Demo user email for testing
- `DEMO_USER_PASSWORD` - Demo user password for testing

## File Structure

```
api/
├── index.js                 # Vercel serverless entry point
├── vercel.json             # Vercel configuration
├── deploy-vercel.sh        # Deployment script
├── test-vercel.sh          # Testing script
├── .env.vercel.example     # Environment variables template
└── src/
    ├── app.js              # Application factory
    ├── middleware/setup.js # Middleware configuration
    ├── routes/setup.js     # Route registration
    └── ...                 # Other source files
```

## Troubleshooting

### Common Issues

1. **Function timeout**: Increase `maxDuration` in `vercel.json`
2. **Database connection**: Use Supabase connection pooling (port 6543)
3. **CORS errors**: Check `CORS_ORIGIN` environment variable
4. **Cold starts**: Monitor function performance in Vercel dashboard

### View Logs

```bash
vercel logs your-deployment-url.vercel.app
```

### Test Endpoints

```bash
# Health check
curl https://your-deployment.vercel.app/health

# API info
curl https://your-deployment.vercel.app/api

# Test login (with demo credentials)
curl -X POST https://your-deployment.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fsw.local","password":"SecureDemoPass123!"}'
```

## Next Steps

1. Deploy API to Vercel
2. Update frontend `NEXT_PUBLIC_API_URL` environment variable
3. Test all functionality
4. Set up monitoring and alerts

For detailed instructions, see `VERCEL_DEPLOYMENT.md`