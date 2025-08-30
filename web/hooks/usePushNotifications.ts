import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

interface PushSubscription {
  id: string
  deviceName: string
  createdAt: string
  lastUsed: string
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscriptionJSON | null>(
    null
  )
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null)

  // Check if push notifications are supported
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (supported) {
      // Check current subscription
      checkSubscription()
      // Fetch VAPID public key
      fetchVapidPublicKey()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
      setSubscription(subscription?.toJSON() || null)
    } catch (error) {
      console.error('Error checking push subscription:', error)
    }
  }

  const fetchVapidPublicKey = async () => {
    try {
      const response = await fetch('/api/push/vapid-public-key')
      if (response.ok) {
        const data = await response.json()
        setVapidPublicKey(data.publicKey)
      }
    } catch (error) {
      console.error('Error fetching VAPID public key:', error)
    }
  }

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in your browser')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  const subscribe = async () => {
    if (!user) {
      toast.error('Please log in to enable push notifications')
      return
    }

    if (!vapidPublicKey) {
      toast.error('Push notifications are not configured')
      return
    }

    setIsLoading(true)

    try {
      // Request permission
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        toast.error('Push notification permission denied')
        return
      }

      // Register service worker
      const registration =
        await navigator.serviceWorker.register('/service-worker.js')
      await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceName: getDeviceName(),
        }),
      })

      if (response.ok) {
        setIsSubscribed(true)
        setSubscription(subscription.toJSON())
        toast.success('Push notifications enabled')
      } else {
        throw new Error('Failed to save subscription')
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      toast.error('Failed to enable push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    if (!subscription) return

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const pushSubscription = await registration.pushManager.getSubscription()

      if (pushSubscription) {
        await pushSubscription.unsubscribe()
      }

      // Remove subscription from server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      if (response.ok) {
        setIsSubscribed(false)
        setSubscription(null)
        toast.success('Push notifications disabled')
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      toast.error('Failed to disable push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const testNotification = async () => {
    if (!isSubscribed) {
      toast.error('Please enable push notifications first')
      return
    }

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        toast.success('Test notification sent')
      } else {
        throw new Error('Failed to send test notification')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Failed to send test notification')
    }
  }

  const getSubscriptions = async (): Promise<PushSubscription[]> => {
    try {
      const response = await fetch('/api/push/subscriptions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.subscriptions
      }
      return []
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      return []
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification,
    getSubscriptions,
    checkPermission: () => Notification.permission,
  }
}

// Helper functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function getDeviceName() {
  const userAgent = navigator.userAgent

  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'iOS Device'
  } else if (/Android/.test(userAgent)) {
    return 'Android Device'
  } else if (/Windows/.test(userAgent)) {
    return 'Windows PC'
  } else if (/Mac/.test(userAgent)) {
    return 'Mac'
  } else if (/Linux/.test(userAgent)) {
    return 'Linux PC'
  }

  return 'Web Browser'
}
