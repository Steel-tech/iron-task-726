'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { offlineStorage } from '@/lib/offline-storage'
import { syncService, type SyncProgress } from '@/lib/sync-service'
import {
  Upload,
  Image,
  Video,
  FileUp,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Wifi,
  WifiOff,
  Clock,
  MapPin,
  Camera,
  Smartphone,
  Shield,
  Mic
} from 'lucide-react'
import { UploadFabricationIcon } from '@/components/icons/SteelConstructionIcons'
import SafetyAnalysisModal from './SafetyAnalysisModal'
import VoiceToText from './VoiceToText'

interface FileUpload {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error' | 'offline'
  error?: string
  gpsCoordinates?: { latitude: number; longitude: number }
}

interface Project {
  id: string
  name: string
}

export default function OfflineUpload() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const [files, setFiles] = useState<FileUpload[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [activityType, setActivityType] = useState('ERECTION')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queuedCount, setQueuedCount] = useState(0)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(true)
  const [showSafetyModal, setShowSafetyModal] = useState(false)
  const [selectedFileForAnalysis, setSelectedFileForAnalysis] = useState<FileUpload | null>(null)
  const [showVoiceInput, setShowVoiceInput] = useState(false)

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update queued count
  useEffect(() => {
    const updateQueuedCount = async () => {
      try {
        const count = await syncService.getQueuedItemsCount()
        setQueuedCount(count)
      } catch (error) {
        // Silent failure
      }
    }
    
    updateQueuedCount()
    const interval = setInterval(updateQueuedCount, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Setup auto-sync
  useEffect(() => {
    syncService.setupAutoSync((progress) => {
      setSyncProgress(progress)
      
      // Update queued count when sync completes
      if (progress.completedItems === progress.totalItems) {
        setTimeout(async () => {
          const count = await syncService.getQueuedItemsCount()
          setQueuedCount(count)
          setSyncProgress(null)
        }, 1000)
      }
    })
  }, [])

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects')
        setProjects(response.data)
        if (response.data.length > 0) {
          setSelectedProjectId(response.data[0].id)
        }
      } catch (error) {
        // Try to load from offline storage
        try {
          const offlineProjects = await offlineStorage.getProjects()
          setProjects(offlineProjects)
          if (offlineProjects.length > 0) {
            setSelectedProjectId(offlineProjects[0].id)
          }
        } catch (offlineError) {
          // Silent failure
        }
      }
    }
    fetchProjects()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files, true)
    }
  }

  const handleFiles = async (fileList: FileList, fromCamera = false) => {
    const gpsCoordinates = autoLocationEnabled ? await offlineStorage.getCurrentLocation() : null
    
    const newFiles: FileUpload[] = Array.from(fileList)
      .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending' as const,
        gpsCoordinates: gpsCoordinates || undefined
      }))
    
    setFiles(prev => [...prev, ...newFiles])

    // Auto-fill location from GPS if available and camera was used
    if (fromCamera && gpsCoordinates && !location) {
      setLocation(`GPS: ${gpsCoordinates.latitude.toFixed(6)}, ${gpsCoordinates.longitude.toFixed(6)}`)
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const uploadFiles = async () => {
    if (!selectedProjectId) {
      alert('Please select a project')
      return
    }

    if (files.length === 0) {
      alert('Please select files to upload')
      return
    }

    setIsUploading(true)

    for (const fileUpload of files) {
      if (fileUpload.status === 'success') continue

      try {
        setFiles(prev => prev.map(f => 
          f.id === fileUpload.id 
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        ))

        if (isOnline) {
          // Try online upload first
          const formData = new FormData()
          formData.append('file', fileUpload.file)
          formData.append('projectId', selectedProjectId)
          formData.append('activityType', activityType)
          formData.append('location', location)
          formData.append('notes', notes)
          formData.append('tags', tags)
          formData.append('mediaType', fileUpload.file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO')

          if (fileUpload.gpsCoordinates) {
            formData.append('latitude', fileUpload.gpsCoordinates.latitude.toString())
            formData.append('longitude', fileUpload.gpsCoordinates.longitude.toString())
          }

          await api.post('/media/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const progress = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0
              
              setFiles(prev => prev.map(f => 
                f.id === fileUpload.id 
                  ? { ...f, progress }
                  : f
              ))
            }
          })

          setFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          ))
        } else {
          throw new Error('No internet connection')
        }
      } catch (error) {
        // Store offline for later sync
        try {
          await offlineStorage.saveOfflineMedia({
            file: fileUpload.file,
            projectId: selectedProjectId,
            activityType,
            location,
            notes,
            tags,
            mediaType: fileUpload.file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO',
            gpsCoordinates: fileUpload.gpsCoordinates
          })

          setFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, status: 'offline' as const, progress: 100 }
              : f
          ))

          // Update queued count
          const count = await syncService.getQueuedItemsCount()
          setQueuedCount(count)
        } catch (offlineError) {
          setFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, status: 'error' as const, error: 'Failed to save offline' }
              : f
          ))
        }
      }
    }

    setIsUploading(false)

    // Check if all uploads were successful or stored offline
    const allProcessed = files.every(f => f.status === 'success' || f.status === 'offline')
    if (allProcessed) {
      setTimeout(() => {
        router.push(`/dashboard/projects/${selectedProjectId}`)
      }, 1000)
    }
  }

  const startManualSync = async () => {
    if (!isOnline) {
      alert('No internet connection available')
      return
    }

    try {
      await syncService.startSync((progress) => {
        setSyncProgress(progress)
      })
      
      const count = await syncService.getQueuedItemsCount()
      setQueuedCount(count)
      setSyncProgress(null)
    } catch (error) {
      alert('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const openSafetyAnalysis = (fileUpload: FileUpload) => {
    setSelectedFileForAnalysis(fileUpload)
    setShowSafetyModal(true)
  }

  const handleVoiceTranscription = (text: string) => {
    setNotes(prev => prev ? `${prev}\n\n${text}` : text)
    setShowVoiceInput(false)
  }

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-shogun">Upload Media</h1>
        <div className="flex items-center gap-4">
          {/* Network status */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
          
          {/* Queued items indicator */}
          {queuedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
              <Clock className="h-4 w-4" />
              {queuedCount} queued
              {isOnline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startManualSync}
                  disabled={syncService.isSyncInProgress()}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  {syncService.isSyncInProgress() ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            {files.length} files ({totalSizeMB} MB)
          </div>
        </div>
      </div>

      {/* Sync progress */}
      {syncProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Syncing offline media ({syncProgress.completedItems} of {syncProgress.totalItems})
            </span>
            <span className="text-sm text-blue-600">
              {Math.round((syncProgress.completedItems / syncProgress.totalItems) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(syncProgress.completedItems / syncProgress.totalItems) * 100}%` }}
            />
          </div>
          {syncProgress.currentItem && (
            <p className="text-xs text-blue-600 mt-1">
              Current: {syncProgress.currentItem}
            </p>
          )}
        </div>
      )}

      {/* Project Details */}
      <div className="bg-card rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Project Details</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoLocation"
              checked={autoLocationEnabled}
              onChange={(e) => setAutoLocationEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoLocation" className="text-sm flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Auto GPS
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-3 border rounded-md text-base" // Larger touch targets
              required
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
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
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full p-3 border rounded-md text-base" // Larger touch targets
            >
              <option value="ERECTION">Erection</option>
              <option value="FABRICATION">Fabrication</option>
              <option value="DELIVERY">Delivery</option>
              <option value="SAFETY">Safety</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Bay 3, Level 2"
              className="w-full p-3 border rounded-md text-base" // Larger touch targets
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="welding, beam, safety (comma separated)"
              className="w-full p-3 border rounded-md text-base" // Larger touch targets
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              Notes
            </label>
            <Button
              type="button"
              onClick={() => setShowVoiceInput(!showVoiceInput)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Mic className="h-4 w-4" />
              Voice Input
            </Button>
          </div>
          
          {showVoiceInput && (
            <div className="mb-4">
              <VoiceToText
                onTranscriptionComplete={handleVoiceTranscription}
                placeholder="Describe work progress, safety observations, or other notes..."
              />
            </div>
          )}
          
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details..."
            className="w-full p-3 border rounded-md text-base" // Larger touch targets
            rows={3}
          />
        </div>
      </div>

      {/* Camera and Upload Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera Capture */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Capture
          </h3>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <Button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full h-12 text-base" // Larger touch target
            variant="outline"
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Take Photo/Video
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Optimized for construction workers with gloves
          </p>
        </div>

        {/* File Upload */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 bg-card
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="text-center">
            <UploadFabricationIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" size={32} />
            <p className="text-sm font-medium mb-2">
              Drop files or browse
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-12 text-base" // Larger touch target
            >
              <Plus className="h-5 w-5 mr-2" />
              Select Files
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold">Selected Files</h3>
          <div className="space-y-3"> {/* Increased spacing for touch */}
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg" // Increased padding
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  {file.file.type.startsWith('video/') ? (
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <Video className="h-6 w-6 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.gpsCoordinates && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      GPS tagged
                    </p>
                  )}
                  {file.status === 'uploading' && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2"> {/* Thicker progress bar */}
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === 'success' && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {file.status === 'offline' && (
                    <Clock className="h-6 w-6 text-orange-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                  {file.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openSafetyAnalysis(file)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full"
                        title="Analyze for safety hazards"
                      >
                        <Shield className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button
              onClick={uploadFiles}
              disabled={isUploading || files.length === 0 || !selectedProjectId}
              className="flex-1 h-12 text-base" // Larger touch target
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  {isOnline ? 'Upload All Files' : 'Save for Later Sync'}
                </>
              )}
            </Button>
            {!isUploading && files.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  files.forEach(f => URL.revokeObjectURL(f.preview))
                  setFiles([])
                }}
                className="h-12 text-base" // Larger touch target
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Safety Analysis Modal */}
      <SafetyAnalysisModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        imageFile={selectedFileForAnalysis?.file || null}
        activityType={activityType}
        location={location}
      />
    </div>
  )
}