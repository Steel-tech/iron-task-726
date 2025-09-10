<metadata>
purpose: Comprehensive API documentation for Iron Task 726 construction documentation system
type: API
language: Node.js/Fastify
dependencies: Fastify 5.4.0, Prisma 5.22.0, Supabase, JWT, Socket.io
last-updated: 2025-09-10
</metadata>

<overview>
Complete API reference for the Iron Task 726 construction documentation system backend services, including authentication, project management, media handling, reporting, and real-time features.
</overview>

# API Reference
## Iron Task 726 Construction Documentation System

### 🏗️ **Base Configuration**

<configuration>
<setting name="baseURL" type="string" default="http://localhost:3001/api">
  Base URL for all API endpoints in development
</setting>
<setting name="authentication" type="string" default="Bearer JWT">
  Uses JWT Bearer tokens for authentication
</setting>
<setting name="contentType" type="string" default="application/json">
  Default content type for API requests
</setting>
<setting name="rateLimit" type="object" default="varies-by-endpoint">
  Rate limiting applied per endpoint for security
</setting>
</configuration>

**Base URL**: `http://localhost:3001/api`  
**Authentication**: Bearer JWT Token  
**Content-Type**: `application/json`

---

## 🔐 **Authentication API**

### **User Registration**

<functions>
<function name="POST /api/auth/register">
  <signature>POST /api/auth/register</signature>
  <purpose>Register new user account with role-based access</purpose>
  <parameters>
    <param name="email" type="string" required="true">User email address (must be unique)</param>
    <param name="password" type="string" required="true">Password (minimum 8 characters)</param>
    <param name="name" type="string" required="true">Full name</param>
    <param name="role" type="string" required="false">User role (default: WORKER)</param>
    <param name="companyId" type="string" required="false">Company UUID</param>
    <param name="unionMember" type="boolean" required="false">Union membership status</param>
    <param name="phoneNumber" type="string" required="false">Contact phone number</param>
  </parameters>
  <returns>User object with access and refresh tokens</returns>
  <examples>
    <example>
      <input>
{
  "email": "worker@fsw-denver.com",
  "password": "SecurePass123!",
  "name": "John Smith",
  "role": "STEEL_ERECTOR",
  "unionMember": true,
  "phoneNumber": "+1-555-0123"
}
      </input>
      <output>
{
  "user": {
    "id": "uuid-user-id",
    "email": "worker@fsw-denver.com",
    "name": "John Smith",
    "role": "STEEL_ERECTOR",
    "companyId": "uuid-company-id"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
      </output>
    </example>
  </examples>
  <errors>
    <error type="ValidationError">Invalid email format or password too weak</error>
    <error type="ConflictError">Email already exists</error>
    <error type="RateLimitError">Too many registration attempts</error>
  </errors>
</function>
</functions>

### **User Login**

<functions>
<function name="POST /api/auth/login">
  <signature>POST /api/auth/login</signature>
  <purpose>Authenticate user with enhanced security features</purpose>
  <parameters>
    <param name="email" type="string" required="true">User email</param>
    <param name="password" type="string" required="true">User password</param>
    <param name="rememberDevice" type="boolean" required="false">Remember device for future logins</param>
    <param name="captchaResponse" type="string" required="false">CAPTCHA response (required after 3 failed attempts)</param>
  </parameters>
  <returns>Authentication tokens and user profile</returns>
  <examples>
    <example>
      <input>
{
  "email": "admin@fsw-denver.com",
  "password": "Test1234!",
  "rememberDevice": true
}
      </input>
      <output>
{
  "user": {
    "id": "uuid-admin-id",
    "email": "admin@fsw-denver.com",
    "name": "Admin User",
    "role": "ADMIN",
    "twoFactorEnabled": false
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "sessionId": "session-uuid"
}
      </output>
    </example>
  </examples>
  <errors>
    <error type="AuthenticationError">Invalid credentials</error>
    <error type="CaptchaRequiredError">CAPTCHA required after failed attempts</error>
    <error type="TwoFactorRequiredError">2FA token required</error>
  </errors>
</function>
</functions>

### **Token Management**

<functions>
<function name="POST /api/auth/refresh">
  <signature>POST /api/auth/refresh</signature>
  <purpose>Refresh access token using refresh token</purpose>
  <parameters>
    <param name="refreshToken" type="string" required="true">Valid refresh token</param>
  </parameters>
  <returns>New access token and optionally new refresh token</returns>
  <examples>
    <example>
      <input>{"refreshToken": "jwt-refresh-token"}</input>
      <output>
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token",
  "expiresIn": 3600
}
      </output>
    </example>
  </examples>
</function>

<function name="POST /api/auth/logout">
  <signature>POST /api/auth/logout</signature>
  <purpose>Invalidate refresh token and clear session</purpose>
  <parameters>
    <param name="refreshToken" type="string" required="true">Refresh token to invalidate</param>
  </parameters>
  <returns>Success confirmation</returns>
  <examples>
    <example>
      <input>{"refreshToken": "jwt-refresh-token"}</input>
      <output>{"message": "Successfully logged out"}</output>
    </example>
  </examples>
</function>
</functions>

---

## 🏗️ **Project Management API**

### **Project Operations**

<functions>
<function name="GET /api/projects">
  <signature>GET /api/projects</signature>
  <purpose>Retrieve all projects accessible to user</purpose>
  <parameters>
    <param name="status" type="string" required="false">Filter by project status</param>
    <param name="search" type="string" required="false">Search projects by name or description</param>
  </parameters>
  <returns>Array of project objects with media counts and labels</returns>
  <examples>
    <example>
      <input>GET /api/projects?status=ACTIVE</input>
      <output>
[
  {
    "id": "project-uuid",
    "name": "Downtown Steel Frame",
    "description": "High-rise construction project",
    "status": "ACTIVE",
    "location": "1234 Main St, Denver, CO",
    "startDate": "2024-01-15T00:00:00Z",
    "_count": {
      "media": 42
    },
    "labels": []
  }
]
      </output>
    </example>
  </examples>
</function>

<function name="POST /api/projects">
  <signature>POST /api/projects</signature>
  <purpose>Create new construction project</purpose>
  <parameters>
    <param name="name" type="string" required="true">Project name</param>
    <param name="description" type="string" required="false">Project description</param>
    <param name="location" type="string" required="false">Project location</param>
    <param name="jobNumber" type="string" required="false">Job/contract number</param>
    <param name="startDate" type="string" required="false">Project start date (ISO 8601)</param>
    <param name="endDate" type="string" required="false">Expected completion date</param>
  </parameters>
  <returns>Created project object</returns>
  <examples>
    <example>
      <input>
{
  "name": "Bridge Reinforcement Phase 2",
  "description": "Steel reinforcement of existing bridge structure",
  "location": "Highway 36, Boulder, CO",
  "jobNumber": "FSW-2024-BR002",
  "startDate": "2024-03-01T00:00:00Z"
}
      </input>
      <output>
{
  "id": "new-project-uuid",
  "name": "Bridge Reinforcement Phase 2",
  "description": "Steel reinforcement of existing bridge structure",
  "status": "PLANNING",
  "location": "Highway 36, Boulder, CO",
  "jobNumber": "FSW-2024-BR002",
  "companyId": "company-uuid",
  "createdAt": "2024-09-10T12:00:00Z"
}
      </output>
    </example>
  </examples>
</function>
</functions>

---

## 📸 **Media Management API**

### **Media Upload and Retrieval**

<functions>
<function name="POST /api/media/upload">
  <signature>POST /api/media/upload (multipart/form-data)</signature>
  <purpose>Upload single media file with metadata</purpose>
  <parameters>
    <param name="file" type="file" required="true">Media file (image/video)</param>
    <param name="projectId" type="string" required="true">Target project UUID</param>
    <param name="activityType" type="string" required="false">Activity type (ERECTION, WELDING, etc.)</param>
    <param name="description" type="string" required="false">Media description</param>
    <param name="location" type="string" required="false">GPS coordinates or location description</param>
    <param name="timestamp" type="string" required="false">Capture timestamp (ISO 8601)</param>
  </parameters>
  <returns>Uploaded media object with URLs</returns>
  <examples>
    <example>
      <input>
Form Data:
- file: steel_beam_installation.jpg
- projectId: project-uuid
- activityType: ERECTION
- description: "Main beam installation - Level 3"
- location: "40.7589,-73.9851"
      </input>
      <output>
{
  "id": "media-uuid",
  "originalName": "steel_beam_installation.jpg",
  "url": "https://storage.supabase.co/v1/object/public/media/...",
  "thumbnailUrl": "https://storage.supabase.co/v1/object/public/thumbnails/...",
  "mediaType": "IMAGE",
  "activityType": "ERECTION",
  "description": "Main beam installation - Level 3",
  "location": "40.7589,-73.9851",
  "projectId": "project-uuid",
  "uploadedAt": "2024-09-10T14:30:00Z"
}
      </output>
    </example>
  </examples>
  <errors>
    <error type="ValidationError">Invalid file type or size</error>
    <error type="StorageError">Upload failed to storage provider</error>
    <error type="AuthorizationError">User not authorized for project</error>
  </errors>
</function>

<function name="POST /api/media/upload/batch">
  <signature>POST /api/media/upload/batch (multipart/form-data)</signature>
  <purpose>Upload multiple media files simultaneously</purpose>
  <parameters>
    <param name="files" type="file[]" required="true">Array of media files</param>
    <param name="projectId" type="string" required="true">Target project UUID</param>
    <param name="activityType" type="string" required="false">Default activity type for all files</param>
    <param name="batchDescription" type="string" required="false">Description for entire batch</param>
  </parameters>
  <returns>Array of uploaded media objects</returns>
  <examples>
    <example>
      <input>
Form Data:
- files[]: [beam1.jpg, beam2.jpg, beam3.jpg]
- projectId: project-uuid
- activityType: ERECTION
- batchDescription: "Steel beam installation sequence"
      </input>
      <output>
{
  "uploaded": [
    {"id": "media-uuid-1", "originalName": "beam1.jpg", ...},
    {"id": "media-uuid-2", "originalName": "beam2.jpg", ...},
    {"id": "media-uuid-3", "originalName": "beam3.jpg", ...}
  ],
  "failed": [],
  "totalCount": 3,
  "successCount": 3
}
      </output>
    </example>
  </examples>
</function>

<function name="GET /api/media">
  <signature>GET /api/media</signature>
  <purpose>Retrieve media with pagination and filtering</purpose>
  <parameters>
    <param name="page" type="number" required="false">Page number (default: 1)</param>
    <param name="limit" type="number" required="false">Items per page (default: 24)</param>
    <param name="projectId" type="string" required="false">Filter by project</param>
    <param name="mediaType" type="string" required="false">Filter by media type (IMAGE/VIDEO)</param>
    <param name="activityType" type="string" required="false">Filter by activity type</param>
    <param name="startDate" type="string" required="false">Filter from date (ISO 8601)</param>
    <param name="endDate" type="string" required="false">Filter to date (ISO 8601)</param>
  </parameters>
  <returns>Paginated media results</returns>
  <examples>
    <example>
      <input>GET /api/media?projectId=project-uuid&mediaType=IMAGE&page=1&limit=12</input>
      <output>
{
  "media": [
    {
      "id": "media-uuid",
      "originalName": "steel_installation.jpg",
      "url": "https://storage.url/...",
      "thumbnailUrl": "https://storage.url/thumbnails/...",
      "mediaType": "IMAGE",
      "activityType": "ERECTION",
      "uploadedAt": "2024-09-10T14:30:00Z",
      "project": {
        "id": "project-uuid",
        "name": "Downtown Steel Frame"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 4,
    "totalCount": 42,
    "hasNext": true
  }
}
      </output>
    </example>
  </examples>
</function>
</functions>

---

## 🏷️ **Tags and Labels API**

### **Tag Management**

<functions>
<function name="GET /api/tags">
  <signature>GET /api/tags</signature>
  <purpose>Retrieve all available tags for the company</purpose>
  <parameters>
    <param name="category" type="string" required="false">Filter tags by category</param>
  </parameters>
  <returns>Array of tag objects organized by category</returns>
  <examples>
    <example>
      <input>GET /api/tags?category=materials</input>
      <output>
[
  {
    "id": "tag-uuid",
    "name": "Steel Beam",
    "color": "#FF6B35",
    "category": "materials",
    "description": "Steel structural beams",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
      </output>
    </example>
  </examples>
</function>

<function name="POST /api/tags">
  <signature>POST /api/tags</signature>
  <purpose>Create new tag (Admin/PM only)</purpose>
  <parameters>
    <param name="name" type="string" required="true">Tag name</param>
    <param name="color" type="string" required="false">Hex color code</param>
    <param name="category" type="string" required="false">Tag category</param>
    <param name="description" type="string" required="false">Tag description</param>
  </parameters>
  <returns>Created tag object</returns>
  <examples>
    <example>
      <input>
{
  "name": "Rebar Installation",
  "color": "#28A745",
  "category": "activities",
  "description": "Reinforcement bar installation activities"
}
      </input>
      <output>
{
  "id": "new-tag-uuid",
  "name": "Rebar Installation",
  "color": "#28A745",
  "category": "activities",
  "description": "Reinforcement bar installation activities",
  "companyId": "company-uuid",
  "createdAt": "2024-09-10T15:00:00Z"
}
      </output>
    </example>
  </examples>
</function>

<function name="POST /api/tags/apply">
  <signature>POST /api/tags/apply</signature>
  <purpose>Apply tags to media items</purpose>
  <parameters>
    <param name="mediaIds" type="string[]" required="true">Array of media UUIDs</param>
    <param name="tagIds" type="string[]" required="true">Array of tag UUIDs to apply</param>
  </parameters>
  <returns>Success confirmation with applied counts</returns>
  <examples>
    <example>
      <input>
{
  "mediaIds": ["media-uuid-1", "media-uuid-2"],
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
      </input>
      <output>
{
  "applied": 4,
  "mediaCount": 2,
  "tagCount": 2,
  "message": "Successfully applied tags to media"
}
      </output>
    </example>
  </examples>
</function>
</functions>

---

## 📊 **AI Reports API**

### **Report Generation**

<functions>
<function name="POST /api/reports">
  <signature>POST /api/reports</signature>
  <purpose>Generate AI-powered project reports</purpose>
  <parameters>
    <param name="projectId" type="string" required="true">Project UUID</param>
    <param name="reportType" type="string" required="true">Report type (PROGRESS_RECAP, SUMMARY, DAILY_LOG)</param>
    <param name="mediaIds" type="string[]" required="false">Specific media to include</param>
    <param name="dateRange" type="object" required="false">Custom date range for report</param>
    <param name="includeMetadata" type="boolean" required="false">Include technical metadata</param>
  </parameters>
  <returns>Generated report object</returns>
  <examples>
    <example>
      <input>
{
  "projectId": "project-uuid",
  "reportType": "PROGRESS_RECAP",
  "dateRange": {
    "start": "2024-09-01T00:00:00Z",
    "end": "2024-09-10T23:59:59Z"
  },
  "includeMetadata": true
}
      </input>
      <output>
{
  "id": "report-uuid",
  "projectId": "project-uuid",
  "reportType": "PROGRESS_RECAP",
  "title": "Weekly Progress Report - Downtown Steel Frame",
  "content": "## Project Overview\n\nSignificant progress made this week...",
  "metadata": {
    "mediaAnalyzed": 23,
    "activitiesIdentified": ["ERECTION", "WELDING"],
    "progressEstimate": "75%"
  },
  "generatedAt": "2024-09-10T16:00:00Z",
  "status": "COMPLETED"
}
      </output>
    </example>
  </examples>
</function>

<function name="POST /api/reports/{reportId}/share">
  <signature>POST /api/reports/:reportId/share</signature>
  <purpose>Share report via email, SMS, or generate shareable link</purpose>
  <parameters>
    <param name="reportId" type="string" required="true">Report UUID (in path)</param>
    <param name="method" type="string" required="true">Share method (EMAIL, SMS, LINK)</param>
    <param name="recipients" type="string[]" required="false">Email addresses or phone numbers</param>
    <param name="message" type="string" required="false">Custom message to include</param>
    <param name="linkExpiry" type="string" required="false">Link expiration (for LINK method)</param>
  </parameters>
  <returns>Share confirmation with tracking information</returns>
  <examples>
    <example>
      <input>
{
  "method": "EMAIL",
  "recipients": ["pm@client.com", "safety@client.com"],
  "message": "Weekly progress report for your review."
}
      </input>
      <output>
{
  "shareId": "share-uuid",
  "method": "EMAIL",
  "recipients": ["pm@client.com", "safety@client.com"],
  "sentAt": "2024-09-10T16:05:00Z",
  "status": "SENT"
}
      </output>
    </example>
  </examples>
</function>
</functions>

---

## 💬 **Communication API**

### **Comments and Chat**

<functions>
<function name="POST /api/comments">
  <signature>POST /api/comments</signature>
  <purpose>Add comment to media with @mentions support</purpose>
  <parameters>
    <param name="mediaId" type="string" required="true">Media UUID</param>
    <param name="content" type="string" required="true">Comment text</param>
    <param name="mentions" type="string[]" required="false">User UUIDs to mention</param>
    <param name="parentId" type="string" required="false">Parent comment UUID for replies</param>
  </parameters>
  <returns>Created comment object</returns>
  <examples>
    <example>
      <input>
{
  "mediaId": "media-uuid",
  "content": "Great work on the beam alignment! @john-uuid please review the connection details.",
  "mentions": ["john-uuid"]
}
      </input>
      <output>
{
  "id": "comment-uuid",
  "content": "Great work on the beam alignment! @john-uuid please review the connection details.",
  "mediaId": "media-uuid",
  "author": {
    "id": "user-uuid",
    "name": "Sarah Johnson",
    "role": "FOREMAN"
  },
  "mentions": [
    {
      "id": "john-uuid",
      "name": "John Smith",
      "role": "STEEL_ERECTOR"
    }
  ],
  "createdAt": "2024-09-10T16:30:00Z"
}
      </output>
    </example>
  </examples>
</function>

<function name="POST /api/team-chat/messages">
  <signature>POST /api/team-chat/messages</signature>
  <purpose>Send message to project team chat</purpose>
  <parameters>
    <param name="projectId" type="string" required="true">Project UUID</param>
    <param name="content" type="string" required="true">Message content</param>
    <param name="messageType" type="string" required="false">Message type (TEXT, MEDIA, SYSTEM)</param>
    <param name="attachmentId" type="string" required="false">Media attachment UUID</param>
  </parameters>
  <returns>Sent message object</returns>
  <examples>
    <example>
      <input>
{
  "projectId": "project-uuid",
  "content": "Team meeting at 8 AM tomorrow to review welding progress",
  "messageType": "TEXT"
}
      </input>
      <output>
{
  "id": "message-uuid",
  "projectId": "project-uuid",
  "content": "Team meeting at 8 AM tomorrow to review welding progress",
  "messageType": "TEXT",
  "sender": {
    "id": "user-uuid",
    "name": "Mike Wilson",
    "role": "PROJECT_MANAGER"
  },
  "sentAt": "2024-09-10T17:00:00Z"
}
      </output>
    </example>
  </examples>
</function>
</functions>

---

## 🔒 **Security Features**

### **Two-Factor Authentication**

<functions>
<function name="POST /api/auth/2fa/setup">
  <signature>POST /api/auth/2fa/setup</signature>
  <purpose>Initialize two-factor authentication setup</purpose>
  <parameters>
    <param name="password" type="string" required="true">Current user password for verification</param>
  </parameters>
  <returns>QR code data and backup codes</returns>
  <examples>
    <example>
      <input>{"password": "current-password"}</input>
      <output>
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "manualEntryKey": "JBSWY3DPEHPK3PXP",
  "backupCodes": [
    "12345678",
    "87654321",
    "11223344",
    "44332211",
    "55667788"
  ]
}
      </output>
    </example>
  </examples>
</function>

<function name="POST /api/auth/2fa/verify">
  <signature>POST /api/auth/2fa/verify</signature>
  <purpose>Complete two-factor authentication verification</purpose>
  <parameters>
    <param name="token" type="string" required="true">6-digit TOTP code</param>
  </parameters>
  <returns>2FA activation confirmation</returns>
  <examples>
    <example>
      <input>{"token": "123456"}</input>
      <output>
{
  "enabled": true,
  "message": "Two-factor authentication enabled successfully"
}
      </output>
    </example>
  </examples>
</function>
</functions>

---

## 🌐 **Real-time Features (WebSocket)**

### **WebSocket Connection**

<configuration>
<setting name="websocketURL" type="string" default="ws://localhost:3001">
  WebSocket connection URL for real-time features
</setting>
<setting name="authentication" type="string" default="JWT token">
  Include JWT token in connection handshake
</setting>
</configuration>

### **Real-time Events**

<patterns>
<pattern name="media-upload">
  ```javascript
  // Listen for new media uploads
  socket.on('media:uploaded', (data) => {
    console.log('New media uploaded:', data.media);
    // Update UI with new media
  });
  ```
</pattern>

<pattern name="comment-added">
  ```javascript
  // Listen for new comments
  socket.on('comment:added', (data) => {
    console.log('New comment:', data.comment);
    // Update comment list
  });
  ```
</pattern>

<pattern name="project-update">
  ```javascript
  // Listen for project updates
  socket.on('project:updated', (data) => {
    console.log('Project updated:', data.project);
    // Refresh project data
  });
  ```
</pattern>
</patterns>

---

## 📈 **Performance Monitoring**

### **Health Check Endpoints**

<functions>
<function name="GET /api/health">
  <signature>GET /api/health</signature>
  <purpose>Check API service health status</purpose>
  <parameters></parameters>
  <returns>Service health information</returns>
  <examples>
    <example>
      <input>GET /api/health</input>
      <output>
{
  "status": "healthy",
  "timestamp": "2024-09-10T18:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  },
  "version": "1.0.0"
}
      </output>
    </example>
  </examples>
</function>

<function name="GET /api/health/detailed">
  <signature>GET /api/health/detailed</signature>
  <purpose>Detailed system health and performance metrics</purpose>
  <parameters></parameters>
  <returns>Comprehensive system status</returns>
  <examples>
    <example>
      <input>GET /api/health/detailed</input>
      <output>
{
  "status": "healthy",
  "uptime": 86400,
  "memory": {
    "used": "245MB",
    "total": "512MB",
    "percentage": 47.8
  },
  "database": {
    "status": "connected",
    "activeConnections": 8,
    "responseTime": "12ms"
  },
  "storage": {
    "status": "connected",
    "provider": "supabase",
    "responseTime": "45ms"
  }
}
      </output>
    </example>
  </examples>
</function>
</functions>

---

## 🚨 **Error Handling**

### **Standard Error Responses**

<patterns>
<pattern name="validation-error">
  ```json
  {
    "error": "ValidationError",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "statusCode": 400
  }
  ```
</pattern>

<pattern name="authentication-error">
  ```json
  {
    "error": "AuthenticationError",
    "message": "Invalid or expired token",
    "statusCode": 401
  }
  ```
</pattern>

<pattern name="authorization-error">
  ```json
  {
    "error": "AuthorizationError",
    "message": "Insufficient permissions for this action",
    "statusCode": 403
  }
  ```
</pattern>

<pattern name="rate-limit-error">
  ```json
  {
    "error": "RateLimitError",
    "message": "Too many requests",
    "retryAfter": 60,
    "statusCode": 429
  }
  ```
</pattern>
</patterns>

---

## 🔧 **Development Tools**

### **API Testing**

```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fsw-denver.com","password":"Test1234!"}'

# Test protected endpoint
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Upload media
curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "projectId=PROJECT_UUID" \
  -F "activityType=ERECTION"
```

### **Rate Limits**

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Authentication | 5 requests | 15 minutes |
| Media Upload | 20 files | 1 hour |
| API Calls (General) | 100 requests | 15 minutes |
| Reports Generation | 10 reports | 1 hour |

---

**Iron Task 726 API** - Powering construction documentation with robust, secure, and performant backend services. 🏗️⚡