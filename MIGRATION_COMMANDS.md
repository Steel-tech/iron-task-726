# Quick Migration Commands

## 1. Stop Docker
```bash
docker-compose down
```

## 2. Set Database URL
```bash
export SUPABASE_DB_URL="postgresql://postgres:AB7XcyTB9B6Sp9pe@db.fjoscpvmmcvbgnwxsysp.supabase.co:5432/postgres"
```

## 3. Run Migration
```bash
./scripts/migrate-to-supabase.sh
```

## 4. In Supabase SQL Editor
- Run contents of scripts/setup-rls.sql
- Run contents of scripts/setup-supabase-storage.sql

## 5. Update App Config
```bash
# Copy Supabase config to main env files
cp .env.supabase api/.env
cp .env.supabase web/.env.local
```
