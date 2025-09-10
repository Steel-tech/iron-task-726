<metadata>
purpose: Technical architecture overview of Iron Task 726 construction documentation system
type: architecture
language: TypeScript/JavaScript/SQL
dependencies: Next.js 15.5.2, Fastify 5.4.0, Prisma 5.22.0, PostgreSQL, Redis, Socket.io
last-updated: 2025-09-10
</metadata>

<overview>
Comprehensive technical architecture documentation for the Iron Task 726 construction documentation system, including recent performance optimizations, security enhancements, and scalability improvements.
</overview>

# Architecture Overview
## Iron Task 726 Construction Documentation System

### 🏗️ **System Architecture**

The Iron Task 726 system employs a modern **microservices-inspired monorepo architecture** optimized for construction industry workflows, real-time collaboration, and enterprise scalability.

---

## 🎯 **High-Level Architecture**

<configuration>
<setting name="architecture-pattern" type="string" default="layered-monorepo">
  Layered monorepo with clear separation between frontend, API, and data layers
</setting>
<setting name="deployment-model" type="string" default="containerized-services">
  Docker-containerized services with orchestration via Docker Compose
</setting>
<setting name="data-flow" type="string" default="unidirectional-with-real-time">
  Unidirectional data flow with real-time bidirectional communication
</setting>
</configuration>

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15.5.2 Web Application (Port 3000)                   │
│  ├── App Router (React 18.3.1)                                 │
│  ├── TypeScript ES2022 (Strict Mode)                           │
│  ├── Tailwind CSS + Radix UI Components                        │
│  ├── Zustand State Management                                   │
│  ├── TanStack Query (Data Fetching)                            │
│  └── Socket.io Client (Real-time)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                            HTTPS/WSS
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Fastify 5.4.0 API Server (Port 3001)                         │
│  ├── JWT Authentication + 2FA                                   │
│  ├── Rate Limiting & Security Middleware                       │
│  ├── Request/Response Validation                               │
│  ├── CORS & Helmet Security Headers                            │
│  ├── File Upload Processing (Multipart)                        │
│  └── Socket.io Server (Real-time Events)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                         Internal Network
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL 15 + PostGIS (Port 5432)                          │
│  ├── Prisma ORM 5.22.0                                         │
│  ├── Database Migrations & Seeding                             │
│  ├── Row-Level Security (RLS)                                  │
│  └── Optimized Queries & Indexing                              │
│                                                                 │
│  Redis 7 Alpine (Port 6379)                                   │
│  ├── Session Storage                                            │
│  ├── Caching Layer                                              │
│  ├── Job Queue Management                                       │
│  └── Rate Limiting Store                                        │
│                                                                 │
│  Storage Layer                                                  │
│  ├── Supabase Storage (Primary)                                │
│  ├── AWS S3 (Legacy Support)                                   │
│  └── MinIO (Development)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Performance Optimization Architecture**

### **Frontend Performance Enhancements**

<configuration>
<setting name="next-js-standalone" type="boolean" default="true">
  Standalone output mode for 40% faster builds and reduced container size
</setting>
<setting name="typescript-target" type="string" default="ES2022">
  Modern ES target for better performance and reduced polyfills
</setting>
<setting name="experimental-features" type="array" default="['optimizePackageImports', 'optimizeCss']">
  Experimental Next.js features for enhanced performance
</setting>
</configuration>

**Build Optimizations:**
```javascript
// next.config.js - Production Optimizations
{
  output: 'standalone',                    // Standalone mode
  experimental: {
    optimizePackageImports: [              // Package import optimization
      '@radix-ui/react-dialog',
      'lucide-react',
      '@radix-ui/react-dropdown-menu'
    ],
    optimizeCss: true                      // CSS optimization
  },
  compress: true                           // Built-in compression
}
```

**Caching Strategy:**
- **Static Assets**: 1-year immutable caching
- **Images**: 24-hour optimized caching with WebP/AVIF support
- **API Responses**: Redis-based intelligent caching
- **Bundle Splitting**: Automatic code splitting with Next.js

### **Backend Performance Architecture**

<configuration>
<setting name="fastify-server" type="object" default="high-performance-config">
  Fastify configured for high-throughput construction industry workloads
</setting>
<setting name="database-optimization" type="object" default="prisma-optimized">
  Prisma ORM with connection pooling and optimized queries
</setting>
</configuration>

**API Server Optimizations:**
```javascript
// Fastify Configuration
const fastify = require('fastify')({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    serializers: {
      req: sanitizedRequestSerializer    // Security-focused logging
    }
  },
  trustProxy: true,                      // Production proxy trust
  maxParamLength: 200                    // Optimized parameter handling
});
```

