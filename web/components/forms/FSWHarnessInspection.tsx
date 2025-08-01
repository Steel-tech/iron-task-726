'use client'

import React, { useState } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, Save, Calendar, User, FileText, Download } from 'lucide-react'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

interface InspectionItem {
  id: string
  label: string
  status: 'pass' | 'fail' | 'na' | null
  notes: string
}

interface HarnessInspectionData {
  // Inspector Information
  inspectorName: string
  inspectorSignature: string
  inspectionDate: string
  
  // Equipment Information
  equipmentType: string
  manufacturer: string
  modelNumber: string
  serialNumber: string
  purchaseDate: string
  lastInspectionDate: string
  
  // Inspection Items - Visual
  visualInspection: InspectionItem[]
  
  // Inspection Items - Functional
  functionalInspection: InspectionItem[]
  
  // Overall Assessment
  overallStatus: 'pass' | 'fail' | null
  recommendedAction: string
  nextInspectionDate: string
  additionalNotes: string
}

interface FSWHarnessInspectionProps {
  projectId: string
  onSave?: (data: HarnessInspectionData) => void
}

export default function FSWHarnessInspection({ projectId, onSave }: FSWHarnessInspectionProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<HarnessInspectionData>({
    // Inspector Information
    inspectorName: '',
    inspectorSignature: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    
    // Equipment Information
    equipmentType: 'Full Body Harness',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    purchaseDate: '',
    lastInspectionDate: '',
    
    // Visual Inspection Items
    visualInspection: [
      { id: 'webbing', label: 'Webbing - Check for cuts, burns, chemical damage, excessive wear', status: null, notes: '' },
      { id: 'stitching', label: 'Stitching - Check for broken, cut, or pulled stitches', status: null, notes: '' },
      { id: 'buckles', label: 'Buckles - Check for cracks, distortion, sharp edges, corrosion', status: null, notes: '' },
      { id: 'dee_rings', label: 'D-Rings - Check for cracks, sharp edges, distortion, corrosion', status: null, notes: '' },
      { id: 'hardware', label: 'Hardware - Check all metal components for damage, wear, function', status: null, notes: '' },
      { id: 'labels', label: 'Labels - Check that all required labels are present and legible', status: null, notes: '' },
      { id: 'overall_condition', label: 'Overall Condition - General assessment of harness condition', status: null, notes: '' }
    ],
    
    // Functional Inspection Items
    functionalInspection: [
      { id: 'buckle_function', label: 'Buckle Function - All buckles engage and release properly', status: null, notes: '' },
      { id: 'adjuster_function', label: 'Adjuster Function - All adjusters move freely and hold position', status: null, notes: '' },
      { id: 'dee_ring_movement', label: 'D-Ring Movement - D-rings move freely without binding', status: null, notes: '' },
      { id: 'fit_adjustment', label: 'Fit Adjustment - Harness adjusts properly for user', status: null, notes: '' },
      { id: 'connection_points', label: 'Connection Points - All attachment points secure and functional', status: null, notes: '' }
    ],
    
    // Overall Assessment
    overallStatus: null,
    recommendedAction: '',
    nextInspectionDate: '',
    additionalNotes: ''
  })

  const updateInspectionItem = (
    section: 'visualInspection' | 'functionalInspection',
    itemId: string,
    field: 'status' | 'notes',
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }))
  }

  const getStatusIcon = (status: 'pass' | 'fail' | 'na' | null) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />
      case 'na': return <span className="h-5 w-5 flex items-center justify-center text-gray-500 text-xs font-bold">N/A</span>
      default: return <div className="h-5 w-5 border-2 border-gray-400 rounded" />
    }
  }

  const calculateOverallStatus = (): 'pass' | 'fail' | null => {
    const allItems = [...formData.visualInspection, ...formData.functionalInspection]
    const hasFailures = allItems.some(item => item.status === 'fail')
    const allChecked = allItems.every(item => item.status !== null)
    
    if (hasFailures) return 'fail'
    if (allChecked) return 'pass'
    return null
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Calculate overall status
      const overallStatus = calculateOverallStatus()
      const dataToSave = { ...formData, overallStatus }
      
      // Save to API (you'll need to create this endpoint)
      // await api.post(`/projects/${projectId}/harness-inspections`, dataToSave)
      
      toast({
        title: 'Success',
        description: 'Harness inspection saved successfully'
      })
      
      if (onSave) {
        onSave(dataToSave)
      }
      
      console.log('Harness Inspection Saved:', dataToSave)
    } catch (error) {
      console.error('Failed to save harness inspection:', error)
      toast({
        title: 'Error',
        description: 'Failed to save harness inspection',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = () => {
    // Implement PDF export functionality
    toast({
      title: 'Info',
      description: 'PDF export functionality will be implemented'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-safety-orange rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-shogun text-white">FSW Harness Inspection</h1>
            <p className="text-gray-400">Daily/Weekly Safety Equipment Inspection</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-safety-orange hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Inspection'}
          </Button>
        </div>
      </div>

      {/* Inspector Information */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-safety-orange" />
          Inspector Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Inspector Name</label>
            <input
              type="text"
              value={formData.inspectorName}
              onChange={(e) => setFormData(prev => ({ ...prev, inspectorName: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              placeholder="Enter inspector name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Inspection Date</label>
            <input
              type="date"
              value={formData.inspectionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Inspector Signature</label>
            <input
              type="text"
              value={formData.inspectorSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, inspectorSignature: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              placeholder="Digital signature or initials"
            />
          </div>
        </div>
      </div>

      {/* Equipment Information */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-safety-orange" />
          Equipment Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Equipment Type</label>
            <select
              value={formData.equipmentType}
              onChange={(e) => setFormData(prev => ({ ...prev, equipmentType: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
            >
              <option value="Full Body Harness">Full Body Harness</option>
              <option value="Positioning Harness">Positioning Harness</option>
              <option value="Suspension Harness">Suspension Harness</option>
              <option value="Retrieval Harness">Retrieval Harness</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Manufacturer</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              placeholder="e.g., Miller, MSA, 3M"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Model Number</label>
            <input
              type="text"
              value={formData.modelNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, modelNumber: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              placeholder="Enter model number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Serial Number</label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              placeholder="Enter serial number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Date</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Last Inspection Date</label>
            <input
              type="date"
              value={formData.lastInspectionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, lastInspectionDate: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
            />
          </div>
        </div>
      </div>

      {/* Visual Inspection */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-safety-orange" />
          Visual Inspection
        </h2>
        <div className="space-y-4">
          {formData.visualInspection.map((item) => (
            <div key={item.id} className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => updateInspectionItem('visualInspection', item.id, 'status', 'pass')}
                    className={`p-1 rounded ${item.status === 'pass' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
                  >
                    <CheckCircle className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => updateInspectionItem('visualInspection', item.id, 'status', 'fail')}
                    className={`p-1 rounded ${item.status === 'fail' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
                  >
                    <XCircle className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => updateInspectionItem('visualInspection', item.id, 'status', 'na')}
                    className={`p-1 rounded text-xs font-bold ${item.status === 'na' ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'} transition-colors text-white`}
                  >
                    N/A
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">{item.label}</p>
                  <textarea
                    value={item.notes}
                    onChange={(e) => updateInspectionItem('visualInspection', item.id, 'notes', e.target.value)}
                    placeholder="Add notes or observations..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange text-sm"
                    rows={2}
                  />
                </div>
                <div className="flex items-center">
                  {getStatusIcon(item.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Functional Inspection */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-safety-orange" />
          Functional Inspection
        </h2>
        <div className="space-y-4">
          {formData.functionalInspection.map((item) => (
            <div key={item.id} className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => updateInspectionItem('functionalInspection', item.id, 'status', 'pass')}
                    className={`p-1 rounded ${item.status === 'pass' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
                  >
                    <CheckCircle className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => updateInspectionItem('functionalInspection', item.id, 'status', 'fail')}
                    className={`p-1 rounded ${item.status === 'fail' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
                  >
                    <XCircle className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => updateInspectionItem('functionalInspection', item.id, 'status', 'na')}
                    className={`p-1 rounded text-xs font-bold ${item.status === 'na' ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'} transition-colors text-white`}
                  >
                    N/A
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">{item.label}</p>
                  <textarea
                    value={item.notes}
                    onChange={(e) => updateInspectionItem('functionalInspection', item.id, 'notes', e.target.value)}
                    placeholder="Add notes or observations..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange text-sm"
                    rows={2}
                  />
                </div>
                <div className="flex items-center">
                  {getStatusIcon(item.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-safety-orange" />
          Overall Assessment
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">Overall Status:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(calculateOverallStatus())}
              <span className={`font-semibold ${
                calculateOverallStatus() === 'pass' ? 'text-green-400' :
                calculateOverallStatus() === 'fail' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {calculateOverallStatus() === 'pass' ? 'PASS - Equipment Safe for Use' :
                 calculateOverallStatus() === 'fail' ? 'FAIL - Equipment Not Safe for Use' :
                 'Assessment Incomplete'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Recommended Action</label>
              <select
                value={formData.recommendedAction}
                onChange={(e) => setFormData(prev => ({ ...prev, recommendedAction: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              >
                <option value="">Select action...</option>
                <option value="Continue Use">Continue Use - No Issues Found</option>
                <option value="Minor Repair">Minor Repair Required</option>
                <option value="Major Repair">Major Repair Required</option>
                <option value="Remove from Service">Remove from Service</option>
                <option value="Replace">Replace Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Next Inspection Date</label>
              <input
                type="date"
                value={formData.nextInspectionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, nextInspectionDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Any additional observations, recommendations, or notes..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-safety-orange focus:border-safety-orange"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-400 font-semibold mb-2">Safety Reminder</h3>
            <p className="text-red-300 text-sm">
              If ANY item fails inspection, the harness must be immediately removed from service. 
              Do not use damaged equipment. Contact your safety coordinator immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}