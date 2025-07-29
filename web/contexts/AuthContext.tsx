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
    // Check for stored token - use consistent key
    const storedToken = localStorage.getItem('accessToken')
    if (storedToken) {
      setToken(storedToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      fetchUser()
      setupSessionWarning(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])
  
  const setupSessionWarning = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = payload.exp * 1000
      const now = Date.now()
      const timeUntilWarning = expiresAt - now - (5 * 60 * 1000) // 5 minutes before expiry
      
      if (timeUntilWarning > 0) {
        setTimeout(() => {
          setShowSessionWarning(true)
        }, timeUntilWarning)
      }
    } catch (error) {
      console.error('Error setting up session warning:', error)
    }
  }
  
  const fetchUser = async () => {
    try {
      const userData = await authApi.getMe()
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // Token might be invalid, clear it
      localStorage.removeItem('accessToken')
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
      console.error('Logout error:', error)
    }
    
    // Clear token and user - authApi.logout already removes accessToken
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
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
    refreshUser
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