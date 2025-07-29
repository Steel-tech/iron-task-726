'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Tag, Hash, Palette } from 'lucide-react'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface Tag {
  id: string
  name: string
  slug: string
  color: string
  description?: string
  category?: string
  isSystem: boolean
  _count: {
    mediaTags: number
  }
  createdBy: {
    id: string
    name: string
  }
}

const TAG_CATEGORIES = [
  'Material',
  'Location',
  'Status',
  'Trade',
  'Equipment',
  'Safety',
  'Quality',
  'Other'
]

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6B7280', // Gray
]

export default function TagsPage() {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
    category: '',
    isSystem: false
  })

  const canManageTags = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER'
  const canDeleteTags = user?.role === 'ADMIN'

  useEffect(() => {
    fetchTags()
  }, [selectedCategory])

  const fetchTags = async () => {
    try {
      setIsLoading(true)
      const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''
      const response = await api.get(`/tags${params}`)
      setTags(response.data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTag = async () => {
    try {
      const response = await api.post('/tags', formData)
      setTags([...tags, response.data])
      setShowCreateDialog(false)
      resetForm()
      toast({
        title: 'Success',
        description: 'Tag created successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create tag',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag) return
    
    try {
      const response = await api.patch(`/tags/${editingTag.id}`, formData)
      setTags(tags.map(tag => tag.id === editingTag.id ? response.data : tag))
      setShowEditDialog(false)
      setEditingTag(null)
      resetForm()
      toast({
        title: 'Success',
        description: 'Tag updated successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update tag',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return
    
    try {
      await api.delete(`/tags/${tagId}`)
      setTags(tags.filter(tag => tag.id !== tagId))
      toast({
        title: 'Success',
        description: 'Tag deleted successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete tag',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      description: '',
      category: '',
      isSystem: false
    })
  }

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
      category: tag.category || '',
      isSystem: tag.isSystem
    })
    setShowEditDialog(true)
  }

  const groupedTags = tags.reduce((acc, tag) => {
    const category = tag.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-8 w-8 text-safety-orange" />
          <h1 className="text-3xl font-bold font-shogun text-white">Tag Management</h1>
        </div>
        {canManageTags && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-safety-orange hover:bg-safety-orange/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="brushed-metal rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-400">Filter by category:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-safety-orange text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Categories
            </button>
            {TAG_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-safety-orange text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safety-orange mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTags).map(([category, categoryTags]) => (
            <div key={category} className="brushed-metal rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-safety-orange" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryTags.map(tag => (
                  <div
                    key={tag.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <h3 className="font-medium text-white">{tag.name}</h3>
                      </div>
                      {tag.isSystem && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                          System
                        </span>
                      )}
                    </div>
                    
                    {tag.description && (
                      <p className="text-sm text-gray-400 mb-2">{tag.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {tag._count.mediaTags} uses
                      </span>
                      
                      {canManageTags && !tag.isSystem && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tag)}
                            className="h-8 w-8 text-gray-400 hover:text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {canDeleteTags && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTag(tag.id)}
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

      {/* Create Tag Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-steel-gray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter tag name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="category" className="text-white">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {TAG_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="text-white">
                      {category}
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
              <Label htmlFor="description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter tag description"
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
                onClick={handleCreateTag}
                disabled={!formData.name}
                className="bg-safety-orange hover:bg-safety-orange/90"
              >
                Create Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-steel-gray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-white">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter tag name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category" className="text-white">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {TAG_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="text-white">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="edit-description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter tag description"
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingTag(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTag}
                disabled={!formData.name}
                className="bg-safety-orange hover:bg-safety-orange/90"
              >
                Update Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}