import { prisma } from './prisma'
import { emitToUser } from './websocket'

interface NotificationData {
  userId: string
  type: string
  title: string
  message: string
  data?: any
}

export async function sendNotification(notification: NotificationData) {
  // Create notification in database
  const created = await prisma.notification.create({
    data: {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data
    }
  })
  
  // Send real-time notification to user if connected
  emitToUser(notification.userId, 'notification', created)
  
  // TODO: Send push notification if user has enabled them
  // TODO: Send email notification based on user preferences
  
  return created
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId }
  })
  
  if (!notification) {
    throw new Error('Notification not found')
  }
  
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  })
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false }
  })
}

export async function getUserNotifications(
  userId: string,
  limit = 20,
  offset = 0
) {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.notification.count({ where: { userId } })
  ])
  
  return {
    notifications,
    total,
    hasMore: offset + limit < total
  }
}