'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import {
  AlertTriangle,
  Camera,
  Users,
  Clock,
  MapPin,
  FileText,
  Plus,
  X,
} from 'lucide-react'

interface WitnessInfo {
  name: string
  role: string
  contactInfo: string
  statement: string
}

interface InjuryDetails {
  bodyPart: string
  injuryType: string
  severity: 'minor' | 'moderate' | 'severe' | 'fatal'
  medicalAttention: boolean
  medicalProvider: string
}

interface IncidentReportData {
  reporterName: string
  reporterRole: string
  reportDate: string
  incidentDate: string
  incidentTime: string
  location: string
  specificLocation: string
  incidentType:
    | 'injury'
    | 'near_miss'
    | 'property_damage'
    | 'environmental'
    | 'other'
  description: string
  immediateActions: string

  // Injured Person Details
  injuredPersonName: string
  injuredPersonRole: string
  injuredPersonEmployer: string
  injuryDetails: InjuryDetails

  // Environmental Conditions
  weather: string
  lighting: string
  temperatureF: string
  workConditions: string

  // Witnesses
  witnesses: WitnessInfo[]

  // Contributing Factors
  contributingFactors: string[]
  equipmentInvolved: string
  ppeUsed: string[]
  ppeCondition: string

  // Prevention
  preventionMeasures: string
  correctiveActions: string
  followupRequired: boolean
  followupDetails: string

  // Photos/Evidence
  photosNeeded: boolean
  photoDescription: string
  evidenceCollected: string

  // Signatures
  reporterSignature: string
  supervisorName: string
  supervisorSignature: string
  reviewDate: string
}

interface FSWIncidentReportProps {
  projectId: string
}

