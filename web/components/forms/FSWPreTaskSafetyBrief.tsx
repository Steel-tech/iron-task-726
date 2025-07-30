'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Shield, Users, CheckCircle, AlertTriangle, Plus, X } from 'lucide-react'

interface CrewMember {
  name: string
  role: string
  signature: string
}

interface Hazard {
  hazardType: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  controlMeasures: string
}

interface PreTaskSafetyData {
  date: string
  time: string
  location: string
  workDescription: string
  supervisorName: string
  
  // Crew Information
  crewMembers: CrewMember[]
  
  // Weather & Environmental
  weatherConditions: string
  temperature: string
  windSpeed: string
  visibility: string
  groundConditions: string
  
  // Work Plan
  plannedStartTime: string
  plannedEndTime: string
  estimatedDuration: string
  workScope: string
  
  // Safety Requirements
  requiredPPE: string[]
  specialEquipment: string[]
  permits: string[]
  
  // Hazard Identification
  hazards: Hazard[]
  
  // Emergency Information
  emergencyContacts: {
    site: string
    medical: string
    fire: string
    supervisor: string
  }
  
  // Safety Topics Discussed
  topicsDiscussed: string[]
  additionalSafetyNotes: string
  
  // Inspection Checklist
  inspectionChecklist: {
    toolsInspected: boolean
    ppeInspected: boolean
    workAreaSecured: boolean
    hazardsCommunicated: boolean
    emergencyPlanReviewed: boolean
    escapeRoutesIdentified: boolean
  }
  
  // Signatures
  supervisorSignature: string
  briefingTime: string
}

interface FSWPreTaskSafetyBriefProps {
  projectId: string
}

