'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { toast } from '@/components/ui/use-toast'

interface MediaTag {
  id: string
  tag: {
    id: string
    name: string
    color: string
    category?: string
  }
}

interface Tag {
  id: string
  name: string
  slug: string
  color: string
  category?: string
}

interface MediaTaggerProps {
  mediaId: string
  initialTags?: MediaTag[]
  onTagsUpdate?: (tags: MediaTag[]) => void
  compact?: boolean
}

export default function MediaTagger({ 
  mediaId, 
  initialTags = [], 
  onTagsUpdate,
  compact = false 
}: MediaTaggerProps) {
  const [tags, setTags] = useState<MediaTag[]>(initialTags)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAvailableTags()
  }, [])

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  const fetchAvailableTags = async () => {
    try {
      const response = await api.get('/tags')
      setAvailableTags(response.data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const handleAddTag = async (tag: Tag) => {
    if (tags.some(t => t.tag.id === tag.id)) {
      toast({
        title: 'Tag already added',
        description: `"${tag.name}" is already applied to this media`,
        variant: 'default'
      })
      return
    }

    setIsLoading(true)
    try {
      const currentTagIds = tags.map(t => t.tag.id)
      const response = await api.post('/tags/apply', {
        mediaId,
        tagIds: [...currentTagIds, tag.id]
      })
      
      const updatedTags = response.data.mediaTags
      setTags(updatedTags)
      onTagsUpdate?.(updatedTags)
      setIsOpen(false)
      
      toast({
        title: 'Tag added',
        description: `Added "${tag.name}" tag`,
      })
    } catch (error) {
      console.error('Failed to add tag:', error)
      toast({
        title: 'Error',
        description: 'Failed to add tag',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    setIsLoading(true)
    try {
      const updatedTagIds = tags
        .filter(t => t.tag.id !== tagId)
        .map(t => t.tag.id)
      
      const response = await api.post('/tags/apply', {
        mediaId,
        tagIds: updatedTagIds
      })
      
      const updatedTags = response.data.mediaTags
      setTags(updatedTags)
      onTagsUpdate?.(updatedTags)
      
      const removedTag = tags.find(t => t.tag.id === tagId)
      toast({
        title: 'Tag removed',
        description: `Removed "${removedTag?.tag.name}" tag`,
      })
    } catch (error) {
      console.error('Failed to remove tag:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove tag',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !tags.some(t => t.tag.id === tag.id)
  )

  const groupedTags = filteredTags.reduce((acc, tag) => {
    const category = tag.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {tags.map(mediaTag => (
          <Badge
            key={mediaTag.id}
            variant="secondary"
            className="px-2 py-1"
            style={{ 
              backgroundColor: `${mediaTag.tag.color}20`,
              borderColor: mediaTag.tag.color,
              color: mediaTag.tag.color
            }}
          >
            {mediaTag.tag.name}
          </Badge>
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={isLoading}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-gray-800 border-gray-700">
            <Command className="bg-transparent">
              <CommandInput 
                placeholder="Search tags..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 bg-transparent text-white placeholder:text-gray-400"
              />
              <CommandEmpty className="text-gray-400 p-4 text-center text-sm">
                No tags found
              </CommandEmpty>
              {Object.entries(groupedTags).map(([category, categoryTags]) => (
                <CommandGroup key={category} heading={category} className="text-gray-400">
                  {categoryTags.map(tag => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleAddTag(tag)}
                      className="text-white hover:bg-gray-700 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </h3>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-gray-800 border-gray-700">
            <Command className="bg-transparent">
              <CommandInput 
                placeholder="Search tags..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 bg-transparent text-white placeholder:text-gray-400"
              />
              <CommandEmpty className="text-gray-400 p-4 text-center text-sm">
                No tags found
              </CommandEmpty>
              {Object.entries(groupedTags).map(([category, categoryTags]) => (
                <CommandGroup key={category} heading={category} className="text-gray-400">
                  {categoryTags.map(tag => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleAddTag(tag)}
                      className="text-white hover:bg-gray-700 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400">No tags applied</p>
        ) : (
          tags.map(mediaTag => (
            <Badge
              key={mediaTag.id}
              variant="secondary"
              className="px-3 py-1 pr-2 flex items-center gap-2"
              style={{ 
                backgroundColor: `${mediaTag.tag.color}20`,
                borderColor: mediaTag.tag.color,
                color: mediaTag.tag.color
              }}
            >
              {mediaTag.tag.name}
              {mediaTag.tag.category && (
                <span className="text-xs opacity-70">• {mediaTag.tag.category}</span>
              )}
              <button
                onClick={() => handleRemoveTag(mediaTag.tag.id)}
                className="ml-1 hover:opacity-70 transition-opacity"
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}