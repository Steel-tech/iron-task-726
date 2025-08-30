'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/Button'
import {
  safetyIncidentService,
  type SafetyIncident,
} from '@/lib/safety-incident-service'
import {
  AlertTriangle,
  Camera,
  MapPin,
  User,
  Clock,
  FileText,
  Plus,
  X,
  Upload,
  Calendar,
  Users,
  Shield,
  Paperclip,
} from 'lucide-react'

interface SafetyIncidentFormProps {
  onSubmit?: (incident: SafetyIncident) => void
  onCancel?: () => void
  projectId?: string
  projectName?: string
}

export default function SafetyIncidentForm({
  onSubmit,
  onCancel,
  projectId = 'project_1',
  projectName = 'Current Project',
}: SafetyIncidentFormProps) {
  const [formData, setFormData] = useState({
    incidentType: 'near_miss' as SafetyIncident['incidentType'],
    severity: 'medium' as SafetyIncident['severity'],
    title: '',
    description: '',
    location: {
      area: '',
      address: '',
    },
    datetime: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    immediateActions: '',
    peopleInvolved: [
      { name: '', role: '', injuryType: '', medicalAttention: false },
    ],
    witnessNames: [''],
    tags: [] as string[],
  })

  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const incidentTypes = [
    { value: 'near_miss', label: 'Near Miss', icon: '⚠️' },
    { value: 'injury', label: 'Injury', icon: '🩹' },
    { value: 'property_damage', label: 'Property Damage', icon: '🔨' },
    { value: 'safety_violation', label: 'Safety Violation', icon: '🚫' },
    { value: 'equipment_failure', label: 'Equipment Failure', icon: '⚙️' },
    { value: 'environmental', label: 'Environmental', icon: '🌍' },
  ]

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    {
      value: 'medium',
      label: 'Medium',
      color: 'bg-yellow-100 text-yellow-800',
    },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  ]

  const workerRoles = [
    'IRONWORKER',
    'WELDER',
    'FOREMAN',
    'SUPERVISOR',
    'SAFETY_OFFICER',
    'INSPECTOR',
    'CRANE_OPERATOR',
    'LABORER',
    'ELECTRICIAN',
    'OTHER',
  ]

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          },
        }))
      },
      error => {
        console.error('Error getting location:', error)
        alert('Unable to get current location. Please enter location manually.')
      }
    )
  }

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos(prev => [...prev, ...files].slice(0, 10)) // Limit to 10 photos
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const addPersonInvolved = () => {
    setFormData(prev => ({
      ...prev,
      peopleInvolved: [
        ...prev.peopleInvolved,
        { name: '', role: '', injuryType: '', medicalAttention: false },
      ],
    }))
  }

  const removePersonInvolved = (index: number) => {
    setFormData(prev => ({
      ...prev,
      peopleInvolved: prev.peopleInvolved.filter((_, i) => i !== index),
    }))
  }

  const updatePersonInvolved = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      peopleInvolved: prev.peopleInvolved.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      ),
    }))
  }

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnessNames: [...prev.witnessNames, ''],
    }))
  }

  const removeWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnessNames: prev.witnessNames.filter((_, i) => i !== index),
    }))
  }

  const updateWitness = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      witnessNames: prev.witnessNames.map((name, i) =>
        i === index ? value : name
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convert form data to incident format
      const incidentData = {
        projectId,
        projectName,
        reportedBy: {
          id: 'current_user',
          name: 'Current User',
          role: 'FOREMAN',
        },
        incidentType: formData.incidentType,
        severity: formData.severity,
        status: 'reported' as const,
        title: formData.title,
        description: formData.description,
        location: {
          area: formData.location.area,
          coordinates: currentLocation || undefined,
          address: formData.location.address,
        },
        datetime: new Date(formData.datetime),
        peopleInvolved: formData.peopleInvolved.filter(p => p.name.trim()),
        witnessNames: formData.witnessNames.filter(w => w.trim()),
        immediateActions: formData.immediateActions,
        photos: photos.map((photo, index) => ({
          id: `photo_${index}`,
          url: URL.createObjectURL(photo),
          description: `Photo ${index + 1}`,
          timestamp: new Date(),
        })),
        documents: [],
        tags: formData.tags,
        complianceFlags: [],
        followUpRequired:
          formData.severity === 'high' || formData.severity === 'critical',
      }

      const savedIncident =
        await safetyIncidentService.reportIncident(incidentData)

      if (onSubmit) {
        onSubmit(savedIncident)
      }

      // Reset form
      setFormData({
        incidentType: 'near_miss',
        severity: 'medium',
        title: '',
        description: '',
        location: { area: '', address: '' },
        datetime: new Date().toISOString().slice(0, 16),
        immediateActions: '',
        peopleInvolved: [
          { name: '', role: '', injuryType: '', medicalAttention: false },
        ],
        witnessNames: [''],
        tags: [],
      })
      setPhotos([])
      setCurrentLocation(null)
    } catch (error) {
      console.error('Failed to submit incident:', error)
      alert('Failed to submit incident. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-red-900">
            Report Safety Incident
          </h2>
        </div>
        <p className="text-sm text-red-700 mt-1">
          Report all incidents immediately for proper investigation and
          prevention
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Type *
            </label>
            <select
              value={formData.incidentType}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  incidentType: e.target.value as any,
                }))
              }
              className="input-construction w-full"
              required
            >
              {incidentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level *
            </label>
            <select
              value={formData.severity}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  severity: e.target.value as any,
                }))
              }
              className="input-construction w-full"
              required
            >
              {severityLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <div className="mt-1">
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                  severityLevels.find(l => l.value === formData.severity)?.color
                }`}
              >
                {severityLevels.find(l => l.value === formData.severity)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incident Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={e =>
              setFormData(prev => ({ ...prev, title: e.target.value }))
            }
            className="input-construction w-full"
            placeholder="Brief description of the incident"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            value={formData.description}
            onChange={e =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            className="input-construction w-full h-24"
            placeholder="Provide a detailed description of what happened..."
            required
          />
        </div>

        {/* Location and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location/Area *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.location.area}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, area: e.target.value },
                  }))
                }
                className="input-construction flex-1"
                placeholder="e.g., Bay 3, Level 2"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="flex-shrink-0"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
            {formData.location.address && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.location.address}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={e =>
                setFormData(prev => ({ ...prev, datetime: e.target.value }))
              }
              className="input-construction w-full"
              required
            />
          </div>
        </div>

        {/* People Involved */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              People Involved
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPersonInvolved}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Person
            </Button>
          </div>

          {formData.peopleInvolved.map((person, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 mb-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Person {index + 1}
                </h4>
                {formData.peopleInvolved.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePersonInvolved(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={person.name}
                  onChange={e =>
                    updatePersonInvolved(index, 'name', e.target.value)
                  }
                  className="input-construction"
                  placeholder="Full name"
                />
                <select
                  value={person.role}
                  onChange={e =>
                    updatePersonInvolved(index, 'role', e.target.value)
                  }
                  className="input-construction"
                >
                  <option value="">Select role</option>
                  {workerRoles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {formData.incidentType === 'injury' && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={person.injuryType || ''}
                    onChange={e =>
                      updatePersonInvolved(index, 'injuryType', e.target.value)
                    }
                    className="input-construction w-full"
                    placeholder="Type of injury (e.g., cut, bruise, strain)"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={person.medicalAttention || false}
                      onChange={e =>
                        updatePersonInvolved(
                          index,
                          'medicalAttention',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Required medical attention
                    </span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Witnesses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Witnesses
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWitness}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Witness
            </Button>
          </div>

          {formData.witnessNames.map((witness, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={witness}
                onChange={e => updateWitness(index, e.target.value)}
                className="input-construction flex-1"
                placeholder="Witness name"
              />
              {formData.witnessNames.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWitness(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Immediate Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Immediate Actions Taken *
          </label>
          <textarea
            value={formData.immediateActions}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                immediateActions: e.target.value,
              }))
            }
            className="input-construction w-full h-20"
            placeholder="Describe what was done immediately after the incident..."
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos & Evidence
          </label>
          <div className="flex gap-2 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="construction-primary"
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </form>
    </div>
  )
}
