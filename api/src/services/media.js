const MediaUploadService = require('./mediaUpload');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const mediaService = new MediaUploadService(prisma);

module.exports = {
  getSignedUrl: (key, expiresIn) => mediaService.getSignedUrl(key, expiresIn),
  mediaService
};