const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');
const fs = require('fs').promises;
const path = require('path');

class SupabaseStorageService {
  constructor(prisma) {
    this.prisma = prisma;
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Storage bucket name
    this.bucketName = 'media';
  }

  async ensureBucket() {
    try {
      // Check if bucket exists
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        // Create the bucket
        const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false, // Private bucket, we'll use signed URLs
          allowedMimeTypes: ['image/*', 'video/*'],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (error) throw error;
        console.log(`✅ Created Supabase storage bucket: ${this.bucketName}`);
      }
    } catch (error) {
      console.error('Error ensuring bucket:', error);
    }
  }

  async uploadMedia(file, metadata) {
    const { 
      projectId, 
      userId, 
      activityType, 
      tags = [], 
      location, 
      notes,
      latitude,
      longitude,
      altitude,
      accuracy,
      timestamp,
      mediaType = 'PHOTO',
      isPictureInPicture = false,
      address
    } = metadata;

    // Ensure bucket exists
    await this.ensureBucket();

    // Validate file type
    const mimeType = file.mimetype;
    const isVideo = mimeType.startsWith('video/');
    const isPhoto = mimeType.startsWith('image/');
    
    if (!isVideo && !isPhoto) {
      throw new Error('Invalid file type. Only images and videos are allowed.');
    }

    // Generate unique file names
    const fileId = uuidv4();
    const extension = this.getFileExtension(file.filename);
    const fileName = `${fileId}.${extension}`;
    const filePath = `${projectId}/${fileName}`;

    try {
      // Convert stream to buffer for Supabase
      const chunks = [];
      for await (const chunk of file.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const fileSize = buffer.length;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      let width, height, duration, thumbnailPath;

      if (isPhoto) {
        // For now, use default dimensions (in production, you'd analyze the image)
        width = 1920;
        height = 1080;
        
        // For thumbnails, we'll use the same image for now
        // In production, you'd resize the image
        thumbnailPath = `${projectId}/thumb_${fileName}`;
        
        // Upload thumbnail (for now, same image)
        const { error: thumbError } = await this.supabase.storage
          .from(this.bucketName)
          .upload(thumbnailPath, buffer, {
            contentType: mimeType,
            upsert: false
          });
          
        if (thumbError) console.error('Thumbnail upload error:', thumbError);
      } else if (isVideo) {
        // For videos, set placeholder values
        duration = 0;
        thumbnailPath = `${projectId}/thumb_${fileId}.jpg`;
        // TODO: Generate video thumbnail
      }

      // Create database record
      const media = await this.prisma.media.create({
        data: {
          projectId,
          userId,
          fileUrl: filePath,
          thumbnailUrl: thumbnailPath,
          fileSize,
          mediaType: isVideo ? (isPictureInPicture ? 'DUAL_VIDEO' : 'VIDEO') : 'PHOTO',
          width,
          height,
          duration,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          address,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          tags,
          activityType,
          location,
          notes,
          metadata: {},
          isPictureInPicture,
          status: 'READY'
        },
        include: {
          project: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Log activity
      await this.prisma.activity.create({
        data: {
          projectId,
          userId,
          type: activityType,
          description: `Uploaded ${isVideo ? 'video' : 'photo'}: ${file.filename}`,
          mediaIds: [media.id]
        }
      });

      return media;
    } catch (error) {
      console.error('Upload error:', error);
      // Try to clean up if upload partially succeeded
      try {
        await this.supabase.storage.from(this.bucketName).remove([filePath]);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      throw error;
    }
  }

  async getSignedUrl(filePath, expiresIn = 3600) {
    if (!filePath) return null;
    
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  async deleteMedia(mediaId, userId) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Delete from Supabase Storage
    const filesToDelete = [media.fileUrl];
    if (media.thumbnailUrl) filesToDelete.push(media.thumbnailUrl);
    if (media.frontCameraUrl) filesToDelete.push(media.frontCameraUrl);
    if (media.backCameraUrl) filesToDelete.push(media.backCameraUrl);

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove(filesToDelete.filter(Boolean));

    if (error) {
      console.error('Error deleting from storage:', error);
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id: mediaId }
    });

    return { success: true };
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  async recordView(mediaId, userId) {
    await this.prisma.mediaView.upsert({
      where: {
        mediaId_userId: {
          mediaId,
          userId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        mediaId,
        userId
      }
    });
  }

  // Batch upload support
  async uploadBatch(files, commonMetadata) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const media = await this.uploadMedia(file, commonMetadata);
        results.push(media);
      } catch (error) {
        errors.push({
          filename: file.filename,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  // Get public URL (for public buckets only)
  getPublicUrl(filePath) {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
}

module.exports = SupabaseStorageService;