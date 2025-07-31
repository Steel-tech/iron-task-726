#!/bin/bash

# Supabase Migration Script
# This script helps migrate data from local PostgreSQL to Supabase

set -e

echo "=== FSW Iron Task - Supabase Migration Script ==="
echo ""

# Check if required environment variables are set
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL environment variable not set"
    echo "Please set it to your Supabase database URL:"
    echo "export SUPABASE_DB_URL='postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres'"
    exit 1
fi

# Configuration
LOCAL_DB_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"
LOCAL_DB_USER="${LOCAL_DB_USER:-fsw}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-fsw123}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-fsw_iron_task}"

# Parse Supabase URL for pg_dump/psql
SUPABASE_HOST=$(echo $SUPABASE_DB_URL | sed -E 's/.*@([^:]+).*/\1/')
SUPABASE_USER=$(echo $SUPABASE_DB_URL | sed -E 's/.*\/\/([^:]+).*/\1/')
SUPABASE_PASS=$(echo $SUPABASE_DB_URL | sed -E 's/.*:([^@]+)@.*/\1/')
SUPABASE_DB=$(echo $SUPABASE_DB_URL | sed -E 's/.*\/([^?]+).*/\1/')

echo "Migration Configuration:"
echo "- Source: $LOCAL_DB_USER@$LOCAL_DB_HOST:$LOCAL_DB_PORT/$LOCAL_DB_NAME"
echo "- Target: $SUPABASE_HOST (Supabase)"
echo ""

# Function to run commands with error handling
run_command() {
    echo "Running: $1"
    eval "$1"
    if [ $? -ne 0 ]; then
        echo "Error: Command failed"
        exit 1
    fi
}

# Step 1: Create backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Step 1: Creating backup of local database..."
PGPASSWORD=$LOCAL_DB_PASS pg_dump \
    -h $LOCAL_DB_HOST \
    -p $LOCAL_DB_PORT \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --if-exists \
    --clean \
    > "$BACKUP_DIR/local_backup.sql"

echo "Backup saved to: $BACKUP_DIR/local_backup.sql"

# Step 2: Create schema-only dump for analysis
echo ""
echo "Step 2: Extracting schema..."
PGPASSWORD=$LOCAL_DB_PASS pg_dump \
    -h $LOCAL_DB_HOST \
    -p $LOCAL_DB_PORT \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    --schema-only \
    --no-owner \
    --no-privileges \
    > "$BACKUP_DIR/schema.sql"

# Step 3: Create data-only dump
echo ""
echo "Step 3: Extracting data..."
PGPASSWORD=$LOCAL_DB_PASS pg_dump \
    -h $LOCAL_DB_HOST \
    -p $LOCAL_DB_PORT \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    --data-only \
    --no-owner \
    --no-privileges \
    --disable-triggers \
    > "$BACKUP_DIR/data.sql"

# Step 4: Prepare Supabase
echo ""
echo "Step 4: Preparing Supabase database..."
echo "Warning: This will drop and recreate tables in Supabase!"
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

# Step 5: Apply schema to Supabase
echo ""
echo "Step 5: Applying schema to Supabase..."
PGPASSWORD=$SUPABASE_PASS psql \
    -h $SUPABASE_HOST \
    -U $SUPABASE_USER \
    -d $SUPABASE_DB \
    -f "$BACKUP_DIR/schema.sql" \
    2>&1 | tee "$BACKUP_DIR/schema_import.log"

# Step 6: Import data to Supabase
echo ""
echo "Step 6: Importing data to Supabase..."
PGPASSWORD=$SUPABASE_PASS psql \
    -h $SUPABASE_HOST \
    -U $SUPABASE_USER \
    -d $SUPABASE_DB \
    -f "$BACKUP_DIR/data.sql" \
    2>&1 | tee "$BACKUP_DIR/data_import.log"

# Step 7: Run Prisma migrations
echo ""
echo "Step 7: Running Prisma migrations..."
cd api
export DATABASE_URL="$SUPABASE_DB_URL"
npx prisma migrate deploy
npx prisma generate
cd ..

# Step 8: Verify migration
echo ""
echo "Step 8: Verifying migration..."
echo "Checking table counts..."

# Count records in local database
echo ""
echo "Local database counts:"
PGPASSWORD=$LOCAL_DB_PASS psql \
    -h $LOCAL_DB_HOST \
    -p $LOCAL_DB_PORT \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    -c "SELECT 'users' as table_name, COUNT(*) as count FROM users
        UNION ALL SELECT 'projects', COUNT(*) FROM projects
        UNION ALL SELECT 'photos', COUNT(*) FROM photos
        UNION ALL SELECT 'documents', COUNT(*) FROM documents
        UNION ALL SELECT 'forms', COUNT(*) FROM forms
        UNION ALL SELECT 'inspections', COUNT(*) FROM inspections;"

# Count records in Supabase
echo ""
echo "Supabase database counts:"
PGPASSWORD=$SUPABASE_PASS psql \
    -h $SUPABASE_HOST \
    -U $SUPABASE_USER \
    -d $SUPABASE_DB \
    -c "SELECT 'users' as table_name, COUNT(*) as count FROM users
        UNION ALL SELECT 'projects', COUNT(*) FROM projects
        UNION ALL SELECT 'photos', COUNT(*) FROM photos
        UNION ALL SELECT 'documents', COUNT(*) FROM documents
        UNION ALL SELECT 'forms', COUNT(*) FROM forms
        UNION ALL SELECT 'inspections', COUNT(*) FROM inspections;"

echo ""
echo "=== Migration Complete ==="
echo ""
echo "Next steps:"
echo "1. Update your .env files with Supabase credentials"
echo "2. Set up Row Level Security policies (see scripts/setup-rls.sql)"
echo "3. Configure Supabase Storage buckets"
echo "4. Test the application with Supabase"
echo ""
echo "Backup files saved to: $BACKUP_DIR"