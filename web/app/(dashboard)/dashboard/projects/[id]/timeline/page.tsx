'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import {
  ArrowLeft,
  Clock,
  Globe,
  Lock,
  Palette,
  Upload,
  Filter,
  Eye,
  Link as LinkIcon,
  Save,
  Trash2,
  ExternalLink,
  BarChart,
} from 'lucide-react'
import Link from 'next/link'

interface Timeline {
  id: string
  shareToken: string
  shareUrl: string
  isPublic: boolean
  password: boolean
  showAllMedia: boolean
  mediaTypes: string[]
  activityTypes: string[]
  brandLogo: string | null
  brandColor: string | null
  title: string | null
  description: string | null
  viewCount: number
  _count: {
    views: number
  }
}

export default function ProjectTimelinePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [project, setProject] = useState<any>(null)

  // Timeline settings
  const [isPublic, setIsPublic] = useState(false)
  const [password, setPassword] = useState('')
  const [showAllMedia, setShowAllMedia] = useState(true)
  const [mediaTypes, setMediaTypes] = useState(['PHOTO', 'VIDEO'])
  const [activityTypes, setActivityTypes] = useState<string[]>([])
  const [brandLogo, setBrandLogo] = useState('')
  const [brandColor, setBrandColor] = useState('#1a73e8')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchTimeline()
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data)
      setTitle(response.data.name) // Default title to project name
    } catch (error) {
      console.error('Failed to fetch project:', error)
    }
  }

  const fetchTimeline = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/timeline`)
      const data = response.data
      setTimeline(data)

      // Load existing settings
      setIsPublic(data.isPublic)
      setShowAllMedia(data.showAllMedia)
      setMediaTypes(data.mediaTypes)
      setActivityTypes(data.activityTypes)
      setBrandLogo(data.brandLogo || '')
      setBrandColor(data.brandColor || '#1a73e8')
      setTitle(data.title || '')
      setDescription(data.description || '')
    } catch (error) {
      // Timeline doesn't exist yet
      console.log('Timeline not configured yet')
    } finally {
      setIsLoading(false)
    }
  }

  const saveTimeline = async () => {
    setIsSaving(true)

    try {
      const settings = {
        isPublic,
        password: password || undefined,
        showAllMedia,
        mediaTypes,
        activityTypes,
        brandLogo: brandLogo || undefined,
        brandColor,
        title,
        description: description || undefined,
      }

      const response = await api.post(
        `/projects/${projectId}/timeline`,
        settings
      )
      setTimeline(response.data)
      alert('Timeline settings saved successfully!')
    } catch (error) {
      console.error('Failed to save timeline:', error)
      alert('Failed to save timeline settings')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteTimeline = async () => {
    if (
      !confirm(
        'Are you sure you want to delete the timeline? This will remove all timeline settings and analytics.'
      )
    ) {
      return
    }

    try {
      await api.delete(`/projects/${projectId}/timeline`)
      setTimeline(null)
      alert('Timeline deleted successfully')
    } catch (error) {
      console.error('Failed to delete timeline:', error)
      alert('Failed to delete timeline')
    }
  }

  const copyShareLink = () => {
    if (timeline?.shareUrl) {
      navigator.clipboard.writeText(timeline.shareUrl)
      alert('Timeline link copied to clipboard!')
    }
  }

  const toggleMediaType = (type: string) => {
    setMediaTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleActivityType = (type: string) => {
    setActivityTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Project Timeline</h1>
          {project && (
            <p className="text-muted-foreground mt-1">{project.name}</p>
          )}
        </div>
        {timeline && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={copyShareLink}
              title="Copy share link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Link
              href={timeline.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="icon" title="View timeline">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/projects/${projectId}/timeline/analytics`}>
              <Button variant="outline" size="icon" title="Analytics">
                <BarChart className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {timeline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Timeline is live!</p>
              <p className="text-sm text-blue-700 mt-1">
                Your timeline has been viewed {timeline.viewCount} times
              </p>
              <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Share link:</p>
                <p className="text-sm font-mono break-all">
                  {timeline.shareUrl}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Basic Settings */}
        <div className="bg-card rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Timeline Settings</h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Timeline Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter timeline title"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description for the timeline..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <Globe className="h-4 w-4" />
              <span className="text-sm">Make timeline public</span>
            </label>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Password Protection</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Optional password"
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Media Filters */}
        <div className="bg-card rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Media Filters
          </h3>

          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={showAllMedia}
                onChange={e => setShowAllMedia(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">
                Show all project media
              </span>
            </label>

            {!showAllMedia && (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Media Types</p>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mediaTypes.includes('PHOTO')}
                        onChange={() => toggleMediaType('PHOTO')}
                        className="rounded"
                      />
                      <span className="text-sm">Photos</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mediaTypes.includes('VIDEO')}
                        onChange={() => toggleMediaType('VIDEO')}
                        className="rounded"
                      />
                      <span className="text-sm">Videos</span>
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Activity Types</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'ERECTION',
                      'FABRICATION',
                      'DELIVERY',
                      'SAFETY',
                      'OTHER',
                    ].map(type => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={activityTypes.includes(type)}
                          onChange={() => toggleActivityType(type)}
                          className="rounded"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Branding */}
        <div className="bg-card rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold">Branding</h3>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">Brand Logo URL</span>
            </label>
            <input
              type="url"
              value={brandLogo}
              onChange={e => setBrandLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <Palette className="h-4 w-4" />
              <span className="text-sm font-medium">Brand Color</span>
            </label>
            <input
              type="color"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              className="w-full h-10 border rounded-md cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={saveTimeline} disabled={isSaving} className="flex-1">
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Timeline Settings
              </>
            )}
          </Button>
          {timeline && (
            <Button variant="destructive" onClick={deleteTimeline}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Timeline
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
