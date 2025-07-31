-- FSW IronTrack Database Seed Script
-- This script creates default users with pre-hashed passwords
-- Password for all users: Test1234!
-- Bcrypt hash (10 rounds): $2b$10$8X6Sn3ZKG7JlPQE8aHTxqOS.AVkR5MsVt5.88WYBwpKvZHWNq0kPm

-- Insert default company
INSERT INTO "Company" (id, name, settings, "createdAt", "updatedAt")
VALUES (
  'fsw-default-company',
  'FSW Iron Task',
  '{"address":"123 Industrial Way, Denver, CO 80216","phone":"(303) 555-0100","website":"https://fsw-denver.com","timezone":"America/Denver"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert default users with roles
-- Admin User
INSERT INTO "User" (id, email, password, name, role, "companyId", "unionMember", "phoneNumber", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@fsw-denver.com',
  '$2b$10$8X6Sn3ZKG7JlPQE8aHTxqOS.AVkR5MsVt5.88WYBwpKvZHWNq0kPm',
  'Admin User',
  'ADMIN',
  'fsw-default-company',
  false,
  '(303) 555-0101',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Project Manager
INSERT INTO "User" (id, email, password, name, role, "companyId", "unionMember", "phoneNumber", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'pm@fsw-denver.com',
  '$2b$10$8X6Sn3ZKG7JlPQE8aHTxqOS.AVkR5MsVt5.88WYBwpKvZHWNq0kPm',
  'Project Manager',
  'PROJECT_MANAGER',
  'fsw-default-company',
  false,
  '(303) 555-0102',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Foreman
INSERT INTO "User" (id, email, password, name, role, "companyId", "unionMember", "phoneNumber", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'foreman@fsw-denver.com',
  '$2b$10$8X6Sn3ZKG7JlPQE8aHTxqOS.AVkR5MsVt5.88WYBwpKvZHWNq0kPm',
  'Field Foreman',
  'FOREMAN',
  'fsw-default-company',
  true,
  '(303) 555-0103',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Worker
INSERT INTO "User" (id, email, password, name, role, "companyId", "unionMember", "phoneNumber", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'worker@fsw-denver.com',
  '$2b$10$8X6Sn3ZKG7JlPQE8aHTxqOS.AVkR5MsVt5.88WYBwpKvZHWNq0kPm',
  'Iron Worker',
  'WORKER',
  'fsw-default-company',
  true,
  '(303) 555-0104',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert sample projects
INSERT INTO "Project" (id, "jobNumber", name, location, address, status, "companyId", metadata, "createdAt", "updatedAt")
VALUES 
  (
    gen_random_uuid(),
    '2024-001',
    'Denver Tech Center Tower',
    'Downtown Denver',
    '1801 California St, Denver, CO 80202',
    'ACTIVE',
    'fsw-default-company',
    '{"client":"DTC Development LLC","value":2500000,"startDate":"2024-01-15","estimatedCompletion":"2024-12-31"}',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '2024-002',
    'Cherry Creek Mall Expansion',
    'Cherry Creek',
    '3000 E 1st Ave, Denver, CO 80206',
    'ACTIVE',
    'fsw-default-company',
    '{"client":"Cherry Creek Shopping Center","value":1800000,"startDate":"2024-02-01","estimatedCompletion":"2024-10-15"}',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '2023-115',
    'Union Station Platform Cover',
    'LoDo',
    '1701 Wynkoop St, Denver, CO 80202',
    'COMPLETED',
    'fsw-default-company',
    '{"client":"RTD Denver","value":950000,"startDate":"2023-06-01","completedDate":"2023-12-20"}',
    NOW(),
    NOW()
  )
ON CONFLICT ("jobNumber") DO NOTHING;

-- Assign PM and Foreman to active projects
WITH pm_user AS (
  SELECT id FROM "User" WHERE email = 'pm@fsw-denver.com'
),
foreman_user AS (
  SELECT id FROM "User" WHERE email = 'foreman@fsw-denver.com'
),
active_projects AS (
  SELECT id FROM "Project" WHERE status = 'ACTIVE' AND "companyId" = 'fsw-default-company'
)
INSERT INTO "ProjectMember" ("projectId", "userId", role, "assignedAt")
SELECT p.id, u.id, 'Project Manager', NOW()
FROM active_projects p, pm_user u
UNION ALL
SELECT p.id, u.id, 'Site Foreman', NOW()
FROM active_projects p, foreman_user u
ON CONFLICT ("projectId", "userId") DO NOTHING;

-- Display seed results
SELECT 'Seeded Users:' as info;
SELECT email, name, role FROM "User" WHERE "companyId" = 'fsw-default-company' ORDER BY "createdAt";

SELECT '' as blank;
SELECT 'Seeded Projects:' as info;
SELECT "jobNumber", name, status FROM "Project" WHERE "companyId" = 'fsw-default-company' ORDER BY "jobNumber";

SELECT '' as blank;
SELECT 'Default Password for all users: Test1234!' as info;