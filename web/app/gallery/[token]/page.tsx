'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Image as ImageIcon, Video, Lock, Calendar, Eye, Download, X } from 'lucide-react'

interface GalleryItem {
  id: string
  order: number
  caption: string | null
  media: {
    id: string
    fileUrl: string
    thumbnailUrl: string | null
    mediaType: 'PHOTO' | 'VIDEO' | 'DUAL_VIDEO'
    width: number | null
    height: number | null
    duration: number | null
    timestamp: string
    location: string | null
    notes: string | null
  }
}

interface Gallery {
  id: string
  name: string
  description: string | null
  projectName: string
  brandLogo: string | null
  brandColor: string | null
  watermark: boolean
  items: GalleryItem[]
  viewCount: number
}

export default function PublicGalleryPage() {
  const params = useParams()
  const shareToken = params.token as string
  
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  useEffect(() => {
    fetchGallery()
  }, [shareToken])

  const fetchGallery = async (withPassword?: string) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/public/gallery/${shareToken}${
        withPassword ? `?password=${encodeURIComponent(withPassword)}` : ''
      }`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401 && data.error === 'Password required') {
          setShowPasswordPrompt(true)
          setIsLoading(false)
          return
        }
        throw new Error(data.error || 'Failed to load gallery')
      }
      
      setGallery(data)
      setError(null)
      setShowPasswordPrompt(false)
      
      // Apply brand color if provided
      if (data.brandColor) {
        document.documentElement.style.setProperty('--brand-color', data.brandColor)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    fetchGallery(password)
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      link.click()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Gallery Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Password Required</h1>
            <p className="text-gray-600 mt-2">This gallery is password protected</p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full p-3 border rounded-lg mb-4"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Gallery
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!gallery) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              {gallery.brandLogo && (
                <img 
                  src={gallery.brandLogo} 
                  alt="Brand" 
                  className="h-12 mb-4"
                  style={{ maxHeight: '48px' }}
                />
              )}
              <h1 className="text-3xl font-bold">{gallery.name}</h1>
              {gallery.description && (
                <p className="text-gray-600 mt-2">{gallery.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {gallery.projectName} • {gallery.items.length} items
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>{gallery.viewCount} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gallery.items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => setSelectedItem(item)}
            >
              <div className="aspect-square bg-gray-100">
                {item.media.mediaType === 'VIDEO' || item.media.mediaType === 'DUAL_VIDEO' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                    {item.media.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {Math.floor(item.media.duration / 60)}:{(item.media.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                ) : (
                  <img
                    src={item.media.thumbnailUrl || item.media.fileUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Watermark */}
                {gallery.watermark && (
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    Iron Task
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {item.caption && (
                  <p className="text-sm text-gray-700 mb-2">{item.caption}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(item.media.timestamp).toLocaleDateString()}</span>
                  {item.media.location && (
                    <span className="truncate ml-2">{item.media.location}</span>
                  )}
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden">
              {selectedItem.media.mediaType === 'VIDEO' || selectedItem.media.mediaType === 'DUAL_VIDEO' ? (
                <video
                  src={selectedItem.media.fileUrl}
                  controls
                  autoPlay
                  className="w-full"
                  style={{ maxHeight: '80vh' }}
                />
              ) : (
                <img
                  src={selectedItem.media.fileUrl}
                  alt=""
                  className="w-full"
                  style={{ maxHeight: '80vh', objectFit: 'contain' }}
                />
              )}
              
              <div className="p-4">
                {selectedItem.caption && (
                  <p className="text-lg mb-2">{selectedItem.caption}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(selectedItem.media.timestamp).toLocaleString()}</span>
                  <button
                    onClick={() => downloadImage(
                      selectedItem.media.fileUrl,
                      `gallery-${selectedItem.media.id}.${selectedItem.media.mediaType === 'VIDEO' ? 'mp4' : 'jpg'}`
                    )}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}