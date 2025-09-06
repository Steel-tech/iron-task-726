'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, authApi } from '@/lib/api'
import { SessionWarning } from '@/components/SessionWarning'

interface User {
  id: string
  email: string
  name: string
  role: string
  companyId?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSessionWarning, setShowSessionWarning] = useState(false)

  useEffect(() => {
    // Only access localStorage on the client side to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken')
      if (storedToken) {
        setToken(storedToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        fetchUser()
        setupSessionWarning(storedToken)
      } else {
        setIsLoading(false)
      }
    } else {
      // On server side, just set loading to false
      setIsLoading(false)
    }
  }, [])

  const setupSessionWarning = (token: string) => {
    try {
      // Validate JWT token format
      if (!token || typeof token !== 'string') {
        // Invalid token format - silently return
        return
      }

      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        // Invalid JWT token format - silently return
        return
      }

      // Decode the base64 payload safely
      let decodedPayload: string
      try {
        decodedPayload = atob(tokenParts[1])
      } catch (decodeError) {
        // Failed to decode JWT token payload - silently return
        return
      }

      const payload = JSON.parse(decodedPayload)
      if (!payload.exp) {
        // Token payload missing exp field - silently return
        return
      }

      const expiresAt = payload.exp * 1000
      const now = Date.now()
      const timeUntilWarning = expiresAt - now - 5 * 60 * 1000 // 5 minutes before expiry

      if (timeUntilWarning > 0) {
        setTimeout(() => {
          setShowSessionWarning(true)
        }, timeUntilWarning)
      }
    } catch (error) {
      // Error setting up session warning - silently fail
      // In production, this would be logged to error monitoring service
    }
  }

  const fetchUser = async () => {
    try {
      const userData = await authApi.getMe()
      setUser(userData)
    } catch (error) {
      // Failed to fetch user - token might be invalid
      // Token might be invalid, clear it
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
      }
      setToken(null)
      delete api.defaults.headers.common['Authorization']
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    const { accessToken: newToken, user: userData } = response

    // Store token - already handled by authApi.login
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

    setToken(newToken)
    setUser(userData)
    setupSessionWarning(newToken)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Logout error - continue with cleanup anyway
    }

    // Clear token and user - authApi.logout already removes accessToken
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)

    // Clear localStorage only on client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
    }
  }

  const refreshUser = async () => {
    if (token) {
      await fetchUser()
    }
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showSessionWarning && (
        <SessionWarning
          onExtend={() => {
            setShowSessionWarning(false)
            // Token refresh is handled by the SessionWarning component
          }}
          onLogout={() => {
            setShowSessionWarning(false)
            logout()
          }}
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
