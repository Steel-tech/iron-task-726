'use client'

import { useEffect, useState, useCallback } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/AuthContext'

export function useWebSocket() {
  const { token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!token) return
    
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', {
      transports: ['websocket'],
      auth: {
        token
      }
    })
    
    socketInstance.on('connect', () => {
      console.log('WebSocket connected')
      setConnected(true)
      setError(null)
      
      // Authenticate with token
      socketInstance.emit('authenticate', token)
    })
    
    socketInstance.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data)
    })
    
    socketInstance.on('authentication_error', (err) => {
      console.error('WebSocket authentication error:', err)
      setError(err)
    })
    
    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    })
    
    socketInstance.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err)
      setError(err.message)
    })
    
    setSocket(socketInstance)
    
    return () => {
      socketInstance.disconnect()
    }
  }, [token])
  
  const emit = useCallback((event: string, data?: any) => {
    if (socket && connected) {
      socket.emit(event, data)
    }
  }, [socket, connected])
  
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, handler)
    }
  }, [socket])
  
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, handler)
    }
  }, [socket])

  // Presence-specific methods
  const updatePresence = useCallback((data: { 
    projectId?: string; 
    status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'; 
    currentPage?: string; 
    activity?: string 
  }) => {
    if (socket && connected) {
      socket.emit('update_presence', data)
    }
  }, [socket, connected])
  
  return {
    socket,
    connected,
    error,
    emit,
    on,
    off,
    updatePresence
  }
}