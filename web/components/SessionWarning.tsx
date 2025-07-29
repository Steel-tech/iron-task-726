'use client'

import { useState, useEffect } from 'react'
import { Clock, Shield, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { authApi } from '@/lib/api'

interface SessionWarningProps {
  onExtend: () => void
  onLogout: () => void
}

export function SessionWarning({ onExtend, onLogout }: SessionWarningProps) {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if we should show the warning (5 minutes before token expires)
    const token = localStorage.getItem('accessToken')
    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = payload.exp * 1000 // Convert to milliseconds
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now
      const warningTime = 5 * 60 * 1000 // 5 minutes before expiry

      if (timeUntilExpiry <= warningTime && timeUntilExpiry > 0) {
        setIsVisible(true)
        setTimeLeft(Math.floor(timeUntilExpiry / 1000))
      }
    } catch (error) {
      console.error('Error parsing token:', error)
    }
  }, [])

  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, timeLeft, onLogout])

  const handleExtend = async () => {
    try {
      await authApi.refresh()
      setIsVisible(false)
      onExtend()
    } catch (error) {
      console.error('Failed to refresh session:', error)
      onLogout()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Clock className="h-8 w-8 text-safety-orange animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Session Expiring Soon</h3>
            <p className="text-sm text-gray-400">
              Your session will expire in <span className="font-mono text-safety-orange">{formatTime(timeLeft)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            For your security, we'll automatically log you out when your session expires. 
            Click "Stay Signed In" to extend your session.
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="h-3 w-3" />
            <span>Session timeout helps protect your construction data</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleExtend}
            className="flex-1 bg-safety-orange hover:bg-orange-700 text-white"
            size="sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            Stay Signed In
          </Button>
          
          <Button
            onClick={() => {
              setIsVisible(false)
              onLogout()
            }}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Sign Out Now
          </Button>
        </div>
      </div>
    </div>
  )
}