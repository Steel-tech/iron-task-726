# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FSW Iron Task is a professional construction documentation system built for ironworkers. It features real-time collaboration, AI-powered reports, multi-language support, and comprehensive media management.

## Development Commands

### API Development
```bash
cd api
npm install                  # Install dependencies
npm run dev                 # Start development server (port 3001)
npm test                    # Run all tests
npm test:watch             # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npx prisma migrate dev     # Run database migrations
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio GUI
npx prisma db seed        # Seed database with test data
```

### Web Development
```bash
cd web
npm install                # Install dependencies
npm run dev               # Start development server (port 3000)
npm run build             # Build for production
npm test                  # Run all tests
npm test:watch           # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

### Docker Development (when available)
```bash
./start.sh                          # Start all services with Docker
docker-compose logs -f              # View logs
docker-compose down                 # Stop all services
docker exec fsw-api npm run test   # Run API tests in container
```

## Architecture Overview

### Authentication System
- **Dual Token Architecture**: Access tokens (15min) + Refresh tokens (7d, HttpOnly cookies)
- **Token Rotation**: Implements token family tracking to prevent reuse attacks
- **Role-Based Access Control**: 8 roles (ADMIN, PROJECT_MANAGER, FOREMAN, WORKER, etc.)
- **Rate Limiting**: 5 auth attempts per 15 minutes per IP/email
- **Session Management**: Users can view/revoke individual or all sessions

### Real-time Communication
- **Socket.io Implementation**: Room-based architecture for efficient broadcasting
- **Room Structure**: 
  - `project:{id}` - Project-wide updates
  - `user:{id}` - User notifications
  - `media:{id}` - Live media comments
- **JWT Authentication**: Required after initial WebSocket connection
- **Presence Tracking**: Online user detection per project

### File Storage System
- **S3-Compatible Storage**: AWS S3 or MinIO for development
- **Signed URLs**: 1-hour expiration for secure access
- **Media Types**: Photos, videos, dual-camera videos (PiP)
- **Processing**: Thumbnail generation, metadata extraction, GPS data
- **Batch Upload**: Up to 10 files per batch

### AI Report Generation
- **Report Types**:
  - `PROGRESS_RECAP`: Comprehensive project documentation
  - `SUMMARY`: Quick photo group summaries  
  - `DAILY_LOG`: Daily activities with auto-generated todos
- **Asynchronous Generation**: Status tracking for long-running operations
- **Sharing Options**: Email, SMS, or public link with expiration

### Database Schema
- **Core Flow**: Company → Projects → Media/Activities/Users
- **Advanced Features**:
  - Polymorphic tagging system
  - Media view tracking analytics
  - Flexible JSON metadata fields
  - Complex many-to-many relationships
- **Refresh Token Security**: Token storage with expiration and revocation

## Critical Configuration

### Environment Variables

**API (.env)**:
```env
# Database (Required)
DATABASE_URL=postgresql://...

# Supabase (Required for production)
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Security (Required - min 32 chars)
JWT_SECRET=[min 32 characters]
COOKIE_SECRET=[min 32 characters]

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Storage (Migration period only)
S3_ENDPOINT=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1

# Server
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
```

**Web (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Supabase Integration

### Current Status
- Project is migrating from Docker PostgreSQL to Supabase
- Supabase API connection works, but direct PostgreSQL may have network restrictions
- Use Supabase client SDK for database operations during development

### Migration Process
1. Follow `SUPABASE_SETUP.md` for initial setup
2. Use `MIGRATION_CHECKLIST.md` for step-by-step migration
3. Run `SUPABASE_SETUP_SCRIPT.sql` in Supabase SQL Editor
4. Apply `SUPABASE_RLS_POLICIES.sql` for security

## Key Middleware & Patterns

### API Middleware Stack
1. **Environment Validation**: Zod schema validation on startup
2. **Authentication**: JWT verification middleware
3. **Authorization**: Role and project-based access control
4. **Validation**: Request validation using Zod schemas
5. **Error Handling**: Typed error classes with proper HTTP codes

### Service Layer Pattern
- `MediaUploadService`: Handles file uploads, processing, and storage
- `TokenService`: Manages refresh token rotation and sessions
- Services contain business logic separate from routes

### Security Patterns
- Helmet.js for security headers (CSP, XSS protection)
- bcrypt for password hashing
- Signed URLs for media access
- Rate limiting on sensitive endpoints

## Testing Approach

### Test Structure
- **Unit Tests**: Services, utilities, and helpers
- **Integration Tests**: API routes with mocked dependencies
- **Mocking**: Prisma client, JWT, and external services

### Running Specific Tests
```bash
# Run specific test file
npm test -- auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create user"

# Run tests in specific directory
npm test -- src/routes/__tests__/
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create route file in `api/src/routes/`
2. Add Zod schema in `api/src/schemas/`
3. Implement business logic in service layer
4. Add tests in `__tests__/` directory
5. Register route in `api/src/index.js`

### Adding a New Database Model
1. Update `api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive-name`
3. Run `npx prisma generate`
4. Update seed data if needed

### Implementing Real-time Features
1. Add event emitters in API routes
2. Define event types in WebSocket handler
3. Add listeners in frontend components
4. Use appropriate room structure for broadcasting

## Performance Considerations

- Database queries are optimized with proper indexes
- File uploads use streaming for large files
- WebSocket connections use room-based broadcasting
- API uses Fastify for high-performance operations
- Frontend uses React Query for efficient data fetching

## Debugging Tips

### Database Connection Issues
- Check `DATABASE_URL` format in `.env`
- For Supabase: Try pooled connection on port 6543
- Verify network access to database host
- Use `npx prisma db pull` to test connection

### WebSocket Issues
- Verify JWT token is sent after connection
- Check room names match between client/server
- Monitor Socket.io debug logs
- Test with Socket.io admin UI

### File Upload Issues
- Check S3/MinIO credentials
- Verify bucket exists and has proper permissions
- Test with small files first
- Check signed URL expiration times