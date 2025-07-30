'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Package, Truck, CheckCircle, AlertTriangle, X, Plus, FileText } from 'lucide-react'

interface MaterialItem {
  description: string
  specificationGrade: string
  quantityOrdered: string
  quantityDelivered: string
  unit: string
  condition: 'good' | 'damaged' | 'defective' | 'incomplete'
  conditionNotes: string
  certificationReceived: boolean
  certificationNumber: string
}

interface DeliveryPhoto {
  description: string
  photoType: 'overall' | 'damage' | 'labeling' | 'documentation' | 'other'
}

interface MaterialDeliveryData {
  deliveryDate: string
  deliveryTime: string
  projectLocation: string
  poNumber: string
  supplier: string
  supplierContact: string
  driver: string
  truckInfo: string
  
  // Delivery Details
  scheduledDelivery: boolean
  deliveryMethod: 'truck' | 'crane' | 'forklift' | 'manual' | 'other'
  deliveryMethodOther: string
  weatherConditions: string
  accessConditions: string
  
  // Materials
  materials: MaterialItem[]
  
  // Quality Control
  materialsInspected: boolean
  dimensionsVerified: boolean
  markingsLegible: boolean
  protectiveCoatingsIntact: boolean
  storageRequirements: string
  
  // Issues & Documentation
  deliveryIssues: boolean
  issueDescription: string
  correctiveActions: string
  photosRequired: boolean
  photos: DeliveryPhoto[]
  
  // Certifications & Documentation
  millCertificates: boolean
  testReports: boolean
  complianceDocs: boolean
  invoiceReceived: boolean
  documentsComplete: boolean
  missingDocuments: string
  
  // Signatures
  receivedBy: string
  receiverSignature: string
  driverSignature: string
  inspectorName: string
  inspectorSignature: string
  notes: string
}

interface FSWMaterialDeliveryLogProps {
  projectId: string
}

