'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Star,
  Users,
  Camera,
  Video,
  Grid3X3,
  List,
  Layers,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  ChevronDown,
  MoreVertical,
  Image as ImageIcon,
  Clock,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api from '@/lib/api'

interface MediaItem {
  id: string
  fileUrl: string
  thumbnailUrl?: string
  mediaType: 'PHOTO' | 'VIDEO' | 'PANORAMA'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  mediaTags: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
}

interface FeedEvent {
  id: string
  eventType: string
  entityType: string
  entityId: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface Project {
  id: string
  jobNumber: string
  name: string
  location: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'
  updatedAt: string
  company: {
    name: string
  }
  members: Array<{
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }>
  media: MediaItem[]
  labels: Array<{
    label: {
      id: string
      name: string
      color: string
    }
  }>
  feedEvents: FeedEvent[]
  _count: {
    media: number
    activities: number
  }
  isStarred?: boolean
}

interface FeedPreferences {
  projectOrder?: string[]
  showStarredFirst?: boolean
  hideInactive?: boolean
  hiddenProjects?: string[]
  viewMode?: 'grid' | 'list' | 'compact'
  itemsPerPage?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function ProjectFeedPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [preferences, setPreferences] = useState<FeedPreferences>({})
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchProjectFeed = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await api.get('/api/feed', {
        params: {
          starred: showStarredOnly,
          limit: preferences.itemsPerPage || 20,
        },
      })
      setProjects(response.data.projects)
      setPreferences(response.data.preferences || {})
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch project feed:', error)
      toast({
        title: 'Error',
        description: 'Failed to load project feed',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [showStarredOnly, preferences.itemsPerPage, toast])

  useEffect(() => {
    fetchProjectFeed()
  }, [fetchProjectFeed])

  // Auto-refresh functionality
  useEffect(() => {
    if (preferences.autoRefresh) {
      const interval = setInterval(
        () => {
          fetchProjectFeed()
        },
        (preferences.refreshInterval || 30) * 1000
      )

      return () => clearInterval(interval)
    }
    return undefined
  }, [preferences.autoRefresh, preferences.refreshInterval, fetchProjectFeed])

  const toggleProjectStar = async (projectId: string) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/star`)
      const isStarred = response.data.starred

      setProjects(prev =>
        prev.map(project =>
          project.id === projectId ? { ...project, isStarred } : project
        )
      )

      toast({
        title: isStarred ? 'Project starred' : 'Project unstarred',
        description: isStarred
          ? 'This project will appear at the top of your feed'
          : 'Project removed from starred list',
      })
    } catch (error) {
      console.error('Failed to star/unstar project:', error)
      toast({
        title: 'Error',
        description: 'Failed to update project star status',
        variant: 'destructive',
      })
    }
  }

  const updatePreferences = async (updates: Partial<FeedPreferences>) => {
    try {
      const response = await api.put('/api/feed/preferences', updates)
      setPreferences(response.data.preferences)
      toast({
        title: 'Preferences updated',
        description: 'Your feed preferences have been saved',
      })
    } catch (error) {
      console.error('Failed to update preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to update preferences',
        variant: 'destructive',
      })
    }
  }

  const hideProject = async (projectId: string) => {
    const updatedHiddenProjects = [
      ...(preferences.hiddenProjects || []),
      projectId,
    ]
    await updatePreferences({ hiddenProjects: updatedHiddenProjects })
    setProjects(prev => prev.filter(p => p.id !== projectId))
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'ON_HOLD':
        return 'bg-yellow-500'
      case 'COMPLETED':
        return 'bg-blue-500'
      case 'PLANNING':
        return 'bg-purple-500'
      case 'ARCHIVED':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatEventDescription = (event: FeedEvent) => {
    switch (event.eventType) {
      case 'media_uploaded':
        return `uploaded new ${event.entityType}`
      case 'comment_added':
        return 'added a comment'
      case 'tag_applied':
        return 'applied tags'
      case 'member_added':
        return 'joined the project'
      default:
        return event.eventType.replace(/_/g, ' ')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Project Feed</h1>
            <p className="text-gray-400">Stay on top of every job</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={fetchProjectFeed}
              disabled={isRefreshing}
              className="text-gray-300"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Feed Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() =>
                    updatePreferences({
                      showStarredFirst: !preferences.showStarredFirst,
                    })
                  }
                >
                  {preferences.showStarredFirst
                    ? 'Show all projects first'
                    : 'Show starred first'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updatePreferences({
                      hideInactive: !preferences.hideInactive,
                    })
                  }
                >
                  {preferences.hideInactive
                    ? 'Show inactive projects'
                    : 'Hide inactive projects'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updatePreferences({ viewMode: 'grid' })}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid view
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updatePreferences({ viewMode: 'list' })}
                >
                  <List className="h-4 w-4 mr-2" />
                  List view
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updatePreferences({ viewMode: 'compact' })}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Compact view
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    updatePreferences({ autoRefresh: !preferences.autoRefresh })
                  }
                >
                  {preferences.autoRefresh
                    ? 'Disable auto-refresh'
                    : 'Enable auto-refresh'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-4">
          <Button
            variant={showStarredOnly ? 'default' : 'outline'}
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            size="sm"
          >
            <Star className="h-4 w-4 mr-2" />
            Starred Projects
          </Button>
          <div className="text-sm text-gray-400">
            Last updated:{' '}
            {formatDistanceToNow(lastRefresh, { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div
        className={
          preferences.viewMode === 'list'
            ? 'space-y-4'
            : preferences.viewMode === 'compact'
              ? 'space-y-2'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }
      >
        {projects.map(project => (
          <div
            key={project.id}
            className={`
              bg-gray-800 rounded-lg overflow-hidden
              ${preferences.viewMode === 'compact' ? 'p-4' : 'p-6'}
              hover:bg-gray-700 transition-colors
            `}
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="text-xl font-semibold text-white hover:text-primary transition-colors"
                  >
                    {project.name}
                  </Link>
                  <button
                    onClick={() => toggleProjectStar(project.id)}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Star
                      className={`h-5 w-5 ${project.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>#{project.jobNumber}</span>
                  <span>{project.location}</span>
                  <Badge
                    className={`${getStatusColor(project.status)} text-white`}
                  >
                    {project.status}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/projects/${project.id}`)
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => hideProject(project.id)}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide from feed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Recent Media */}
            {preferences.viewMode !== 'compact' && project.media.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-5 gap-1">
                  {project.media.slice(0, 5).map(media => (
                    <div key={media.id} className="relative aspect-square">
                      {media.mediaType === 'VIDEO' ? (
                        <div className="absolute inset-0 bg-black rounded flex items-center justify-center">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <img
                          src={media.thumbnailUrl || media.fileUrl}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {project._count.media > 5 && (
                  <p className="text-sm text-gray-400 mt-2">
                    +{project._count.media - 5} more
                  </p>
                )}
              </div>
            )}

            {/* Stats and Activity */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  {project._count.media}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {project._count.activities}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {project.members.length}
                </span>
              </div>
              {project.feedEvents.length > 0 && project.feedEvents[0] && (
                <div className="text-xs text-gray-500">
                  {project.feedEvents[0].user.name}{' '}
                  {formatEventDescription(project.feedEvents[0])}
                </div>
              )}
            </div>

            {/* Labels */}
            {project.labels.length > 0 &&
              preferences.viewMode !== 'compact' && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.labels.map(({ label }) => (
                    <Badge
                      key={label.id}
                      style={{ backgroundColor: label.color }}
                      className="text-white text-xs"
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No projects to display</p>
          {showStarredOnly && (
            <p className="text-sm text-gray-500 mt-2">
              Star some projects to see them here
            </p>
          )}
        </div>
      )}
    </div>
  )
}
