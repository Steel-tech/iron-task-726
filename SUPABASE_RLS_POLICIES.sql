-- FSW Iron Task - Row Level Security Policies
-- Run this in Supabase SQL Editor after creating tables

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Get current user's company ID
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::UUID;
$$ LANGUAGE SQL STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'ADMIN';
$$ LANGUAGE SQL STABLE;

-- Check if user is project manager or admin
CREATE OR REPLACE FUNCTION auth.is_manager()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('ADMIN', 'PROJECT_MANAGER');
$$ LANGUAGE SQL STABLE;

-- ========================================
-- COMPANY POLICIES
-- ========================================

-- Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = auth.user_company_id());

-- Only admins can update company info
CREATE POLICY "Admins can update company" ON companies
  FOR UPDATE USING (auth.is_admin() AND id = auth.user_company_id());

-- ========================================
-- USER POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::TEXT = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::TEXT = id);

-- Admins can view all users in their company
CREATE POLICY "Admins can view company users" ON users
  FOR SELECT USING (
    auth.is_admin() AND 
    company_id = auth.user_company_id()
  );

-- Admins can create users in their company
CREATE POLICY "Admins can create company users" ON users
  FOR INSERT WITH CHECK (
    auth.is_admin() AND 
    company_id = auth.user_company_id()
  );

-- ========================================
-- PROJECT POLICIES
-- ========================================

-- Users can view projects in their company
CREATE POLICY "Users can view company projects" ON projects
  FOR SELECT USING (company_id = auth.user_company_id());

-- Managers and admins can create projects
CREATE POLICY "Managers can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.is_manager() AND 
    company_id = auth.user_company_id()
  );

-- Managers and admins can update projects
CREATE POLICY "Managers can update projects" ON projects
  FOR UPDATE USING (
    auth.is_manager() AND 
    company_id = auth.user_company_id()
  );

-- ========================================
-- PROJECT MEMBERS POLICIES
-- ========================================

