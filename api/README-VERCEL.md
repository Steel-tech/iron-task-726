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

# Vercel API Deployment Checklist

Set these environment variables in your Vercel API project:

Required:
- NODE_ENV=production
- DATABASE_URL=postgresql://... (prefer pooled: port 6543 with pgbouncer=true&connection_limit=1)
- JWT_SECRET=(64+ chars)
- COOKIE_SECRET=(32+ chars)
- CORS_ORIGIN=https://your-frontend.vercel.app[,https://your-custom-domain.com]
- SUPABASE_URL=https://your-ref.supabase.co
- SUPABASE_SERVICE_ROLE_KEY=eyJ...
- SUPABASE_ANON_KEY=eyJ...
- FRONTEND_URL=https://your-frontend.vercel.app

Optional:
- PUBLIC_URL=defaults to FRONTEND_URL
- REDIS_URL=redis://...
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION, S3_ENDPOINT
- EMAIL_PROVIDER (smtp|sendgrid) + SMTP_* or SENDGRID_API_KEY, SMTP_FROM
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

Notes:
- Do not include /api in NEXT_PUBLIC_API_URL. The web app appends /api internally.
- Ensure CORS_ORIGIN does not include localhost in production.