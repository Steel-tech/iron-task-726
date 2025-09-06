const crypto = require('crypto')
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const prisma = require('../lib/prisma')

class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   */
  static async generateSecret(userId, userEmail) {
    const secret = speakeasy.generateSecret({
      name: `Iron Task 726 (${userEmail})`,
      issuer: 'Iron Task 726',
      length: 32,
    })

    // Store the secret in the database (temporarily unverified)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false, // Not enabled until verified
      },
    })

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: await QRCode.toDataURL(secret.otpauth_url),
    }
  }

  /**
   * Verify a TOTP token and enable 2FA
   */
  static async verifyAndEnable(userId, token) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user || !user.twoFactorSecret) {
      throw new Error('No 2FA secret found for user')
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1, // Allow 1 step (30 seconds) tolerance
    })

    if (!verified) {
      throw new Error('Invalid 2FA token')
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes()
    const hashedBackupCodes = backupCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    )

    // Enable 2FA and store backup codes
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    })

    return {
      success: true,
      backupCodes, // Return plain codes to user (only shown once)
    }
  }

  /**
   * Verify a 2FA token during login
   */
  static async verifyToken(userId, token) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA not enabled for user')
    }

    // First try TOTP verification
    const totpVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1,
    })

    if (totpVerified) {
      return { verified: true, method: 'totp' }
    }

    // If TOTP fails, check backup codes
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
      const backupCodeIndex = user.twoFactorBackupCodes.indexOf(hashedToken)

      if (backupCodeIndex !== -1) {
        // Remove used backup code
        const updatedBackupCodes = [...user.twoFactorBackupCodes]
        updatedBackupCodes.splice(backupCodeIndex, 1)

        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: updatedBackupCodes },
        })

        return {
          verified: true,
          method: 'backup',
          remainingBackupCodes: updatedBackupCodes.length,
        }
      }
    }

    throw new Error('Invalid 2FA token or backup code')
  }

  /**
   * Disable 2FA for a user
   */
  static async disable(userId, password) {
    // Note: Password verification should be done by the calling function
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    })

    return { success: true }
  }

  /**
   * Generate new backup codes
   */
  static async regenerateBackupCodes(userId) {
    const backupCodes = this.generateBackupCodes()
    const hashedBackupCodes = backupCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    )

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: hashedBackupCodes },
    })

    return backupCodes
  }

  /**
   * Check if user has 2FA enabled
   */
  static async isEnabled(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })

    return user?.twoFactorEnabled || false
  }

  /**
   * Get 2FA status and backup code count
   */
  static async getStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    })

    return {
      enabled: user?.twoFactorEnabled || false,
      backupCodesRemaining: user?.twoFactorBackupCodes?.length || 0,
    }
  }

  /**
   * Generate random backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = []
    for (let i = 0; i < count; i++) {
      // Generate 8-digit codes (easier to type)
      const code = Math.floor(10000000 + Math.random() * 90000000).toString()
      codes.push(code)
    }
    return codes
  }
}

module.exports = TwoFactorService
