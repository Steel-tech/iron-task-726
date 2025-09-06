'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Video,
  FlipHorizontal,
  Upload,
  X,
  MapPin,
  Tag,
  FileText,
  Loader2,
  Check,
} from 'lucide-react'

interface MediaMetadata {
  projectId: string
  activityType: string
  location?: string
  notes?: string
  tags?: string[]
  latitude?: number
  longitude?: number
  altitude?: number
  accuracy?: number
  address?: string
}

interface Project {
  id: string
  name: string
  jobNumber: string
  location: string
  status: string
}

export default function CapturePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [isCapturing, setIsCapturing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  )
  const [capturedMedia, setCapturedMedia] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [location, setLocation] = useState<GeolocationPosition | null>(null)

  // Form data
  const [projectId, setProjectId] = useState('')
  const [activityType, setActivityType] = useState('INSTALLATION')
  const [locationDesc, setLocationDesc] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: captureMode === 'video',
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCapturing(true)

      // Get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => setLocation(position),
          error => {
            // Location access denied or failed - continue without GPS
            // In production, this would be logged to error monitoring
          },
          { enableHighAccuracy: true }
        )
      }
    } catch (error) {
      // Camera access failed - show user-friendly error
      alert('Failed to access camera. Please check permissions.')
    }
  }, [facingMode, captureMode])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
    setIsRecording(false)
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  // Toggle camera
  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
    if (isCapturing) {
      stopCamera()
      setTimeout(startCamera, 100)
    }
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      canvas.toBlob(
        blob => {
          if (blob) {
            setCapturedMedia(blob)
            setCapturedUrl(URL.createObjectURL(blob))
            stopCamera()
          }
        },
        'image/jpeg',
        0.9
      )
    }
  }

  // Start video recording
  const startRecording = () => {
    if (!videoRef.current?.srcObject) return

    const stream = videoRef.current.srcObject as MediaStream
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    })

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setCapturedMedia(blob)
      setCapturedUrl(URL.createObjectURL(blob))
      chunksRef.current = []
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
  }

  // Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      stopCamera()
    }
  }

  // Upload media
  const uploadMedia = async () => {
    if (!capturedMedia || !projectId) {
      alert('Please select a project and capture media first')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    const fileName =
      captureMode === 'photo'
        ? `photo_${Date.now()}.jpg`
        : `video_${Date.now()}.webm`

    formData.append('file', capturedMedia, fileName)
    formData.append('projectId', projectId)
    formData.append('activityType', activityType)
    formData.append('location', locationDesc)
    formData.append('notes', notes)
    formData.append('tags', tags)
    formData.append('mediaType', captureMode === 'photo' ? 'PHOTO' : 'VIDEO')

    if (location) {
      formData.append('latitude', location.coords.latitude.toString())
      formData.append('longitude', location.coords.longitude.toString())
      formData.append('altitude', location.coords.altitude?.toString() || '')
      formData.append('accuracy', location.coords.accuracy.toString())
    }

    try {
      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        },
      })

      alert('Media uploaded successfully!')
      router.push(`/dashboard/projects/${projectId}`)
    } catch (error) {
      // Upload failed - show user-friendly error
      alert('Failed to upload media. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Reset capture
  const resetCapture = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setCapturedMedia(null)
    setCapturedUrl(null)
    startCamera()
  }

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.get('/projects')
        setProjects(response.data.projects || [])
      } catch (error) {
        // Failed to load projects - will show empty state
      } finally {
        setLoadingProjects(false)
      }
    }
    loadProjects()
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl)
      }
    }
  }, [stopCamera, capturedUrl])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Capture Media</h1>

      {/* Mode selector */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={captureMode === 'photo' ? 'default' : 'outline'}
          onClick={() => {
            setCaptureMode('photo')
            if (isCapturing) {
              stopCamera()
              setTimeout(startCamera, 100)
            }
          }}
        >
          <Camera className="h-4 w-4 mr-2" />
          Photo
        </Button>
        <Button
          variant={captureMode === 'video' ? 'default' : 'outline'}
          onClick={() => {
            setCaptureMode('video')
            if (isCapturing) {
              stopCamera()
              setTimeout(startCamera, 100)
            }
          }}
        >
          <Video className="h-4 w-4 mr-2" />
          Video
        </Button>
      </div>

      {/* Camera view */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-6">
        {capturedUrl ? (
          captureMode === 'photo' ? (
            <img src={capturedUrl} alt="Captured" className="w-full" />
          ) : (
            <video src={capturedUrl} controls className="w-full" />
          )
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
            style={{ maxHeight: '500px' }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera controls */}
        {!capturedMedia && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            {!isCapturing ? (
              <Button onClick={startCamera} size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleCamera}
                  className="bg-white/20 backdrop-blur"
                >
                  <FlipHorizontal className="h-5 w-5" />
                </Button>
                {captureMode === 'photo' ? (
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={isRecording ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    {isRecording ? (
                      <>
                        <div className="h-3 w-3 bg-white rounded-full mr-2 animate-pulse" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Video className="h-5 w-5 mr-2" />
                        Record
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={stopCamera}
                  className="bg-white/20 backdrop-blur"
                >
                  <X className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Metadata form */}
      {capturedMedia && (
        <div className="bg-card p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Add Details</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Project *</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              disabled={loadingProjects}
            >
              <option value="">
                {loadingProjects ? 'Loading projects...' : 'Select a project'}
              </option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.jobNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Activity Type
            </label>
            <select
              value={activityType}
              onChange={e => setActivityType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="INSTALLATION">Installation</option>
              <option value="INSPECTION">Inspection</option>
              <option value="PROGRESS">Progress</option>
              <option value="ISSUE">Issue</option>
              <option value="COMPLETION">Completion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location Description
            </label>
            <input
              type="text"
              value={locationDesc}
              onChange={e => setLocationDesc(e.target.value)}
              placeholder="e.g., Bay 3, Level 2"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="welding, beam, safety (comma separated)"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>

          {location && (
            <div className="text-sm text-muted-foreground">
              <MapPin className="inline h-4 w-4 mr-1" />
              GPS: {location.coords.latitude.toFixed(6)},{' '}
              {location.coords.longitude.toFixed(6)}
              {location.coords.accuracy &&
                ` (±${Math.round(location.coords.accuracy)}m)`}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              onClick={uploadMedia}
              disabled={isUploading || !projectId}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetCapture}
              disabled={isUploading}
            >
              Retake
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
