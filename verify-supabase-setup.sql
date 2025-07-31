-- Verify Supabase Setup
-- Run this query to check if all tables were created correctly

SELECT 
    'Tables' as category,
    COUNT(DISTINCT table_name) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Enums' as category,
    COUNT(DISTINCT typname) as count
FROM pg_type 
WHERE typtype = 'e' 
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')

UNION ALL

SELECT 
    'Companies' as category,
    COUNT(*) as count
FROM companies

UNION ALL

SELECT 
    'Users' as category,
    COUNT(*) as count
FROM users

UNION ALL

SELECT 
    'Projects' as category,
    COUNT(*) as count
FROM projects

UNION ALL

SELECT 
    'Tags' as category,
    COUNT(*) as count
FROM tags

UNION ALL

SELECT 
    'Labels' as category,
    COUNT(*) as count
FROM labels;

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;