export default function FSWIncidentReport({
  projectId,
}: FSWIncidentReportProps) {
  const [formData, setFormData] = useState<IncidentReportData>({
    reporterName: '',
    reporterRole: '',
    reportDate: new Date().toISOString().split('T')[0],
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '',
    location: '',
    specificLocation: '',
    incidentType: 'near_miss',
    description: '',
    immediateActions: '',

    injuredPersonName: '',
    injuredPersonRole: '',
    injuredPersonEmployer: '',
    injuryDetails: {
      bodyPart: '',
      injuryType: '',
      severity: 'minor',
      medicalAttention: false,
      medicalProvider: '',
    },

    weather: '',
    lighting: '',
    temperatureF: '',
    workConditions: '',

    witnesses: [],

    contributingFactors: [],
    equipmentInvolved: '',
    ppeUsed: [],
    ppeCondition: '',

    preventionMeasures: '',
    correctiveActions: '',
    followupRequired: false,
    followupDetails: '',

    photosNeeded: false,
    photoDescription: '',
    evidenceCollected: '',

    reporterSignature: '',
    supervisorName: '',
    supervisorSignature: '',
    reviewDate: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [
        ...prev.witnesses,
        { name: '', role: '', contactInfo: '', statement: '' },
      ],
    }))
  }

  const updateWitness = (
    index: number,
    field: keyof WitnessInfo,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.map((witness, i) =>
        i === index ? { ...witness, [field]: value } : witness
      ),
    }))
  }

  const removeWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index),
    }))
  }

  const handleContributingFactorChange = (factor: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      contributingFactors: checked
        ? [...prev.contributingFactors, factor]
        : prev.contributingFactors.filter(f => f !== factor),
    }))
  }

  const handlePPEChange = (ppe: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      ppeUsed: checked
        ? [...prev.ppeUsed, ppe]
        : prev.ppeUsed.filter(p => p !== ppe),
    }))
  }

  const getSeverityColor = (severity: InjuryDetails['severity']) => {
    switch (severity) {
      case 'minor':
        return 'text-yellow-400'
      case 'moderate':
        return 'text-orange-400'
      case 'severe':
        return 'text-red-400'
      case 'fatal':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  const contributingFactorOptions = [
    'Inadequate training',
    'Equipment failure',
    'Poor housekeeping',
    'Improper PPE',
    'Unsafe work practices',
    'Environmental conditions',
    'Time pressure',
    'Communication failure',
    'Inadequate supervision',
    'Procedure not followed',
  ]

  const ppeOptions = [
    'Hard hat',
    'Safety glasses',
    'Steel-toed boots',
    'Safety harness',
    'Gloves',
    'High-visibility vest',
    'Hearing protection',
    'Respirator',
    'Fall protection',
    'Arc flash protection',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Incident Report submitted successfully!')

      // Reset form would go here in production
    } catch (error) {
      alert('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="brushed-metal rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-600 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-shogun text-white">
              Incident Report
            </h2>
            <p className="text-gray-400">
              Near-miss and accident reporting with investigation details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Report Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Report Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reporter Name *
                </label>
                <input
                  type="text"
                  value={formData.reporterName}
                  onChange={e =>
                    setFormData({ ...formData, reporterName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reporter Role *
                </label>
                <input
                  type="text"
                  value={formData.reporterRole}
                  onChange={e =>
                    setFormData({ ...formData, reporterRole: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Date *
                </label>
                <input
                  type="date"
                  value={formData.reportDate}
                  onChange={e =>
                    setFormData({ ...formData, reportDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Incident Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Incident Date *
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={e =>
                    setFormData({ ...formData, incidentDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Incident Time *
                </label>
                <input
                  type="time"
                  value={formData.incidentTime}
                  onChange={e =>
                    setFormData({ ...formData, incidentTime: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Incident Type *
                </label>
                <select
                  value={formData.incidentType}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      incidentType: e.target
                        .value as IncidentReportData['incidentType'],
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                >
                  <option value="near_miss">Near Miss</option>
                  <option value="injury">Injury</option>
                  <option value="property_damage">Property Damage</option>
                  <option value="environmental">Environmental</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="General location"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Specific Location
                </label>
                <input
                  type="text"
                  value={formData.specificLocation}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      specificLocation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Floor level, area, equipment, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description of Incident *
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Describe what happened in detail..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Immediate Actions Taken
              </label>
              <textarea
                value={formData.immediateActions}
                onChange={e =>
                  setFormData({ ...formData, immediateActions: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="First aid, area secured, equipment shut down, etc."
              />
            </div>
          </div>

          {/* Injury Details - Only show if incident type is injury */}
          {formData.incidentType === 'injury' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Injured Person Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Injured Person Name *
                  </label>
                  <input
                    type="text"
                    value={formData.injuredPersonName}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        injuredPersonName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    required={formData.incidentType === 'injury'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={formData.injuredPersonRole}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        injuredPersonRole: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    required={formData.incidentType === 'injury'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Employer
                  </label>
                  <input
                    type="text"
                    value={formData.injuredPersonEmployer}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        injuredPersonEmployer: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Body Part Affected
                  </label>
                  <input
                    type="text"
                    value={formData.injuryDetails.bodyPart}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        injuryDetails: {
                          ...formData.injuryDetails,
                          bodyPart: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Injury Type
                  </label>
                  <input
                    type="text"
                    value={formData.injuryDetails.injuryType}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        injuryDetails: {
                          ...formData.injuryDetails,
                          injuryType: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    placeholder="Cut, bruise, fracture, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Severity *
                  </label>
                  <select
                    value={formData.injuryDetails.severity}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        injuryDetails: {
                          ...formData.injuryDetails,
                          severity: e.target.value as InjuryDetails['severity'],
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    required={formData.incidentType === 'injury'}
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="fatal">Fatal</option>
                  </select>
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.injuryDetails.medicalAttention}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          injuryDetails: {
                            ...formData.injuryDetails,
                            medicalAttention: e.target.checked,
                          },
                        })
                      }
                      className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                    />
                    Medical Attention Required
                  </label>
                </div>
              </div>

              {formData.injuryDetails.medicalAttention && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Medical Provider/Facility
                  </label>
                  <input
                    type="text"
                    value={formData.injuryDetails.medicalProvider}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        injuryDetails: {
                          ...formData.injuryDetails,
                          medicalProvider: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    placeholder="Hospital, clinic, first aid station, etc."
                  />
                </div>
              )}
            </div>
          )}

          {/* Environmental Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Environmental Conditions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weather
                </label>
                <input
                  type="text"
                  value={formData.weather}
                  onChange={e =>
                    setFormData({ ...formData, weather: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Clear, rainy, windy, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lighting
                </label>
                <input
                  type="text"
                  value={formData.lighting}
                  onChange={e =>
                    setFormData({ ...formData, lighting: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Natural, artificial, poor, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  value={formData.temperatureF}
                  onChange={e =>
                    setFormData({ ...formData, temperatureF: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Work Conditions
                </label>
                <input
                  type="text"
                  value={formData.workConditions}
                  onChange={e =>
                    setFormData({ ...formData, workConditions: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Normal, rushed, congested, etc."
                />
              </div>
            </div>
          </div>

          {/* Witnesses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Witnesses
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addWitness}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Witness
              </Button>
            </div>

            {formData.witnesses.map((witness, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-medium">
                    Witness {index + 1}
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeWitness(index)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={witness.name}
                      onChange={e =>
                        updateWitness(index, 'name', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={witness.role}
                      onChange={e =>
                        updateWitness(index, 'role', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Contact Info
                    </label>
                    <input
                      type="text"
                      value={witness.contactInfo}
                      onChange={e =>
                        updateWitness(index, 'contactInfo', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      placeholder="Phone or email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Statement
                  </label>
                  <textarea
                    value={witness.statement}
                    onChange={e =>
                      updateWitness(index, 'statement', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    placeholder="What did the witness observe?"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Contributing Factors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Contributing Factors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contributingFactorOptions.map(factor => (
                <label
                  key={factor}
                  className="flex items-center text-sm text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={formData.contributingFactors.includes(factor)}
                    onChange={e =>
                      handleContributingFactorChange(factor, e.target.checked)
                    }
                    className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                  />
                  {factor}
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Equipment Involved
              </label>
              <input
                type="text"
                value={formData.equipmentInvolved}
                onChange={e =>
                  setFormData({
                    ...formData,
                    equipmentInvolved: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="List any equipment involved in the incident"
              />
            </div>
          </div>

          {/* PPE Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Personal Protective Equipment
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PPE Used at Time of Incident
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ppeOptions.map(ppe => (
                  <label
                    key={ppe}
                    className="flex items-center text-sm text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={formData.ppeUsed.includes(ppe)}
                      onChange={e => handlePPEChange(ppe, e.target.checked)}
                      className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                    />
                    {ppe}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PPE Condition
              </label>
              <textarea
                value={formData.ppeCondition}
                onChange={e =>
                  setFormData({ ...formData, ppeCondition: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Condition of PPE at time of incident"
              />
            </div>
          </div>

          {/* Prevention and Follow-up */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Prevention & Follow-up
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recommended Prevention Measures
              </label>
              <textarea
                value={formData.preventionMeasures}
                onChange={e =>
                  setFormData({
                    ...formData,
                    preventionMeasures: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="What could have prevented this incident?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Corrective Actions Taken
              </label>
              <textarea
                value={formData.correctiveActions}
                onChange={e =>
                  setFormData({
                    ...formData,
                    correctiveActions: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Actions taken to prevent recurrence"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.followupRequired}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      followupRequired: e.target.checked,
                    })
                  }
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Follow-up Required
              </label>
            </div>

            {formData.followupRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Follow-up Details
                </label>
                <textarea
                  value={formData.followupDetails}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      followupDetails: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Describe required follow-up actions and timeline"
                />
              </div>
            )}
          </div>

          {/* Evidence */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Evidence & Documentation
            </h3>
            <div className="flex items-center">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.photosNeeded}
                  onChange={e =>
                    setFormData({ ...formData, photosNeeded: e.target.checked })
                  }
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Photos taken or needed
              </label>
            </div>

            {formData.photosNeeded && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo Description
                </label>
                <textarea
                  value={formData.photoDescription}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      photoDescription: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Describe photos taken or needed"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evidence Collected
              </label>
              <textarea
                value={formData.evidenceCollected}
                onChange={e =>
                  setFormData({
                    ...formData,
                    evidenceCollected: e.target.value,
                  })
                }
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Physical evidence, documents, samples, etc."
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Signatures & Review
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reporter Signature *
                </label>
                <input
                  type="text"
                  value={formData.reporterSignature}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      reporterSignature: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Type full name as signature"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  value={formData.supervisorName}
                  onChange={e =>
                    setFormData({ ...formData, supervisorName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Supervisor Signature
                </label>
                <input
                  type="text"
                  value={formData.supervisorSignature}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      supervisorSignature: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Type full name as signature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Review Date
                </label>
                <input
                  type="date"
                  value={formData.reviewDate}
                  onChange={e =>
                    setFormData({ ...formData, reviewDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
