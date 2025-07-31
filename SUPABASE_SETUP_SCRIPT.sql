-- FSW Iron Task - Supabase Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- ENUMS
-- ========================================

CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'PROJECT_MANAGER', 
  'FOREMAN',
  'WORKER',
  'STEEL_ERECTOR',
  'WELDER',
  'SAFETY_INSPECTOR',
  'VIEWER'
);

CREATE TYPE project_status AS ENUM (
  'PLANNING',
  'ACTIVE', 
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED'
);

CREATE TYPE media_type AS ENUM ('PHOTO', 'VIDEO', 'DUAL_VIDEO');
CREATE TYPE media_status AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');
CREATE TYPE activity_type AS ENUM (
  'ERECTION', 'FABRICATION', 'DELIVERY', 'WELDING', 
  'BOLTING', 'PLUMBING', 'DECKING', 'SAFETY', 'OTHER'
);

CREATE TYPE report_type AS ENUM ('PROGRESS_RECAP', 'SUMMARY', 'DAILY_LOG');
CREATE TYPE report_status AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

-- ========================================
-- CORE TABLES
-- ========================================

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  address TEXT,
  phone VARCHAR(50),
  website VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'America/Denver',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'WORKER',
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  union_member BOOLEAN DEFAULT false,
  phone_number VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT,
  status project_status DEFAULT 'ACTIVE',
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Members
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ========================================
-- MEDIA & DOCUMENTATION
-- ========================================

-- Media
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- File information
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type media_type NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- seconds for videos
  
  -- Location data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  
  -- Business data
  tags TEXT[] DEFAULT '{}',
  activity_type activity_type NOT NULL,
  location TEXT, -- Building location like "Bay 3, Level 2"
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Dual camera support
  is_picture_in_picture BOOLEAN DEFAULT false,
  front_camera_url TEXT,
  back_camera_url TEXT,
  
  -- Processing status
  status media_status DEFAULT 'PROCESSING',
  processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Views
CREATE TABLE media_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);

-- Annotations
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Drawing data, text, measurements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TAGGING & ORGANIZATION
-- ========================================

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  description TEXT,
  category VARCHAR(50), -- 'Material', 'Room Type', 'Status', 'Trade'
  is_system BOOLEAN DEFAULT false,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- Labels
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#10B981',
  description TEXT,
  type VARCHAR(50), -- 'project_type', 'project_status', 'budget_range'
  icon VARCHAR(50),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- Media Tags
CREATE TABLE media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  tagged_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, tag_id)
);

-- Project Labels
CREATE TABLE project_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  assigned_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, label_id)
);

-- ========================================
-- COMMUNICATION & COLLABORATION
-- ========================================

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  original_lang VARCHAR(10) DEFAULT 'en',
  translations JSONB,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'like', 'thumbsup', 'thumbsdown', 'question', 'check'
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, type)
);

-- Team Chat
CREATE TABLE team_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  original_lang VARCHAR(10) DEFAULT 'en',
  translations JSONB,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'mention', 'comment', 'reply', 'reaction', 'project_update'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SHARING & PRESENTATION
-- ========================================

-- Galleries
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  share_token VARCHAR(100) UNIQUE DEFAULT gen_random_uuid()::text,
  is_public BOOLEAN DEFAULT false,
  password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Branding
  brand_logo TEXT,
  brand_color VARCHAR(7),
  watermark BOOLEAN DEFAULT true,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery Items
CREATE TABLE gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  caption TEXT,
  UNIQUE(gallery_id, media_id)
);

-- Gallery Views
CREATE TABLE gallery_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45) NOT NULL,
  viewer_info JSONB,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Timelines
CREATE TABLE project_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  share_token VARCHAR(100) UNIQUE DEFAULT gen_random_uuid()::text,
  is_public BOOLEAN DEFAULT false,
  password TEXT,
  
  -- Display settings
  show_all_media BOOLEAN DEFAULT true,
  media_types TEXT[] DEFAULT '{PHOTO,VIDEO}',
  activity_types TEXT[],
  
  -- Branding
  brand_logo TEXT,
  brand_color VARCHAR(7),
  title VARCHAR(255),
  description TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timeline Views
