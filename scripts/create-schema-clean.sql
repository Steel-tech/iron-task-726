-- FSW Iron Task Database Schema (Clean Install)
-- This will DROP and recreate all tables - BE CAREFUL!

-- Drop existing tables if they exist
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Tag" CASCADE;
DROP TABLE IF EXISTS "Media" CASCADE;
DROP TABLE IF EXISTS "ProjectUser" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Company" CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Create tables with consistent types

-- Company table
CREATE TABLE "Company" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User table
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'WORKER',
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "companyId" TEXT NOT NULL,
  "languagePreference" TEXT DEFAULT 'en',
  "phoneNumber" TEXT,
  "profilePhoto" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Project table
CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "jobNumber" TEXT,
  "description" TEXT,
  "location" TEXT,
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "status" TEXT DEFAULT 'ACTIVE' NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "isStarred" BOOLEAN DEFAULT false NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ProjectUser junction table
CREATE TABLE "ProjectUser" (
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT DEFAULT 'VIEWER' NOT NULL,
  "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("projectId", "userId"),
  CONSTRAINT "ProjectUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Media table
CREATE TABLE "Media" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "projectId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "type" TEXT NOT NULL,
  "metadata" JSONB,
  "tags" TEXT[],
  "description" TEXT,
  "location" TEXT,
  "capturedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tag table
CREATE TABLE "Tag" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "color" TEXT,
  "companyId" TEXT NOT NULL,
  "isSystem" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Tag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Tag_unique_name_company" UNIQUE ("name", "companyId")
);

-- Comment table
CREATE TABLE "Comment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "content" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "parentId" TEXT,
  "mentions" TEXT[],
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Comment_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX "Media_projectId_idx" ON "Media"("projectId");
CREATE INDEX "Media_uploadedById_idx" ON "Media"("uploadedById");
CREATE INDEX "Tag_companyId_idx" ON "Tag"("companyId");
CREATE INDEX "Comment_mediaId_idx" ON "Comment"("mediaId");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON "Company"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON "Project"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON "Media"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tag_updated_at BEFORE UPDATE ON "Tag"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comment_updated_at BEFORE UPDATE ON "Comment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security on all tables
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

-- Insert initial data
INSERT INTO "Company" (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'FSW Denver');

-- Create initial admin user (password: Test1234!)
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "companyId") VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'admin@fsw-denver.com', '$2b$10$YKpVqK8KfXqD5C4L7fJNGOb7XQVOpC5hDR1YqRd7DLPQ4sVZqUfAa', 'Admin', 'User', 'ADMIN', '550e8400-e29b-41d4-a716-446655440001');

-- Success message
SELECT 'Schema created successfully!' as message;