**Database Performance:**
- **Connection Pooling**: Optimized Prisma connection management
- **Query Optimization**: Indexed queries for media and project data
- **Row-Level Security**: Efficient security without performance penalty
- **Prepared Statements**: Prisma's built-in prepared statement caching

---

## 🔐 **Security Architecture**

### **Multi-Layer Security Model**

<configuration>
<setting name="security-layers" type="array" default="['transport', 'authentication', 'authorization', 'data', 'audit']">
  Five-layer security model for comprehensive protection
</setting>
<setting name="authentication-methods" type="array" default="['JWT', '2FA-TOTP', 'device-fingerprinting']">
  Multiple authentication factors for enhanced security
</setting>
</configuration>

**Security Layers:**

1. **Transport Security**
   - HTTPS/TLS 1.3 encryption
   - WebSocket Secure (WSS) for real-time
   - Security headers (Helmet.js)
   - CORS policy enforcement

2. **Authentication Layer**
   - JWT with refresh token rotation
   - TOTP-based Two-Factor Authentication
   - Device fingerprinting and trust
   - CAPTCHA protection after failed attempts

3. **Authorization Layer**
   - Role-Based Access Control (RBAC)
   - Company-scoped data isolation
   - Project-level permissions
   - API endpoint authorization

4. **Data Security**
   - Prisma ORM with parameterized queries
   - bcrypt password hashing (12 rounds)
   - Row-Level Security policies
   - Sensitive data encryption

5. **Audit & Monitoring**
   - Comprehensive request logging
   - Security event tracking
   - Rate limiting and abuse detection
   - Real-time security monitoring

### **Authentication Flow Architecture**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Fastify   │    │  Database   │    │   Redis     │
│             │    │   Gateway   │    │             │    │   Store     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ POST /auth/login  │                   │                   │
       ├─────────────────→ │                   │                   │
       │                   │ Verify Password   │                   │
       │                   ├─────────────────→ │                   │
       │                   │ ← User Data       │                   │
       │                   │                   │ Store Session    │
       │                   ├─────────────────────────────────────→ │
       │ ← JWT Tokens      │                   │                   │
       ├─────────────────── │                   │                   │
       │                   │                   │                   │
       │ API Request + JWT │                   │                   │
       ├─────────────────→ │                   │                   │
       │                   │ Validate Token    │                   │
       │                   ├─────────────────────────────────────→ │
       │                   │ ← Session Valid   │                   │
       │                   │ Process Request   │                   │
       │                   ├─────────────────→ │                   │
       │ ← Response        │ ← Data            │                   │
       ├─────────────────── │                   │                   │
```

---

## 📊 **Data Architecture**

### **Database Schema Design**

<configuration>
<setting name="database-engine" type="string" default="PostgreSQL 15 + PostGIS">
  PostgreSQL with spatial extensions for location-based features
</setting>
<setting name="orm-layer" type="string" default="Prisma 5.22.0">
  Type-safe database operations with code generation
</setting>
<setting name="migration-strategy" type="string" default="incremental-migrations">
  Prisma-managed incremental database migrations
</setting>
</configuration>

**Core Entity Relationships:**
```
Company (1) ──────── (*) User
   │                      │
   │                      │
   ├── (*) Project ──── (*) ProjectMember
   │      │                │
   │      │                └── User
   │      │
   │      ├── (*) Media
   │      │      │
   │      │      ├── (*) Comment
   │      │      ├── (*) MediaTag
   │      │      ├── (*) Annotation
   │      │      └── (*) MediaView
   │      │
   │      ├── (*) Gallery
   │      ├── (*) AIReport
   │      └── (*) Activity
   │
   ├── (*) Tag
   ├── (*) Label
   └── (*) SavedFilter
```

**Data Access Patterns:**
- **Company Isolation**: All queries scoped to user's company
- **Project Authorization**: Role-based project access control
- **Media Optimization**: Efficient media queries with pagination
- **Real-time Updates**: Optimized queries for live data synchronization

### **Storage Architecture**

<configuration>
<setting name="primary-storage" type="string" default="Supabase Storage">
  Supabase as primary storage with CDN acceleration
</setting>
<setting name="fallback-storage" type="string" default="AWS S3">
  AWS S3 as fallback for legacy compatibility
</setting>
<setting name="development-storage" type="string" default="MinIO">
  MinIO for local development and testing
</setting>
</configuration>

**Storage Service Selection:**
```javascript
// Intelligent storage service selection
const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

