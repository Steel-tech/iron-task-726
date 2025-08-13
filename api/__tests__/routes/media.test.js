/**
 * Media Routes Test Suite
 * Comprehensive testing for media upload, processing, and management endpoints
 */

const { TestDatabase, AuthHelpers, FileUploadHelpers, MockServiceHelpers, APITestHelpers } = require('../utils/testHelpers');
const { setupTestDatabase, cleanupTestDatabase } = require('../utils/testDatabase');

// Mock external services
jest.mock('../../src/lib/prisma');
jest.mock('../../src/services/supabaseStorageService');
jest.mock('../../src/services/mediaUpload');
jest.mock('@supabase/supabase-js');

// Mock modules
const mockPrisma = MockServiceHelpers.createPrismaMock();
const mockStorageService = {
  uploadFile: jest.fn(),
  getSignedUrl: jest.fn(),
  deleteFile: jest.fn()
};
const mockMediaUploadService = {
  processUpload: jest.fn(),
  generateThumbnail: jest.fn(),
  extractMetadata: jest.fn()
};

require('../../src/lib/prisma').default = mockPrisma;
require('../../src/services/supabaseStorageService').default = mockStorageService;
require('../../src/services/mediaUpload').default = mockMediaUploadService;

// Mock Fastify app
const fastify = require('fastify')({ logger: false });