export default function FSWPreTaskSafetyBrief({ projectId }: FSWPreTaskSafetyBriefProps) {
  const [formData, setFormData] = useState<PreTaskSafetyData>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    workDescription: '',
    supervisorName: '',
    
    crewMembers: [],
    
    weatherConditions: '',
    temperature: '',
    windSpeed: '',
    visibility: '',
    groundConditions: '',
    
    plannedStartTime: '',
    plannedEndTime: '',
    estimatedDuration: '',
    workScope: '',
    
    requiredPPE: [],
    specialEquipment: [],
    permits: [],
    
    hazards: [],
    
    emergencyContacts: {
      site: '',
      medical: '911',
      fire: '911',
      supervisor: ''
    },
    
    topicsDiscussed: [],
    additionalSafetyNotes: '',
    
    inspectionChecklist: {
      toolsInspected: false,
      ppeInspected: false,
      workAreaSecured: false,
      hazardsCommunicated: false,
      emergencyPlanReviewed: false,
      escapeRoutesIdentified: false
    },
    
    supervisorSignature: '',
    briefingTime: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const addCrewMember = () => {
    setFormData(prev => ({
      ...prev,
      crewMembers: [...prev.crewMembers, { name: '', role: '', signature: '' }]
    }))
  }

  const updateCrewMember = (index: number, field: keyof CrewMember, value: string) => {
    setFormData(prev => ({
      ...prev,
      crewMembers: prev.crewMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    }))
  }

  const removeCrewMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      crewMembers: prev.crewMembers.filter((_, i) => i !== index)
    }))
  }

  const addHazard = () => {
    setFormData(prev => ({
      ...prev,
      hazards: [...prev.hazards, { hazardType: '', riskLevel: 'medium', controlMeasures: '' }]
    }))
  }

  const updateHazard = (index: number, field: keyof Hazard, value: any) => {
    setFormData(prev => ({
      ...prev,
      hazards: prev.hazards.map((hazard, i) =>
        i === index ? { ...hazard, [field]: value } : hazard
      )
    }))
  }

  const removeHazard = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hazards: prev.hazards.filter((_, i) => i !== index)
    }))
  }

  const handlePPEChange = (ppe: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      requiredPPE: checked
        ? [...prev.requiredPPE, ppe]
        : prev.requiredPPE.filter(p => p !== ppe)
    }))
  }

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialEquipment: checked
        ? [...prev.specialEquipment, equipment]
        : prev.specialEquipment.filter(e => e !== equipment)
    }))
  }

  const handlePermitChange = (permit: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permits: checked
        ? [...prev.permits, permit]
        : prev.permits.filter(p => p !== permit)
    }))
  }

  const handleTopicChange = (topic: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      topicsDiscussed: checked
        ? [...prev.topicsDiscussed, topic]
        : prev.topicsDiscussed.filter(t => t !== topic)
    }))
  }

  const getRiskColor = (level: Hazard['riskLevel']) => {
    switch (level) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

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
    'Arc flash protection'
  ]

  const equipmentOptions = [
    'Fall arrest system',
    'Confined space equipment',
    'Gas monitoring equipment',
    'Fire extinguisher',
    'First aid kit',
    'Emergency eyewash',
    'Lockout/Tagout devices',
    'Barricades/Signage',
    'Lifting equipment',
    'Welding screens'
  ]

  const permitOptions = [
    'Hot work permit',
    'Confined space permit',
    'Height work permit',
    'Excavation permit',
    'Electrical work permit',
    'Crane operation permit',
    'Environmental permit',
    'Noise permit'
  ]

  const safetyTopics = [
    'Fall protection requirements',
    'Hazard communication',
    'Emergency procedures',
    'Tool safety',
    'Electrical safety',
    'Fire prevention',
    'First aid procedures',
    'Weather monitoring',
    'Communication protocols',
    'Incident reporting'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Pre-Task Safety Brief submitted successfully!')
      
      // Reset form would go here in production
    } catch (error) {
      alert('Failed to submit brief. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="brushed-metal rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-shogun text-white">Pre-Task Safety Brief</h2>
            <p className="text-gray-400">Daily safety briefing checklist and crew acknowledgment</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Brief Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Work location/area"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Supervisor Name *</label>
                <input
                  type="text"
                  value={formData.supervisorName}
                  onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Work Description *</label>
                <input
                  type="text"
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Brief description of work to be performed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Crew Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Crew Members</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCrewMember}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Crew Member
              </Button>
            </div>

            {formData.crewMembers.map((member, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-medium">Crew Member {index + 1}</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeCrewMember(index)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateCrewMember(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => updateCrewMember(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Signature *</label>
                    <input
                      type="text"
                      value={member.signature}
                      onChange={(e) => updateCrewMember(index, 'signature', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      placeholder="Type full name as signature"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Environmental Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Environmental Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Weather</label>
                <input
                  type="text"
                  value={formData.weatherConditions}
                  onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Clear, cloudy, rainy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Temperature (°F)</label>
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Wind Speed</label>
                <input
                  type="text"
                  value={formData.windSpeed}
                  onChange={(e) => setFormData({ ...formData, windSpeed: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Calm, light, strong"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Visibility</label>
                <input
                  type="text"
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Good, fair, poor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ground Conditions</label>
                <input
                  type="text"
                  value={formData.groundConditions}
                  onChange={(e) => setFormData({ ...formData, groundConditions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Dry, wet, icy"
                />
              </div>
            </div>
          </div>

          {/* Work Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Work Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Planned Start Time</label>
                <input
                  type="time"
                  value={formData.plannedStartTime}
                  onChange={(e) => setFormData({ ...formData, plannedStartTime: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Planned End Time</label>
                <input
                  type="time"
                  value={formData.plannedEndTime}
                  onChange={(e) => setFormData({ ...formData, plannedEndTime: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Duration</label>
                <input
                  type="text"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="e.g., 4 hours"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Work Scope</label>
              <textarea
                value={formData.workScope}
                onChange={(e) => setFormData({ ...formData, workScope: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Detailed description of work to be performed..."
              />
            </div>
          </div>

          {/* Required PPE */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Required Personal Protective Equipment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ppeOptions.map((ppe) => (
                <label key={ppe} className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.requiredPPE.includes(ppe)}
                    onChange={(e) => handlePPEChange(ppe, e.target.checked)}
                    className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                  />
                  {ppe}
                </label>
              ))}
            </div>
          </div>

          {/* Special Equipment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Special Equipment Required</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {equipmentOptions.map((equipment) => (
                <label key={equipment} className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.specialEquipment.includes(equipment)}
                    onChange={(e) => handleEquipmentChange(equipment, e.target.checked)}
                    className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                  />
                  {equipment}
                </label>
              ))}
            </div>
          </div>

          {/* Permits Required */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Permits Required</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permitOptions.map((permit) => (
                <label key={permit} className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.permits.includes(permit)}
                    onChange={(e) => handlePermitChange(permit, e.target.checked)}
                    className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                  />
                  {permit}
                </label>
              ))}
            </div>
          </div>

          {/* Hazard Identification */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Hazard Identification</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addHazard}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hazard
              </Button>
            </div>

            {formData.hazards.map((hazard, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-medium">Hazard {index + 1}</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeHazard(index)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Hazard Type *</label>
                    <input
                      type="text"
                      value={hazard.hazardType}
                      onChange={(e) => updateHazard(index, 'hazardType', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      placeholder="e.g., Fall hazard, Electrical"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Risk Level *</label>
                    <select
                      value={hazard.riskLevel}
                      onChange={(e) => updateHazard(index, 'riskLevel', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <span className={`text-sm font-medium ${getRiskColor(hazard.riskLevel)}`}>
                      {hazard.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Control Measures *</label>
                  <textarea
                    value={hazard.controlMeasures}
                    onChange={(e) => updateHazard(index, 'controlMeasures', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    placeholder="How will this hazard be controlled or mitigated?"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Emergency Contacts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Site Emergency</label>
                <input
                  type="tel"
                  value={formData.emergencyContacts.site}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    emergencyContacts: { ...formData.emergencyContacts, site: e.target.value } 
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Site emergency number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Medical Emergency</label>
                <input
                  type="tel"
                  value={formData.emergencyContacts.medical}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    emergencyContacts: { ...formData.emergencyContacts, medical: e.target.value } 
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fire Emergency</label>
                <input
                  type="tel"
                  value={formData.emergencyContacts.fire}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    emergencyContacts: { ...formData.emergencyContacts, fire: e.target.value } 
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Supervisor Contact</label>
                <input
                  type="tel"
                  value={formData.emergencyContacts.supervisor}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    emergencyContacts: { ...formData.emergencyContacts, supervisor: e.target.value } 
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
            </div>
          </div>

          {/* Safety Topics Discussed */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Safety Topics Discussed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {safetyTopics.map((topic) => (
                <label key={topic} className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.topicsDiscussed.includes(topic)}
                    onChange={(e) => handleTopicChange(topic, e.target.checked)}
                    className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                  />
                  {topic}
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Additional Safety Notes</label>
              <textarea
                value={formData.additionalSafetyNotes}
                onChange={(e) => setFormData({ ...formData, additionalSafetyNotes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Additional safety reminders or concerns discussed..."
              />
            </div>
          </div>

          {/* Pre-Work Inspection Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Pre-Work Inspection Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.inspectionChecklist).map(([key, value]) => (
                <label key={key} className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      inspectionChecklist: {
                        ...formData.inspectionChecklist,
                        [key]: e.target.checked
                      }
                    })}
                    className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                  />
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Completion & Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Supervisor Signature *</label>
                <input
                  type="text"
                  value={formData.supervisorSignature}
                  onChange={(e) => setFormData({ ...formData, supervisorSignature: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Type full name as signature"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Briefing Completion Time</label>
                <input
                  type="time"
                  value={formData.briefingTime}
                  onChange={(e) => setFormData({ ...formData, briefingTime: e.target.value })}
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
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Complete Safety Brief'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}