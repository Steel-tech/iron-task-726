const MediaUploadService = require('./mediaUpload')
const prisma = require('../lib/prisma')
const mediaService = new MediaUploadService(prisma)

module.exports = {
  getSignedUrl: (key, expiresIn) => mediaService.getSignedUrl(key, expiresIn),
  mediaService,
}
