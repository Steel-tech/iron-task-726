'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import {
  Upload,
  Image,
  Video,
  FileUp,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus
} from 'lucide-react'
import { UploadFabricationIcon } from '@/components/icons/SteelConstructionIcons'

interface FileUpload {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface Project {
  id: string
  name: string
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileUpload[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [activityType, setActivityType] = useState('ERECTION')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

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
        console.error('Failed to fetch projects:', error)
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

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileUpload[] = Array.from(fileList)
      .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending' as const
      }))
    
    setFiles(prev => [...prev, ...newFiles])
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

        const formData = new FormData()
        formData.append('file', fileUpload.file)
        formData.append('projectId', selectedProjectId)
        formData.append('activityType', activityType)
        formData.append('location', location)
        formData.append('notes', notes)
        formData.append('tags', tags)
        formData.append('mediaType', fileUpload.file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO')

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
      } catch (error) {
        console.error('Upload error:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileUpload.id 
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        ))
      }
    }

    setIsUploading(false)

    // Check if all uploads were successful
    const allSuccess = files.every(f => f.status === 'success')
    if (allSuccess) {
      setTimeout(() => {
        router.push(`/dashboard/projects/${selectedProjectId}`)
      }, 1000)
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-shogun">Upload Media</h1>
        <div className="text-sm text-muted-foreground">
          {files.length} files ({totalSizeMB} MB)
        </div>
      </div>

      {/* Project Selection */}
      <div className="bg-card rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Project Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details..."
            className="w-full p-2 border rounded-md"
            rows={3}
          />
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${files.length > 0 ? 'mb-4' : 'mb-0'}
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
          <UploadFabricationIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-lg font-medium mb-2">
            Drag and drop your photos and videos here
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse from your device
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Select Files
          </Button>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold">Selected Files</h3>
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
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
                  {file.status === 'uploading' && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button
              onClick={uploadFiles}
              disabled={isUploading || files.length === 0 || !selectedProjectId}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload All Files
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
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}