CREATE TABLE timeline_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id UUID NOT NULL REFERENCES project_timelines(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45) NOT NULL,
  viewer_info JSONB,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- AI REPORTS & ANALYTICS
-- ========================================

-- AI Reports
CREATE TABLE ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  status report_status DEFAULT 'PENDING',
  
  -- Report configuration
  title VARCHAR(255) NOT NULL,
  date_range JSONB,
  media_ids UUID[] DEFAULT '{}',
  sections JSONB,
  
  -- Generated content
  content JSONB,
  summary TEXT,
  todo_items JSONB,
  
  -- File storage
  pdf_url TEXT,
  share_token VARCHAR(100) UNIQUE DEFAULT gen_random_uuid()::text,
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Shares
CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES ai_reports(id) ON DELETE CASCADE,
  shared_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Share settings
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Share method
  method VARCHAR(20) NOT NULL, -- 'email', 'sms', 'link'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Templates
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  report_type report_type NOT NULL,
  
  -- Template configuration
  sections JSONB NOT NULL,
  styling JSONB,
  logo_url TEXT,
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FORMS & COMPLIANCE
-- ========================================

-- Forms Data
CREATE TABLE forms_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_type VARCHAR(100) NOT NULL, -- 'FSW_IRON_TASK', 'DAILY_TIMESHEET', etc.
  data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- USER PREFERENCES & FEED
-- ========================================

-- Starred Projects
CREATE TABLE starred_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Starred Users
CREATE TABLE starred_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, starred_id)
);

