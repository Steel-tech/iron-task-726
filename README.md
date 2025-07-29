# FSW Iron Task 🏗️

Professional Construction Documentation System built by ironworkers, for ironworkers. Document your projects, ensure safety compliance, and track progress with the most trusted platform in steel construction.

![FSW Iron Task](https://img.shields.io/badge/Built%20for-Steel%20Construction-orange)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)
![Real-time](https://img.shields.io/badge/Real--time-WebSocket-green)

## 🚀 Features

### 📸 Smart Documentation
- **Capture & Upload**: Take photos/videos directly or batch upload from devices
- **Dual Camera Support**: Picture-in-picture mode for comprehensive documentation
- **Auto-Organization**: Smart tagging system automatically categorizes content
- **Photo Annotation**: Draw, mark up, and add notes directly on images

### 🏷️ Advanced Tagging & Labels
- **Custom Tags**: Create project-specific tags for materials, locations, and status
- **Quick Tagging**: Apply tags instantly during photo capture
- **Smart Search**: Find anything with advanced filters and saved searches
- **Permission Control**: Admin/PM-only tag management

### 🌐 Multi-Language Communication
- **Real-time Translation**: Team members communicate in their preferred language
- **Photo Comments**: Discuss project details with @mentions
- **In-app Chat**: Project-specific team communication channels
- **Notification System**: Stay updated on important discussions

### 📊 AI-Powered Reports
- **Progress Recap**: Comprehensive project documentation with AI insights
- **Summary Reports**: Quick overviews of photo groups with context
- **Daily Logs**: Automated daily reports with next-day action items
- **One-Click Sharing**: Send reports via email, SMS, or shareable links

### 📱 Project Feed & Monitoring
- **Live Updates**: See real-time progress from all job sites
- **Star Important Projects**: Prioritize what matters most
- **Remote Monitoring**: Reduce site visits while staying informed
- **Custom Views**: Grid, list, or compact layouts

### 🔐 Enhanced Authentication & Security
- **Smart Login Experience**: Password visibility toggle, auto-focus progression, Enter key navigation
- **CAPTCHA Protection**: Mathematical challenge after 3 failed login attempts
- **Device Remember**: Trusted device functionality with email auto-fill
- **Session Management**: Automatic extension warnings with countdown timer
- **Accessibility First**: Full screen reader support, ARIA labels, keyboard navigation
- **Progressive Loading**: Enhanced feedback with step-by-step status updates
- **Role-Based Access**: Admin, Project Manager, Foreman, Worker roles
- **Project Permissions**: Control who sees what
- **Secure Sharing**: Time-limited gallery links
- **Audit Trail**: Track all document activities

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Socket.io** - Real-time updates

### Backend
- **Node.js** - JavaScript runtime
- **Fastify** - High-performance web framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database
- **Redis** - Caching and sessions
- **MinIO** - S3-compatible object storage

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **JWT** - Secure authentication
- **WebSocket** - Real-time communication

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Steel-tech/FSW-Iron-Track.git
   cd FSW-Iron-Track
   ```

2. **Start with Docker**
   ```bash
   ./start.sh
   ```
   This will:
   - Build all containers
   - Set up the database
   - Seed initial data
   - Start all services

3. **Access the application**
   - Web App: http://localhost:3000
   - API: http://localhost:3001
   - MinIO Console: http://localhost:9001

### Default Login Credentials

```
Admin User:
Email: admin@fsw-denver.com
Password: Test1234!

Project Manager:
Email: pm@fsw-denver.com
Password: Test1234!

Foreman:
Email: foreman@fsw-denver.com
Password: Test1234!
```

## 🔐 Enhanced Login Experience

The Iron Task login system has been enhanced with advanced security and accessibility features:

### 🎯 **Smart Login Features**
- **Password Visibility Toggle**: Click the eye icon to show/hide your password
- **Auto-Focus Navigation**: Email field focuses on load, Tab/Enter moves between fields
- **Keyboard Shortcuts**: Press Enter in email to move to password, Enter in password to submit
- **Remember Device**: Check "Remember this device" to auto-fill email on trusted devices

### 🛡️ **Security Protection**
- **CAPTCHA Challenge**: Simple math problem appears after 3 failed login attempts
- **Session Warnings**: Get notified 5 minutes before your session expires
- **Progressive Loading**: Clear feedback during authentication process
- **Secure Token Management**: Automatic token refresh and family rotation

### ♿ **Accessibility Features**
- **Screen Reader Support**: Full ARIA labels and semantic markup
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Readable with assistive technologies
- **Error Announcements**: Clear error messages with live regions

### 🏗️ **Construction-Themed Design**
- **Safety Orange**: Primary action color matching construction standards
- **Steel Blue**: Secondary accent color for professional appearance
- **Animated Elements**: Construction icons (cranes, welding torches, sparks)
- **Industry Context**: OSHA compliance badges and construction statistics

## 📁 Project Structure

```
FSW-Iron-Track/
├── api/                    # Backend API service
│   ├── prisma/            # Database schema and migrations
│   ├── src/               # Source code
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   └── lib/           # Utilities
│   └── tests/             # API tests
├── web/                    # Frontend Next.js application
│   ├── app/               # App Router pages
│   │   └── login/        # Enhanced login page with advanced features
│   ├── components/        # React components
│   │   ├── ui/           # Base UI components
│   │   ├── icons/        # Custom steel icons
│   │   └── SessionWarning.tsx # Session expiration management
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx # Enhanced auth with session monitoring
│   ├── hooks/             # Custom hooks
│   └── lib/               # Utilities
├── database/              # Database initialization
└── docker-compose.yml     # Container orchestration
```

## 🔧 Development

### Local Development

1. **API Development**
   ```bash
   cd api
   npm install
   npm run dev
   ```

2. **Frontend Development**
   ```bash
   cd web
   npm install
   npm run dev
   ```

### Database Management

```bash
# Run migrations
docker exec fsw-api npx prisma migrate dev

# Open Prisma Studio
docker exec fsw-api npx prisma studio

# Reset database
docker exec fsw-api npx prisma migrate reset
```

### Running Tests

```bash
# Run all tests
./test-runner.sh

# API tests only
cd api && npm test

# Frontend tests only
cd web && npm test
```

## 📱 Key Features Guide

### Creating a Project
1. Navigate to Projects → New Project
2. Fill in project details (name, location, job number)
3. Add team members
4. Start documenting!

### Using Tags
1. Go to Tags (Admin/PM only)
2. Create custom tags with categories
3. Apply tags during photo capture or later
4. Use tags to filter and search content

### Generating AI Reports
1. Open any project
2. Click "AI Reports"
3. Choose report type:
   - **Progress Recap**: Full project documentation
   - **Summary**: Quick photo group overview
   - **Daily Log**: Today's activities + tomorrow's todos
4. Share via email, SMS, or link

### Project Feed
1. Access from Projects → Project Feed
2. Star important projects
3. Customize view preferences
4. Enable auto-refresh for live updates

## 📄 API Documentation

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Enhanced login with CAPTCHA protection and device tracking
- `POST /api/auth/refresh` - Refresh access token with automatic rotation
- `POST /api/auth/logout` - Clear refresh token and invalidate sessions
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/sessions` - List active user sessions
- `DELETE /api/auth/sessions/:id` - Revoke specific session
- `POST /api/auth/revoke-all-sessions` - Revoke all user sessions

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Media
- `POST /api/media/upload` - Upload single media
- `POST /api/media/upload/batch` - Batch upload
- `GET /api/media/project/:projectId` - Get project media
- `GET /api/media/:id` - Get media details
- `PATCH /api/media/:id` - Update media metadata
- `DELETE /api/media/:id` - Delete media

### Tags & Labels
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag
- `POST /api/tags/apply` - Apply tags to media

### Reports
- `POST /api/reports` - Generate AI report
- `GET /api/projects/:id/reports` - List project reports
- `GET /api/reports/:id` - Get report details
- `POST /api/reports/:id/share` - Share report
- `GET /api/reports/:id/download` - Download PDF

### Communication
- `POST /api/comments` - Add comment
- `GET /api/comments/media/:id` - Get media comments
- `POST /api/team-chat/messages` - Send chat message
- `GET /api/notifications` - Get notifications

## 🚢 Deployment

### Environment Variables

Create `.env` files in both `api/` and `web/` directories:

**api/.env**
```env
DATABASE_URL=postgresql://user:password@postgres:5432/fsw_iron_task
JWT_SECRET=your-secret-key
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

**web/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Production Deployment

1. Update environment variables for production
2. Use proper SSL certificates
3. Configure reverse proxy (nginx/traefik)
4. Set up backup strategies
5. Monitor with logging service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for FSW Iron Task.

## 🆘 Support

For support, email support@fsw-denver.com or contact your project administrator.

## 🙏 Acknowledgments

- Built with ❤️ by ironworkers who understand the job
- Special thanks to all field crews providing feedback
- Designed for safety, built for efficiency

---

**FSW Iron Task** - Where Steel Meets Technology 🏗️⚡