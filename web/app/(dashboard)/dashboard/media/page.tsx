'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/use-toast'
import {
  Image,
  Video,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  MapPin,
  Tag,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Loader2,
  Trash2,
  Edit2,
  Share2,
  Plus,
  Hash,
  Palette,
} from 'lucide-react'
import {
  MediaGalleryIcon,
  WeldingTorchIcon,
  PencilRulerIcon,
} from '@/components/icons/SteelConstructionIcons'
import VideoGalleryViewer from '@/components/VideoGalleryViewer'
import VideoPlayer from '@/components/VideoPlayer'
import VideoPlayerErrorDemo from '@/components/VideoPlayerErrorDemo'
import PhotoAnnotator from '@/components/PhotoAnnotator'
import MediaTagger from '@/components/MediaTagger'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Media {
  id: string
  fileUrl: string
  thumbnailUrl: string | null
  mediaType: 'PHOTO' | 'VIDEO' | 'DUAL_VIDEO'
  timestamp: string
  activityType: string
  location: string | null
  notes: string | null
  tags: string[]
  fileSize: number
  width: number | null
  height: number | null
  duration: number | null
  latitude: number | null
  longitude: number | null
  address: string | null
  project: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
  }
  _count: {
    views: number
  }
  mediaTags?: Array<{
    id: string
    tag: {
      id: string
      name: string
      color: string
      category?: string
    }
  }>
}

interface Project {
  id: string
  name: string
}

interface TagType {
  id: string
  name: string
  slug: string
  color: string
  description?: string
  category?: string
  isSystem: boolean
  _count: {
    mediaTags: number
  }
  createdBy: {
    id: string
    name: string
  }
}

const TAG_CATEGORIES = [
  'Material',
  'Location',
  'Status',
  'Trade',
  'Equipment',
  'Safety',
  'Quality',
  'Other',
]

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6B7280', // Gray
]

// Demo media data for video components demo
const demoMedia = [
  {
    id: '1',
    fileUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200?text=Video+1',
    mediaType: 'VIDEO' as const,
    timestamp: new Date().toISOString(),
    activityType: 'ERECTION',
    location: 'Bay 3, Level 2',
    notes: 'Steel beam installation progress',
    tags: ['welding', 'beam', 'safety'],
    fileSize: 5242880,
    width: 1920,
    height: 1080,
    duration: 60,
    project: {
      id: '1',
      name: 'Downtown Tower',
    },
    user: {
      id: '1',
      name: 'John Steel',
    },
  },
  {
    id: '2',
    fileUrl: 'https://via.placeholder.com/1920x1080?text=Construction+Photo+1',
    thumbnailUrl: 'https://via.placeholder.com/300x200?text=Photo+1',
    mediaType: 'PHOTO' as const,
    timestamp: new Date().toISOString(),
    activityType: 'FABRICATION',
    location: 'Shop Floor',
    notes: 'Fabrication progress',
    tags: ['fabrication', 'steel'],
    fileSize: 2097152,
    width: 1920,
    height: 1080,
    project: {
      id: '1',
      name: 'Downtown Tower',
    },
    user: {
      id: '2',
      name: 'Mike Welder',
    },
  },
  {
    id: '3',
    fileUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200?text=Video+2',
    mediaType: 'VIDEO' as const,
    timestamp: new Date().toISOString(),
    activityType: 'SAFETY',
    location: 'Site Entrance',
    notes: 'Safety inspection video',
    tags: ['safety', 'inspection'],
    fileSize: 10485760,
    width: 1920,
    height: 1080,
    duration: 120,
    project: {
      id: '2',
      name: 'Bridge Project',
    },
    user: {
      id: '3',
      name: 'Sarah Safety',
    },
  },
]

// Demo images for annotator
const demoImages = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2000',
    title: 'Steel Beam Installation - Level 3',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2000',
    title: 'Construction Site Overview',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?q=80&w=2000',
    title: 'Welding Process Documentation',
  },
]

