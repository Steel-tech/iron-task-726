'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { X, Download, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window === 'undefined') return

    // Check if app is already installed (running in standalone mode)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show our custom install prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    // Listen for successful app installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener
    )
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Separate effect for iOS install prompt to avoid dependency issues
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if we should show iOS install instructions
    if (isIOS && !isStandalone) {
      // Show iOS install prompt after delay if not already installed
      setTimeout(() => setShowPrompt(true), 5000)
    }
  }, [isIOS, isStandalone])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)

    // Log the result (optional)
    if (outcome === 'accepted') {
      // User accepted the install prompt
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-prompt-dismissed', 'true')
    }
  }

  // Don't show if already installed or user dismissed this session
  if (
    isStandalone ||
    (typeof window !== 'undefined' &&
      sessionStorage.getItem('pwa-prompt-dismissed'))
  ) {
    return null
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Install FSW Iron Task
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {isIOS
            ? 'Add to your home screen for quick access and offline capabilities.'
            : 'Install our app for faster access, offline support, and a better mobile experience.'}
        </p>

        {isIOS ? (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 space-y-1">
              <p>To install on iOS:</p>
              <p>
                1. Tap the Share button <span className="font-mono">□↑</span>
              </p>
              <p>2. Select "Add to Home Screen"</p>
              <p>3. Tap "Add" to confirm</p>
            </div>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="w-full text-sm"
            >
              Got it
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 text-sm h-9"
              disabled={!deferredPrompt}
            >
              <Download className="h-4 w-4 mr-1" />
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="text-sm h-9 px-3"
            >
              Later
            </Button>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Offline Access
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Faster Loading
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Push Notifications
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