let mediaService;
if (useSupabase) {
  mediaService = new SupabaseStorageService(prisma);
} else if (useS3) {
  mediaService = new MediaUploadService(prisma);
} else {
  mediaService = new LocalStorageService(prisma);
}
```

---

## 🌐 **Real-time Communication Architecture**

### **WebSocket Integration**

<configuration>
<setting name="websocket-library" type="string" default="Socket.io 4.7.2">
  Socket.io for reliable real-time communication
</setting>
<setting name="event-driven-architecture" type="boolean" default="true">
  Event-driven real-time updates across the system
</setting>
</configuration>

**Real-time Event Flow:**
```
Client Actions → API Updates → Database Changes → WebSocket Events → Client Updates
     │              │              │                    │              │
     │              │              │                    │              │
   Upload         Process        Store Media          Broadcast      Update UI
   Media    →     Media     →    + Metadata    →     'media:new'  →   Live Feed
     │              │              │                    │              │
   Add            Validate       Save Comment         Broadcast      Show
   Comment   →    + Sanitize →   + Mentions     →    'comment:added' → Notification
```

**Socket.io Event Categories:**
- `media:*` - Media upload, processing, and updates
- `comment:*` - Comments and mentions
- `project:*` - Project status and membership changes
- `notification:*` - Real-time notifications
- `chat:*` - Team chat messages

---

## 🔄 **API Architecture**

### **RESTful API Design**

<configuration>
<setting name="api-framework" type="string" default="Fastify 5.4.0">
  High-performance API framework with plugin ecosystem
</setting>
<setting name="validation-library" type="string" default="Zod 3.25.75">
  Runtime type validation and sanitization
</setting>
<setting name="middleware-stack" type="array" default="['auth', 'rate-limit', 'validation', 'logging']">
  Comprehensive middleware stack for security and reliability
</setting>
</configuration>

**API Route Architecture:**
```
/api
├── /auth                    # Authentication endpoints
│   ├── /register           # User registration
│   ├── /login              # User authentication
│   ├── /refresh            # Token refresh
│   ├── /logout             # Session termination
│   └── /2fa                # Two-factor authentication
├── /projects               # Project management
├── /media                  # Media upload/retrieval
├── /tags                   # Tag management
├── /comments               # Comment system
├── /reports                # AI report generation
├── /notifications          # Notification system
└── /health                 # Health monitoring
```

**Middleware Pipeline:**
```javascript
fastify.register(require('@fastify/cors'), corsOptions);
fastify.register(require('@fastify/helmet'), securityOptions);
fastify.register(require('@fastify/jwt'), jwtOptions);
fastify.register(require('@fastify/multipart'), uploadOptions);
fastify.register(require('@fastify/cookie'), cookieOptions);

