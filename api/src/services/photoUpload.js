const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
// const sharp = require('sharp'); // Temporarily disabled due to Alpine Linux issue
const { v4: uuidv4 } = require('uuid')
const Queue = require('bull')

// Initialize S3 client (works with MinIO locally)
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO
})

// Initialize Bull queue for async processing
const photoQueue = new Queue('photo-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
  },
})

// Photo upload service
class PhotoUploadService {
  constructor(prisma) {
    this.prisma = prisma
    this.bucketName = process.env.AWS_BUCKET_NAME || 'fsw-iron-task-dev'
  }

  async uploadPhoto(fileData, metadata) {
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
    } = metadata

    // Generate unique filename
    const photoId = uuidv4()
    const extension = this.getFileExtension(fileData.mimetype)
    const filename = `${projectId}/${photoId}.${extension}`
    const thumbnailFilename = `${projectId}/thumb_${photoId}.jpg`

    try {
      // Process image with Sharp - temporarily disabled
      const imageBuffer = await fileData.toBuffer()
      // const imageMetadata = await sharp(imageBuffer).metadata();
      const imageMetadata = { width: 1920, height: 1080 } // Default values

      // Upload original image
      await this.uploadToS3(filename, imageBuffer, fileData.mimetype)

      // Create thumbnail - temporarily disabled
      // const thumbnailBuffer = await sharp(imageBuffer)
      //   .resize(400, 400, {
      //     fit: 'inside',
      //     withoutEnlargement: true
      //   })
      //   .jpeg({ quality: 80 })
      //   .toBuffer();

      // await this.uploadToS3(thumbnailFilename, thumbnailBuffer, 'image/jpeg');
      await this.uploadToS3(thumbnailFilename, imageBuffer, fileData.mimetype)

      // Save to database
      const photo = await this.prisma.photo.create({
        data: {
          id: photoId,
          projectId,
          userId,
          fileUrl: filename,
          thumbnailUrl: thumbnailFilename,
          fileSize: imageBuffer.length,
          mimeType: fileData.mimetype,
          width: imageMetadata.width,
          height: imageMetadata.height,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          altitude: altitude ? parseFloat(altitude) : null,
          accuracy: accuracy ? parseFloat(accuracy) : null,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          tags,
          activityType,
          location,
          notes,
          metadata: {
            exif: imageMetadata.exif || {},
            originalFilename: fileData.filename,
            uploadedAt: new Date().toISOString(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              jobNumber: true,
              name: true,
            },
          },
        },
      })

      // Add to processing queue for additional operations
      await photoQueue.add('process-photo', {
        photoId: photo.id,
        operations: ['generate-previews', 'extract-metadata', 'notify-team'],
      })

      // Log activity
      await this.prisma.activity.create({
        data: {
          projectId,
          userId,
          type: 'photo_uploaded',
          data: {
            photoId: photo.id,
            filename: fileData.filename,
            activityType,
            location,
          },
        },
      })

      return photo
    } catch (error) {
      console.error('Photo upload error:', error)
      throw error
    }
  }

  async uploadToS3(key, buffer, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)
  }

  async getSignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  }

  getFileExtension(mimetype) {
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    }
    return mimeToExt[mimetype] || 'jpg'
  }

  async batchUpload(files, commonMetadata) {
    const results = []
    const errors = []

    for (const file of files) {
      try {
        const photo = await this.uploadPhoto(file, {
          ...commonMetadata,
          // Allow individual file metadata to override common metadata
          ...file.metadata,
        })
        results.push(photo)
      } catch (error) {
        errors.push({
          filename: file.filename,
          error: error.message,
        })
      }
    }

    return { results, errors }
  }
}

module.exports = PhotoUploadService
