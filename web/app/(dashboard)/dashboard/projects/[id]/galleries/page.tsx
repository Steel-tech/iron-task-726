'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import {
  Plus,
  Share2,
  Eye,
  Trash2,
  Edit,
  Copy,
  Lock,
  Calendar,
  BarChart,
  ExternalLink,
} from 'lucide-react'
import NextLink from 'next/link'

interface Gallery {
  id: string
  name: string
  description: string | null
  shareToken: string
  shareUrl: string
  isPublic: boolean
  password: boolean
  expiresAt: string | null
  viewCount: number
  createdAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count: {
    items: number
    views: number
  }
}

export default function ProjectGalleriesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    fetchGalleries()
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data)
    } catch (error) {
      console.error('Failed to fetch project:', error)
    }
  }

  const fetchGalleries = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/galleries`)
      setGalleries(response.data.galleries)
    } catch (error) {
      console.error('Failed to fetch galleries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteGallery = async (galleryId: string) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return

    try {
      await api.delete(`/galleries/${galleryId}`)
      await fetchGalleries()
    } catch (error) {
      console.error('Failed to delete gallery:', error)
      alert('Failed to delete gallery')
    }
  }

  const copyShareLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Galleries</h1>
          {project && (
            <p className="text-muted-foreground mt-1">{project.name}</p>
          )}
        </div>
        <NextLink href={`/dashboard/projects/${projectId}/galleries/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Gallery
          </Button>
        </NextLink>
      </div>

      {galleries.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-4">No galleries yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Create galleries to share curated collections of photos and videos
            with clients
          </p>
          <NextLink href={`/dashboard/projects/${projectId}/galleries/new`}>
            <Button>Create your first gallery</Button>
          </NextLink>
        </div>
      ) : (
        <div className="grid gap-6">
          {galleries.map(gallery => (
            <div key={gallery.id} className="bg-card rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{gallery.name}</h3>
                  {gallery.description && (
                    <p className="text-muted-foreground">
                      {gallery.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{gallery._count.items} items</span>
                    <span>•</span>
                    <span>{gallery._count.views} views</span>
                    <span>•</span>
                    <span>
                      Created {new Date(gallery.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyShareLink(gallery.shareUrl)}
                    title="Copy share link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <NextLink
                    href={gallery.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="icon" title="View gallery">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </NextLink>
                  <NextLink
                    href={`/dashboard/projects/${projectId}/galleries/${gallery.id}/analytics`}
                  >
                    <Button variant="outline" size="icon" title="Analytics">
                      <BarChart className="h-4 w-4" />
                    </Button>
                  </NextLink>
                  <NextLink
                    href={`/dashboard/projects/${projectId}/galleries/${gallery.id}/edit`}
                  >
                    <Button variant="outline" size="icon" title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </NextLink>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteGallery(gallery.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  {gallery.isPublic ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Private</span>
                    </>
                  )}
                </div>
                {gallery.password && (
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    <span>Password protected</span>
                  </div>
                )}
                {gallery.expiresAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Expires {new Date(gallery.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1">
                  Share link:
                </p>
                <p className="text-sm font-mono break-all">
                  {gallery.shareUrl}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
