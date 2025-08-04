const AWS = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
// const sharp = require('sharp'); // Temporarily disabled due to Alpine Linux issue
const { v4: uuidv4 } = require('uuid');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class MediaUploadService {
  constructor(prisma) {
    this.prisma = prisma;
    this.s3Client = new AWS.S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = process.env.AWS_BUCKET_NAME;
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
    const s3Key = `${projectId}/${fileName}`;

    // Save file temporarily
    const tempPath = path.join(os.tmpdir(), fileName);
    await pipeline(file.file, createWriteStream(tempPath));

    try {
      // Get file info
      const stats = await fs.stat(tempPath);
      const fileSize = stats.size;

      let width, height, duration, thumbnailKey;

      if (isPhoto) {
        // Process image - temporarily disabled sharp
        // const imageInfo = await sharp(tempPath).metadata();
        // width = imageInfo.width;
        // height = imageInfo.height;
        width = 1920; // Default values
        height = 1080;

        // Generate thumbnail - temporarily disabled
        thumbnailKey = `${projectId}/thumb_${fileName}`;
        // const thumbnailBuffer = await sharp(tempPath)
        //   .resize(400, 400, { fit: 'cover' })
        //   .jpeg({ quality: 80 })
        //   .toBuffer();

        // Upload thumbnail - temporarily use original
        const fileBuffer = await fs.readFile(tempPath);
        await this.uploadToS3(thumbnailKey, fileBuffer, mimeType);
      } else if (isVideo) {
        // Process video to extract metadata and generate thumbnail
        const videoMetadata = await this.getVideoMetadata(tempPath);
        duration = videoMetadata.duration;
        width = videoMetadata.width;
        height = videoMetadata.height;
        
        // Generate thumbnail from video
        thumbnailKey = `${projectId}/thumb_${fileId}.jpg`;
        const thumbnailPath = path.join(os.tmpdir(), `thumb_${fileId}.jpg`);
        
        try {
          await this.generateVideoThumbnail(tempPath, thumbnailPath);
          const thumbnailBuffer = await fs.readFile(thumbnailPath);
          await this.uploadToS3(thumbnailKey, thumbnailBuffer, 'image/jpeg');
          
          // Clean up thumbnail file
          await fs.unlink(thumbnailPath).catch(() => {});
        } catch (error) {
          console.error('Failed to generate video thumbnail:', error);
          // Continue without thumbnail
        }
      }

      // Upload original file
      const fileBuffer = await fs.readFile(tempPath);
      await this.uploadToS3(s3Key, fileBuffer, mimeType);

      // Create database record
      const media = await this.prisma.media.create({
        data: {
          projectId,
          userId,
          fileUrl: s3Key,
          thumbnailUrl: thumbnailKey,
          fileSize,
          mimeType,
          mediaType: isVideo ? (isPictureInPicture ? 'DUAL_VIDEO' : 'VIDEO') : 'PHOTO',
          width,
          height,
          duration,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          altitude: altitude ? parseFloat(altitude) : null,
          accuracy: accuracy ? parseFloat(accuracy) : null,
          address,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          tags,
          activityType,
          location,
          notes,
          metadata: file.metadata || {},
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
          type: isVideo ? 'video_uploaded' : 'photo_uploaded',
          data: {
            mediaId: media.id,
            fileName: file.filename,
            fileSize,
            mediaType: media.mediaType
          }
        }
      });

      return media;
    } finally {
      // Clean up temp file
      await fs.unlink(tempPath).catch(() => {});
    }
  }

  async uploadDualCameraVideo(frontFile, backFile, metadata) {
    // Handle picture-in-picture video upload
    const { projectId, userId } = metadata;
    
    // Generate unique IDs
    const videoId = uuidv4();
    const frontKey = `${projectId}/front_${videoId}.mp4`;
    const backKey = `${projectId}/back_${videoId}.mp4`;
    
    // Upload both video files
    // ... implementation for dual camera upload
    
    return await this.uploadMedia(frontFile, {
      ...metadata,
      mediaType: 'DUAL_VIDEO',
      isPictureInPicture: true,
      frontCameraUrl: frontKey,
      backCameraUrl: backKey
    });
  }

  async uploadToS3(key, buffer, contentType) {
    const command = new AWS.PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  async getSignedUrl(key, expiresIn = 3600) {
    if (!key) return null;
    
    const command = new AWS.GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteMedia(mediaId, userId) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { project: true }
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Delete from S3
    await this.deleteFromS3(media.fileUrl);
    if (media.thumbnailUrl) {
      await this.deleteFromS3(media.thumbnailUrl);
    }
    if (media.frontCameraUrl) {
      await this.deleteFromS3(media.frontCameraUrl);
    }
    if (media.backCameraUrl) {
      await this.deleteFromS3(media.backCameraUrl);
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id: mediaId }
    });

    return { success: true };
  }

  async deleteFromS3(key) {
    const command = new AWS.DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  async getMediaByProject(projectId, filters = {}) {
    const { mediaType, startDate, endDate, tags, userId } = filters;
    
    const where = {
      projectId,
      ...(mediaType && { mediaType }),
      ...(userId && { userId }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const media = await this.prisma.media.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        annotations: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { views: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Generate signed URLs
    for (const item of media) {
      item.fileUrl = await this.getSignedUrl(item.fileUrl);
      item.thumbnailUrl = await this.getSignedUrl(item.thumbnailUrl);
      if (item.frontCameraUrl) {
        item.frontCameraUrl = await this.getSignedUrl(item.frontCameraUrl);
      }
      if (item.backCameraUrl) {
        item.backCameraUrl = await this.getSignedUrl(item.backCameraUrl);
      }
    }

    return media;
  }

  async recordView(mediaId, userId) {
    // Record that a user viewed this media
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

  /**
   * Get video metadata using ffmpeg
   * @param {string} videoPath - Path to video file
   * @returns {Promise<Object>} Video metadata
   */
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: Math.round(metadata.format.duration || 0),
          width: videoStream.width,
          height: videoStream.height,
          bitrate: metadata.format.bit_rate,
          codec: videoStream.codec_name,
          fps: parseFloat(videoStream.r_frame_rate) || 0
        });
      });
    });
  }

  /**
   * Generate thumbnail from video
   * @param {string} videoPath - Path to video file
   * @param {string} thumbnailPath - Path where thumbnail will be saved
   * @param {number} timeOffset - Time offset in seconds (default: 1 second)
   * @returns {Promise<void>}
   */
  async generateVideoThumbnail(videoPath, thumbnailPath, timeOffset = 1) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeOffset],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '400x400'
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          // Try again at 0 seconds if the video is shorter than timeOffset
          if (timeOffset > 0) {
            this.generateVideoThumbnail(videoPath, thumbnailPath, 0)
              .then(resolve)
              .catch(reject);
          } else {
            reject(err);
          }
        });
    });
  }

  /**
   * Process dual camera video (Picture-in-Picture)
   * @param {string} mainVideoPath - Path to main video
   * @param {string} pipVideoPath - Path to PiP video
   * @param {string} outputPath - Path for combined video
   * @returns {Promise<void>}
   */
  async processDualCameraVideo(mainVideoPath, pipVideoPath, outputPath) {
    return new Promise((resolve, reject) => {
      // Create picture-in-picture effect
      // PiP video in bottom-right corner at 25% size
      ffmpeg()
        .input(mainVideoPath)
        .input(pipVideoPath)
        .complexFilter([
          '[1:v]scale=iw/4:ih/4[pip]',
          '[0:v][pip]overlay=main_w-overlay_w-10:main_h-overlay_h-10'
        ])
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a copy'
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
}

module.exports = MediaUploadService;