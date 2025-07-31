# Supabase Storage Setup Guide

## Overview
This guide will help you set up Supabase Storage for media uploads in FSW Iron Task. Supabase Storage provides a scalable, secure solution for storing images and videos.

## Prerequisites
- Supabase account (already set up based on your .env file)
- Supabase project URL and service role key (already in .env)

## Step 1: Set Up Storage Bucket in Supabase Dashboard

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket** if the "media" bucket doesn't exist
4. Configure the bucket:
   - Name: `media`
   - Public: **OFF** (we'll use signed URLs for security)
   - Allowed MIME types: Click "Add MIME type" and add:
     - `image/*` (for all image types)
     - `video/*` (for all video types)
   - Max file size: 52428800 (50MB) or adjust as needed

## Step 2: Set Up Storage Policies (RLS)

For the media bucket, create these policies:

### 1. Authenticated users can upload
```sql
-- Policy name: Authenticated users can upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');
```

### 2. Users can view their company's files
```sql
-- Policy name: Users can view company files
CREATE POLICY "Users can view company files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'media');
```

### 3. Users can delete their own uploads
```sql
-- Policy name: Users can delete own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 3: Restart Your API Server

The application is already configured to detect and use Supabase Storage automatically.

```bash
# Kill existing API server
ps aux | grep "node.*index.js" | grep -v grep | awk '{print $2}' | xargs -r kill

# Start API server
cd /home/ictorarcia/projects/fsw-iron-task/api
PORT=3002 npm run dev
```

## Step 4: Verify Setup

1. Check API logs for: `Using Supabase Storage for media uploads`
2. Try uploading an image through the application
3. Check Supabase dashboard Storage section to see uploaded files

## How It Works

1. **Upload Process**:
   - Files are uploaded directly to Supabase Storage
   - Each project gets its own folder: `media/{project-id}/`
   - Files are named with UUIDs to prevent conflicts
   - Metadata is stored in your PostgreSQL database

2. **Security**:
   - Files are private by default
   - Access is controlled via signed URLs (1-hour expiration)
   - Only authenticated users can upload
   - Users can only access files from their company

3. **File Organization**:
   ```
   media/
   ├── project-id-1/
   │   ├── uuid1.jpg
   │   ├── thumb_uuid1.jpg
   │   └── uuid2.mp4
   └── project-id-2/
       ├── uuid3.png
       └── thumb_uuid3.png
   ```

## Troubleshooting

### "Bucket not found" error
- Make sure you created the "media" bucket in Supabase dashboard
- Check that the bucket name in the code matches exactly

### "Permission denied" errors
- Verify RLS policies are set up correctly
- Make sure you're using the service role key (not anon key) in .env
- Check that the user is authenticated

### Upload fails silently
- Check browser console for errors
- Check API logs: `tail -f /tmp/api-restart.log`
- Verify file size is under the limit
- Ensure MIME type is allowed

### Can't see uploaded files
- Check if signed URLs are being generated correctly
- Verify the bucket exists and has the uploaded files
- Check that frontend is using the signed URLs

## Benefits of Supabase Storage

1. **Scalability**: Handles any amount of files
2. **CDN**: Files are served via Supabase's CDN
3. **Security**: Built-in RLS policies
4. **Integration**: Works seamlessly with Supabase Auth and Database
5. **Cost-effective**: Generous free tier
6. **No server management**: Fully managed service

## Migration from Local Storage

If you have existing files in local storage:

1. Upload them to Supabase Storage maintaining the same structure
2. Update database records with new file paths
3. Test that all files are accessible
4. Remove local files once confirmed

## Next Steps

1. Set up image optimization (Supabase supports on-the-fly transformations)
2. Implement video thumbnail generation
3. Add file type validation on the frontend
4. Set up backup policies
5. Monitor storage usage in Supabase dashboard