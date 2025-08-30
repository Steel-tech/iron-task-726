'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import {
  teamActivityService,
  type TeamMember,
  type ActivityEvent,
  type ProjectPresence,
} from '@/lib/team-activity-service'
import {
  Users,
  Activity,
  MapPin,
  Clock,
  Camera,
  Shield,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react'

export default function LiveTeamDashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([])
  const [projectPresence, setProjectPresence] = useState<ProjectPresence[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('all')

  // Initialize with mock data for demonstration
  useEffect(() => {
    // Use mock data for development
    setTeamMembers(teamActivityService.generateMockTeamMembers(6))
    setRecentActivities(teamActivityService.generateMockActivities(15))
    setIsConnected(true)

    // In production, you would initialize the real service:
    // teamActivityService.initialize(process.env.NEXT_PUBLIC_API_URL!, authToken)
    //   .then(() => setIsConnected(true))
    //   .catch(console.error)

    // Set up real-time listeners
    const unsubscribeActivity = teamActivityService.onActivityUpdate(
      activity => {
        setRecentActivities(prev => [activity, ...prev.slice(0, 19)])
      }
    )

    const unsubscribePresence = teamActivityService.onPresenceUpdate(
      presence => {
        setProjectPresence(presence)
      }
    )

    return () => {
      unsubscribeActivity()
      unsubscribePresence()
    }
  }, [])

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'photo_upload':
        return <Camera className="h-4 w-4" />
      case 'safety_check':
        return <Shield className="h-4 w-4" />
      case 'progress_update':
        return <TrendingUp className="h-4 w-4" />
      case 'check_in':
        return <UserCheck className="h-4 w-4" />
      case 'check_out':
        return <UserX className="h-4 w-4" />
      case 'comment':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'photo_upload':
        return 'text-blue-600 bg-blue-50'
      case 'safety_check':
        return 'text-red-600 bg-red-50'
      case 'progress_update':
        return 'text-green-600 bg-green-50'
      case 'check_in':
        return 'text-purple-600 bg-purple-50'
      case 'check_out':
        return 'text-gray-600 bg-gray-50'
      case 'comment':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const onlineMembers = teamMembers.filter(m => m.isOnline)
  const filteredActivities =
    selectedProject === 'all'
      ? recentActivities
      : recentActivities.filter(a => a.projectId === selectedProject)

  const projects = Array.from(
    new Set(recentActivities.map(a => a.projectName))
  ).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Live Team Dashboard</h2>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isConnected ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-construction">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Team</p>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="card-construction">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Online Now</p>
              <p className="text-2xl font-bold text-green-600">
                {onlineMembers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-construction">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="card-construction">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Activities</p>
              <p className="text-2xl font-bold">
                {
                  recentActivities.filter(
                    a =>
                      new Date(a.timestamp).toDateString() ===
                      new Date().toDateString()
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Team Members Status */}
        <div className="xl:col-span-1">
          <div className="card-construction">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Status
              </h3>
              <span className="text-sm text-gray-500">
                {onlineMembers.length} of {teamMembers.length} online
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    >
                      {member.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        member.isOnline ? 'bg-green-400' : 'bg-gray-300'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {member.role}
                      </span>
                      {member.currentActivity && (
                        <span className="text-xs text-gray-600">
                          • {member.currentActivity}
                        </span>
                      )}
                    </div>
                    {!member.isOnline && (
                      <p className="text-xs text-gray-400">
                        Last seen {formatTimeAgo(member.lastSeen)}
                      </p>
                    )}
                  </div>

                  {member.location && (
                    <MapPin className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="xl:col-span-2">
          <div className="card-construction">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Activity Feed
              </h3>

              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="input-construction text-sm py-1 px-2"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activities</p>
                </div>
              ) : (
                filteredActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`p-2 rounded-full ${getActivityColor(activity.type)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {activity.userName}
                        </p>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {activity.userRole}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-1">
                        {activity.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.projectName}
                        </span>
                        {activity.metadata?.location && (
                          <span>{activity.metadata.location}</span>
                        )}
                        {activity.metadata?.safetyScore && (
                          <span className="text-red-600">
                            Safety Score: {activity.metadata.safetyScore}/100
                          </span>
                        )}
                        {activity.metadata?.progressPercentage && (
                          <span className="text-green-600">
                            Progress: {activity.metadata.progressPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
