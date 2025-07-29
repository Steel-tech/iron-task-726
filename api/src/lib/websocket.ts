import { FastifyInstance } from 'fastify'
import { Server } from 'socket.io'
import { verifyToken } from './auth'
import { prisma } from './prisma'

let io: Server | null = null

// User to socket mapping
const userSockets = new Map<string, Set<string>>()
// Project to socket mapping  
const projectSockets = new Map<string, Set<string>>()
// Socket to user/project mapping
const socketInfo = new Map<string, { userId: string; projectIds: string[] }>()

export function initializeWebSocket(fastify: FastifyInstance) {
  io = new Server(fastify.server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  })
  
  io.on('connection', async (socket) => {
    console.log('New WebSocket connection:', socket.id)
    
    // Authenticate the connection
    socket.on('authenticate', async (token: string) => {
      try {
        const payload = verifyToken(token)
        const userId = payload.userId
        
        // Get user's projects
        const projectMembers = await prisma.projectMember.findMany({
          where: { userId },
          select: { projectId: true }
        })
        const projectIds = projectMembers.map(pm => pm.projectId)
        
        // Store socket info
        socketInfo.set(socket.id, { userId, projectIds })
        
        // Add to user sockets
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set())
        }
        userSockets.get(userId)!.add(socket.id)
        
        // Add to project sockets
        for (const projectId of projectIds) {
          if (!projectSockets.has(projectId)) {
            projectSockets.set(projectId, new Set())
          }
          projectSockets.get(projectId)!.add(socket.id)
        }
        
        socket.emit('authenticated', { userId, projectIds })
        
        // Join project rooms
        projectIds.forEach(projectId => {
          socket.join(`project:${projectId}`)
        })
        
        // Join user room
        socket.join(`user:${userId}`)
        
      } catch (error) {
        console.error('WebSocket authentication failed:', error)
        socket.emit('authentication_error', 'Invalid token')
        socket.disconnect()
      }
    })
    
    // Handle disconnection
    socket.on('disconnect', () => {
      const info = socketInfo.get(socket.id)
      if (info) {
        // Remove from user sockets
        const userSocketSet = userSockets.get(info.userId)
        if (userSocketSet) {
          userSocketSet.delete(socket.id)
          if (userSocketSet.size === 0) {
            userSockets.delete(info.userId)
          }
        }
        
        // Remove from project sockets
        for (const projectId of info.projectIds) {
          const projectSocketSet = projectSockets.get(projectId)
          if (projectSocketSet) {
            projectSocketSet.delete(socket.id)
            if (projectSocketSet.size === 0) {
              projectSockets.delete(projectId)
            }
          }
        }
        
        socketInfo.delete(socket.id)
      }
      
      console.log('WebSocket disconnected:', socket.id)
    })
    
    // Handle joining a specific media room for live comments
    socket.on('join_media', (mediaId: string) => {
      socket.join(`media:${mediaId}`)
    })
    
    socket.on('leave_media', (mediaId: string) => {
      socket.leave(`media:${mediaId}`)
    })
  })
  
  return io
}

// Emit to all users in a project
export function emitToProject(projectId: string, event: string, data: any) {
  if (!io) return
  io.to(`project:${projectId}`).emit(event, data)
}

// Emit to a specific user
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, data)
}

// Emit to all users viewing a specific media
export function emitToMedia(mediaId: string, event: string, data: any) {
  if (!io) return
  io.to(`media:${mediaId}`).emit(event, data)
}

// Get online users for a project
export function getOnlineProjectUsers(projectId: string): string[] {
  const sockets = projectSockets.get(projectId)
  if (!sockets) return []
  
  const users = new Set<string>()
  for (const socketId of sockets) {
    const info = socketInfo.get(socketId)
    if (info) {
      users.add(info.userId)
    }
  }
  
  return Array.from(users)
}

// Check if a user is online
export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId)
}