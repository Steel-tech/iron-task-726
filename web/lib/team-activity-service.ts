/**
 * Real-Time Team Activity Service
 * Tracks and broadcasts team member activities across projects
 */

import { io, Socket } from 'socket.io-client'

export interface TeamMember {
  id: string
  name: string
  role: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
  currentProject?: string
  currentActivity?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

export interface ActivityEvent {
  id: string
  userId: string
  userName: string
  userRole: string
  projectId: string
  projectName: string
  type: 'photo_upload' | 'safety_check' | 'progress_update' | 'check_in' | 'check_out' | 'comment' | 'report_generated'
  description: string
  timestamp: Date
  metadata?: {
    mediaCount?: number
    safetyScore?: number
    progressPercentage?: number
    location?: string
    [key: string]: any
  }
}

export interface ProjectPresence {
  projectId: string
  projectName: string
  activeMembers: TeamMember[]
  recentActivities: ActivityEvent[]
  totalOnline: number
}

class TeamActivityService {
  private socket: Socket | null = null
  private currentUser: TeamMember | null = null
  private activityCallbacks: Array<(activity: ActivityEvent) => void> = []
  private presenceCallbacks: Array<(presence: ProjectPresence[]) => void> = []
  private memberCallbacks: Array<(members: TeamMember[]) => void> = []
  private isConnected = false

