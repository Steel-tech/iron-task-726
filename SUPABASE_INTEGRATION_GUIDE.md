# FSW Iron Task - Supabase Integration Guide

## 🔧 **Step 1: Update Environment Variables**

### API Backend (`api/.env`)
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (use Supabase connection)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Storage (replace MinIO)
SUPABASE_STORAGE_URL=https://your-project-ref.supabase.co/storage/v1

# Auth (replace JWT)
SUPABASE_JWT_SECRET=your-jwt-secret

# Remove old MinIO settings
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_BUCKET_NAME=
```

### Web Frontend (`web/.env.local`)
```env
# Supabase Client Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Remove old settings
# NEXT_PUBLIC_MINIO_ENDPOINT=
```

## 🔐 **Step 2: Install Supabase SDKs**

### API Backend
```bash
cd api
npm install @supabase/supabase-js
```

### Web Frontend
```bash
cd web
npm install @supabase/supabase-js
```

## 🗄️ **Step 3: Update Database Connection**

### API Backend (`api/src/lib/supabase.js`)
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };
```

### Web Frontend (`web/lib/supabase.js`)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 🔑 **Step 4: Replace Authentication**

### API Backend - Auth Middleware (`api/src/middleware/auth.js`)
```javascript
const { supabase } = require('../lib/supabase');

async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    // Get user details from database
    const { data: userDetails } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!userDetails) {
      return reply.code(401).send({ error: 'User not found' });
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: userDetails.role,
      companyId: userDetails.company_id
    };

  } catch (error) {
    return reply.code(401).send({ error: 'Authentication failed' });
  }
}

module.exports = { authenticate };
```

### API Backend - Auth Routes (`api/src/routes/auth.js`)
```javascript
const { supabase } = require('../lib/supabase');

async function routes(fastify, options) {
  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return reply.code(400).send({ error: error.message });
      }

      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, password, name, role, companyId } = request.body;

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        return reply.code(400).send({ error: authError.message });
      }

      // Create user in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          role: role || 'WORKER',
          company_id: companyId
        })
        .select()
        .single();

      if (userError) {
        return reply.code(400).send({ error: userError.message });
      }

      return {
        user: userData,
        session: authData.session
      };
    } catch (error) {
      return reply.code(500).send({ error: 'Registration failed' });
    }
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return reply.code(500).send({ error: 'Logout failed' });
    }

    return { message: 'Logged out successfully' };
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    return request.user;
  });
}

module.exports = routes;
```

## 📁 **Step 5: Replace Storage**

### API Backend - Storage Service (`api/src/services/storage.js`)
```javascript
const { supabase } = require('../lib/supabase');

class StorageService {
  // Upload file to Supabase Storage
  async uploadFile(bucket, path, file, options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, options);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        path: data.path,
        url: urlData.publicUrl
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Delete file from Supabase Storage
  async deleteFile(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Get file URL
  getFileUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

module.exports = new StorageService();
```

### Update Media Upload Route (`api/src/routes/media.js`)
```javascript
const storageService = require('../services/storage');

// Update upload endpoint
fastify.post('/upload', {
  preHandler: [fastify.authenticate, fastify.upload.single('file')]
}, async (request, reply) => {
  const { projectId, activityType, location, notes } = request.body;
  const file = request.file;

  try {
    // Upload to Supabase Storage
    const uploadResult = await storageService.uploadFile(
      'media',
      `${projectId}/${Date.now()}-${file.originalname}`,
      file.buffer,
      {
        contentType: file.mimetype,
        upsert: false
      }
    );

    // Create media record
    const media = await prisma.media.create({
      data: {
        projectId,
        userId: request.user.id,
        fileUrl: uploadResult.url,
        mediaType: file.mimetype.startsWith('video/') ? 'VIDEO' : 'PHOTO',
        fileSize: file.size,
        activityType,
        location,
        notes,
        status: 'READY'
      }
    });

    return media;
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
});
```

## 🔄 **Step 6: Update Database Queries**

### Replace Prisma with Supabase Client
```javascript
// Old Prisma query
const projects = await prisma.project.findMany({
  where: { companyId: user.companyId },
  include: { media: true }
});

// New Supabase query
const { data: projects, error } = await supabase
  .from('projects')
  .select(`
    *,
    media (*)
  `)
  .eq('company_id', user.companyId);

if (error) {
  throw error;
}
```

## 🚀 **Step 7: Test Integration**

### Test Script (`test-supabase-integration.js`)
```javascript
const { supabase } = require('./api/src/lib/supabase');

async function testIntegration() {
  console.log('🧪 Testing Supabase Integration...\n');

  // Test database connection
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connection working');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }

  // Test storage
  try {
    const { data, error } = await supabase.storage
      .from('media')
      .list('', { limit: 1 });

    if (error) {
      console.error('❌ Storage connection failed:', error.message);
    } else {
      console.log('✅ Storage connection working');
    }
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
  }

  // Test auth
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth connection failed:', error.message);
    } else {
      console.log('✅ Auth connection working');
    }
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
}

testIntegration();
```

## 📋 **Step 8: Migration Checklist**

- [ ] Update environment variables
- [ ] Install Supabase SDKs
- [ ] Replace authentication system
- [ ] Update storage service
- [ ] Update database queries
- [ ] Test all functionality
- [ ] Update frontend components
- [ ] Deploy to production

## 🎯 **Next Steps After Integration**

1. **Test all features** with the new Supabase backend
2. **Update frontend components** to use Supabase client
3. **Implement real-time features** using Supabase subscriptions
4. **Add error handling** for Supabase-specific errors
5. **Optimize queries** for better performance
6. **Set up monitoring** for Supabase usage

## 🔧 **Troubleshooting**

### Common Issues:
- **RLS Policy Errors**: Check that policies are correctly applied
- **Storage Permission Errors**: Verify bucket permissions
- **Auth Token Issues**: Ensure JWT tokens are properly handled
- **Connection Timeouts**: Check network connectivity and Supabase status

### Debug Commands:
```bash
# Test database connection
node test-supabase-integration.js

# Check Supabase status
curl https://status.supabase.com/

# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

This integration guide will help you migrate from your current setup to Supabase while maintaining all functionality. 