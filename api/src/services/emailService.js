const nodemailer = require('nodemailer')
const sgMail = require('@sendgrid/mail')
const env = require('../config/env')
const { logger } = require('../utils/logger')
const path = require('path')
const fs = require('fs').promises

class EmailService {
  constructor() {
    this.provider = env.EMAIL_PROVIDER || 'smtp'
    this.from = env.EMAIL_FROM || 'FSW Iron Task <noreply@fswirontask.com>'

    if (this.provider === 'sendgrid' && env.SENDGRID_API_KEY) {
      sgMail.setApiKey(env.SENDGRID_API_KEY)
      this.initialized = true
    } else if (this.provider === 'smtp' && env.SMTP_HOST) {
      this.transporter = nodemailer.createTransporter({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || '587'),
        secure: env.SMTP_SECURE === 'true',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
      this.initialized = true
    } else {
      logger.warn('Email service not configured')
      this.initialized = false
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string|Array<string>} options.to - Recipient(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content
   * @param {Array} options.attachments - Optional attachments
   * @returns {Promise<Object>} Send result
   */
  async send(options) {
    if (!this.initialized) {
      logger.warn('Email service not initialized - skipping email')
      return { skipped: true }
    }

    try {
      if (this.provider === 'sendgrid') {
        const msg = {
          to: options.to,
          from: this.from,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments,
        }

        const result = await sgMail.send(msg)
        logger.info(`Email sent via SendGrid to ${options.to}`)
        return { success: true, messageId: result[0].headers['x-message-id'] }
      } else {
        const mailOptions = {
          from: this.from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments,
        }

        const result = await this.transporter.sendMail(mailOptions)
        logger.info(`Email sent via SMTP to ${options.to}`)
        return { success: true, messageId: result.messageId }
      }
    } catch (error) {
      logger.error('Failed to send email:', error)
      throw error
    }
  }

  /**
   * Send notification email
   * @param {Object} user - User object
   * @param {Object} notification - Notification object
   */
  async sendNotificationEmail(user, notification) {
    const template = await this.getEmailTemplate('notification')

    const html = template
      .replace('{{userName}}', user.name)
      .replace('{{notificationTitle}}', notification.title)
      .replace('{{notificationMessage}}', notification.message)
      .replace('{{notificationType}}', notification.type)
      .replace(
        '{{actionUrl}}',
        `${env.APP_URL}/notifications/${notification.id}`
      )
      .replace('{{year}}', new Date().getFullYear())

    const text = `
Hi ${user.name},

${notification.title}

${notification.message}

View in app: ${env.APP_URL}/notifications/${notification.id}

--
FSW Iron Task
`

    return this.send({
      to: user.email,
      subject: `[FSW Iron Task] ${notification.title}`,
      html,
      text,
    })
  }

  /**
   * Send project invitation email
   * @param {Object} invitee - User being invited
   * @param {Object} project - Project object
   * @param {Object} inviter - User sending invitation
   */
  async sendProjectInvitation(invitee, project, inviter) {
    const template = await this.getEmailTemplate('project-invitation')

    const html = template
      .replace('{{userName}}', invitee.name)
      .replace('{{projectName}}', project.name)
      .replace('{{inviterName}}', inviter.name)
      .replace('{{projectLocation}}', project.location)
      .replace('{{actionUrl}}', `${env.APP_URL}/projects/${project.id}`)
      .replace('{{year}}', new Date().getFullYear())

    const text = `
Hi ${invitee.name},

${inviter.name} has invited you to join the project "${project.name}" at ${project.location}.

Accept invitation: ${env.APP_URL}/projects/${project.id}

--
FSW Iron Task
`

    return this.send({
      to: invitee.email,
      subject: `Invitation to join ${project.name}`,
      html,
      text,
    })
  }

  /**
   * Send report share email
   * @param {Object} recipient - Email recipient
   * @param {Object} report - Report object
   * @param {Object} sender - User sharing the report
   * @param {string} shareUrl - Public share URL
   */
  async sendReportShare(recipient, report, sender, shareUrl) {
    const template = await this.getEmailTemplate('report-share')

    const html = template
      .replace('{{recipientName}}', recipient.name || 'there')
      .replace('{{senderName}}', sender.name)
      .replace('{{reportTitle}}', report.title)
      .replace('{{reportType}}', report.type)
      .replace('{{projectName}}', report.project?.name || 'Project')
      .replace('{{shareUrl}}', shareUrl)
      .replace(
        '{{expiresAt}}',
        new Date(report.shareExpiresAt).toLocaleDateString()
      )
      .replace('{{year}}', new Date().getFullYear())

    const text = `
Hi ${recipient.name || 'there'},

${sender.name} has shared a ${report.type} report with you: "${report.title}"

View report: ${shareUrl}

This link expires on ${new Date(report.shareExpiresAt).toLocaleDateString()}.

--
FSW Iron Task
`

    return this.send({
      to: recipient.email,
      subject: `${sender.name} shared a report with you`,
      html,
      text,
    })
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   */
  async sendPasswordReset(user, resetToken) {
    const template = await this.getEmailTemplate('password-reset')
    const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`

    const html = template
      .replace('{{userName}}', user.name)
      .replace('{{resetUrl}}', resetUrl)
      .replace('{{year}}', new Date().getFullYear())

    const text = `
Hi ${user.name},

You requested a password reset for your FSW Iron Task account.

Reset your password: ${resetUrl}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

--
FSW Iron Task
`

    return this.send({
      to: user.email,
      subject: 'Reset your FSW Iron Task password',
      html,
      text,
    })
  }

  /**
   * Send welcome email to new user
   * @param {Object} user - New user object
   */
  async sendWelcomeEmail(user) {
    const template = await this.getEmailTemplate('welcome')

    const html = template
      .replace('{{userName}}', user.name)
      .replace('{{loginUrl}}', `${env.APP_URL}/login`)
      .replace('{{year}}', new Date().getFullYear())

    const text = `
Welcome to FSW Iron Task, ${user.name}!

Your account has been created successfully.

Login to get started: ${env.APP_URL}/login

Key features:
- Document your projects with photos and videos
- Collaborate with your team in real-time
- Generate AI-powered progress reports
- Track safety compliance

Need help? Contact support@fswirontask.com

--
FSW Iron Task
`

    return this.send({
      to: user.email,
      subject: 'Welcome to FSW Iron Task!',
      html,
      text,
    })
  }

  /**
   * Load email template
   * @param {string} templateName - Template name
   * @returns {Promise<string>} Template HTML
   */
  async getEmailTemplate(templateName) {
    try {
      const templatePath = path.join(
        __dirname,
        '..',
        'templates',
        'emails',
        `${templateName}.html`
      )
      return await fs.readFile(templatePath, 'utf8')
    } catch (error) {
      // Return basic template if file not found
      return this.getBasicTemplate()
    }
  }

  /**
   * Get basic email template
   * @returns {string} Basic HTML template
   */
  getBasicTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FSW Iron Task</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ea580c; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FSW Iron Task</h1>
    </div>
    <div class="content">
      <h2>{{notificationTitle}}</h2>
      <p>Hi {{userName}},</p>
      <p>{{notificationMessage}}</p>
      <p><a href="{{actionUrl}}" class="button">View in App</a></p>
    </div>
    <div class="footer">
      <p>&copy; {{year}} FSW Iron Task. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
  }
}

// Export singleton instance
module.exports = new EmailService()
