-- Row Level Security (RLS) Setup for FSW Iron Task
-- Run this script in Supabase SQL Editor after creating tables

-- Note: RLS was already enabled in the create script, but we need policies

-- Helper function to get user's role from JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'WORKER'
  )::TEXT;
$$ LANGUAGE SQL STABLE;

-- Helper function to get user's company from JWT
CREATE OR REPLACE FUNCTION auth.user_company()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'companyId',
    ''
  )::TEXT;
$$ LANGUAGE SQL STABLE;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    auth.uid()::TEXT
  )::TEXT;
$$ LANGUAGE SQL STABLE;

-- Company policies
-- Users can only view their own company
CREATE POLICY "Users view own company" ON "Company"
  FOR SELECT USING (id = auth.user_company());

-- User policies
-- Users can view their own profile
CREATE POLICY "Users view own profile" ON "User"
  FOR SELECT USING (id = auth.user_id());

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON "User"
  FOR UPDATE USING (id = auth.user_id());

-- Admins can view all users in their company
CREATE POLICY "Admins view company users" ON "User"
  FOR SELECT USING (
    auth.user_role() IN ('ADMIN', 'PROJECT_MANAGER') AND 
    "companyId" = auth.user_company()
  );

-- Project policies
-- Users can view projects they're assigned to
CREATE POLICY "Users view assigned projects" ON "Project"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ProjectUser" 
      WHERE "ProjectUser"."projectId" = "Project"."id" 
      AND "ProjectUser"."userId" = auth.user_id()
    )
  );

-- Admins/PMs can view all company projects
CREATE POLICY "Admins view all company projects" ON "Project"
  FOR SELECT USING (
    auth.user_role() IN ('ADMIN', 'PROJECT_MANAGER') AND 
    "companyId" = auth.user_company()
  );

-- Admins/PMs can create projects
CREATE POLICY "Admins create projects" ON "Project"
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('ADMIN', 'PROJECT_MANAGER') AND 
    "companyId" = auth.user_company()
  );

-- Admins/PMs can update company projects
CREATE POLICY "Admins update company projects" ON "Project"
  FOR UPDATE USING (
    auth.user_role() IN ('ADMIN', 'PROJECT_MANAGER') AND 
    "companyId" = auth.user_company()
  );

-- ProjectUser policies
-- Users can view project assignments for their projects
CREATE POLICY "Users view project assignments" ON "ProjectUser"
  FOR SELECT USING (
    "userId" = auth.user_id() OR
    EXISTS (
      SELECT 1 FROM "ProjectUser" pu2
      WHERE pu2."projectId" = "ProjectUser"."projectId"
      AND pu2."userId" = auth.user_id()
    )
  );

-- Admins/PMs can manage project assignments
CREATE POLICY "Admins manage project assignments" ON "ProjectUser"
  FOR ALL USING (
    auth.user_role() IN ('ADMIN', 'PROJECT_MANAGER') AND
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project"."id" = "ProjectUser"."projectId"
      AND "Project"."companyId" = auth.user_company()
    )
  );

-- Media policies
-- Users can view media from their projects
CREATE POLICY "Users view project media" ON "Media"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ProjectUser" 
      WHERE "ProjectUser"."projectId" = "Media"."projectId" 
      AND "ProjectUser"."userId" = auth.user_id()
    )
  );

-- Users can upload media to their projects
CREATE POLICY "Users upload media" ON "Media"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ProjectUser" 
      WHERE "ProjectUser"."projectId" = "Media"."projectId" 
      AND "ProjectUser"."userId" = auth.user_id()
    )
  );

-- Users can update their own media
CREATE POLICY "Users update own media" ON "Media"
  FOR UPDATE USING ("uploadedById" = auth.user_id());

-- Tag policies
-- Users can view tags from their company
CREATE POLICY "Users view company tags" ON "Tag"
  FOR SELECT USING ("companyId" = auth.user_company());

-- Admins/PMs can manage tags
CREATE POLICY "Admins manage tags" ON "Tag"
  FOR ALL USING (
    auth.user_role() IN ('ADMIN', 'PROJECT_MANAGER') AND 
    "companyId" = auth.user_company()
  );

-- Comment policies
-- Users can view comments on media they can access
CREATE POLICY "Users view accessible comments" ON "Comment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Media" m
      JOIN "ProjectUser" pu ON m."projectId" = pu."projectId"
      WHERE m."id" = "Comment"."mediaId"
      AND pu."userId" = auth.user_id()
    )
  );

-- Users can create comments on accessible media
CREATE POLICY "Users create comments" ON "Comment"
  FOR INSERT WITH CHECK (
    "userId" = auth.user_id() AND
    EXISTS (
      SELECT 1 FROM "Media" m
      JOIN "ProjectUser" pu ON m."projectId" = pu."projectId"
      WHERE m."id" = "Comment"."mediaId"
      AND pu."userId" = auth.user_id()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users update own comments" ON "Comment"
  FOR UPDATE USING ("userId" = auth.user_id());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.jwt() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.user_role() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.user_company() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.user_id() TO postgres, authenticated, anon;

-- Success message
SELECT 'RLS policies created successfully!' as message;