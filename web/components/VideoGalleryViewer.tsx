'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Share2,
  Info,
  Image as ImageIcon,
  Video,
  Loader2,
  AlertCircle,
  Edit2,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/Button'
import PhotoAnnotatorModal from '@/components/PhotoAnnotatorModal'
import Comments from '@/components/Comments'
import MediaTagger from '@/components/MediaTagger'

interface MediaItem {
  id: string
  fileUrl: string
  thumbnailUrl?: string | null
  mediaType: 'PHOTO' | 'VIDEO' | 'DUAL_VIDEO'
  timestamp: string
  activityType: string
  location?: string | null
  notes?: string | null
  tags: string[]
  mediaTags?: Array<{
    id: string
    tag: {
      id: string
      name: string
      color: string
      category?: string
    }
  }>
  fileSize: number
  width?: number | null
  height?: number | null
  duration?: number | null
  project?: {
    id: string
    name: string
  }
  user?: {
    id: string
    name: string
  }
}

interface VideoGalleryViewerProps {
  media: MediaItem[]
  initialIndex?: number
  onClose?: () => void
  showInfo?: boolean
  allowDownload?: boolean
  allowShare?: boolean
  title?: string
  subtitle?: string
}

export default function VideoGalleryViewer({
  media,
  initialIndex = 0,
  onClose,
  showInfo = true,
  allowDownload = true,
  allowShare = true,
  title,
  subtitle,
}: VideoGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showAnnotator, setShowAnnotator] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentMedia = media[currentIndex]
  const isVideo =
    currentMedia?.mediaType === 'VIDEO' ||
    currentMedia?.mediaType === 'DUAL_VIDEO'

  // Reset states when media changes
  useEffect(() => {
    setIsPlaying(false)
    setIsLoading(true)
    setError(null)
    setCurrentTime(0)
    setDuration(0)
  }, [currentIndex])

  // Auto-hide controls
  useEffect(() => {
    const hideControls = () => {
      if (isPlaying && !showInfoPanel) {
        setShowControls(false)
      }
    }

    const showControlsTemporarily = () => {
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(hideControls, 3000)
    }

    if (isVideo) {
      showControlsTemporarily()
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying, isVideo, showInfoPanel])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          navigateTo(currentIndex - 1)
          break
        case 'ArrowRight':
          navigateTo(currentIndex + 1)
          break
        case ' ':
          e.preventDefault()
          if (isVideo) togglePlayPause()
          break
        case 'Escape':
          onClose?.()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          if (isVideo) setIsMuted(!isMuted)
          break
        case 'i':
          setShowInfoPanel(!showInfoPanel)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, isVideo, isMuted, showInfoPanel])

  const navigateTo = (index: number) => {
    if (index >= 0 && index < media.length) {
      setCurrentIndex(index)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleVideoError = () => {
    setError('Failed to load video')
    setIsLoading(false)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
    }
    setIsMuted(vol === 0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(currentMedia.fileUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentMedia.project?.name || 'media'}_${currentMedia.timestamp}.${currentMedia.mediaType === 'VIDEO' ? 'mp4' : 'jpg'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  if (!currentMedia) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Header */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-white text-xl font-bold">{title}</h2>
              )}
              {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {showInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className="text-white hover:bg-white/20"
                >
                  <Info className="h-5 w-5" />
                </Button>
              )}
              {allowShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              )}
              {allowDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowComments(!showComments)}
                className="text-white hover:bg-white/20"
                title="Comments"
              >
                <MessageCircle className="h-5 w-5" />
                {showComments && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-safety-orange rounded-full" />
                )}
              </Button>
              {!isVideo && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAnnotator(true)}
                  className="text-white hover:bg-white/20"
                  title="Edit photo"
                >
                  <Edit2 className="h-5 w-5" />
                </Button>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous button */}
        {currentIndex > 0 && showControls && (
          <button
            onClick={() => navigateTo(currentIndex - 1)}
            className="absolute left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Media display */}
        <div className="relative max-w-full max-h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4 text-white">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {!error &&
            (isVideo ? (
              <video
                ref={videoRef}
                src={currentMedia.fileUrl}
                className="max-w-full max-h-[80vh]"
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onError={handleVideoError}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
              />
            ) : (
              <img
                src={currentMedia.fileUrl}
                alt=""
                className="max-w-full max-h-[80vh] object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => setError('Failed to load image')}
              />
            ))}
        </div>

        {/* Next button */}
        {currentIndex < media.length - 1 && showControls && (
          <button
            onClick={() => navigateTo(currentIndex + 1)}
            className="absolute right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Video controls */}
      {isVideo && showControls && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="flex items-center gap-2 text-white text-sm">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fff ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 0%)`,
                }}
              />
              <span>{formatTime(duration)}</span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateTo(currentIndex + 1)}
                  disabled={currentIndex === media.length - 1}
                  className="text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>

                {/* Volume controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #fff ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 0%)`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail strip */}
      {showControls && media.length > 1 && (
        <div className="absolute bottom-20 left-0 right-0 p-4">
          <div className="flex gap-2 overflow-x-auto py-2">
            {media.map((item, index) => (
              <button
                key={item.id}
                onClick={() => navigateTo(index)}
                className={`relative flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {item.mediaType === 'VIDEO' ||
                item.mediaType === 'DUAL_VIDEO' ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={item.thumbnailUrl || item.fileUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info panel */}
      {showInfoPanel && (
        <div className="absolute top-0 right-0 h-full w-80 bg-black/90 p-4 overflow-y-auto">
          <div className="space-y-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Media Information</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfoPanel(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/70">Type</p>
                <p className="flex items-center gap-2">
                  {isVideo ? (
                    <>
                      <Video className="h-4 w-4" /> Video
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" /> Photo
                    </>
                  )}
                </p>
              </div>

              {currentMedia.project && (
                <div>
                  <p className="text-white/70">Project</p>
                  <p>{currentMedia.project.name}</p>
                </div>
              )}

              <div>
                <p className="text-white/70">Activity</p>
                <p>{currentMedia.activityType}</p>
              </div>

              {currentMedia.location && (
                <div>
                  <p className="text-white/70">Location</p>
                  <p>{currentMedia.location}</p>
                </div>
              )}

              <div>
                <p className="text-white/70">Date</p>
                <p>{new Date(currentMedia.timestamp).toLocaleString()}</p>
              </div>

              {currentMedia.user && (
                <div>
                  <p className="text-white/70">Uploaded by</p>
                  <p>{currentMedia.user.name}</p>
                </div>
              )}

              <div>
                <p className="text-white/70">File size</p>
                <p>{formatFileSize(currentMedia.fileSize)}</p>
              </div>

              {currentMedia.width && currentMedia.height && (
                <div>
                  <p className="text-white/70">Dimensions</p>
                  <p>
                    {currentMedia.width} × {currentMedia.height}
                  </p>
                </div>
              )}

              {currentMedia.duration && (
                <div>
                  <p className="text-white/70">Duration</p>
                  <p>{formatTime(currentMedia.duration)}</p>
                </div>
              )}

              <div>
                <p className="text-white/70 mb-2">Tags</p>
                <MediaTagger
                  mediaId={currentMedia.id}
                  initialTags={currentMedia.mediaTags || []}
                  onTagsUpdate={updatedTags => {
                    // Update the current media item's tags
                    const updatedMedia = {
                      ...currentMedia,
                      mediaTags: updatedTags,
                    }
                    // You might want to update the parent component's media array here
                  }}
                />
              </div>

              {currentMedia.notes && (
                <div>
                  <p className="text-white/70">Notes</p>
                  <p className="text-sm">{currentMedia.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-xs text-white/50">
                {currentIndex + 1} of {media.length} items
              </p>
              <p className="text-xs text-white/50">
                Press arrow keys to navigate, space to play/pause
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gray-900 border-l border-gray-700 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Comments</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Comments
              mediaId={currentMedia.id}
              projectMembers={currentMedia.project ? [] : []} // TODO: Pass actual project members
            />
          </div>
        </div>
      )}

      {/* Photo Annotator Modal */}
      {!isVideo && (
        <PhotoAnnotatorModal
          isOpen={showAnnotator}
          onClose={() => setShowAnnotator(false)}
          imageUrl={currentMedia.fileUrl}
          title={`Edit: ${currentMedia.project?.name || 'Photo'}`}
          onSave={(annotations, imageDataUrl) => {
            // Here you would save the annotated image
            console.log('Saving annotated image:', {
              annotations,
              imageDataUrl,
            })
            // Could make an API call to save the annotated version
          }}
        />
      )}
    </div>
  )
}
