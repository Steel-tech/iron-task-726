-- FSW Iron Task Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Create tables based on Prisma schema

-- Company table
CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT
);

-- Project table
CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "jobNumber" TEXT,
  "description" TEXT,
  "location" TEXT,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "status" TEXT DEFAULT 'ACTIVE' NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "isStarred" BOOLEAN DEFAULT false NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT
);

-- ProjectUser junction table
CREATE TABLE IF NOT EXISTS "ProjectUser" (
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT DEFAULT 'VIEWER' NOT NULL,
  "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("projectId", "userId"),
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Media table
CREATE TABLE IF NOT EXISTS "Media" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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
  "capturedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT
);

-- Tag table
CREATE TABLE IF NOT EXISTS "Tag" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "category" TEXT,
  "color" TEXT,
  "companyId" TEXT NOT NULL,
  "isSystem" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE,
  UNIQUE ("name", "companyId")
);

-- Comment table
CREATE TABLE IF NOT EXISTS "Comment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "content" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "parentId" TEXT,
  "mentions" TEXT[],
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS "Media_projectId_idx" ON "Media"("projectId");
CREATE INDEX IF NOT EXISTS "Media_uploadedById_idx" ON "Media"("uploadedById");
CREATE INDEX IF NOT EXISTS "Tag_companyId_idx" ON "Tag"("companyId");
CREATE INDEX IF NOT EXISTS "Comment_mediaId_idx" ON "Comment"("mediaId");

-- Enable Row Level Security on all tables
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

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

-- Insert initial data
INSERT INTO "Company" (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'FSW Denver')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Schema created successfully!' as message;