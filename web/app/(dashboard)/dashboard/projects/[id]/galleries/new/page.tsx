'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import {
  ArrowLeft,
  Image,
  Video,
  Check,
  Lock,
  Globe,
  Calendar,
  Palette,
  Upload,
  X,
} from 'lucide-react'
import Link from 'next/link'

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

export default function NewGalleryPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [media, setMedia] = useState<Media[]>([])
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Gallery settings
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState('')
  const [brandLogo, setBrandLogo] = useState('')
  const [brandColor, setBrandColor] = useState('#1a73e8')
  const [watermark, setWatermark] = useState(true)
  const [captions, setCaptions] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchMedia()
  }, [projectId])

  const fetchMedia = async () => {
    try {
      const response = await api.get(`/media/project/${projectId}`)
      setMedia(response.data.media)
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMediaSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMedia)
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId)
    } else {
      newSelection.add(mediaId)
    }
    setSelectedMedia(newSelection)
  }

  const selectAll = () => {
    setSelectedMedia(new Set(media.map(m => m.id)))
  }

  const deselectAll = () => {
    setSelectedMedia(new Set())
  }

  const createGallery = async () => {
    if (!name.trim()) {
      alert('Please enter a gallery name')
      return
    }

    if (selectedMedia.size === 0) {
      alert('Please select at least one photo or video')
      return
    }

    setIsCreating(true)

    try {
      const settings: any = {
        isPublic,
        watermark,
        captions,
      }

      if (password) settings.password = password
      if (brandLogo) settings.brandLogo = brandLogo
      if (brandColor) settings.brandColor = brandColor
      if (expiresIn) {
        const days = parseInt(expiresIn)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + days)
        settings.expiresAt = expiresAt.toISOString()
      }

      const response = await api.post('/galleries', {
        projectId,
        name,
        description,
        mediaIds: Array.from(selectedMedia),
        settings,
      })

      router.push(`/dashboard/projects/${projectId}/galleries`)
    } catch (error) {
      console.error('Failed to create gallery:', error)
      alert('Failed to create gallery')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/projects/${projectId}/galleries`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Gallery</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select Media</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {selectedMedia.size} of {media.length} items selected
            </p>

            {media.length === 0 ? (
              <div className="text-center py-12">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No media in this project yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {media.map(item => (
                  <div
                    key={item.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedMedia.has(item.id)
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => toggleMediaSelection(item.id)}
                  >
                    <div className="aspect-square bg-gray-100">
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
                    </div>

                    {selectedMedia.has(item.id) && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white truncate">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Settings */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold">Gallery Settings</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Gallery Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Week 1 Progress"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a description for the gallery..."
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
                <span className="text-sm">Make gallery public</span>
              </label>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Password Protection
                  </span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Optional password"
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Expiration</span>
                </label>
                <select
                  value={expiresIn}
                  onChange={e => setExpiresIn(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Never expire</option>
                  <option value="7">Expire in 7 days</option>
                  <option value="30">Expire in 30 days</option>
                  <option value="90">Expire in 90 days</option>
                </select>
              </div>
            </div>
          </div>

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

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={watermark}
                onChange={e => setWatermark(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Add watermark to images</span>
            </label>
          </div>

          <Button
            onClick={createGallery}
            disabled={isCreating || selectedMedia.size === 0}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Gallery'}
          </Button>
        </div>
      </div>
    </div>
  )
}
