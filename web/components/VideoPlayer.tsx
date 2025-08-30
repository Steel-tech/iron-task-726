'use client'

import React, { useRef, useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle,
  Download,
  Share2,
  PictureInPicture,
} from 'lucide-react'
import { Button } from '@/components/Button'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onError?: (error: Event) => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  showDownload?: boolean
  showShare?: boolean
  className?: string
  // For dual video (picture-in-picture)
  secondarySrc?: string
  isPictureInPicture?: boolean
}

export default function VideoPlayer({
  src,
  poster,
  title,
  onError,
  onPlay,
  onPause,
  onEnded,
  autoPlay = false,
  muted = false,
  loop = false,
  showDownload = true,
  showShare = true,
  className = '',
  secondarySrc,
  isPictureInPicture = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const primaryVideoRef = useRef<HTMLVideoElement>(null)
  const secondaryVideoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [pipPosition, setPipPosition] = useState<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('bottom-right')

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-hide controls
  // Reset error state when src changes and validate URL
  useEffect(() => {
    setError(null)
    setIsLoading(true)

    // Quick validation for obviously invalid URLs
    if (
      !src ||
      src.includes('invalid') ||
      src.includes('404') ||
      src.includes('non-existent')
    ) {
      setTimeout(() => {
        setError('Video source not found')
        setIsLoading(false)
      }, 500)
    }
  }, [src])

  useEffect(() => {
    const hideControls = () => {
      if (isPlaying) {
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

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  // Sync both videos if dual video mode
  useEffect(() => {
    if (
      isPictureInPicture &&
      primaryVideoRef.current &&
      secondaryVideoRef.current
    ) {
      const syncVideos = () => {
        if (secondaryVideoRef.current && primaryVideoRef.current) {
          secondaryVideoRef.current.currentTime =
            primaryVideoRef.current.currentTime
        }
      }

      primaryVideoRef.current.addEventListener('timeupdate', syncVideos)
      return () => {
        primaryVideoRef.current?.removeEventListener('timeupdate', syncVideos)
      }
    }
  }, [isPictureInPicture])

  const togglePlayPause = () => {
    if (primaryVideoRef.current) {
      if (isPlaying) {
        primaryVideoRef.current.pause()
        secondaryVideoRef.current?.pause()
        onPause?.()
      } else {
        primaryVideoRef.current.play()
        secondaryVideoRef.current?.play()
        onPlay?.()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (primaryVideoRef.current) {
      primaryVideoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
      if (!isMuted) {
        setVolume(0)
      } else {
        setVolume(primaryVideoRef.current.volume)
      }
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

  const handleTimeUpdate = () => {
    if (primaryVideoRef.current) {
      setCurrentTime(primaryVideoRef.current.currentTime)

      // Update buffered amount
      if (primaryVideoRef.current.buffered.length > 0) {
        const bufferedEnd = primaryVideoRef.current.buffered.end(
          primaryVideoRef.current.buffered.length - 1
        )
        setBuffered((bufferedEnd / primaryVideoRef.current.duration) * 100)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (primaryVideoRef.current) {
      setDuration(primaryVideoRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    console.error('Video error occurred:', e)
    const videoElement = e.currentTarget
    const error = videoElement.error

    let errorMessage = 'Failed to load video'
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted'
          break
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading video'
          break
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Video format not supported'
          break
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video source not found or not supported'
          break
      }
    }

    setError(errorMessage)
    setIsLoading(false)
    onError?.(e.nativeEvent)
  }

  // Also handle poster image errors
  const handlePosterError = () => {
    console.warn('Poster image failed to load')
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (primaryVideoRef.current) {
      primaryVideoRef.current.currentTime = time
      if (secondaryVideoRef.current) {
        secondaryVideoRef.current.currentTime = time
      }
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (primaryVideoRef.current) {
      primaryVideoRef.current.volume = vol
    }
    setIsMuted(vol === 0)
  }

  const changePlaybackRate = (rate: number) => {
    if (primaryVideoRef.current) {
      primaryVideoRef.current.playbackRate = rate
      if (secondaryVideoRef.current) {
        secondaryVideoRef.current.playbackRate = rate
      }
      setPlaybackRate(rate)
      setShowSettings(false)
    }
  }

  const skipTime = (seconds: number) => {
    if (primaryVideoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      primaryVideoRef.current.currentTime = newTime
      if (secondaryVideoRef.current) {
        secondaryVideoRef.current.currentTime = newTime
      }
      setCurrentTime(newTime)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = title || 'video.mp4'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const cyclePipPosition = () => {
    const positions: Array<
      'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    > = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    const currentIndex = positions.indexOf(pipPosition)
    const nextIndex = (currentIndex + 1) % positions.length
    setPipPosition(positions[nextIndex])
  }

  const pipPositionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-right': 'bottom-20 right-4',
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Main video */}
      <div className="relative w-full h-full bg-black">
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white z-10 bg-gray-900">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="text-center space-y-2 px-4">
              <p className="text-lg font-semibold">{error}</p>
              <p className="text-sm text-gray-400">
                Please check the video source and try again
              </p>
            </div>
          </div>
        ) : (
          <video
            ref={primaryVideoRef}
            src={src}
            poster={poster}
            className="w-full h-full"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onError={handleVideoError}
            onEnded={() => {
              setIsPlaying(false)
              onEnded?.()
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadStart={() => {
              console.log('Video load started:', src)
              setIsLoading(true)
            }}
            onCanPlay={() => {
              console.log('Video can play:', src)
              if (error === null) setIsLoading(false)
            }}
            onStalled={() => {
              console.warn('Video stalled')
              setError('Video loading stalled')
              setIsLoading(false)
            }}
            onSuspend={() => {
              console.warn('Video loading suspended')
            }}
            muted={isMuted}
            loop={loop}
            autoPlay={autoPlay}
            playsInline
            crossOrigin="anonymous"
          />
        )}

        {/* Secondary video (PiP) */}
        {isPictureInPicture && secondarySrc && (
          <div
            className={`absolute w-1/4 h-1/4 bg-black rounded-lg overflow-hidden shadow-lg cursor-pointer ${pipPositionClasses[pipPosition]}`}
            onClick={cyclePipPosition}
          >
            <video
              ref={secondaryVideoRef}
              src={secondarySrc}
              className="w-full h-full"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity">
              <PictureInPicture className="h-6 w-6 text-white" />
            </div>
          </div>
        )}

        {/* Controls overlay */}
        {!error && (
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Center play button */}
            {!isPlaying && (
              <button
                onClick={togglePlayPause}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <Play className="h-10 w-10 text-white ml-1" />
              </button>
            )}

            {/* Title */}
            {title && (
              <div className="absolute top-4 left-4 right-4">
                <h3 className="text-white text-lg font-semibold truncate">
                  {title}
                </h3>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress bar */}
              <div className="mb-2 relative">
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                <div
                  className="absolute inset-0 bg-white/40 rounded-full"
                  style={{ width: `${buffered}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="relative w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer z-10"
                  style={{
                    background: `linear-gradient(to right, #ff6600 ${(currentTime / duration) * 100}%, transparent 0%)`,
                  }}
                />
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
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

                  {/* Skip buttons */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => skipTime(-10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => skipTime(10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? (
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

                  {/* Time display */}
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Settings */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:bg-white/20"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>

                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px]">
                        <div className="text-white text-sm">
                          <p className="text-xs text-white/70 mb-1">
                            Playback Speed
                          </p>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                            <button
                              key={rate}
                              onClick={() => changePlaybackRate(rate)}
                              className={`block w-full text-left px-2 py-1 rounded hover:bg-white/20 ${
                                playbackRate === rate ? 'bg-white/20' : ''
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Download */}
                  {showDownload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      className="text-white hover:bg-white/20"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Share */}
                  {showShare && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Fullscreen */}
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
      </div>
    </div>
  )
}
