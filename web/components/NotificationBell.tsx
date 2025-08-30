'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  X,
  MessageCircle,
  AtSign,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
}

const notificationIcons = {
  mention: AtSign,
  comment: MessageCircle,
  reply: MessageCircle,
  reaction: ThumbsUp,
  project_update: AlertTriangle,
}

export default function NotificationBell() {
  const router = useRouter()
  const { socket } = useWebSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    // Listen for new notifications
    if (socket) {
      socket.on('notification', handleNewNotification)

      return () => {
        socket.off('notification')
      }
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/notifications?limit=10')
      setNotifications(response.data.notifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count')
      setUnreadCount(response.data.count)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)])
    setUnreadCount(prev => prev + 1)

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
      })
    }
  }

  const markAsRead = async (notificationId?: string) => {
    try {
      if (notificationId) {
        await api.patch(`/notifications/${notificationId}/read`)
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        // Mark all as read
        await api.post('/notifications/mark-read')
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.data?.mediaId) {
      router.push(`/dashboard/media?id=${notification.data.mediaId}`)
    } else if (notification.data?.projectId) {
      router.push(`/dashboard/projects/${notification.data.projectId}`)
    }

    setShowDropdown(false)
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-safety-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead()}
                      className="text-xs text-safety-orange hover:text-orange-600"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon =
                    notificationIcons[
                      notification.type as keyof typeof notificationIcons
                    ] || Bell

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-gray-800 transition-colors ${
                        !notification.read ? 'bg-gray-800/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex-shrink-0 p-2 rounded-full ${
                            !notification.read
                              ? 'bg-safety-orange/20'
                              : 'bg-gray-700'
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              !notification.read
                                ? 'text-safety-orange'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>

                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-safety-orange rounded-full" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    router.push('/dashboard/notifications')
                    setShowDropdown(false)
                  }}
                  className="text-sm text-safety-orange hover:text-orange-600 w-full text-center"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
