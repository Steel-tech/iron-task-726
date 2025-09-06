const { supabaseAdmin, auth } = require('../lib/supabase')
const prisma = require('../lib/prisma')

/**
 * Supabase Auth Service
 * Handles authentication using Supabase Auth
 */
class SupabaseAuthService {
  /**
   * Register a new user
   */
  async register({
    email,
    password,
    firstName,
    lastName,
    companyId,
    role = 'WORKER',
  }) {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            firstName,
            lastName,
            role,
            companyId,
          },
        })

      if (authError) {throw authError}

      // Create user in our database
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          password: 'SUPABASE_AUTH', // We don't store passwords anymore
          firstName,
          lastName,
          role,
          companyId,
          isActive: true,
        },
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        session: null, // Supabase will handle sessions on the client
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Login user (verify credentials)
   * Note: Actual login happens on the client side with Supabase
   */
  async login(email, password) {
    try {
      // Verify credentials using Supabase Admin API
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {throw error}

      // Get user from our database
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      })

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive')
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          company: user.company,
        },
        session: data.session,
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token) {
    try {
      const { user, error } = await auth.verifyToken(token)

      if (error || !user) {
        return null
      }

      // Get full user data from our database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      })

      if (!dbUser || !dbUser.isActive) {
        return null
      }

      return {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        companyId: dbUser.companyId,
        company: dbUser.company,
      }
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }

  /**
   * Reset password request
   */
  async requestPasswordReset(email) {
    try {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/reset-password`,
      })

      if (error) {throw error}

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  /**
   * Update user password (requires old password or reset token)
   */
  async updatePassword(userId, newPassword) {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      })

      if (error) {throw error}

      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      throw error
    }
  }

  /**
   * Logout (cleanup)
   */
  async logout(userId) {
    // Cleanup any server-side session data if needed
    // Actual logout happens on the client side
    return { success: true }
  }
}

module.exports = new SupabaseAuthService()
