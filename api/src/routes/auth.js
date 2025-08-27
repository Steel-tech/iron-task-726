const bcrypt = require('bcrypt');
const constants = require('../config/constants');
const { validate } = require('../middleware/validation');
const authSchemas = require('../schemas/auth');
const { authRateLimit } = require('../middleware/rateLimit');
const TokenService = require('../services/tokenService');
const TwoFactorService = require('../services/twoFactorService');
const { UserService } = require('../services/database');
const { AuthenticationError, NotFoundError, ValidationError } = require('../utils/errors');

// Helper to extract client info
function getClientInfo(request) {
  return {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  };
}

async function routes(fastify, options) {
  // Register new user
  fastify.post('/register', {
    preHandler: [
      authRateLimit,
      validate(authSchemas.register)
    ]
  }, async (request, reply) => {
    const { email, password, name, role, companyId, unionMember, phoneNumber } = request.body;

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, constants.BCRYPT_ROUNDS);

      // Create user using service
      const user = await UserService.create({
        email,
        password: hashedPassword,
        name,
        role: role || 'WORKER',
        companyId: companyId || constants.DEFAULT_COMPANY_ID,
        unionMember: unionMember || false,
        phoneNumber
      });

      // Generate access token
      const accessToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        },
        { expiresIn: constants.ACCESS_TOKEN_EXPIRES }
      );

      // Create refresh token in database
      const refreshToken = await TokenService.createRefreshToken(
        user.id,
        request.ip,
        request.headers['user-agent']
      );

      // Set refresh token as httpOnly cookie
      reply.setCookie(constants.SESSION_COOKIE_NAME, refreshToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      return reply.send({
        user,
        accessToken
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.code(409).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create user' });
    }
  });

  // Login
  fastify.post('/login', {
    preHandler: [
      authRateLimit,
      validate(authSchemas.login)
    ]
  }, async (request, reply) => {
    const { email, password, twoFactorToken } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    try {
      // Log login attempt
      (request.logger?.info || console.log)('Login attempt', { email });

      // Find user with password
      const user = await UserService.findWithPassword(email);

      if (!user) {
        console.log('Login failed - user not found', { email });
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        console.log('Login failed - invalid credentials', { 
          email: email.substring(0, 3) + '***',
          timestamp: new Date().toISOString()
        });
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorToken) {
          // Return special response indicating 2FA is required
          return reply.send({
            requiresTwoFactor: true,
            message: 'Two-factor authentication required'
          });
        }

        // Verify 2FA token
        try {
          await TwoFactorService.verifyToken(user.id, twoFactorToken);
        } catch (twoFactorError) {
          console.log('Login failed - invalid 2FA token', { 
            email: email.substring(0, 3) + '***',
            timestamp: new Date().toISOString()
          });
          return reply.code(401).send({ 
            error: 'Invalid two-factor authentication code',
            requiresTwoFactor: true
          });
        }
      }

      // Generate access token
      const accessToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        },
        { expiresIn: constants.ACCESS_TOKEN_EXPIRES }
      );

      // Create refresh token in database
      const refreshToken = await TokenService.createRefreshToken(
        user.id,
        request.ip,
        request.headers['user-agent']
      );

      // Set refresh token cookie
      reply.setCookie(constants.SESSION_COOKIE_NAME, refreshToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      // Log successful login
      (request.logger?.info || console.log)('Login successful', {
        email,
        userId: user.id,
        role: user.role,
        companyId: user.companyId,
        sessionId: refreshToken.id,
        twoFactorUsed: user.twoFactorEnabled
      });

      // Remove password from response
      const { password: _, twoFactorSecret: __, twoFactorBackupCodes: ___, ...userWithoutSensitiveData } = user;

      return reply.send({
        user: userWithoutSensitiveData,
        accessToken
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies[constants.SESSION_COOKIE_NAME];

    if (!refreshToken) {
      return reply.code(401).send({ error: 'No refresh token provided' });
    }

    try {
      // Rotate the refresh token
      const { newToken, user } = await TokenService.rotateRefreshToken(
        refreshToken,
        request.ip,
        request.headers['user-agent']
      );

      // Generate new access token
      const accessToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        },
        { expiresIn: constants.ACCESS_TOKEN_EXPIRES }
      );

      // Set new refresh token cookie
      reply.setCookie(constants.SESSION_COOKIE_NAME, newToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      return reply.send({ accessToken });
    } catch (error) {
      fastify.log.error(error);
      
      // Clear invalid cookie
      reply.clearCookie(constants.SESSION_COOKIE_NAME);
      
      if (error instanceof AuthenticationError) {
        return reply.code(401).send({ error: error.message });
      }
      
      return reply.code(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Logout
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Revoke all user refresh tokens
      await TokenService.revokeUserTokens(request.user.id, 'logout');
      
      // Clear cookie
      reply.clearCookie(constants.SESSION_COOKIE_NAME);
      
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      // Still clear cookie even if revocation fails
      reply.clearCookie(constants.SESSION_COOKIE_NAME);
      return reply.send({ success: true });
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Check if user exists in request (from JWT)
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ error: 'User not authenticated' });
      }
      
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
          unionMember: true,
          phoneNumber: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true
            }
          },
          projectMembers: {
            include: {
              project: {
                select: {
                  id: true,
                  jobNumber: true,
                  name: true,
                  status: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send(user);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get user data' });
    }
  });

  // Change password
  fastify.post('/change-password', {
    preHandler: [
      fastify.authenticate,
      validate(authSchemas.changePassword)
    ]
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;

    // Validation handled by schema
    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ error: 'Current and new passwords are required' });
    }

    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: request.user.id }
      });

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return reply.code(401).send({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, constants.BCRYPT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: request.user.id },
        data: { password: hashedPassword }
      });

      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to change password' });
    }
  });

  // Get user sessions
  fastify.get('/sessions', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const sessions = await TokenService.getUserSessions(request.user.id);
      return reply.send({ sessions });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get sessions' });
    }
  });

  // Revoke specific session
  fastify.delete('/sessions/:sessionId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { sessionId } = request.params;
    
    try {
      // Verify session belongs to user
      const session = await prisma.refreshToken.findFirst({
        where: {
          id: sessionId,
          userId: request.user.id,
          revokedAt: null
        }
      });
      
      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }
      
      await TokenService.revokeToken(session.token, 'manual');
      
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to revoke session' });
    }
  });

  // Revoke all other sessions
  fastify.post('/revoke-all-sessions', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const currentToken = request.cookies[constants.SESSION_COOKIE_NAME];
    
    try {
      // Get current token to preserve it
      const currentSession = currentToken ? await prisma.refreshToken.findUnique({
        where: { token: currentToken }
      }) : null;
      
      // Revoke all user tokens
      await TokenService.revokeUserTokens(request.user.id, 'security');
      
      // Restore current session if it exists
      if (currentSession && !currentSession.revokedAt) {
        await prisma.refreshToken.update({
          where: { id: currentSession.id },
          data: { revokedAt: null, revokedReason: null }
        });
      }
      
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to revoke sessions' });
    }
  });
}

module.exports = routes;