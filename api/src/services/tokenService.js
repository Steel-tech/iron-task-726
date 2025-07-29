const crypto = require('crypto');
const prisma = require('../lib/prisma');
const constants = require('../config/constants');
const { AuthenticationError } = require('../utils/errors');

class TokenService {
  /**
   * Generate a secure random token
   * @returns {string} Random token
   */
  static generateSecureToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Create a new refresh token for a user
   * @param {string} userId - User ID
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @param {string} family - Optional token family for rotation chain
   * @returns {Promise<Object>} Created refresh token record
   */
  static async createRefreshToken(userId, ipAddress = null, userAgent = null, family = null) {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = await prisma.refreshToken.create({
      data: {
        token,
        userId,
        family: family || crypto.randomUUID(),
        expiresAt,
        ipAddress,
        userAgent
      }
    });

    return refreshToken;
  }

  /**
   * Validate and rotate a refresh token
   * @param {string} token - Refresh token to validate
   * @param {string} ipAddress - Current IP address
   * @param {string} userAgent - Current user agent
   * @returns {Promise<Object>} New refresh token and user data
   */
  static async rotateRefreshToken(token, ipAddress = null, userAgent = null) {
    // Find the token
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!existingToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > existingToken.expiresAt) {
      await this.revokeToken(token, 'expired');
      throw new AuthenticationError('Refresh token expired');
    }

    // Check if token was already rotated or revoked
    if (existingToken.rotatedAt || existingToken.revokedAt) {
      // Possible token reuse attack - revoke entire family
      await this.revokeTokenFamily(existingToken.family, 'suspicious');
      throw new AuthenticationError('Token reuse detected');
    }

    // Start transaction for atomic rotation
    const result = await prisma.$transaction(async (tx) => {
      // Mark old token as rotated
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { rotatedAt: new Date() }
      });

      // Create new token in same family
      const newToken = await tx.refreshToken.create({
        data: {
          token: this.generateSecureToken(),
          userId: existingToken.userId,
          family: existingToken.family,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress,
          userAgent
        }
      });

      return { newToken, user: existingToken.user };
    });

    return result;
  }

  /**
   * Revoke a specific refresh token
   * @param {string} token - Token to revoke
   * @param {string} reason - Reason for revocation
   */
  static async revokeToken(token, reason = 'manual') {
    await prisma.refreshToken.update({
      where: { token },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }

  /**
   * Revoke all tokens in a family (used for security breach scenarios)
   * @param {string} family - Token family ID
   * @param {string} reason - Reason for revocation
   */
  static async revokeTokenFamily(family, reason = 'suspicious') {
    await prisma.refreshToken.updateMany({
      where: {
        family,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {string} userId - User ID
   * @param {string} reason - Reason for revocation
   */
  static async revokeUserTokens(userId, reason = 'logout') {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }

  /**
   * Clean up expired tokens (for scheduled job)
   */
  static async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            revokedAt: { 
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
            } 
          }
        ]
      }
    });

    return result.count;
  }

  /**
   * Get active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Active refresh tokens
   */
  static async getUserSessions(userId) {
    return await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        issuedAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true
      },
      orderBy: { issuedAt: 'desc' }
    });
  }
}

module.exports = TokenService;