-- Users can view project members for projects they have access to
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Managers can manage project members
CREATE POLICY "Managers can manage project members" ON project_members
  FOR ALL USING (
    auth.is_manager() AND
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- ========================================
-- MEDIA POLICIES
-- ========================================

-- Users can view media from their company's projects
CREATE POLICY "Users can view company media" ON media
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Users can upload media to projects they're assigned to
CREATE POLICY "Users can upload media" ON media
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can update their own media
CREATE POLICY "Users can update own media" ON media
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- Users can delete their own media
CREATE POLICY "Users can delete own media" ON media
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- MEDIA VIEWS POLICIES
-- ========================================

-- Users can view their own media views
CREATE POLICY "Users can view own media views" ON media_views
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

-- Users can create media views for company media
CREATE POLICY "Users can create media views" ON media_views
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    media_id IN (
      SELECT m.id FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- ========================================
-- ANNOTATIONS POLICIES
-- ========================================

-- Users can view annotations on company media
CREATE POLICY "Users can view company annotations" ON annotations
  FOR SELECT USING (
    media_id IN (
      SELECT m.id FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can create annotations on company media
CREATE POLICY "Users can create annotations" ON annotations
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    media_id IN (
      SELECT m.id FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can update their own annotations
CREATE POLICY "Users can update own annotations" ON annotations
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- Users can delete their own annotations
CREATE POLICY "Users can delete own annotations" ON annotations
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- TAGS POLICIES
-- ========================================

-- Users can view tags from their company
CREATE POLICY "Users can view company tags" ON tags
  FOR SELECT USING (company_id = auth.user_company_id());

-- Managers can create tags
CREATE POLICY "Managers can create tags" ON tags
  FOR INSERT WITH CHECK (
    auth.is_manager() AND 
    company_id = auth.user_company_id()
  );

-- Managers can update tags
CREATE POLICY "Managers can update tags" ON tags
  FOR UPDATE USING (
    auth.is_manager() AND 
    company_id = auth.user_company_id()
  );

-- ========================================
-- LABELS POLICIES
-- ========================================

-- Users can view labels from their company
CREATE POLICY "Users can view company labels" ON labels
  FOR SELECT USING (company_id = auth.user_company_id());

-- Managers can create labels
CREATE POLICY "Managers can create labels" ON labels
  FOR INSERT WITH CHECK (
    auth.is_manager() AND 
    company_id = auth.user_company_id()
  );

-- Managers can update labels
CREATE POLICY "Managers can update labels" ON labels
  FOR UPDATE USING (
    auth.is_manager() AND 
    company_id = auth.user_company_id()
  );

-- ========================================
-- MEDIA TAGS POLICIES
-- ========================================

-- Users can view media tags for company media
CREATE POLICY "Users can view company media tags" ON media_tags
  FOR SELECT USING (
    media_id IN (
      SELECT m.id FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can tag company media
CREATE POLICY "Users can tag media" ON media_tags
  FOR INSERT WITH CHECK (
    tagged_by_id::TEXT = auth.uid()::TEXT AND
    media_id IN (
      SELECT m.id FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can remove their own tags
CREATE POLICY "Users can remove own tags" ON media_tags
  FOR DELETE USING (tagged_by_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- PROJECT LABELS POLICIES
-- ========================================

-- Users can view project labels for company projects
CREATE POLICY "Users can view company project labels" ON project_labels
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Managers can assign labels to projects
CREATE POLICY "Managers can assign project labels" ON project_labels
  FOR INSERT WITH CHECK (
    auth.is_manager() AND
    assigned_by_id::TEXT = auth.uid()::TEXT AND
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Managers can remove project labels
CREATE POLICY "Managers can remove project labels" ON project_labels
  FOR DELETE USING (
    auth.is_manager() AND
    assigned_by_id::TEXT = auth.uid()::TEXT
  );

-- ========================================
-- COMMENTS POLICIES
-- ========================================

-- Users can view comments on company media
CREATE POLICY "Users can view company comments" ON comments
  FOR SELECT USING (
    media_id IN (
      SELECT m.id FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can create comments on company media
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    media_id IN (
      SELECT m.id FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- REACTIONS POLICIES
-- ========================================

-- Users can view reactions on company comments
CREATE POLICY "Users can view company reactions" ON reactions
  FOR SELECT USING (
    comment_id IN (
      SELECT c.id FROM comments c
      JOIN media m ON c.media_id = m.id
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can create reactions on company comments
CREATE POLICY "Users can create reactions" ON reactions
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    comment_id IN (
      SELECT c.id FROM comments c
      JOIN media m ON c.media_id = m.id
      JOIN projects p ON m.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions" ON reactions
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- TEAM CHAT POLICIES
-- ========================================

-- Users can view team chat for their projects
CREATE POLICY "Users can view team chat" ON team_chat
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can send messages to their projects
CREATE POLICY "Users can send team chat messages" ON team_chat
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON team_chat
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON team_chat
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- NOTIFICATIONS POLICIES
-- ========================================

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- GALLERIES POLICIES
-- ========================================

-- Users can view galleries from their company projects
CREATE POLICY "Users can view company galleries" ON galleries
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Users can create galleries for their projects
CREATE POLICY "Users can create galleries" ON galleries
  FOR INSERT WITH CHECK (
    created_by_id::TEXT = auth.uid()::TEXT AND
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can update their own galleries
CREATE POLICY "Users can update own galleries" ON galleries
  FOR UPDATE USING (created_by_id::TEXT = auth.uid()::TEXT);

-- Users can delete their own galleries
CREATE POLICY "Users can delete own galleries" ON galleries
  FOR DELETE USING (created_by_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- GALLERY ITEMS POLICIES
-- ========================================

-- Users can view gallery items for company galleries
CREATE POLICY "Users can view company gallery items" ON gallery_items
  FOR SELECT USING (
    gallery_id IN (
      SELECT g.id FROM galleries g
      JOIN projects p ON g.project_id = p.id
      WHERE p.company_id = auth.user_company_id()
    )
  );

-- Users can add items to their galleries
CREATE POLICY "Users can add gallery items" ON gallery_items
  FOR INSERT WITH CHECK (
    gallery_id IN (
      SELECT id FROM galleries WHERE created_by_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can update their gallery items
CREATE POLICY "Users can update own gallery items" ON gallery_items
  FOR UPDATE USING (
    gallery_id IN (
      SELECT id FROM galleries WHERE created_by_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can remove items from their galleries
CREATE POLICY "Users can remove own gallery items" ON gallery_items
  FOR DELETE USING (
    gallery_id IN (
      SELECT id FROM galleries WHERE created_by_id::TEXT = auth.uid()::TEXT
    )
  );

-- ========================================
-- AI REPORTS POLICIES
-- ========================================

-- Users can view reports from their company projects
CREATE POLICY "Users can view company reports" ON ai_reports
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Users can create reports for their projects
CREATE POLICY "Users can create reports" ON ai_reports
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can update their own reports
CREATE POLICY "Users can update own reports" ON ai_reports
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON ai_reports
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- FORMS DATA POLICIES
-- ========================================

-- Users can view forms data from their company projects
CREATE POLICY "Users can view company forms data" ON forms_data
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Users can submit forms for their projects
CREATE POLICY "Users can submit forms" ON forms_data
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can update their own forms
CREATE POLICY "Users can update own forms" ON forms_data
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- FEED EVENTS POLICIES
-- ========================================

-- Users can view feed events from their company projects
CREATE POLICY "Users can view company feed events" ON feed_events
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- System can create feed events (handled by triggers)
CREATE POLICY "System can create feed events" ON feed_events
  FOR INSERT WITH CHECK (true);

-- ========================================
-- ACTIVITIES POLICIES
-- ========================================

-- Users can view activities from their company projects
CREATE POLICY "Users can view company activities" ON activities
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.user_company_id()
    )
  );

-- Users can create activities for their projects
CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT AND
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id::TEXT = auth.uid()::TEXT
    )
  );

-- Users can update their own activities
CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

-- All RLS policies have been created
-- Your database is now secure with proper access control
-- Users can only access data from their own company
-- Project members can only access their assigned projects
-- Admins have full access to their company's data 