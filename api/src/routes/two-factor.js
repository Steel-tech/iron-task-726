const bcrypt = require('bcrypt')
const TwoFactorService = require('../services/twoFactorService')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function routes(fastify, options) {
  // Generate 2FA setup (QR code and secret)
  fastify.post(
    '/setup',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { password } = request.body

        // Verify password before allowing 2FA setup
        if (!password) {
          return reply
            .code(400)
            .send({ error: 'Password required to setup 2FA' })
        }

        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
        })

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
          return reply.code(401).send({ error: 'Invalid password' })
        }

        // Check if 2FA is already enabled
        if (user.twoFactorEnabled) {
          return reply.code(400).send({ error: '2FA is already enabled' })
        }

        const setup = await TwoFactorService.generateSecret(
          request.user.id,
          user.email
        )

        return reply.send({
          qrCode: setup.qrCode,
          manualEntryKey: setup.secret,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to setup 2FA' })
      }
    }
  )

  // Verify 2FA token and enable 2FA
  fastify.post(
    '/verify',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { token } = request.body

        if (!token) {
          return reply.code(400).send({ error: '2FA token required' })
        }

        const result = await TwoFactorService.verifyAndEnable(
          request.user.id,
          token
        )

        return reply.send({
          success: true,
          backupCodes: result.backupCodes,
          message: '2FA has been enabled successfully',
        })
      } catch (error) {
        fastify.log.error(error)
        if (error.message === 'Invalid 2FA token') {
          return reply
            .code(400)
            .send({ error: 'Invalid 2FA token. Please try again.' })
        }
        return reply.code(500).send({ error: 'Failed to enable 2FA' })
      }
    }
  )

  // Get 2FA status
  fastify.get(
    '/status',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const status = await TwoFactorService.getStatus(request.user.id)
        return reply.send(status)
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to get 2FA status' })
      }
    }
  )

  // Disable 2FA
  fastify.post(
    '/disable',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { password } = request.body

        if (!password) {
          return reply
            .code(400)
            .send({ error: 'Password required to disable 2FA' })
        }

        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
        })

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
          return reply.code(401).send({ error: 'Invalid password' })
        }

        await TwoFactorService.disable(request.user.id)

        return reply.send({
          success: true,
          message: '2FA has been disabled',
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to disable 2FA' })
      }
    }
  )

  // Regenerate backup codes
  fastify.post(
    '/backup-codes',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { password } = request.body

        if (!password) {
          return reply
            .code(400)
            .send({ error: 'Password required to regenerate backup codes' })
        }

        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
        })

        if (!user.twoFactorEnabled) {
          return reply.code(400).send({ error: '2FA is not enabled' })
        }

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
          return reply.code(401).send({ error: 'Invalid password' })
        }

        const backupCodes = await TwoFactorService.regenerateBackupCodes(
          request.user.id
        )

        return reply.send({
          backupCodes,
          message: 'New backup codes generated. Store them securely.',
        })
      } catch (error) {
        fastify.log.error(error)
        return reply
          .code(500)
          .send({ error: 'Failed to regenerate backup codes' })
      }
    }
  )
}

module.exports = routes