export default function FSWMaterialDeliveryLog({ projectId }: FSWMaterialDeliveryLogProps) {
  const [formData, setFormData] = useState<MaterialDeliveryData>({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: new Date().toTimeString().slice(0, 5),
    projectLocation: '',
    poNumber: '',
    supplier: '',
    supplierContact: '',
    driver: '',
    truckInfo: '',
    
    scheduledDelivery: true,
    deliveryMethod: 'truck',
    deliveryMethodOther: '',
    weatherConditions: '',
    accessConditions: '',
    
    materials: [
      {
        description: '',
        specificationGrade: '',
        quantityOrdered: '',
        quantityDelivered: '',
        unit: 'tons',
        condition: 'good',
        conditionNotes: '',
        certificationReceived: false,
        certificationNumber: ''
      }
    ],
    
    materialsInspected: false,
    dimensionsVerified: false,
    markingsLegible: false,
    protectiveCoatingsIntact: false,
    storageRequirements: '',
    
    deliveryIssues: false,
    issueDescription: '',
    correctiveActions: '',
    photosRequired: false,
    photos: [],
    
    millCertificates: false,
    testReports: false,
    complianceDocs: false,
    invoiceReceived: false,
    documentsComplete: false,
    missingDocuments: '',
    
    receivedBy: '',
    receiverSignature: '',
    driverSignature: '',
    inspectorName: '',
    inspectorSignature: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, {
        description: '',
        specificationGrade: '',
        quantityOrdered: '',
        quantityDelivered: '',
        unit: 'tons',
        condition: 'good',
        conditionNotes: '',
        certificationReceived: false,
        certificationNumber: ''
      }]
    }))
  }

  const updateMaterial = (index: number, field: keyof MaterialItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) =>
        i === index ? { ...material, [field]: value } : material
      )
    }))
  }

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }))
  }

  const addPhoto = () => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, { description: '', photoType: 'overall' }]
    }))
  }

  const updatePhoto = (index: number, field: keyof DeliveryPhoto, value: any) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.map((photo, i) =>
        i === index ? { ...photo, [field]: value } : photo
      )
    }))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const getConditionColor = (condition: MaterialItem['condition']) => {
    switch (condition) {
      case 'good': return 'text-green-400'
      case 'damaged': return 'text-orange-400'
      case 'defective': return 'text-red-400'
      case 'incomplete': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getConditionIcon = (condition: MaterialItem['condition']) => {
    switch (condition) {
      case 'good': return <CheckCircle className="h-4 w-4" />
      case 'damaged': return <AlertTriangle className="h-4 w-4" />
      case 'defective': return <X className="h-4 w-4" />
      case 'incomplete': return <AlertTriangle className="h-4 w-4" />
      default: return null
    }
  }

  const unitOptions = ['tons', 'lbs', 'kg', 'pieces', 'feet', 'meters', 'rolls', 'bundles', 'sheets']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Material Delivery Log submitted successfully!')
      
      // Reset form would go here in production
    } catch (error) {
      alert('Failed to submit delivery log. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="brushed-metal rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-shogun text-white">Material Delivery Log</h2>
            <p className="text-gray-400">Track material deliveries, quantities, and condition upon arrival</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Delivery Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Delivery Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Delivery Date *</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Delivery Time *</label>
                <input
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">PO Number *</label>
                <input
                  type="text"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.scheduledDelivery}
                    onChange={(e) => setFormData({ ...formData, scheduledDelivery: e.target.checked })}
                    className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                  />
                  Scheduled Delivery
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Location *</label>
                <input
                  type="text"
                  value={formData.projectLocation}
                  onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Supplier *</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Supplier Contact</label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Phone or email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Driver Name</label>
                <input
                  type="text"
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Truck/Vehicle Info</label>
                <input
                  type="text"
                  value={formData.truckInfo}
                  onChange={(e) => setFormData({ ...formData, truckInfo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="License plate, truck number"
                />
              </div>
            </div>
          </div>

          {/* Delivery Method & Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Delivery Method & Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Delivery Method</label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as MaterialDeliveryData['deliveryMethod'] })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                >
                  <option value="truck">Truck</option>
                  <option value="crane">Crane</option>
                  <option value="forklift">Forklift</option>
                  <option value="manual">Manual</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {formData.deliveryMethod === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Other Method</label>
                  <input
                    type="text"
                    value={formData.deliveryMethodOther}
                    onChange={(e) => setFormData({ ...formData, deliveryMethodOther: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Weather Conditions</label>
                <input
                  type="text"
                  value={formData.weatherConditions}
                  onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Clear, rainy, windy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Access Conditions</label>
                <input
                  type="text"
                  value={formData.accessConditions}
                  onChange={(e) => setFormData({ ...formData, accessConditions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Good, restricted, muddy"
                />
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Materials Delivered</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addMaterial}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>

            {formData.materials.map((material, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-medium">Material {index + 1}</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeMaterial(index)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                    <input
                      type="text"
                      value={material.description}
                      onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      placeholder="Steel beams, rebar, plates, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Specification/Grade</label>
                    <input
                      type="text"
                      value={material.specificationGrade}
                      onChange={(e) => updateMaterial(index, 'specificationGrade', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      placeholder="e.g., A992, Grade 60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Qty Ordered</label>
                    <input
                      type="number"
                      step="0.01"
                      value={material.quantityOrdered}
                      onChange={(e) => updateMaterial(index, 'quantityOrdered', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Qty Delivered *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={material.quantityDelivered}
                      onChange={(e) => updateMaterial(index, 'quantityDelivered', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                    <select
                      value={material.unit}
                      onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    >
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Condition *</label>
                    <select
                      value={material.condition}
                      onChange={(e) => updateMaterial(index, 'condition', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      required
                    >
                      <option value="good">Good</option>
                      <option value="damaged">Damaged</option>
                      <option value="defective">Defective</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={material.certificationReceived}
                        onChange={(e) => updateMaterial(index, 'certificationReceived', e.target.checked)}
                        className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                      />
                      Cert Received
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`flex items-center gap-1 text-sm ${getConditionColor(material.condition)}`}>
                    {getConditionIcon(material.condition)}
                    {material.condition.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Condition Notes</label>
                    <textarea
                      value={material.conditionNotes}
                      onChange={(e) => updateMaterial(index, 'conditionNotes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      placeholder="Describe any damage, defects, or issues"
                    />
                  </div>
                  {material.certificationReceived && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Certification Number</label>
                      <input
                        type="text"
                        value={material.certificationNumber}
                        onChange={(e) => updateMaterial(index, 'certificationNumber', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quality Control Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Quality Control Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.materialsInspected}
                  onChange={(e) => setFormData({ ...formData, materialsInspected: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Materials visually inspected
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.dimensionsVerified}
                  onChange={(e) => setFormData({ ...formData, dimensionsVerified: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Dimensions verified
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.markingsLegible}
                  onChange={(e) => setFormData({ ...formData, markingsLegible: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Markings/labels legible
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.protectiveCoatingsIntact}
                  onChange={(e) => setFormData({ ...formData, protectiveCoatingsIntact: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Protective coatings intact
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Storage Requirements</label>
              <textarea
                value={formData.storageRequirements}
                onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Special storage requirements or location notes"
              />
            </div>
          </div>

          {/* Issues & Documentation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Issues & Documentation</h3>
            <div className="flex items-center">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.deliveryIssues}
                  onChange={(e) => setFormData({ ...formData, deliveryIssues: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Delivery issues encountered
              </label>
            </div>

            {formData.deliveryIssues && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Issue Description</label>
                  <textarea
                    value={formData.issueDescription}
                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    placeholder="Describe the issues encountered"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Corrective Actions</label>
                  <textarea
                    value={formData.correctiveActions}
                    onChange={(e) => setFormData({ ...formData, correctiveActions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    placeholder="Actions taken to resolve issues"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.photosRequired}
                  onChange={(e) => setFormData({ ...formData, photosRequired: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Photos required/taken
              </label>
            </div>

            {formData.photosRequired && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Photo Documentation</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addPhoto}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Photo
                  </Button>
                </div>

                {formData.photos.map((photo, index) => (
                  <div key={index} className="bg-gray-800/30 p-3 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-sm">Photo {index + 1}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removePhoto(index)}
                        className="border-red-600 text-red-400 hover:bg-red-900/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Photo Type</label>
                        <select
                          value={photo.photoType}
                          onChange={(e) => updatePhoto(index, 'photoType', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-safety-orange"
                        >
                          <option value="overall">Overall view</option>
                          <option value="damage">Damage documentation</option>
                          <option value="labeling">Labeling/markings</option>
                          <option value="documentation">Documentation</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                        <input
                          type="text"
                          value={photo.description}
                          onChange={(e) => updatePhoto(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-safety-orange"
                          placeholder="What does this photo show?"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications & Documentation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Certifications & Documentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.millCertificates}
                  onChange={(e) => setFormData({ ...formData, millCertificates: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Mill certificates received
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.testReports}
                  onChange={(e) => setFormData({ ...formData, testReports: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Test reports received
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.complianceDocs}
                  onChange={(e) => setFormData({ ...formData, complianceDocs: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Compliance documents
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.invoiceReceived}
                  onChange={(e) => setFormData({ ...formData, invoiceReceived: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                Invoice received
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.documentsComplete}
                  onChange={(e) => setFormData({ ...formData, documentsComplete: e.target.checked })}
                  className="mr-2 rounded border-gray-700 bg-gray-800 text-safety-orange focus:ring-2 focus:ring-safety-orange"
                />
                All documents complete
              </label>
            </div>

            {!formData.documentsComplete && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Missing Documents</label>
                <textarea
                  value={formData.missingDocuments}
                  onChange={(e) => setFormData({ ...formData, missingDocuments: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="List any missing or incomplete documentation"
                />
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Additional Notes</h3>
            <div>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Any additional notes, observations, or special instructions..."
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Received By *</label>
                <input
                  type="text"
                  value={formData.receivedBy}
                  onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Receiver Signature *</label>
                <input
                  type="text"
                  value={formData.receiverSignature}
                  onChange={(e) => setFormData({ ...formData, receiverSignature: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Type full name as signature"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Driver Signature</label>
                <input
                  type="text"
                  value={formData.driverSignature}
                  onChange={(e) => setFormData({ ...formData, driverSignature: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Type full name as signature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Inspector Name</label>
                <input
                  type="text"
                  value={formData.inspectorName}
                  onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>
            </div>

            {formData.inspectorName && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Inspector Signature</label>
                  <input
                    type="text"
                    value={formData.inspectorSignature}
                    onChange={(e) => setFormData({ ...formData, inspectorSignature: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                    placeholder="Type full name as signature"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Delivery Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}