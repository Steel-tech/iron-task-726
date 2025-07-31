# Image Upload Guide for FSW Iron Task

## Current Status
The image upload feature is now configured to use local file storage since AWS S3 credentials are not set up. This guide will help you upload images to your projects.

## How to Upload Images

### 1. Login to the Application
- Go to http://localhost:3000
- Click "Start Documenting" 
- Login with one of these accounts:
  - Admin: `admin@fsw-denver.com` / `Test1234!`
  - Project Manager: `pm@fsw-denver.com` / `Test1234!`
  - Foreman: `foreman@fsw-denver.com` / `Test1234!`

### 2. Navigate to a Project
- Click on "Projects" in the sidebar
- Click on any existing project (e.g., "Denver Tech Center Tower")
- Or create a new project by clicking "New Project"

### 3. Upload Images

#### Option A: From Project Page
1. Once inside a project, look for:
   - "Upload" button
   - "Add Media" button
   - "Add Photo" button
   - Camera icon

#### Option B: From Capture Menu
1. Click "Capture" in the sidebar
2. Click "Upload Files" or similar option
3. Select your project from the dropdown
4. Choose your image files

#### Option C: From Upload Menu
1. Click "Upload" in the sidebar
2. Select the project
3. Choose your files

### 4. Upload Process
- Click the upload button to open file selector
- Select one or more image files (JPG, PNG, GIF supported)
- Add optional information:
  - Activity Type (what work is being documented)
  - Location (where in the project)
  - Notes (any additional details)
  - Tags (for easy searching later)
- Click "Upload" or "Submit"

## File Storage Location
- Images are stored locally in: `/home/ictorarcia/projects/fsw-iron-task/api/uploads/`
- Thumbnails are stored in: `/home/ictorarcia/projects/fsw-iron-task/api/uploads/thumbnails/`
- Files are organized by project ID

## Troubleshooting

### If you don't see an upload option:
1. Make sure you're logged in with appropriate permissions
2. Make sure you're inside a project (not on the projects list page)
3. Check the Media & Tags section in the sidebar

### If upload fails:
1. Check that the API server is running on port 3002
2. Ensure the uploads directory exists and has write permissions
3. Check browser console for error messages
4. Make sure file size is reasonable (under 10MB recommended)

### To verify uploads are working:
1. After uploading, check the project media gallery
2. Look in the uploads directory: `ls -la api/uploads/[project-id]/`
3. Check API logs: `tail -f /tmp/api-restart.log`

## Technical Details
- The system automatically generates thumbnails for images
- Each upload is tracked in the database with metadata
- Files are served through the API at: `http://localhost:3002/api/media/file/[path]`
- Maximum batch upload: 10 files at once

## Next Steps
For production use, you should configure proper cloud storage:
1. Set up AWS S3 or compatible storage (like MinIO)
2. Add these environment variables to `api/.env`:
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_BUCKET_NAME=your-bucket-name
   AWS_REGION=us-east-1
   S3_ENDPOINT=https://s3.amazonaws.com (or your MinIO endpoint)
   ```
3. Restart the API server

The system will automatically switch to S3 storage when these variables are configured.