  async initialize(apiUrl: string, authToken: string) {
    if (this.socket) {
      this.socket.disconnect()
    }

    this.socket = io(apiUrl, {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventListeners()
    
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'))
        return
      }

      this.socket.on('connect', () => {
        this.isConnected = true
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        this.isConnected = false
        reject(error)
      })

      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'))
        }
      }, 10000)
    })
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Team member presence updates
    this.socket.on('member_online', (member: TeamMember) => {
      this.notifyMemberCallbacks()
    })

    this.socket.on('member_offline', (member: TeamMember) => {
      this.notifyMemberCallbacks()
    })

    this.socket.on('member_location_update', (data: { userId: string; location: TeamMember['location'] }) => {
      this.notifyMemberCallbacks()
    })

    // Activity updates
    this.socket.on('new_activity', (activity: ActivityEvent) => {
      this.activityCallbacks.forEach(callback => callback(activity))
    })

    // Project presence updates
    this.socket.on('project_presence_update', (presence: ProjectPresence[]) => {
      this.presenceCallbacks.forEach(callback => callback(presence))
    })

    // Handle disconnection
    this.socket.on('disconnect', () => {
      this.isConnected = false
    })
  }

  private notifyMemberCallbacks() {
    // This would typically fetch updated member list from server
    // For now, we'll implement a placeholder
  }

  // Activity tracking methods
  async trackActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) {
    if (!this.socket || !this.isConnected) return

    const activityData: Partial<ActivityEvent> = {
      ...activity,
      timestamp: new Date()
    }

    this.socket.emit('track_activity', activityData)
  }

  async updateLocation(location: TeamMember['location']) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('update_location', { location })
  }

  async setCurrentActivity(projectId: string, activity: string) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('set_current_activity', { projectId, activity })
  }

  // Presence management
  async joinProject(projectId: string) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('join_project', { projectId })
  }

  async leaveProject(projectId: string) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('leave_project', { projectId })
  }

  // Check in/out functionality
  async checkIn(projectId: string, location?: TeamMember['location']) {
    const activity: Omit<ActivityEvent, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'> = {
      projectId,
      projectName: '', // Will be filled by server
      type: 'check_in',
      description: 'Checked in to project',
      metadata: location ? { location: location.address } : undefined
    }

    await this.trackActivity(activity)
    
    if (location) {
      await this.updateLocation(location)
    }
  }

  async checkOut(projectId: string) {
    const activity: Omit<ActivityEvent, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'> = {
      projectId,
      projectName: '', // Will be filled by server
      type: 'check_out',
      description: 'Checked out of project'
    }

    await this.trackActivity(activity)
  }

  // Callback registration
  onActivityUpdate(callback: (activity: ActivityEvent) => void) {
    this.activityCallbacks.push(callback)
    
    return () => {
      const index = this.activityCallbacks.indexOf(callback)
      if (index > -1) {
        this.activityCallbacks.splice(index, 1)
      }
    }
  }

  onPresenceUpdate(callback: (presence: ProjectPresence[]) => void) {
    this.presenceCallbacks.push(callback)
    
    return () => {
      const index = this.presenceCallbacks.indexOf(callback)
      if (index > -1) {
        this.presenceCallbacks.splice(index, 1)
      }
    }
  }

  onMemberUpdate(callback: (members: TeamMember[]) => void) {
    this.memberCallbacks.push(callback)
    
    return () => {
      const index = this.memberCallbacks.indexOf(callback)
      if (index > -1) {
        this.memberCallbacks.splice(index, 1)
      }
    }
  }

  // Quick activity helpers for common construction tasks
  async trackPhotoUpload(projectId: string, mediaCount: number, location?: string) {
    return this.trackActivity({
      projectId,
      projectName: '',
      type: 'photo_upload',
      description: `Uploaded ${mediaCount} ${mediaCount === 1 ? 'photo' : 'photos'}`,
      metadata: { mediaCount, location }
    })
  }

  async trackSafetyCheck(projectId: string, safetyScore: number, location?: string) {
    return this.trackActivity({
      projectId,
      projectName: '',
      type: 'safety_check',
      description: `Completed safety check (Score: ${safetyScore}/100)`,
      metadata: { safetyScore, location }
    })
  }

  async trackProgressUpdate(projectId: string, progressPercentage: number, description?: string) {
    return this.trackActivity({
      projectId,
      projectName: '',
      type: 'progress_update',
      description: description || `Updated progress to ${progressPercentage}%`,
      metadata: { progressPercentage }
    })
  }

  // Connection management
  isConnectedToServer(): boolean {
    return this.isConnected
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
  }

  // Mock data generators for development
  generateMockTeamMembers(count: number = 5): TeamMember[] {
    const roles = ['FOREMAN', 'IRONWORKER', 'WELDER', 'SAFETY_OFFICER', 'INSPECTOR']
    const names = ['Mike Johnson', 'Sarah Chen', 'Roberto Martinez', 'Dave Thompson', 'Lisa Anderson']
    
    return Array.from({ length: count }, (_, i) => ({
      id: `user_${i + 1}`,
      name: names[i] || `Worker ${i + 1}`,
      role: roles[i % roles.length],
      isOnline: Math.random() > 0.3,
      lastSeen: new Date(Date.now() - Math.random() * 3600000),
      currentProject: Math.random() > 0.5 ? `project_${Math.floor(Math.random() * 3) + 1}` : undefined,
      currentActivity: Math.random() > 0.5 ? ['Welding', 'Erection', 'Safety Check'][Math.floor(Math.random() * 3)] : undefined
    }))
  }

  generateMockActivities(count: number = 10): ActivityEvent[] {
    const types: ActivityEvent['type'][] = ['photo_upload', 'safety_check', 'progress_update', 'check_in', 'check_out']
    const projects = ['Downtown Office Complex', 'Highway Bridge Project', 'Industrial Warehouse']
    const users = ['Mike Johnson', 'Sarah Chen', 'Roberto Martinez']
    
    return Array.from({ length: count }, (_, i) => ({
      id: `activity_${i + 1}`,
      userId: `user_${(i % 3) + 1}`,
      userName: users[i % users.length],
      userRole: 'IRONWORKER',
      projectId: `project_${(i % 3) + 1}`,
      projectName: projects[i % projects.length],
      type: types[Math.floor(Math.random() * types.length)],
      description: `Mock activity ${i + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      metadata: {
        location: 'Bay 3, Level 2'
      }
    }))
  }
}

export const teamActivityService = new TeamActivityService()