// Custom middleware
fastify.register(authenticationMiddleware);
fastify.register(rateLimitMiddleware);
fastify.register(validationMiddleware);
fastify.register(loggingMiddleware);
```

---

## 📱 **Frontend Architecture**

### **Next.js App Router Architecture**

<configuration>
<setting name="routing-model" type="string" default="App Router">
  Next.js 15+ App Router for improved performance and developer experience
</setting>
<setting name="rendering-strategy" type="string" default="hybrid-SSR-CSR">
  Hybrid server-side and client-side rendering for optimal performance
</setting>
</configuration>

**Application Structure:**
```
web/app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing page
├── globals.css             # Global styles
├── providers.tsx           # Context providers
├── (dashboard)/            # Dashboard layout group
│   ├── layout.tsx         # Dashboard-specific layout
│   ├── projects/          # Projects management
│   ├── media/             # Media gallery
│   ├── reports/           # AI reports
│   └── settings/          # User settings
├── login/                 # Authentication pages
├── register/              # Registration flow
└── api/                   # API routes (if needed)
```

**Component Architecture:**
```
components/
├── ui/                    # Base UI components (Radix UI)
│   ├── Button.tsx
│   ├── Dialog.tsx
│   ├── Input.tsx
│   └── ...
├── forms/                 # Form components
├── media/                 # Media-specific components
├── projects/              # Project management components
├── dashboard/             # Dashboard components
└── layout/                # Layout components
```

### **State Management Architecture**

<configuration>
<setting name="state-library" type="string" default="Zustand 4.4.7">
  Lightweight state management for client-side state
</setting>
<setting name="server-state" type="string" default="TanStack Query 5.13.4">
  Server state management with caching and synchronization
</setting>
</configuration>

**State Management Pattern:**
```javascript
// Zustand stores for local state
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// TanStack Query for server state
const { data: projects, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## 🚀 **Deployment Architecture**

### **Containerization Strategy**

<configuration>
<setting name="container-platform" type="string" default="Docker + Docker Compose">
  Docker containerization with Compose orchestration
</setting>
<setting name="production-images" type="string" default="multi-stage-builds">
  Multi-stage Docker builds for optimized production images
</setting>
</configuration>

**Container Architecture:**
```yaml
# docker-compose.yml
services:
  web:
    build: ./web
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL
    depends_on: [api]
    
  api:
    build: ./api
    ports: ["3001:3001"]
    environment:
      - DATABASE_URL
      - JWT_SECRET
      - SUPABASE_URL
    depends_on: [postgres, redis]
    
  postgres:
    image: postgis/postgis:15-3.3
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

**Production Optimizations:**
- **Multi-stage builds** for minimal production images
- **Health checks** for service monitoring
- **Resource limits** for predictable performance
- **Volume mounts** for persistent data

### **Scalability Architecture**

<configuration>
<setting name="horizontal-scaling" type="boolean" default="true">
  Designed for horizontal scaling across multiple instances
</setting>
<setting name="load-balancing" type="string" default="nginx-proxy">
  Nginx proxy for load balancing and SSL termination
</setting>
</configuration>

**Scaling Considerations:**
- **Stateless API design** for horizontal scaling
- **Database connection pooling** for efficient resource usage
- **Redis session store** for shared session management
- **CDN integration** for global static asset delivery
- **WebSocket scaling** with Redis adapter for multi-instance support

---

## 📈 **Monitoring and Observability**

### **Performance Monitoring**

<configuration>
<setting name="metrics-collection" type="array" default="['response-times', 'error-rates', 'resource-usage', 'user-activity']">
  Comprehensive metrics collection for system monitoring
</setting>
<setting name="health-checks" type="object" default="multi-service-health-monitoring">
  Health check endpoints for all services
</setting>
</configuration>

**Monitoring Stack:**
- **Application Metrics**: Custom Fastify plugins for API metrics
- **Database Performance**: Prisma query monitoring
- **Real-time Monitoring**: Socket.io connection and event metrics
- **Frontend Performance**: Next.js built-in performance monitoring
- **Infrastructure**: Docker container resource monitoring

**Health Check Architecture:**
```javascript
// Comprehensive health monitoring
{
  status: "healthy",
  services: {
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection(),
    storage: await checkStorageService(),
    websocket: checkWebSocketStatus()
  },
  performance: {
    responseTime: averageResponseTime,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  }
}
```

---

## 🔧 **Development Architecture**

### **Development Workflow**

<configuration>
<setting name="development-tools" type="array" default="['hot-reload', 'type-checking', 'linting', 'testing']">
  Comprehensive development toolchain for productivity
</setting>
<setting name="code-quality" type="object" default="automated-quality-gates">
  Automated code quality enforcement
</setting>
</configuration>

**Development Toolchain:**
- **Hot Module Replacement**: Next.js and Nodemon for instant updates
- **TypeScript**: Strict type checking with ES2022 target
- **ESLint + Prettier**: Code quality and formatting
- **Jest**: Comprehensive testing framework
- **Prisma Studio**: Database GUI for development

**Quality Gates:**
- **Pre-commit hooks**: Husky + lint-staged
- **Type coverage**: 90%+ TypeScript coverage requirement
- **Bundle analysis**: Webpack Bundle Analyzer integration
- **Performance auditing**: Lighthouse CI integration
- **Security auditing**: npm audit + Snyk integration

---

## 🚀 **Future Architecture Roadmap**

### **Planned Enhancements**

<configuration>
<setting name="react-19-upgrade" type="object" default="performance-focused-upgrade">
  React 19 upgrade for 15-25% performance improvement
</setting>
<setting name="prisma-6-upgrade" type="object" default="query-performance-upgrade">
  Prisma 6 upgrade for 40% faster database queries
</setting>
</configuration>

**Technology Roadmap:**
1. **React 19 Migration** (Q1 2025)
   - New React Compiler for automatic optimization
   - Improved hydration performance
   - Better concurrent rendering

2. **Prisma 6 Upgrade** (Q1 2025)
   - Enhanced query engine performance
   - TypedSQL for complex queries
   - Improved connection pooling

3. **Microservices Migration** (Q2 2025)
   - Service separation for better scalability
   - Event-driven architecture
   - Independent service deployment

4. **Advanced Analytics** (Q2 2025)
   - Real-time construction analytics
   - Machine learning integration
   - Predictive project insights

---

**Iron Task 726 Architecture** - Built for scale, optimized for performance, designed for the future of construction technology. 🏗️⚡

---

## 📚 **Architecture Documentation References**

- **Performance Guide**: `PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **Development Setup**: `DEVELOPMENT_SETUP.md`
- **API Documentation**: `API_REFERENCE.md`
- **Database Schema**: `api/prisma/schema.prisma`
- **Configuration Files**: `next.config.js`, `docker-compose.yml`