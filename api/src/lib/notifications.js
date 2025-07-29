const prisma = require('./prisma');
const { emitToUser } = require('./websocket');
const pushNotificationService = require('../services/pushNotificationService');
const emailService = require('../services/emailService');
const { logger } = require('../utils/logger');

/**
 * Send a notification to a user
 * @param {Object} notification - Notification data
 * @param {string} notification.userId - User ID
 * @param {string} notification.type - Notification type
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {any} notification.data - Additional data
 * @param {string} notification.url - Optional URL for notification action
 * @returns {Promise<Object>} Created notification
 */
async function sendNotification(notification) {
  try {
    // Create notification in database
    const created = await prisma.notification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      }
    });
    
    // Send real-time notification to user if connected
    emitToUser(notification.userId, 'notification', created);
    
    // Send push notification if user has enabled them
    try {
      await pushNotificationService.sendToUser(notification.userId, {
        ...created,
        url: notification.url
      });
    } catch (pushError) {
      // Don't fail if push notification fails
      logger.error('Push notification failed:', pushError);
    }
    
    // Send email notification based on user preferences
    try {
      // Check user's email notification preferences
      const userWithPrefs = await prisma.user.findUnique({
        where: { id: notification.userId },
        include: { feedPreferences: true }
      });
      
      // Default to sending emails unless explicitly disabled
      const emailEnabled = userWithPrefs?.feedPreferences?.emailNotifications !== false;
      
      if (emailEnabled && userWithPrefs) {
        await emailService.sendNotificationEmail(userWithPrefs, created);
      }
    } catch (emailError) {
      // Don't fail if email notification fails
      logger.error('Email notification failed:', emailError);
    }
    
    return created;
  } catch (error) {
    logger.error('Failed to send notification:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated notification
 */
async function markNotificationAsRead(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId }
  });
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
async function markAllNotificationsAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
}

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: { userId, read: false }
  });
}

/**
 * Get user notifications with pagination
 * @param {string} userId - User ID
 * @param {number} limit - Limit per page
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} Notifications with metadata
 */
async function getUserNotifications(userId, limit = 20, offset = 0) {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.notification.count({ where: { userId } })
  ]);
  
  return {
    notifications,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * Send notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data (without userId)
 * @returns {Promise<Array>} Array of created notifications
 */
async function sendNotificationToUsers(userIds, notificationData) {
  const results = await Promise.allSettled(
    userIds.map(userId => 
      sendNotification({
        ...notificationData,
        userId
      })
    )
  );
  
  return results.map((result, index) => ({
    userId: userIds[index],
    status: result.status,
    notification: result.value,
    error: result.reason?.message
  }));
}

/**
 * Send notification to all project members
 * @param {string} projectId - Project ID
 * @param {Object} notificationData - Notification data
 * @param {string} excludeUserId - Optional user ID to exclude
 */
async function sendNotificationToProjectMembers(projectId, notificationData, excludeUserId = null) {
  // Get all project members
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      userId: excludeUserId ? { not: excludeUserId } : undefined
    },
    select: { userId: true }
  });
  
  const userIds = members.map(member => member.userId);
  return sendNotificationToUsers(userIds, notificationData);
}

module.exports = {
  sendNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  getUserNotifications,
  sendNotificationToUsers,
  sendNotificationToProjectMembers
};