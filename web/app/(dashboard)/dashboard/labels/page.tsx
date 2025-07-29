'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Tag, Hash, Palette, Building, DollarSign, Leaf } from 'lucide-react'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface ProjectLabel {
  id: string
  name: string
  slug: string
  type: string
  color: string
  description?: string
  icon?: string
  _count: {
    projects: number
  }
  createdBy: {
    id: string
    name: string
  }
}

const LABEL_TYPES = [
  { value: 'project_type', label: 'Project Type', icon: Building },
  { value: 'project_status', label: 'Project Status', icon: Tag },
  { value: 'budget_range', label: 'Budget Range', icon: DollarSign },
  { value: 'sustainability', label: 'Sustainability', icon: Leaf },
]

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6B7280', // Gray
]

const ICON_OPTIONS = [
  'building', 'factory', 'bridge', 'home',
  'pencil', 'clock', 'pause', 'check',
  'dollar', 'leaf', 'lightning', 'recycle',
  'shield', 'star', 'flag', 'target'
]

export default function LabelsPage() {
  const { user } = useAuth()
  const [labels, setLabels] = useState<ProjectLabel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLabel, setEditingLabel] = useState<ProjectLabel | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    color: '#10B981',
    description: '',
    icon: ''
  })

  const canManageLabels = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER'
  const canDeleteLabels = user?.role === 'ADMIN'

  useEffect(() => {
    fetchLabels()
  }, [selectedType])

  const fetchLabels = async () => {
    try {
      setIsLoading(true)
      const params = selectedType !== 'all' ? `?type=${selectedType}` : ''
      const response = await api.get(`/labels${params}`)
      setLabels(response.data)
    } catch (error) {
      console.error('Failed to fetch labels:', error)
      toast({
        title: 'Error',
        description: 'Failed to load labels',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLabel = async () => {
    try {
      const response = await api.post('/labels', formData)
      setLabels([...labels, response.data])
      setShowCreateDialog(false)
      resetForm()
      toast({
        title: 'Success',
        description: 'Label created successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create label',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateLabel = async () => {
    if (!editingLabel) return
    
    try {
      const response = await api.patch(`/labels/${editingLabel.id}`, formData)
      setLabels(labels.map(label => label.id === editingLabel.id ? response.data : label))
      setShowEditDialog(false)
      setEditingLabel(null)
      resetForm()
      toast({
        title: 'Success',
        description: 'Label updated successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update label',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label?')) return
    
    try {
      await api.delete(`/labels/${labelId}`)
      setLabels(labels.filter(label => label.id !== labelId))
      toast({
        title: 'Success',
        description: 'Label deleted successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete label',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      color: '#10B981',
      description: '',
      icon: ''
    })
  }

  const openEditDialog = (label: ProjectLabel) => {
    setEditingLabel(label)
    setFormData({
      name: label.name,
      type: label.type,
      color: label.color,
      description: label.description || '',
      icon: label.icon || ''
    })
    setShowEditDialog(true)
  }

  const groupedLabels = labels.reduce((acc, label) => {
    const type = label.type
    if (!acc[type]) acc[type] = []
    acc[type].push(label)
    return acc
  }, {} as Record<string, ProjectLabel[]>)

  const getTypeLabel = (type: string) => {
    return LABEL_TYPES.find(t => t.value === type)?.label || type
  }

  const getTypeIcon = (type: string) => {
    const TypeIcon = LABEL_TYPES.find(t => t.value === type)?.icon || Tag
    return <TypeIcon className="h-5 w-5 text-safety-orange" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-8 w-8 text-safety-orange" />
          <h1 className="text-3xl font-bold font-shogun text-white">Label Management</h1>
        </div>
        {canManageLabels && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-safety-orange hover:bg-safety-orange/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Label
          </Button>
        )}
      </div>

      {/* Type Filter */}
      <div className="brushed-metal rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-400">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-safety-orange text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Types
            </button>
            {LABEL_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedType === type.value
                    ? 'bg-safety-orange text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <type.icon className="h-4 w-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Labels Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety-orange mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLabels).map(([type, typeLabels]) => (
            <div key={type} className="brushed-metal rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                {getTypeIcon(type)}
                {getTypeLabel(type)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {typeLabels.map(label => (
                  <div
                    key={label.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <h3 className="font-medium text-white">{label.name}</h3>
                      </div>
                      {label.icon && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                          {label.icon}
                        </span>
                      )}
                    </div>
                    
                    {label.description && (
                      <p className="text-sm text-gray-400 mb-2">{label.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {label._count.projects} projects
                      </span>
                      
                      {canManageLabels && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(label)}
                            className="h-8 w-8 text-gray-400 hover:text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {canDeleteLabels && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLabel(label.id)}
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Label Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-steel-gray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter label name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="type" className="text-white">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {LABEL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="color" className="text-white">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 bg-gray-800 border-gray-700"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-8 h-8 rounded hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="icon" className="text-white">Icon (Optional)</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="" className="text-white">No icon</SelectItem>
                  {ICON_OPTIONS.map(icon => (
                    <SelectItem key={icon} value={icon} className="text-white">
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter label description"
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLabel}
                disabled={!formData.name || !formData.type}
                className="bg-safety-orange hover:bg-safety-orange/90"
              >
                Create Label
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Label Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-steel-gray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-white">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter label name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-type" className="text-white">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white opacity-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {LABEL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">Type cannot be changed</p>
            </div>
            
            <div>
              <Label htmlFor="edit-color" className="text-white">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 bg-gray-800 border-gray-700"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-8 h-8 rounded hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-icon" className="text-white">Icon (Optional)</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="" className="text-white">No icon</SelectItem>
                  {ICON_OPTIONS.map(icon => (
                    <SelectItem key={icon} value={icon} className="text-white">
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter label description"
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingLabel(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateLabel}
                disabled={!formData.name}
                className="bg-safety-orange hover:bg-safety-orange/90"
              >
                Update Label
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}