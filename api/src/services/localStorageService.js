const fs = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { pipeline } = require('stream/promises')
const { createWriteStream } = require('fs')

class LocalStorageService {
  constructor(prisma) {
    this.prisma = prisma
    this.uploadsDir = path.join(process.cwd(), 'uploads')
    this.ensureUploadsDirectory()
  }

  async ensureUploadsDirectory() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true })
      await fs.mkdir(path.join(this.uploadsDir, 'thumbnails'), {
        recursive: true,
      })
    } catch (error) {
      console.error('Failed to create uploads directory:', error)
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
      address,
    } = metadata

    // Validate file type
    const mimeType = file.mimetype
    const isVideo = mimeType.startsWith('video/')
    const isPhoto = mimeType.startsWith('image/')

    if (!isVideo && !isPhoto) {
      throw new Error('Invalid file type. Only images and videos are allowed.')
    }

    // Generate unique file names
    const fileId = uuidv4()
    const extension = this.getFileExtension(file.filename)
    const fileName = `${fileId}.${extension}`

    // Create project directory
    const projectDir = path.join(this.uploadsDir, projectId)
    await fs.mkdir(projectDir, { recursive: true })

    const filePath = path.join(projectDir, fileName)
    const relativePath = path.join(projectId, fileName)

    try {
      // Save file
      await pipeline(file.file, createWriteStream(filePath))

      // Get file info
      const stats = await fs.stat(filePath)
      const fileSize = stats.size

      let width, height, duration, thumbnailPath

      if (isPhoto) {
        // For now, use default dimensions
        width = 1920
        height = 1080

        // Copy as thumbnail for now (in production, you'd resize)
        const thumbName = `thumb_${fileName}`
        const thumbDir = path.join(this.uploadsDir, 'thumbnails', projectId)
        await fs.mkdir(thumbDir, { recursive: true })
        thumbnailPath = path.join('thumbnails', projectId, thumbName)
        await fs.copyFile(filePath, path.join(this.uploadsDir, thumbnailPath))
      } else if (isVideo) {
        // For videos, set placeholder values
        duration = 0
        thumbnailPath = path.join(
          'thumbnails',
          projectId,
          `thumb_${fileId}.jpg`
        )
      }

      // Create database record
      const media = await this.prisma.media.create({
        data: {
          projectId,
          userId,
          fileUrl: relativePath,
          thumbnailUrl: thumbnailPath,
          fileSize,
          mediaType: isVideo
            ? isPictureInPicture
              ? 'DUAL_VIDEO'
              : 'VIDEO'
            : 'PHOTO',
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
          status: 'READY',
        },
        include: {
          project: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Log activity
      await this.prisma.activity.create({
        data: {
          projectId,
          userId,
          type: activityType,
          description: `Uploaded ${isVideo ? 'video' : 'photo'}: ${file.filename}`,
          mediaIds: [media.id],
        },
      })

      return media
    } catch (error) {
      // Clean up on error
      await fs.unlink(filePath).catch(() => {})
      throw error
    }
  }

  async getSignedUrl(relativePath, expiresIn = 3600) {
    if (!relativePath) {return null}

    // For local storage, return a URL to the API endpoint
    const baseUrl =
      process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`
    return `${baseUrl}/api/media/file/${encodeURIComponent(relativePath)}`
  }

  async deleteMedia(mediaId, userId) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    })

    if (!media) {
      throw new Error('Media not found')
    }

    // Delete files
    if (media.fileUrl) {
      const filePath = path.join(this.uploadsDir, media.fileUrl)
      await fs.unlink(filePath).catch(() => {})
    }

    if (media.thumbnailUrl) {
      const thumbPath = path.join(this.uploadsDir, media.thumbnailUrl)
      await fs.unlink(thumbPath).catch(() => {})
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id: mediaId },
    })

    return { success: true }
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase()
  }

  async recordView(mediaId, userId) {
    await this.prisma.mediaView.upsert({
      where: {
        mediaId_userId: {
          mediaId,
          userId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        mediaId,
        userId,
      },
    })
  }
}

module.exports = LocalStorageService
