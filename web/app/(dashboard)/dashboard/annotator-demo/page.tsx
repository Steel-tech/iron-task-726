'use client'

import { useState } from 'react'
import PhotoAnnotator from '@/components/PhotoAnnotator'
import { Button } from '@/components/Button'
import { Image, Save, RefreshCw } from 'lucide-react'
import { PencilRulerIcon } from '@/components/icons/SteelConstructionIcons'

const demoImages = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2000',
    title: 'Steel Beam Installation - Level 3'
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2000',
    title: 'Construction Site Overview'
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?q=80&w=2000',
    title: 'Welding Process Documentation'
  }
]

export default function AnnotatorDemoPage() {
  const [selectedImage, setSelectedImage] = useState(demoImages[0])
  const [savedAnnotations, setSavedAnnotations] = useState<any[]>([])
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const handleSave = (annotations: any[], imageDataUrl: string) => {
    setSavedAnnotations(annotations)
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
    
    // In a real app, you would save to API here
    console.log('Saved annotations:', annotations)
    console.log('Annotated image data URL length:', imageDataUrl.length)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PencilRulerIcon className="h-8 w-8 text-safety-orange" size={32} />
          <h1 className="text-3xl font-bold font-shogun text-white">Photo Annotator Demo</h1>
        </div>
      </div>

      {/* Info Box */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Annotation Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-medium text-white mb-2">Drawing Tools</h3>
            <ul className="space-y-1 text-gray-400">
              <li>• Arrows for pointing out issues</li>
              <li>• Circles to highlight areas</li>
              <li>• Rectangles for boxing sections</li>
              <li>• Text annotations</li>
              <li>• Measurement lines with labels</li>
              <li>• Company logo placement</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Safety Colors</h3>
            <ul className="space-y-1 text-gray-400">
              <li>• Safety Orange for warnings</li>
              <li>• Arc Yellow for attention</li>
              <li>• AISC Blue for info</li>
              <li>• Safety Green for approved</li>
              <li>• Alert Red for critical</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Features</h3>
            <ul className="space-y-1 text-gray-400">
              <li>• Undo/Redo support</li>
              <li>• Adjustable line thickness</li>
              <li>• Save annotated images</li>
              <li>• Download to device</li>
              <li>• Clear all annotations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Image Selection */}
      <div className="brushed-metal rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4">Select Demo Image</h3>
        <div className="flex gap-4">
          {demoImages.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className={`relative overflow-hidden rounded-lg transition-all ${
                selectedImage.id === image.id 
                  ? 'ring-2 ring-safety-orange scale-105' 
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-32 h-24 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                {image.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      {showSaveSuccess && (
        <div className="rounded-md bg-green-900/20 border border-green-800 p-4">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-400">
              Annotations saved successfully! {savedAnnotations.length} annotation{savedAnnotations.length !== 1 ? 's' : ''} added.
            </p>
          </div>
        </div>
      )}

      {/* Photo Annotator */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">{selectedImage.title}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
        </div>
        
        <PhotoAnnotator
          imageUrl={selectedImage.url}
          onSave={handleSave}
          autoEditMode={false}
        />
      </div>

      {/* Instructions */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Try It Out!</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <p>1. Select a tool from the toolbar above the image</p>
          <p>2. Choose your annotation color (safety orange is pre-selected)</p>
          <p>3. Click and drag on the image to create annotations</p>
          <p>4. For text annotations, click where you want the text and type</p>
          <p>5. Use the measurement tool to show dimensions</p>
          <p>6. Add your company logo with the hard hat icon</p>
          <p>7. Save your annotated image or download it directly</p>
        </div>
      </div>
    </div>
  )
}