// Setup test environment
describe('Media Routes', () => {
  let testDb;
  let testUser;
  let testProject;
  let authToken;

  beforeAll(async () => {
    // Register routes
    await fastify.register(require('../../src/routes/media'));
    
    // Register required plugins
    await fastify.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'test-secret'
    });
    
    await fastify.register(require('@fastify/multipart'));
    
    testDb = await setupTestDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create test data
    testUser = await testDb.createUser({
      email: 'mediatest@example.com',
      name: 'Media Test User',
      role: 'WORKER'
    });
    
    testProject = await testDb.createProject({
      name: 'Media Test Project',
      companyId: testUser.companyId
    });
    
    authToken = AuthHelpers.generateToken({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      companyId: testUser.companyId
    });

    // Setup default mock responses
    mockPrisma.user.findUnique.mockResolvedValue(testUser);
    mockPrisma.project.findUnique.mockResolvedValue(testProject);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await fastify.close();
  });

  describe('POST /media/upload', () => {
    it('should successfully upload a single photo', async () => {
      // Mock successful upload
      const mockMedia = {
        id: 'media-123',
        type: 'PHOTO',
        url: 'https://test-bucket.s3.amazonaws.com/photo.jpg',
        thumbnailUrl: 'https://test-bucket.s3.amazonaws.com/photo-thumb.jpg',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024576,
        projectId: testProject.id,
        userId: testUser.id
      };

      mockStorageService.uploadFile.mockResolvedValue({
        url: mockMedia.url,
        key: 'uploads/photo.jpg'
      });
      
      mockMediaUploadService.processUpload.mockResolvedValue({
        thumbnailUrl: mockMedia.thumbnailUrl,
        metadata: { width: 1920, height: 1080 }
      });

      mockPrisma.media.create.mockResolvedValue(mockMedia);

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest-file-content\r\n------test--`
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('media');
      expect(result.media).toMatchObject({
        id: 'media-123',
        type: 'PHOTO',
        filename: 'photo.jpg'
      });
      
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.any(Object), // file stream
        expect.stringContaining('.jpg'),
        'image/jpeg'
      );
      
      expect(mockPrisma.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'PHOTO',
          projectId: testProject.id,
          userId: testUser.id
        })
      });
    });

    it('should successfully upload multiple photos in batch', async () => {
      const mockMediaBatch = [
        { id: 'media-1', filename: 'photo1.jpg' },
        { id: 'media-2', filename: 'photo2.jpg' }
      ];

      mockStorageService.uploadFile
        .mockResolvedValueOnce({ url: 'url1.jpg', key: 'key1' })
        .mockResolvedValueOnce({ url: 'url2.jpg', key: 'key2' });

      mockMediaUploadService.processUpload
        .mockResolvedValueOnce({ thumbnailUrl: 'thumb1.jpg' })
        .mockResolvedValueOnce({ thumbnailUrl: 'thumb2.jpg' });

      mockPrisma.media.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.media.findMany.mockResolvedValue(mockMediaBatch);

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload/batch',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="files"; filename="photo1.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest1\r\n------test\r\nContent-Disposition: form-data; name="files"; filename="photo2.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest2\r\n------test--`
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('media');
      expect(result.media).toHaveLength(2);
      expect(result.uploaded).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should reject files exceeding size limit', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="large.jpg"\r\nContent-Type: image/jpeg\r\n\r\n${Buffer.alloc(110 * 1024 * 1024, 'x').toString()}\r\n------test--`
      });

      APITestHelpers.expectError(response, 400);
      const result = response.json();
      expect(result.error).toContain('File size exceeds limit');
    });

    it('should reject invalid file types', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="malware.exe"\r\nContent-Type: application/octet-stream\r\n\r\nmalicious-content\r\n------test--`
      });

      APITestHelpers.expectError(response, 400);
      const result = response.json();
      expect(result.error).toContain('Invalid file type');
    });

    it('should require authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: '------test\r\ntest\r\n------test--'
      });

      APITestHelpers.expectError(response, 401);
    });

    it('should require valid project access', async () => {
      // Mock project not found
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\ninvalid-project\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest\r\n------test--`
      });

      APITestHelpers.expectError(response, 404);
    });

    it('should handle storage service failures gracefully', async () => {
      mockStorageService.uploadFile.mockRejectedValue(new Error('Storage unavailable'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest\r\n------test--`
      });

      APITestHelpers.expectError(response, 500);
      const result = response.json();
      expect(result.error).toContain('Upload failed');
    });
  });

  describe('GET /media/:id', () => {
    it('should return media details with signed URL', async () => {
      const mockMedia = await testDb.createMedia({
        projectId: testProject.id,
        userId: testUser.id
      });

      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockStorageService.getSignedUrl.mockResolvedValue('https://signed-url.example.com');

      const response = await fastify.inject({
        method: 'GET',
        url: `/media/${mockMedia.id}`,
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('id', mockMedia.id);
      expect(result).toHaveProperty('signedUrl');
      expect(mockStorageService.getSignedUrl).toHaveBeenCalled();
    });

    it('should track media view', async () => {
      const mockMedia = await testDb.createMedia({
        projectId: testProject.id,
        userId: testUser.id
      });

      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.mediaView.create.mockResolvedValue({});

      const response = await fastify.inject({
        method: 'GET',
        url: `/media/${mockMedia.id}`,
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.mediaView.create).toHaveBeenCalledWith({
        data: {
          mediaId: mockMedia.id,
          userId: testUser.id,
          viewedAt: expect.any(Date)
        }
      });
    });

    it('should return 404 for non-existent media', async () => {
      mockPrisma.media.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: '/media/non-existent',
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      APITestHelpers.expectError(response, 404);
    });
  });

  describe('GET /media', () => {
    it('should return paginated media list for project', async () => {
      const mockMediaList = [
        { id: 'media-1', type: 'PHOTO', projectId: testProject.id },
        { id: 'media-2', type: 'VIDEO', projectId: testProject.id }
      ];

      mockPrisma.media.findMany.mockResolvedValue(mockMediaList);
      mockPrisma.media.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: `/media?projectId=${testProject.id}&page=1&limit=10`,
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('media');
      expect(result).toHaveProperty('pagination');
      expect(result.media).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      
      expect(mockPrisma.media.findMany).toHaveBeenCalledWith({
        where: { projectId: testProject.id },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should filter media by type', async () => {
      const mockPhotos = [
        { id: 'photo-1', type: 'PHOTO', projectId: testProject.id }
      ];

      mockPrisma.media.findMany.mockResolvedValue(mockPhotos);

      const response = await fastify.inject({
        method: 'GET',
        url: `/media?projectId=${testProject.id}&type=PHOTO`,
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(mockPrisma.media.findMany).toHaveBeenCalledWith({
        where: { 
          projectId: testProject.id,
          type: 'PHOTO'
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should filter media by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const response = await fastify.inject({
        method: 'GET',
        url: `/media?projectId=${testProject.id}&startDate=${startDate}&endDate=${endDate}`,
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.media.findMany).toHaveBeenCalledWith({
        where: {
          projectId: testProject.id,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('PUT /media/:id', () => {
    it('should update media metadata', async () => {
      const mockMedia = await testDb.createMedia({
        projectId: testProject.id,
        userId: testUser.id
      });

      const updatedMedia = {
        ...mockMedia,
        description: 'Updated description',
        tags: ['updated', 'test']
      };

      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.media.update.mockResolvedValue(updatedMedia);

      const response = await fastify.inject({
        method: 'PUT',
        url: `/media/${mockMedia.id}`,
        headers: AuthHelpers.createAuthHeader(authToken),
        payload: {
          description: 'Updated description',
          tags: ['updated', 'test']
        }
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result.description).toBe('Updated description');
      
      expect(mockPrisma.media.update).toHaveBeenCalledWith({
        where: { id: mockMedia.id },
        data: {
          description: 'Updated description',
          tags: ['updated', 'test']
        },
        include: expect.any(Object)
      });
    });

    it('should prevent unauthorized updates', async () => {
      const otherUser = await testDb.createUser({
        email: 'other@example.com',
        role: 'WORKER'
      });
      
      const mockMedia = await testDb.createMedia({
        projectId: testProject.id,
        userId: otherUser.id // Different user
      });

      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);

      const response = await fastify.inject({
        method: 'PUT',
        url: `/media/${mockMedia.id}`,
        headers: AuthHelpers.createAuthHeader(authToken),
        payload: {
          description: 'Unauthorized update'
        }
      });

      APITestHelpers.expectError(response, 403);
    });
  });

  describe('DELETE /media/:id', () => {
    it('should delete media and associated files', async () => {
      const mockMedia = await testDb.createMedia({
        projectId: testProject.id,
        userId: testUser.id
      });

      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.media.delete.mockResolvedValue(mockMedia);
      mockStorageService.deleteFile.mockResolvedValue();

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/media/${mockMedia.id}`,
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      APITestHelpers.expectSuccess(response, 204);
      expect(mockStorageService.deleteFile).toHaveBeenCalledTimes(2); // Original and thumbnail
      expect(mockPrisma.media.delete).toHaveBeenCalledWith({
        where: { id: mockMedia.id }
      });
    });

    it('should prevent unauthorized deletion', async () => {
      const otherUser = await testDb.createUser({
        email: 'other@example.com',
        role: 'WORKER'
      });
      
      const mockMedia = await testDb.createMedia({
        projectId: testProject.id,
        userId: otherUser.id
      });

      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/media/${mockMedia.id}`,
        headers: AuthHelpers.createAuthHeader(authToken)
      });

      APITestHelpers.expectError(response, 403);
    });
  });

  describe('Security Tests', () => {
    it('should prevent path traversal in filename', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="../../../etc/passwd"\r\nContent-Type: image/jpeg\r\n\r\nmalicious\r\n------test--`
      });

      APITestHelpers.expectError(response, 400);
    });

    it('should validate file content matches mime type', async () => {
      // Mock file validation to detect mismatch
      mockMediaUploadService.processUpload.mockRejectedValue(
        new Error('File content does not match declared type')
      );

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(authToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="fake.jpg"\r\nContent-Type: image/jpeg\r\n\r\nPK\x03\x04fake-zip-signature\r\n------test--`
      });

      APITestHelpers.expectError(response, 400);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent uploads efficiently', async () => {
      const uploadPromises = Array(5).fill().map((_, index) => {
        mockPrisma.media.create.mockResolvedValueOnce({
          id: `concurrent-${index}`,
          filename: `file-${index}.jpg`
        });

        return fastify.inject({
          method: 'POST',
          url: '/media/upload',
          headers: {
            ...AuthHelpers.createAuthHeader(authToken),
            'content-type': 'multipart/form-data; boundary=----test'
          },
          payload: `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${testProject.id}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="photo${index}.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest${index}\r\n------test--`
        });
      });

      const responses = await Promise.all(uploadPromises);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(201);
      });
      
      expect(mockPrisma.media.create).toHaveBeenCalledTimes(5);
    });
  });
});