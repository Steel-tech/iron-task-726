'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/Button'
import PhotoAnnotator from '@/components/PhotoAnnotator'

interface PhotoAnnotatorModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title?: string
  onSave?: (annotations: any[], imageDataUrl: string) => void
  companyLogoUrl?: string
}

export default function PhotoAnnotatorModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Edit Photo',
  onSave,
  companyLogoUrl,
}: PhotoAnnotatorModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async (annotations: any[], imageDataUrl: string) => {
    setIsSaving(true)
    try {
      await onSave?.(annotations, imageDataUrl)
      onClose()
    } catch (error) {
      console.error('Failed to save annotations:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative max-w-[90vw] max-h-[90vh] bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="brushed-metal border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Annotator */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
          <PhotoAnnotator
            imageUrl={imageUrl}
            onSave={handleSave}
            companyLogoUrl={companyLogoUrl}
          />
        </div>
      </div>
    </div>
  )
}