export default function MediaPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  // Tab state
  const [activeTab, setActiveTab] = useState<
    'gallery' | 'tags' | 'video-demo' | 'annotator'
  >('gallery')

  // Media state
  const [media, setMedia] = useState<Media[]>([])
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [editingMediaTags, setEditingMediaTags] = useState<Media | null>(null)
  const [showDemoGallery, setShowDemoGallery] = useState(false)

  // Annotator state
  const [selectedImage, setSelectedImage] = useState<any>(demoImages[0])
  const [savedAnnotations, setSavedAnnotations] = useState<any[]>([])
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(projectId || '')
  const [selectedActivityType, setSelectedActivityType] = useState('')
  const [selectedMediaType, setSelectedMediaType] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 24

  // Tags state
  const [tags, setTags] = useState<TagType[]>([])
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>('all')
  const [showCreateTagDialog, setShowCreateTagDialog] = useState(false)
  const [showEditTagDialog, setShowEditTagDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)

  // Tag form state
  const [tagFormData, setTagFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
    category: '',
    isSystem: false,
  })

  const canManageTags =
    user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER'
  const canDeleteTags = user?.role === 'ADMIN'

  useEffect(() => {
    fetchProjects()
    if (activeTab === 'gallery') {
      fetchMedia()
    } else if (activeTab === 'tags') {
      fetchTags()
    }
    // video-demo tab doesn't need to fetch data as it uses static demo data
  }, [page, selectedProject, activeTab, selectedTagCategory])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchMedia = async () => {
    try {
      setIsLoading(true)
      let url = `/media?page=${page}&limit=${itemsPerPage}`
      if (selectedProject) {
        url = `/media/project/${selectedProject}?page=${page}&limit=${itemsPerPage}`
      }

      const response = await api.get(url)
      setMedia(response.data.media || response.data)
      setFilteredMedia(response.data.media || response.data)

      if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages)
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      setIsLoading(true)
      const params =
        selectedTagCategory !== 'all' ? `?category=${selectedTagCategory}` : ''
      const response = await api.get(`/tags${params}`)
      setTags(response.data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Apply filters
    let filtered = [...media]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        item =>
          item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some(tag =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          item.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Activity type filter
    if (selectedActivityType) {
      filtered = filtered.filter(
        item => item.activityType === selectedActivityType
      )
    }

    // Media type filter
    if (selectedMediaType) {
      filtered = filtered.filter(item => item.mediaType === selectedMediaType)
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        item.mediaTags?.some(mt => selectedTags.includes(mt.tag.id))
      )
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(
        item => new Date(item.timestamp) >= new Date(dateRange.start)
      )
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        item => new Date(item.timestamp) <= new Date(dateRange.end)
      )
    }

    setFilteredMedia(filtered)
  }, [
    searchQuery,
    selectedActivityType,
    selectedMediaType,
    selectedTags,
    dateRange,
    media,
  ])

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return

    try {
      await api.delete(`/media/${mediaId}`)
      setMedia(prev => prev.filter(m => m.id !== mediaId))
      setSelectedMedia(null)
    } catch (error) {
      console.error('Failed to delete media:', error)
      alert('Failed to delete media')
    }
  }

  const handleCreateTag = async () => {
    try {
      const response = await api.post('/tags', tagFormData)
      setTags([...tags, response.data])
      setShowCreateTagDialog(false)
      resetTagForm()
      toast({
        title: 'Success',
        description: 'Tag created successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create tag',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag) return

    try {
      const response = await api.patch(`/tags/${editingTag.id}`, tagFormData)
      setTags(tags.map(tag => (tag.id === editingTag.id ? response.data : tag)))
      setShowEditTagDialog(false)
      setEditingTag(null)
      resetTagForm()
      toast({
        title: 'Success',
        description: 'Tag updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update tag',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    try {
      await api.delete(`/tags/${tagId}`)
      setTags(tags.filter(tag => tag.id !== tagId))
      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete tag',
        variant: 'destructive',
      })
    }
  }

  const resetTagForm = () => {
    setTagFormData({
      name: '',
      color: '#3B82F6',
      description: '',
      category: '',
      isSystem: false,
    })
  }

  const openEditTagDialog = (tag: TagType) => {
    setEditingTag(tag)
    setTagFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
      category: tag.category || '',
      isSystem: tag.isSystem,
    })
    setShowEditTagDialog(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnnotationSave = (annotations: any[], imageDataUrl: string) => {
    setSavedAnnotations(annotations)
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)

    // In a real app, you would save to API here
    console.log('Saved annotations:', annotations)
    console.log('Annotated image data URL length:', imageDataUrl.length)
  }

  const groupedTags = tags.reduce(
    (acc, tag) => {
      const category = tag.category || 'Other'
      if (!acc[category]) acc[category] = []
      acc[category].push(tag)
      return acc
    },
    {} as Record<string, TagType[]>
  )

  const renderGalleryView = () => (
    <>
      {/* Search and Filters */}
      <div className="brushed-metal rounded-lg shadow-lg p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by notes, location, tags, or user..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select
                value={selectedProject}
                onChange={e => {
                  setSelectedProject(e.target.value)
                  setPage(1)
                }}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Activity Type
              </label>
              <select
                value={selectedActivityType}
                onChange={e => setSelectedActivityType(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">All Activities</option>
                <option value="ERECTION">Erection</option>
                <option value="FABRICATION">Fabrication</option>
                <option value="DELIVERY">Delivery</option>
                <option value="SAFETY">Safety</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Media Type
              </label>
              <select
                value={selectedMediaType}
                onChange={e => setSelectedMediaType(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="PHOTO">Photos</option>
                <option value="VIDEO">Videos</option>
                <option value="DUAL_VIDEO">Dual Videos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <Select
                value={selectedTags.join(',')}
                onValueChange={value =>
                  setSelectedTags(value ? value.split(',') : [])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by tags" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e =>
                    setDateRange(prev => ({ ...prev, start: e.target.value }))
                  }
                  className="flex-1 p-2 border rounded-md text-sm"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e =>
                    setDateRange(prev => ({ ...prev, end: e.target.value }))
                  }
                  className="flex-1 p-2 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400">
        Showing {filteredMedia.length} of {media.length} items
      </div>

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 brushed-metal rounded-lg">
          <MediaGalleryIcon
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
            size={48}
          />
          <p className="text-lg text-gray-300">No media found</p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your filters or search criteria
          </p>
          <Link href="/dashboard/capture">
            <Button className="mt-4">
              <WeldingTorchIcon className="h-4 w-4 mr-2" />
              Capture Media
            </Button>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map(item => (
            <div
              key={item.id}
              className="group relative bg-card rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="aspect-square bg-gray-100 relative">
                {item.mediaType === 'VIDEO' ||
                item.mediaType === 'DUAL_VIDEO' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-8 w-8 text-gray-400" />
                    {item.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </div>
                ) : (
                  <img
                    src={item.thumbnailUrl || item.fileUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Tags on thumbnail */}
                {item.mediaTags && item.mediaTags.length > 0 && (
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-1rem)]">
                    {item.mediaTags.slice(0, 3).map(mt => (
                      <div
                        key={mt.id}
                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: mt.tag.color,
                          color: '#fff',
                        }}
                      >
                        {mt.tag.name}
                      </div>
                    ))}
                    {item.mediaTags.length > 3 && (
                      <div className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-600 text-white">
                        +{item.mediaTags.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-xs truncate">
                    {item.location || 'No location'}
                  </p>
                  <p className="text-xs opacity-75">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30"
                    onClick={e => {
                      e.stopPropagation()
                      setEditingMediaTags(item)
                    }}
                  >
                    <Tag className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded px-2 py-1 text-xs font-medium">
                  {formatFileSize(item.fileSize)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="brushed-metal rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Preview</th>
                <th className="text-left p-4 text-sm font-medium">Details</th>
                <th className="text-left p-4 text-sm font-medium">Tags</th>
                <th className="text-left p-4 text-sm font-medium">Project</th>
                <th className="text-left p-4 text-sm font-medium">User</th>
                <th className="text-left p-4 text-sm font-medium">Date</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedia.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      {item.mediaType === 'VIDEO' ||
                      item.mediaType === 'DUAL_VIDEO' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={item.thumbnailUrl || item.fileUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-sm">{item.activityType}</p>
                    <p className="text-xs text-gray-500">
                      {item.location || 'No location'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(item.fileSize)}
                    </p>
                  </td>
                  <td className="p-4">
                    <MediaTagger
                      mediaId={item.id}
                      initialTags={item.mediaTags || []}
                      compact={true}
                    />
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{item.project.name}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{item.user.name}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedMedia(item)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          setEditingMediaTags(item)
                        }}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          handleDelete(item.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  )

  const renderTagsView = () => (
    <>
      {/* Tag Management Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-white">Tag Management</h2>
        </div>
        {canManageTags && (
          <Button
            onClick={() => setShowCreateTagDialog(true)}
            className="bg-safety-orange hover:bg-safety-orange/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="brushed-metal rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-400">
            Filter by category:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTagCategory('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTagCategory === 'all'
                  ? 'bg-safety-orange text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Categories
            </button>
            {TAG_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedTagCategory(category)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTagCategory === category
                    ? 'bg-safety-orange text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety-orange mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTags).map(([category, categoryTags]) => (
            <div
              key={category}
              className="brushed-metal rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-safety-orange" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryTags.map(tag => (
                  <div
                    key={tag.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <h3 className="font-medium text-white">{tag.name}</h3>
                      </div>
                      {tag.isSystem && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                          System
                        </span>
                      )}
                    </div>

                    {tag.description && (
                      <p className="text-sm text-gray-400 mb-2">
                        {tag.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {tag._count.mediaTags} uses
                      </span>

                      {canManageTags && !tag.isSystem && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditTagDialog(tag)}
                            className="h-8 w-8 text-gray-400 hover:text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {canDeleteTags && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTag(tag.id)}
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  const renderVideoDemoView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">
          Video Components Demo
        </h2>
        <Button
          onClick={() => setShowDemoGallery(true)}
          className="bg-safety-orange hover:bg-orange-700"
        >
          <Grid className="h-4 w-4 mr-2" />
          Open Gallery Viewer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standard Video Player */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">
            Standard Video Player
          </h3>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              poster="https://via.placeholder.com/800x450?text=Video+Poster"
              title="Steel Beam Installation - Bay 3"
              className="w-full aspect-video"
            />
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-white mb-2">Features:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Custom controls with safety orange theme</li>
                <li>Playback speed control</li>
                <li>Volume control with mute</li>
                <li>Full screen support</li>
                <li>Skip forward/backward 10 seconds</li>
                <li>Download and share buttons</li>
                <li>Progress bar with buffering indicator</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Picture-in-Picture Video Player */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">
            Dual Camera (Picture-in-Picture)
          </h3>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
              secondarySrc="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              isPictureInPicture={true}
              title="Welding Process - Front & Back View"
              className="w-full aspect-video"
            />
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-white mb-2">Features:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Synchronized dual video playback</li>
                <li>Click PiP window to change position</li>
                <li>Both videos stay in sync during seek</li>
                <li>Perfect for safety documentation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Auto-play Video */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">
            Auto-play Loop Video
          </h3>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              autoPlay={true}
              muted={true}
              loop={true}
              showDownload={false}
              showShare={false}
              title="Safety Demonstration Loop"
              className="w-full aspect-video"
            />
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-white mb-2">Perfect for:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Safety training videos on repeat</li>
                <li>Site entrance displays</li>
                <li>Training room presentations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Video with Error Handling */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">
            Error Handling Demo
          </h3>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayerErrorDemo />
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-white mb-2">Error Handling Features:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Graceful error state with icon and message</li>
                <li>Error callback for custom handling</li>
                <li>Maintains aspect ratio even on error</li>
                <li>Clear user feedback about the issue</li>
                <li>Toggle between error and success states</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">
          Video Gallery Viewer Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-white">Navigation</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Arrow keys to navigate between items</li>
              <li>• Click thumbnails at bottom to jump to specific media</li>
              <li>• Swipe gestures on touch devices</li>
              <li>• Escape key to close</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-white">Video Controls</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Space bar to play/pause</li>
              <li>• M key to mute/unmute</li>
              <li>• F key for fullscreen</li>
              <li>• I key to toggle info panel</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-white">Features</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Mixed photo and video support</li>
              <li>• Detailed metadata display</li>
              <li>• Download individual items</li>
              <li>• Share functionality</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-white">Mobile Support</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Touch-friendly controls</li>
              <li>• Responsive layout</li>
              <li>• Auto-hide controls</li>
              <li>• Pinch to zoom on photos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAnnotatorView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">
          Photo Annotator Demo
        </h2>
      </div>

      {/* Info Box */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Annotation Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-white mb-2">Drawing Tools</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Arrows for pointing out issues</li>
              <li>• Circles to highlight areas</li>
              <li>• Rectangles for boxing sections</li>
              <li>• Text annotations</li>
              <li>• Measurement lines with labels</li>
              <li>• Company logo placement</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Safety Colors</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Safety Orange for warnings</li>
              <li>• Arc Yellow for attention</li>
              <li>• AISC Blue for info</li>
              <li>• Safety Green for approved</li>
              <li>• Alert Red for critical</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Features</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Undo/Redo support</li>
              <li>• Adjustable line thickness</li>
              <li>• Save annotated images</li>
              <li>• Download to device</li>
              <li>• Clear all annotations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Image Selection */}
      <div className="brushed-metal rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4">
          Select Demo Image
        </h3>
        <div className="flex gap-4">
          {demoImages.map(image => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className={`relative overflow-hidden rounded-lg transition-all ${
                selectedImage.id === image.id
                  ? 'ring-2 ring-safety-orange scale-105'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-32 h-24 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                {image.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      {showSaveSuccess && (
        <div className="rounded-md bg-green-900/20 border border-green-800 p-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-400">
              Annotations saved successfully! {savedAnnotations.length}{' '}
              annotation{savedAnnotations.length !== 1 ? 's' : ''} added.
            </p>
          </div>
        </div>
      )}

      {/* Photo Annotator */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {selectedImage.title}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <X className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
        </div>

        <PhotoAnnotator
          imageUrl={selectedImage.url}
          onSave={handleAnnotationSave}
          autoEditMode={false}
        />
      </div>

      {/* Instructions */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Try It Out!</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <p>1. Select a tool from the toolbar above the image</p>
          <p>2. Choose your annotation color (safety orange is pre-selected)</p>
          <p>3. Click and drag on the image to create annotations</p>
          <p>4. For text annotations, click where you want the text and type</p>
          <p>5. Use the measurement tool to show dimensions</p>
          <p>6. Add your company logo with the hard hat icon</p>
          <p>7. Save your annotated image or download it directly</p>
        </div>
      </div>
    </div>
  )

  if (isLoading && (activeTab === 'gallery' || activeTab === 'tags')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MediaGalleryIcon className="h-8 w-8 text-safety-orange" size={32} />
          <h1 className="text-3xl font-bold font-shogun text-white">
            Media & Tags
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'gallery' && (
            <>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'gallery'
                ? 'border-safety-orange text-safety-orange'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <MediaGalleryIcon className="h-5 w-5" />
              Media Gallery
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tags'
                ? 'border-safety-orange text-safety-orange'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tag Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab('video-demo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'video-demo'
                ? 'border-safety-orange text-safety-orange'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Components Demo
            </div>
          </button>
          <button
            onClick={() => setActiveTab('annotator')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'annotator'
                ? 'border-safety-orange text-safety-orange'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <PencilRulerIcon className="h-5 w-5" />
              Photo Annotator
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'gallery'
        ? renderGalleryView()
        : activeTab === 'tags'
          ? renderTagsView()
          : activeTab === 'video-demo'
            ? renderVideoDemoView()
            : renderAnnotatorView()}

      {/* Media Gallery Viewer */}
      {selectedMedia && (
        <VideoGalleryViewer
          media={filteredMedia}
          initialIndex={filteredMedia.findIndex(m => m.id === selectedMedia.id)}
          onClose={() => setSelectedMedia(null)}
          title={
            selectedProject
              ? projects.find(p => p.id === selectedProject)?.name || 'Unknown Project'
              : 'All Media'
          }
          subtitle={`${filteredMedia.length} items`}
          showInfo={true}
          allowDownload={true}
          allowShare={true}
        />
      )}

      {/* Demo Gallery Viewer */}
      {showDemoGallery && (
        <VideoGalleryViewer
          media={demoMedia}
          initialIndex={0}
          onClose={() => setShowDemoGallery(false)}
          title="Construction Progress Gallery"
          subtitle="Mixed media gallery with photos and videos"
        />
      )}

      {/* Edit Media Tags Dialog */}
      {editingMediaTags && (
        <Dialog
          open={!!editingMediaTags}
          onOpenChange={() => setEditingMediaTags(null)}
        >
          <DialogContent className="bg-steel-gray border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Media Tags</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <MediaTagger
                mediaId={editingMediaTags.id}
                initialTags={editingMediaTags.mediaTags || []}
                onTagsUpdate={updatedTags => {
                  // Update the media item with new tags
                  setMedia(
                    media.map(m =>
                      m.id === editingMediaTags.id
                        ? { ...m, mediaTags: updatedTags }
                        : m
                    )
                  )
                  setEditingMediaTags(null)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Tag Dialog */}
      <Dialog open={showCreateTagDialog} onOpenChange={setShowCreateTagDialog}>
        <DialogContent className="bg-steel-gray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={tagFormData.name}
                onChange={e =>
                  setTagFormData({ ...tagFormData, name: e.target.value })
                }
                placeholder="Enter tag name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-white">
                Category
              </Label>
              <Select
                value={tagFormData.category}
                onValueChange={value =>
                  setTagFormData({ ...tagFormData, category: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {TAG_CATEGORIES.map(category => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-white"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color" className="text-white">
                Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={tagFormData.color}
                  onChange={e =>
                    setTagFormData({ ...tagFormData, color: e.target.value })
                  }
                  className="w-20 h-10 bg-gray-800 border-gray-700"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setTagFormData({ ...tagFormData, color })}
                      className="w-8 h-8 rounded hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={tagFormData.description}
                onChange={e =>
                  setTagFormData({
                    ...tagFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter tag description"
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTagDialog(false)
                  resetTagForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTag}
                disabled={!tagFormData.name}
                className="bg-safety-orange hover:bg-safety-orange/90"
              >
                Create Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={showEditTagDialog} onOpenChange={setShowEditTagDialog}>
        <DialogContent className="bg-steel-gray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-white">
                Name
              </Label>
              <Input
                id="edit-name"
                value={tagFormData.name}
                onChange={e =>
                  setTagFormData({ ...tagFormData, name: e.target.value })
                }
                placeholder="Enter tag name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="edit-category" className="text-white">
                Category
              </Label>
              <Select
                value={tagFormData.category}
                onValueChange={value =>
                  setTagFormData({ ...tagFormData, category: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {TAG_CATEGORIES.map(category => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-white"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-color" className="text-white">
                Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={tagFormData.color}
                  onChange={e =>
                    setTagFormData({ ...tagFormData, color: e.target.value })
                  }
                  className="w-20 h-10 bg-gray-800 border-gray-700"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setTagFormData({ ...tagFormData, color })}
                      className="w-8 h-8 rounded hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-white">
                Description (Optional)
              </Label>
              <Textarea
                id="edit-description"
                value={tagFormData.description}
                onChange={e =>
                  setTagFormData({
                    ...tagFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter tag description"
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditTagDialog(false)
                  setEditingTag(null)
                  resetTagForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTag}
                disabled={!tagFormData.name}
                className="bg-safety-orange hover:bg-safety-orange/90"
              >
                Update Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