-- Feed Preferences
CREATE TABLE feed_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Feed ordering preferences
  project_order UUID[] DEFAULT '{}',
  show_starred_first BOOLEAN DEFAULT true,
  
  -- Feed filtering preferences
  hide_inactive BOOLEAN DEFAULT false,
  hidden_projects UUID[] DEFAULT '{}',
  
  -- Feed display preferences
  view_mode VARCHAR(20) DEFAULT 'grid', -- grid, list, compact
  items_per_page INTEGER DEFAULT 20,
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval INTEGER DEFAULT 30, -- seconds
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feed Events
CREATE TABLE feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- media_uploaded, comment_added, tag_applied, member_added
  entity_type VARCHAR(50) NOT NULL, -- media, comment, tag, user
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Filters
CREATE TABLE saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Filter criteria stored as JSON
  filters JSONB NOT NULL,
  
  -- Display settings
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(100) UNIQUE DEFAULT gen_random_uuid()::text,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ACTIVITY TRACKING
-- ========================================

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  media_ids UUID[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Media indexes
CREATE INDEX idx_media_project_timestamp ON media(project_id, created_at);
CREATE INDEX idx_media_user ON media(user_id);
CREATE INDEX idx_media_activity_type ON media(activity_type);
CREATE INDEX idx_media_status ON media(status);
CREATE INDEX idx_media_location ON media USING GIST (ST_MakePoint(longitude, latitude)) WHERE longitude IS NOT NULL;

-- Comments indexes
CREATE INDEX idx_comments_media ON comments(media_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Feed events indexes
CREATE INDEX idx_feed_events_project_created ON feed_events(project_id, created_at);
CREATE INDEX idx_feed_events_user ON feed_events(user_id);
CREATE INDEX idx_feed_events_type ON feed_events(event_type);

-- Gallery indexes
CREATE INDEX idx_gallery_items_gallery_order ON gallery_items(gallery_id, order_index);

-- Report indexes
CREATE INDEX idx_ai_reports_project ON ai_reports(project_id);
CREATE INDEX idx_ai_reports_user ON ai_reports(user_id);
CREATE INDEX idx_ai_reports_type ON ai_reports(report_type);
CREATE INDEX idx_ai_reports_share_token ON ai_reports(share_token);

-- Forms indexes
CREATE INDEX idx_forms_data_project ON forms_data(project_id);
CREATE INDEX idx_forms_data_user ON forms_data(user_id);
CREATE INDEX idx_forms_data_type ON forms_data(form_type);
CREATE INDEX idx_forms_data_submitted ON forms_data(submitted_at);

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert default company
INSERT INTO companies (id, name, address, phone, website) 
VALUES (
  'fsw-default-company',
  'FSW Iron Task',
  '123 Industrial Way, Denver, CO 80216',
  '(303) 555-0100',
  'https://fsw-denver.com'
);

-- Insert sample users (passwords will be handled by Supabase Auth)
INSERT INTO users (id, email, name, role, company_id, union_member, phone_number) 
VALUES 
  (gen_random_uuid(), 'admin@fsw-denver.com', 'Admin User', 'ADMIN', 'fsw-default-company', false, '(303) 555-0101'),
  (gen_random_uuid(), 'pm@fsw-denver.com', 'Project Manager', 'PROJECT_MANAGER', 'fsw-default-company', false, '(303) 555-0102'),
  (gen_random_uuid(), 'foreman@fsw-denver.com', 'Field Foreman', 'FOREMAN', 'fsw-default-company', true, '(303) 555-0103'),
  (gen_random_uuid(), 'worker@fsw-denver.com', 'Iron Worker', 'WORKER', 'fsw-default-company', true, '(303) 555-0104');

-- Insert sample projects
INSERT INTO projects (id, job_number, name, location, address, status, company_id, metadata) 
VALUES 
  (gen_random_uuid(), '2024-001', 'Denver Tech Center Tower', 'Downtown Denver', '1801 California St, Denver, CO 80202', 'ACTIVE', 'fsw-default-company', '{"client":"DTC Development LLC","value":2500000,"startDate":"2024-01-15","estimatedCompletion":"2024-12-31"}'),
  (gen_random_uuid(), '2024-002', 'Cherry Creek Mall Expansion', 'Cherry Creek', '3000 E 1st Ave, Denver, CO 80206', 'ACTIVE', 'fsw-default-company', '{"client":"Cherry Creek Shopping Center","value":1800000,"startDate":"2024-02-01","estimatedCompletion":"2024-10-15"}'),
  (gen_random_uuid(), '2023-115', 'Union Station Platform Cover', 'LoDo', '1701 Wynkoop St, Denver, CO 80202', 'COMPLETED', 'fsw-default-company', '{"client":"RTD Denver","value":950000,"startDate":"2023-06-01","completedDate":"2023-12-20"}');

-- Insert sample tags
INSERT INTO tags (id, name, slug, color, description, category, company_id, created_by_id) 
VALUES 
  (gen_random_uuid(), 'Steel Beam', 'steel-beam', '#3B82F6', 'Structural steel beams', 'Material', 'fsw-default-company', (SELECT id FROM users WHERE email = 'admin@fsw-denver.com')),
  (gen_random_uuid(), 'Safety Issue', 'safety-issue', '#EF4444', 'Safety concerns or violations', 'Status', 'fsw-default-company', (SELECT id FROM users WHERE email = 'admin@fsw-denver.com')),
  (gen_random_uuid(), 'Completed', 'completed', '#10B981', 'Work that has been finished', 'Status', 'fsw-default-company', (SELECT id FROM users WHERE email = 'admin@fsw-denver.com'));

-- Insert sample labels
INSERT INTO labels (id, name, slug, color, description, type, company_id, created_by_id) 
VALUES 
  (gen_random_uuid(), 'High Priority', 'high-priority', '#EF4444', 'Urgent projects', 'project_status', 'fsw-default-company', (SELECT id FROM users WHERE email = 'admin@fsw-denver.com')),
  (gen_random_uuid(), 'Commercial', 'commercial', '#3B82F6', 'Commercial construction projects', 'project_type', 'fsw-default-company', (SELECT id FROM users WHERE email = 'admin@fsw-denver.com')),
  (gen_random_uuid(), 'Large Budget', 'large-budget', '#10B981', 'Projects over $1M', 'budget_range', 'fsw-default-company', (SELECT id FROM users WHERE email = 'admin@fsw-denver.com'));

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE starred_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE starred_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Note: You'll need to create specific RLS policies based on your authentication setup
-- Example policies will be provided in a separate script

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

-- This script has successfully created all tables for FSW Iron Task
-- Next steps:
-- 1. Set up Supabase Auth
-- 2. Create RLS policies
-- 3. Set up storage buckets
-- 4. Configure your application to use these tables 