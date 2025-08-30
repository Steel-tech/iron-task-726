'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import {
  Settings,
  Wrench,
  Zap,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Trash2,
} from 'lucide-react'

interface InspectionItem {
  item: string
  serialNumber?: string
  condition: 'good' | 'fair' | 'poor' | 'out_of_service' | null
  notes: string
}

interface ToolInspectionData {
  inspectorName: string
  inspectionDate: string
  inspectionType: 'daily' | 'weekly' | 'monthly'
  powerTools: InspectionItem[]
  handTools: InspectionItem[]
  safetyEquipment: InspectionItem[]
  weldingEquipment: InspectionItem[]
  additionalNotes: string
  inspectorSignature: string
  nextInspectionDate: string
}

interface FSWToolInspectionProps {
  projectId: string
}

export default function FSWToolInspection({
  projectId,
}: FSWToolInspectionProps) {
  const [formData, setFormData] = useState<ToolInspectionData>({
    inspectorName: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionType: 'daily',
    powerTools: [
      { item: 'Angle Grinder', serialNumber: '', condition: null, notes: '' },
      { item: 'Impact Wrench', serialNumber: '', condition: null, notes: '' },
      { item: 'Drill/Driver', serialNumber: '', condition: null, notes: '' },
    ],
    handTools: [
      { item: 'Wrenches Set', serialNumber: '', condition: null, notes: '' },
      { item: 'Socket Set', serialNumber: '', condition: null, notes: '' },
      { item: 'Measuring Tools', serialNumber: '', condition: null, notes: '' },
    ],
    safetyEquipment: [
      { item: 'First Aid Kit', serialNumber: '', condition: null, notes: '' },
      {
        item: 'Fire Extinguisher',
        serialNumber: '',
        condition: null,
        notes: '',
      },
      {
        item: 'Emergency Eyewash',
        serialNumber: '',
        condition: null,
        notes: '',
      },
    ],
    weldingEquipment: [
      { item: 'Welding Machine', serialNumber: '', condition: null, notes: '' },
      { item: 'Gas Bottles', serialNumber: '', condition: null, notes: '' },
      { item: 'Welding Leads', serialNumber: '', condition: null, notes: '' },
    ],
    additionalNotes: '',
    inspectorSignature: '',
    nextInspectionDate: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateInspectionItem = (
    category: keyof Pick<
      ToolInspectionData,
      'powerTools' | 'handTools' | 'safetyEquipment' | 'weldingEquipment'
    >,
    index: number,
    field: keyof InspectionItem,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addInspectionItem = (
    category: keyof Pick<
      ToolInspectionData,
      'powerTools' | 'handTools' | 'safetyEquipment' | 'weldingEquipment'
    >
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: [
        ...prev[category],
        { item: '', serialNumber: '', condition: null, notes: '' },
      ],
    }))
  }

  const removeInspectionItem = (
    category: keyof Pick<
      ToolInspectionData,
      'powerTools' | 'handTools' | 'safetyEquipment' | 'weldingEquipment'
    >,
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }))
  }

  const getConditionColor = (condition: InspectionItem['condition']) => {
    switch (condition) {
      case 'good':
        return 'text-green-400'
      case 'fair':
        return 'text-yellow-400'
      case 'poor':
        return 'text-orange-400'
      case 'out_of_service':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getConditionIcon = (condition: InspectionItem['condition']) => {
    switch (condition) {
      case 'good':
        return <CheckCircle className="h-4 w-4" />
      case 'fair':
        return <AlertTriangle className="h-4 w-4" />
      case 'poor':
        return <AlertTriangle className="h-4 w-4" />
      case 'out_of_service':
        return <X className="h-4 w-4" />
      default:
        return null
    }
  }

  const renderInspectionCategory = (
    title: string,
    category: keyof Pick<
      ToolInspectionData,
      'powerTools' | 'handTools' | 'safetyEquipment' | 'weldingEquipment'
    >,
    icon: React.ReactNode
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => addInspectionItem(category)}
          className="border-gray-600 text-white hover:bg-gray-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="space-y-3">
        {formData[category].map((item, index) => (
          <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tool/Equipment *
                </label>
                <input
                  type="text"
                  value={item.item}
                  onChange={e =>
                    updateInspectionItem(
                      category,
                      index,
                      'item',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Enter tool/equipment name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={item.serialNumber || ''}
                  onChange={e =>
                    updateInspectionItem(
                      category,
                      index,
                      'serialNumber',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  placeholder="Serial number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Condition *
                </label>
                <select
                  value={item.condition || ''}
                  onChange={e =>
                    updateInspectionItem(
                      category,
                      index,
                      'condition',
                      e.target.value as InspectionItem['condition']
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                >
                  <option value="">Select condition</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeInspectionItem(category, index)}
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span
                className={`flex items-center gap-1 text-sm ${getConditionColor(item.condition)}`}
              >
                {getConditionIcon(item.condition)}
                {item.condition &&
                  item.condition.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={item.notes}
                onChange={e =>
                  updateInspectionItem(category, index, 'notes', e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="Additional notes, issues, or maintenance needed..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Tool Inspection Form Data:', formData)
      alert('Tool & Equipment Inspection submitted successfully!')

      // Reset form
      setFormData({
        inspectorName: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectionType: 'daily',
        powerTools: [
          {
            item: 'Angle Grinder',
            serialNumber: '',
            condition: null,
            notes: '',
          },
          {
            item: 'Impact Wrench',
            serialNumber: '',
            condition: null,
            notes: '',
          },
          {
            item: 'Drill/Driver',
            serialNumber: '',
            condition: null,
            notes: '',
          },
        ],
        handTools: [
          {
            item: 'Wrenches Set',
            serialNumber: '',
            condition: null,
            notes: '',
          },
          { item: 'Socket Set', serialNumber: '', condition: null, notes: '' },
          {
            item: 'Measuring Tools',
            serialNumber: '',
            condition: null,
            notes: '',
          },
        ],
        safetyEquipment: [
          {
            item: 'First Aid Kit',
            serialNumber: '',
            condition: null,
            notes: '',
          },
          {
            item: 'Fire Extinguisher',
            serialNumber: '',
            condition: null,
            notes: '',
          },
          {
            item: 'Emergency Eyewash',
            serialNumber: '',
            condition: null,
            notes: '',
          },
        ],
        weldingEquipment: [
          {
            item: 'Welding Machine',
            serialNumber: '',
            condition: null,
            notes: '',
          },
          { item: 'Gas Bottles', serialNumber: '', condition: null, notes: '' },
          {
            item: 'Welding Leads',
            serialNumber: '',
            condition: null,
            notes: '',
          },
        ],
        additionalNotes: '',
        inspectorSignature: '',
        nextInspectionDate: '',
      })
    } catch (error) {
      alert('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="brushed-metal rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-safety-orange rounded-lg">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-shogun text-white">
              Tool & Equipment Inspection
            </h2>
            <p className="text-gray-400">
              Daily/weekly inspection of tools and equipment
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Inspector Name *
              </label>
              <input
                type="text"
                value={formData.inspectorName}
                onChange={e =>
                  setFormData({ ...formData, inspectorName: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-safety-orange"
                required
                placeholder="Enter inspector name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Inspection Date *
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={e =>
                  setFormData({ ...formData, inspectionDate: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-safety-orange"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Inspection Type *
              </label>
              <select
                value={formData.inspectionType}
                onChange={e =>
                  setFormData({
                    ...formData,
                    inspectionType: e.target
                      .value as ToolInspectionData['inspectionType'],
                  })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-safety-orange"
                required
              >
                <option value="daily">Daily Inspection</option>
                <option value="weekly">Weekly Inspection</option>
                <option value="monthly">Monthly Inspection</option>
              </select>
            </div>
          </div>

          {/* Inspection Categories */}
          {renderInspectionCategory(
            'Power Tools',
            'powerTools',
            <Zap className="h-5 w-5 text-safety-orange" />
          )}
          {renderInspectionCategory(
            'Hand Tools',
            'handTools',
            <Wrench className="h-5 w-5 text-aisc-blue" />
          )}
          {renderInspectionCategory(
            'Safety Equipment',
            'safetyEquipment',
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          )}
          {renderInspectionCategory(
            'Welding Equipment',
            'weldingEquipment',
            <Settings className="h-5 w-5 text-green-400" />
          )}

          {/* Additional Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={e =>
                  setFormData({ ...formData, additionalNotes: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-safety-orange"
                placeholder="General observations, maintenance recommendations, or other notes..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Next Inspection Date
                </label>
                <input
                  type="date"
                  value={formData.nextInspectionDate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      nextInspectionDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-safety-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Inspector Signature *
                </label>
                <input
                  type="text"
                  value={formData.inspectorSignature}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      inspectorSignature: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-safety-orange"
                  required
                  placeholder="Type full name as signature"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-safety-orange hover:bg-orange-700 text-white font-bold px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
