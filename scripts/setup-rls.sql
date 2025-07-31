-- Row Level Security (RLS) Setup for FSW Iron Task
-- Run this script in Supabase SQL Editor after migration

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Helper function to get user's company
CREATE OR REPLACE FUNCTION auth.user_company()
RETURNS INTEGER AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'companyId')::INTEGER;
$$ LANGUAGE SQL STABLE;

-- Users table policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::TEXT = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::TEXT = id);

-- Admin users can view all users in their company
CREATE POLICY "Admins can view company users" ON users
  FOR SELECT USING (
    auth.user_role() = 'admin' AND 
    company_id = auth.user_company()
  );

-- Projects table policies
-- Users can view projects they're assigned to
CREATE POLICY "Users can view assigned projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = projects.id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Admins can view all projects in their company
CREATE POLICY "Admins can view all company projects" ON projects
  FOR SELECT USING (
    auth.user_role() = 'admin' AND 
    company_id = auth.user_company()
  );

-- Admins can create projects
CREATE POLICY "Admins can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.user_role() = 'admin' AND 
    company_id = auth.user_company()
  );

-- Admins can update their company's projects
CREATE POLICY "Admins can update company projects" ON projects
  FOR UPDATE USING (
    auth.user_role() = 'admin' AND 
    company_id = auth.user_company()
  );

-- Project Users table policies
-- Users can view project assignments
CREATE POLICY "Users can view project assignments" ON project_users
  FOR SELECT USING (
    user_id = auth.uid()::TEXT OR
    EXISTS (
      SELECT 1 FROM project_users pu2
      WHERE pu2.project_id = project_users.project_id
      AND pu2.user_id = auth.uid()::TEXT
    )
  );

-- Admins can manage project assignments
CREATE POLICY "Admins can manage project assignments" ON project_users
  FOR ALL USING (
    auth.user_role() = 'admin' AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_users.project_id
      AND projects.company_id = auth.user_company()
    )
  );

-- Photos table policies
-- Users can view photos from their projects
CREATE POLICY "Users can view project photos" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = photos.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Users can upload photos to their projects
CREATE POLICY "Users can upload photos" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = photos.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Users can update their own photos
CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (uploaded_by = auth.uid()::TEXT);

-- Documents table policies
-- Users can view documents from their projects
CREATE POLICY "Users can view project documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = documents.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Users can upload documents to their projects
CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = documents.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Forms table policies
-- Users can view forms from their projects
CREATE POLICY "Users can view project forms" ON forms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = forms.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Admins can create forms
CREATE POLICY "Admins can create forms" ON forms
  FOR INSERT WITH CHECK (
    auth.user_role() = 'admin' AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = forms.project_id
      AND projects.company_id = auth.user_company()
    )
  );

-- Form submissions policies
-- Users can view submissions they created
CREATE POLICY "Users can view own submissions" ON form_submissions
  FOR SELECT USING (submitted_by = auth.uid()::TEXT);

-- Users can create submissions for project forms
CREATE POLICY "Users can create submissions" ON form_submissions
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid()::TEXT AND
    EXISTS (
      SELECT 1 FROM forms f
      JOIN project_users pu ON f.project_id = pu.project_id
      WHERE f.id = form_submissions.form_id
      AND pu.user_id = auth.uid()::TEXT
    )
  );

-- Inspections table policies
-- Users can view inspections from their projects
CREATE POLICY "Users can view project inspections" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = inspections.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Inspectors can create inspections
CREATE POLICY "Inspectors can create inspections" ON inspections
  FOR INSERT WITH CHECK (
    (auth.user_role() = 'inspector' OR auth.user_role() = 'admin') AND
    inspector_id = auth.uid()::TEXT AND
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = inspections.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Messages table policies
-- Users can view messages from their projects
CREATE POLICY "Users can view project messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = messages.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Users can send messages to their projects
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::TEXT AND
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = messages.project_id 
      AND project_users.user_id = auth.uid()::TEXT
    )
  );

-- Notifications table policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- Storage policies (run in Supabase Dashboard > Storage)
-- These are examples - adjust bucket names as needed

-- Public read for photos bucket
-- INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
-- VALUES (
--   'photos',
--   'Public photo access',
--   'bucket_id = ''photos''',
--   NULL
-- );

-- Authenticated users can upload to photos bucket
-- INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
-- VALUES (
--   'photos',
--   'Authenticated upload',
--   NULL,
--   'auth.role() = ''authenticated'''
-- );

-- Grant necessary permissions for auth functions
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.jwt() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.user_role() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.user_company() TO postgres, authenticated, anon;