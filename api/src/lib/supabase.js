const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Service client with full admin access (use carefully!)
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Regular client for user-scoped operations
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Create a Supabase client for a specific user session
 * @param {string} accessToken - User's JWT access token
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function createUserClient(accessToken) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}

/**
 * Storage helper for file uploads
 */
const storage = {
  /**
   * Upload a file to Supabase Storage
   * @param {string} bucket - Storage bucket name
   * @param {string} path - File path in bucket
   * @param {Buffer|ArrayBuffer|Blob} file - File data
   * @param {Object} options - Upload options
   * @returns {Promise<{data: any, error: any}>}
   */
  async upload(bucket, path, file, options = {}) {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }
    
    return await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options.contentType,
        upsert: options.upsert || false
      });
  },

  /**
   * Get public URL for a file
   * @param {string} bucket - Storage bucket name
   * @param {string} path - File path in bucket
   * @returns {string}
   */
  getPublicUrl(bucket, path) {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }
    
    const { data } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  /**
   * Create signed URL for temporary access
   * @param {string} bucket - Storage bucket name
   * @param {string} path - File path in bucket
   * @param {number} expiresIn - Seconds until expiry
   * @returns {Promise<{data: any, error: any}>}
   */
  async createSignedUrl(bucket, path, expiresIn = 3600) {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }
    
    return await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
  },

  /**
   * Delete a file from storage
   * @param {string} bucket - Storage bucket name
   * @param {string[]} paths - File paths to delete
   * @returns {Promise<{data: any, error: any}>}
   */
  async delete(bucket, paths) {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }
    
    return await supabaseAdmin.storage
      .from(bucket)
      .remove(paths);
  }
};

/**
 * Auth helper functions
 */
const auth = {
  /**
   * Verify and decode a Supabase JWT token
   * @param {string} token - JWT token to verify
   * @returns {Promise<{user: any, error: any}>}
   */
  async verifyToken(token) {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }
    
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      return { user, error };
    } catch (error) {
      return { user: null, error };
    }
  },

  /**
   * Create a new user (admin only)
   * @param {Object} userData - User data
   * @returns {Promise<{data: any, error: any}>}
   */
  async createUser(userData) {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }
    
    return await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    });
  },

  /**
   * Update user metadata
   * @param {string} userId - User ID
   * @param {Object} metadata - Metadata to update
   * @returns {Promise<{data: any, error: any}>}
   */
  async updateUser(userId, metadata) {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }
    
    return await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: metadata
    });
  }
};

/**
 * Realtime helper for subscriptions
 */
const realtime = {
  /**
   * Subscribe to database changes
   * @param {string} table - Table name
   * @param {Function} callback - Callback function
   * @param {Object} filters - Optional filters
   * @returns {import('@supabase/supabase-js').RealtimeChannel}
   */
  subscribe(table, callback, filters = {}) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: filters.event || '*',
          schema: 'public',
          table: table,
          filter: filters.filter
        },
        callback
      )
      .subscribe();
    
    return channel;
  },

  /**
   * Unsubscribe from a channel
   * @param {import('@supabase/supabase-js').RealtimeChannel} channel
   */
  async unsubscribe(channel) {
    if (channel) {
      await supabase.removeChannel(channel);
    }
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  createUserClient,
  storage,
  auth,
  realtime
};