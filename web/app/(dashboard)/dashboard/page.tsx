'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import Calendar from '@/components/Calendar'
import Link from 'next/link'
import {
  Camera,
  Clock,
  FolderOpen,
  Image,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'

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

    fetchStats()
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
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

      {/* Main Content Grid - Calendar and Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Activities and Quick Actions */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="brushed-metal rounded-lg shadow-lg">
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
                      className="flex items-center justify-between py-3 border-b last:border-0"
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
                <p className="text-center text-muted-foreground py-8">
                  No recent activity
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="brushed-metal rounded-lg shadow-lg p-6">
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
    </div>
  )
}