'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import {
  Camera,
  Share2,
  Clock,
  Image,
  Video,
  MapPin,
  Calendar,
  Users,
  Settings,
  Upload,
  Eye,
  Download,
  FileText,
  Sparkles,
  ClipboardList,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  location: string | null
  status: string
  createdAt: string
  _count: {
    media: number
    galleries: number
  }
  timeline?: {
    shareUrl: string
    viewCount: number
  }
}

interface Media {
  id: string
  fileUrl: string
  thumbnailUrl: string
  mediaType: 'PHOTO' | 'VIDEO' | 'DUAL_VIDEO'
  timestamp: string
  location: string
  notes: string
  user: {
    id: string
    name: string
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'media' | 'galleries' | 'timeline'
  >('media')

  useEffect(() => {
    fetchProject()
    fetchMedia()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data)

      // Try to fetch timeline info
      try {
        const timelineResponse = await api.get(
          `/projects/${projectId}/timeline`
        )
        setProject(prev => ({
          ...prev!,
          timeline: timelineResponse.data,
        }))
      } catch (error) {
        // Timeline might not exist yet
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    }
  }

  const fetchMedia = async () => {
    try {
      const response = await api.get(`/media/project/${projectId}`)
      setMedia(response.data.media.slice(0, 12)) // Show first 12 items
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mb-4">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {project.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{project.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  project.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : project.status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {project.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/projects/${projectId}/settings`}>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Link href="/dashboard/capture" className="block">
          <div className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Camera className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Capture Media</h3>
            <p className="text-sm text-muted-foreground">
              Take photos or videos
            </p>
          </div>
        </Link>

        <Link href="/dashboard/upload" className="block">
          <div className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Upload className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Upload Files</h3>
            <p className="text-sm text-muted-foreground">Batch upload media</p>
          </div>
        </Link>

        <Link
          href={`/dashboard/projects/${projectId}/galleries`}
          className="block"
        >
          <div className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Share2 className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Galleries</h3>
            <p className="text-sm text-muted-foreground">
              {project._count.galleries} galleries
            </p>
          </div>
        </Link>

        <Link
          href={`/dashboard/projects/${projectId}/timeline`}
          className="block"
        >
          <div className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Clock className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Timeline</h3>
            <p className="text-sm text-muted-foreground">
              {project.timeline
                ? `${project.timeline.viewCount} views`
                : 'Not configured'}
            </p>
          </div>
        </Link>

        <Link
          href={`/dashboard/projects/${projectId}/calendar`}
          className="block"
        >
          <div className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Schedule</h3>
            <p className="text-sm text-muted-foreground">Production calendar</p>
          </div>
        </Link>

        <Link href={`/dashboard/projects/${projectId}/forms`} className="block">
          <div className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <ClipboardList className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Forms</h3>
            <p className="text-sm text-muted-foreground">Daily documentation</p>
          </div>
        </Link>

        <Link
          href={`/dashboard/projects/${projectId}/reports`}
          className="block"
        >
          <div className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">AI Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate reports with AI
            </p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Media</p>
              <p className="text-2xl font-bold">{project._count.media}</p>
            </div>
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Galleries</p>
              <p className="text-2xl font-bold">{project._count.galleries}</p>
            </div>
            <Share2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Timeline Views</p>
              <p className="text-2xl font-bold">
                {project.timeline?.viewCount || 0}
              </p>
            </div>
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Recent Media */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Media</h2>
          <Link href={`/dashboard/media?project=${projectId}`}>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {media.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">No media uploaded yet</p>
            <div className="flex gap-4 justify-center mt-4">
              <Link href="/dashboard/capture">
                <Button>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Media
                </Button>
              </Link>
              <Link href="/dashboard/upload">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map(item => (
              <Link
                key={item.id}
                href={`/dashboard/media/${item.id}`}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                {item.mediaType === 'VIDEO' ||
                item.mediaType === 'DUAL_VIDEO' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={item.thumbnailUrl || item.fileUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white truncate">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
