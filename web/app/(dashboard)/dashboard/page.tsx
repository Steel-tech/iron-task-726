'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import Calendar from '@/components/Calendar'
import LiveTeamDashboard from '@/components/LiveTeamDashboard'
import ProgressAnalyticsDashboard from '@/components/ProgressAnalyticsDashboard'
import TeamChatPanel from '@/components/TeamChatPanel'
import SafetyComplianceDashboard from '@/components/SafetyComplianceDashboard'
import Link from 'next/link'
import {
  Camera,
  Clock,
  FolderOpen,
  Image,
  TrendingUp,
  Upload,
  Users,
  BarChart3,
  MessageSquare,
  Activity,
  Shield
} from 'lucide-react'
import { api } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'

interface DashboardStats {
  totalProjects: number
  totalPhotos: number
  totalUsers: number
  recentPhotos: Array<{
    id: string
    fileName: string
    uploadedAt: string
    user: {
      name: string
    }
    project: {
      name: string
    }
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  
  const { connected, updatePresence, on, off } = useWebSocket()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchRecentActivities = async () => {
      try {
        const response = await api.get('/users/activity/recent?limit=10')
        setRecentActivities(response.data.activities)
      } catch (error) {
        console.error('Failed to fetch recent activities:', error)
      }
    }

    fetchStats()
    fetchRecentActivities()
  }, [])

  // Update presence when connected
  useEffect(() => {
    if (connected) {
      updatePresence({ 
        currentPage: 'Dashboard',
        activity: 'Viewing project overview',
        status: 'ONLINE'
      })
      
      // Listen for presence updates
      const handlePresenceUpdate = (update: any) => {
        setOnlineUsers(prev => {
          const updated = [...prev]
          const existingIndex = updated.findIndex(u => u.userId === update.userId)
          if (existingIndex >= 0) {
            updated[existingIndex] = update
          } else if (update.status === 'ONLINE') {
            updated.push(update)
          }
          return updated.filter(u => u.status === 'ONLINE')
        })
      }

      // Listen for new activities
      const handleActivityCreated = (activity: any) => {
        setRecentActivities(prev => [activity, ...prev.slice(0, 9)])
      }

      on('user_presence_updated', handlePresenceUpdate)
      on('activity_created', handleActivityCreated)
      
      return () => {
        off('user_presence_updated', handlePresenceUpdate)
        off('activity_created', handleActivityCreated)
      }
    }
  }, [connected, updatePresence, on, off])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: FolderOpen,
      color: 'bg-blue-500',
      href: '/dashboard/projects',
    },
    {
      title: 'Total Photos',
      value: stats?.totalPhotos || 0,
      icon: Image,
      color: 'bg-green-500',
      href: '/dashboard/photos',
    },
    {
      title: 'Team Members',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-500',
      href: '/dashboard/team',
    },
    {
      title: 'This Week',
      value: stats?.recentPhotos?.length || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      href: '/dashboard/photos',
    },
  ]

  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'analytics' | 'safety' | 'activity' | 'chat'>('overview')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          {/* Team Presence Indicator */}
          {connected && (
            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">
                {onlineUsers.length} team members online
              </span>
              {onlineUsers.slice(0, 3).map((user, i) => (
                <div key={i} className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                  {user.userName?.charAt(0) || '?'}
                </div>
              ))}
              {onlineUsers.length > 3 && (
                <span className="text-xs text-gray-400">+{onlineUsers.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="brushed-metal p-6 rounded-lg shadow-lg hover:shadow-xl hover:animation-blueSparkHover transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Enhanced Dashboard Tabs */}
      <div className="brushed-metal rounded-lg shadow-lg">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-safety-orange border-b-2 border-safety-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'team'
                ? 'text-safety-orange border-b-2 border-safety-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Live Team
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-safety-orange border-b-2 border-safety-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'safety'
                ? 'text-safety-orange border-b-2 border-safety-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Safety
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-safety-orange border-b-2 border-safety-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Activity
            </div>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-safety-orange border-b-2 border-safety-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Team Chat
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - Activities and Quick Actions */}
              <div className="xl:col-span-2 space-y-6">
                {/* Recent Activity */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                      <Clock className="h-5 w-5 text-safety-orange" />
                      Recent Activity
                    </h2>
                  </div>
                  <div className="p-6">
                    {stats?.recentPhotos && stats.recentPhotos.length > 0 ? (
                      <div className="space-y-4">
                        {stats.recentPhotos.slice(0, 5).map((photo) => (
                          <div
                            key={photo.id}
                            className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2 rounded">
                                <Camera className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{photo.fileName}</p>
                                <p className="text-sm text-gray-400">
                                  {photo.project.name} • by {photo.user.name}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-400">
                              {new Date(photo.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-400 py-8">
                        No recent activity
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Quick Actions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/dashboard/upload">
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Photos
                      </Button>
                    </Link>
                    <Link href="/dashboard/projects/new">
                      <Button variant="outline" className="w-full justify-start">
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Create New Project
                      </Button>
                    </Link>
                    <Link href="/dashboard/photos">
                      <Button variant="outline" className="w-full justify-start">
                        <Image className="h-4 w-4 mr-2" />
                        Browse All Photos
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column - Calendar */}
              <div className="xl:col-span-1">
                <Calendar />
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <LiveTeamDashboard />
          )}

          {activeTab === 'analytics' && (
            <ProgressAnalyticsDashboard />
          )}

          {activeTab === 'safety' && (
            <SafetyComplianceDashboard />
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Activity Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Activities</span>
                    <Activity className="h-4 w-4 text-safety-orange" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{recentActivities.length}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Media Uploads</span>
                    <Image className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {recentActivities.filter(a => a.activityType === 'MEDIA_UPLOAD').length}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Comments</span>
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {recentActivities.filter(a => a.activityType === 'COMMENT').length}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Online Now</span>
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{onlineUsers.length}</div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-safety-orange" />
                      Live Activity Feed
                    </h2>
                    {connected && (
                      <div className="flex items-center gap-2 text-green-500 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live
                      </div>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {recentActivities.length > 0 ? (
                    <div className="divide-y divide-gray-700">
                      {recentActivities.map((activity, index) => (
                        <div key={activity.id || index} className="p-4 hover:bg-gray-700/50">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {activity.user?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{activity.user?.name || 'Unknown User'}</span>
                                <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                                  {activity.user?.role || 'WORKER'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {activity.project?.name}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mt-1">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span>{new Date(activity.createdAt).toLocaleTimeString()}</span>
                                {activity.media && (
                                  <span className="flex items-center gap-1">
                                    <Image className="h-3 w-3" />
                                    {activity.media.mediaType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400 mb-2">No recent activities</p>
                      <p className="text-sm text-gray-500">Activities will appear here as team members work on projects</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-4">Team chat opens in a floating panel</p>
              <p className="text-sm text-gray-500">Look for the chat button in the bottom-right corner</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Team Chat Panel */}
      <TeamChatPanel
        currentUserId="user_1"
        currentUserName="Current User"
        currentUserRole="FOREMAN"
      />
    </div>
  )
}