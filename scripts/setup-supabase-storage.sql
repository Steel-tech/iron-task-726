-- Supabase Storage Buckets Setup for FSW Iron Task
-- Run this in your Supabase SQL Editor

-- Create main storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'project-media',
    'project-media',
    false, -- Private bucket for project photos/videos
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm']::text[]
  ),
  (
    'project-thumbnails',
    'project-thumbnails',
    true, -- Public bucket for thumbnails
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for project-media bucket
-- Policy: Users can upload to their projects
CREATE POLICY "Users can upload to their projects" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text IN (
    SELECT pm.user_id::text
    FROM project_members pm
    WHERE pm.project_id = (storage.foldername(name))[1]
    AND pm.is_active = true
  )
);

-- Policy: Users can view media from their projects
CREATE POLICY "Users can view media from their projects" ON storage.objects
FOR SELECT USING (
  auth.uid()::text IN (
    SELECT pm.user_id::text
    FROM project_members pm
    WHERE pm.project_id = (storage.foldername(name))[1]
    AND pm.is_active = true
  )
);

-- Policy: Users can update their own uploads
CREATE POLICY "Users can update their own uploads" ON storage.objects
FOR UPDATE USING (
  auth.uid()::text = owner
);

-- Policy: Users can delete their own uploads (admins can delete any)
CREATE POLICY "Users can delete media" ON storage.objects
FOR DELETE USING (
  auth.uid()::text = owner
  OR
  auth.uid()::text IN (
    SELECT u.id::text
    FROM users u
    WHERE u.role IN ('ADMIN', 'PROJECT_MANAGER')
  )
);

-- Storage policies for project-thumbnails bucket (public read)
-- Policy: Anyone can view thumbnails
CREATE POLICY "Anyone can view thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'project-thumbnails');

-- Policy: System can upload thumbnails
CREATE POLICY "System can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-thumbnails'
  AND auth.role() = 'service_role'
);

-- Create storage helper functions
CREATE OR REPLACE FUNCTION get_project_media_path(project_id uuid, file_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN project_id::text || '/' || file_name;
END;
$$;

CREATE OR REPLACE FUNCTION get_thumbnail_path(project_id uuid, file_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN project_id::text || '/thumb_' || file_name;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner ON storage.objects(owner);
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name ON storage.objects(name);