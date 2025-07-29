const webpush = require('web-push');
const prisma = require('../lib/prisma');
const env = require('../config/env');
const { logger } = require('../utils/logger');

class PushNotificationService {
  constructor() {
    // Initialize web-push with VAPID keys
    if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
      webpush.setVapidDetails(
        `mailto:${env.VAPID_EMAIL}`,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
      );
      this.initialized = true;
    } else {
      logger.warn('Push notifications not configured - missing VAPID keys');
      this.initialized = false;
    }
  }

  /**
   * Generate VAPID keys for initial setup
   */
  static generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }

  /**
   * Subscribe a user to push notifications
   * @param {string} userId - User ID
   * @param {Object} subscription - Push subscription object from browser
   * @param {string} deviceName - Optional device name
   * @returns {Promise<Object>} Created subscription record
   */
  async subscribeUser(userId, subscription, deviceName = 'Unknown Device') {
    try {
      // Check if subscription already exists
      const existing = await prisma.pushSubscription.findFirst({
        where: {
          userId,
          endpoint: subscription.endpoint
        }
      });

      if (existing) {
        // Update existing subscription
        return await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            deviceName,
            lastUsed: new Date()
          }
        });
      }

      // Create new subscription
      return await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          deviceName,
          lastUsed: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to save push subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from push notifications
   * @param {string} userId - User ID
   * @param {string} endpoint - Subscription endpoint to remove
   */
  async unsubscribeUser(userId, endpoint) {
    try {
      await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint
        }
      });
    } catch (error) {
      logger.error('Failed to remove push subscription:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification payload
   * @returns {Promise<Array>} Results of push attempts
   */
  async sendToUser(userId, notification) {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized');
      return [];
    }

    try {
      // Get all user's push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      if (subscriptions.length === 0) {
        logger.debug(`No push subscriptions found for user ${userId}`);
        return [];
      }

      // Prepare notification payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          notificationId: notification.id,
          type: notification.type,
          url: notification.url || '/',
          ...notification.data
        },
        timestamp: Date.now()
      });

      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          try {
            await webpush.sendNotification(pushSubscription, payload);
            // Update last used timestamp
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { lastUsed: new Date() }
            });
            return { success: true, subscriptionId: sub.id };
          } catch (error) {
            // Handle subscription errors
            if (error.statusCode === 410) {
              // Subscription expired, remove it
              await prisma.pushSubscription.delete({
                where: { id: sub.id }
              });
              logger.info(`Removed expired subscription ${sub.id}`);
            } else {
              logger.error(`Failed to send push to subscription ${sub.id}:`, error);
            }
            return { success: false, subscriptionId: sub.id, error: error.message };
          }
        })
      );

      return results;
    } catch (error) {
      logger.error('Failed to send push notifications:', error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notification - Notification payload
   */
  async sendToUsers(userIds, notification) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification))
    );
    
    return results.map((result, index) => ({
      userId: userIds[index],
      status: result.status,
      results: result.value || [],
      error: result.reason?.message
    }));
  }

  /**
   * Get user's push subscription settings
   * @param {string} userId - User ID
   */
  async getUserSubscriptions(userId) {
    return await prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        createdAt: true,
        lastUsed: true
      },
      orderBy: { lastUsed: 'desc' }
    });
  }

  /**
   * Clean up old/inactive subscriptions
   * @param {number} daysInactive - Number of days of inactivity
   */
  async cleanupInactiveSubscriptions(daysInactive = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await prisma.pushSubscription.deleteMany({
      where: {
        lastUsed: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${result.count} inactive push subscriptions`);
    return result.count;
  }
}

// Export singleton instance
module.exports = new PushNotificationService();