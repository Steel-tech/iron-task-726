# FSW Iron Task - Supabase Database Schema

## 🏗️ Core Tables for Construction Documentation

### 1. **Companies** (Organizations)
```sql
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
```

### 2. **Users** (Team Members)
```sql
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
```

### 3. **Projects** (Job Sites)
```sql
CREATE TYPE project_status AS ENUM (
  'PLANNING',
  'ACTIVE', 
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED'
);

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
```

### 4. **Project Members** (Team Assignments)
```sql
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
```

## 📸 Media & Documentation Tables

### 5. **Media** (Photos & Videos)
```sql
CREATE TYPE media_type AS ENUM ('PHOTO', 'VIDEO', 'DUAL_VIDEO');
CREATE TYPE media_status AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');
CREATE TYPE activity_type AS ENUM (
  'ERECTION', 'FABRICATION', 'DELIVERY', 'WELDING', 
  'BOLTING', 'PLUMBING', 'DECKING', 'SAFETY', 'OTHER'
);

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
```

### 6. **Media Views** (Analytics)
```sql
CREATE TABLE media_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);
```

### 7. **Annotations** (Photo Markups)
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Drawing data, text, measurements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🏷️ Tagging & Organization System

### 8. **Tags** (Custom Categories)
```sql
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
```

### 9. **Labels** (Project Organization)
```sql
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
```

### 10. **Media Tags** (Many-to-Many)
```sql
CREATE TABLE media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  tagged_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, tag_id)
);
```

### 11. **Project Labels** (Many-to-Many)
```sql
CREATE TABLE project_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  assigned_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, label_id)
);
```

## 💬 Communication & Collaboration

### 12. **Comments** (Photo Discussions)
```sql
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
```

### 13. **Reactions** (Comment Feedback)
```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'like', 'thumbsup', 'thumbsdown', 'question', 'check'
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, type)
);
```

### 14. **Team Chat** (Project Messages)
```sql
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
```

### 15. **Notifications** (User Alerts)
```sql
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
```

## 📊 Sharing & Presentation

### 16. **Galleries** (Photo Collections)
```sql
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
```

### 17. **Gallery Items** (Gallery Contents)
```sql
CREATE TABLE gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  caption TEXT,
  UNIQUE(gallery_id, media_id)
);
```

### 18. **Gallery Views** (Gallery Analytics)
```sql
CREATE TABLE gallery_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45) NOT NULL,
  viewer_info JSONB,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 19. **Project Timelines** (Timeline Views)
```sql
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
```

### 20. **Timeline Views** (Timeline Analytics)
```sql
CREATE TABLE timeline_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id UUID NOT NULL REFERENCES project_timelines(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45) NOT NULL,
  viewer_info JSONB,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🤖 AI Reports & Analytics

### 21. **AI Reports** (Generated Reports)
```sql
CREATE TYPE report_type AS ENUM ('PROGRESS_RECAP', 'SUMMARY', 'DAILY_LOG');
CREATE TYPE report_status AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

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
```

### 22. **Report Shares** (Report Distribution)
```sql
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
```

### 23. **Report Templates** (Custom Report Formats)
```sql
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
```

## 📋 Forms & Compliance

### 24. **Forms Data** (Safety Forms)
```sql
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
```

## ⭐ User Preferences & Feed

### 25. **Starred Projects** (Favorites)
```sql
CREATE TABLE starred_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);
```

### 26. **Starred Users** (Followed Team Members)
```sql
CREATE TABLE starred_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, starred_id)
);
```

### 27. **Feed Preferences** (User Settings)
```sql
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
```

### 28. **Feed Events** (Activity Feed)
```sql
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
```

### 29. **Saved Filters** (Custom Searches)
```sql
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
```

## 🔍 Activity Tracking

### 30. **Activities** (Work Logs)
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  media_ids UUID[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📊 Indexes for Performance

```sql
-- Media indexes
CREATE INDEX idx_media_project_timestamp ON media(project_id, timestamp);
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
```

## 🔐 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ... (enable on all tables)

-- Example policies (implement based on your auth setup)
-- Users can only see their own company's data
-- Project members can see project data
-- Admins can see all company data
```

## 🚀 Quick Setup Commands

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create all tables (run the CREATE TABLE statements above)

-- Insert default company
INSERT INTO companies (id, name, address, phone, website) 
VALUES (
  'fsw-default-company',
  'FSW Iron Task',
  '123 Industrial Way, Denver, CO 80216',
  '(303) 555-0100',
  'https://fsw-denver.com'
);

-- Create indexes
-- (run all the CREATE INDEX statements above)

-- Enable RLS
-- (run all the ALTER TABLE ENABLE ROW LEVEL SECURITY statements)
```

This schema provides a complete foundation for the FSW Iron Task construction documentation system, supporting all the features mentioned in your codebase including media management, team collaboration, AI reports, safety forms, and more. 