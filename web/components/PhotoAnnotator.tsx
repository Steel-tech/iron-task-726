'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Type,
  Circle,
  Square,
  ArrowRight,
  Ruler,
  AlertTriangle,
  Download,
  Save,
  Undo,
  Redo,
  Trash2,
  Move,
  Palette,
  Image as ImageIcon,
  Plus,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { HardHatIcon } from '@/components/icons/SteelConstructionIcons'

interface Annotation {
  id: string
  type: 'text' | 'arrow' | 'circle' | 'rectangle' | 'measurement' | 'logo'
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color: string
  fontSize?: number
  endX?: number
  endY?: number
  strokeWidth: number
}

interface PhotoAnnotatorProps {
  imageUrl: string
  onSave?: (annotations: Annotation[], imageDataUrl: string) => void
  initialAnnotations?: Annotation[]
  companyLogoUrl?: string
  autoEditMode?: boolean
}

export default function PhotoAnnotator({
  imageUrl,
  onSave,
  initialAnnotations = [],
  companyLogoUrl = '/logo.png',
  autoEditMode = false,
}: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [annotations, setAnnotations] =
    useState<Annotation[]>(initialAnnotations)
  const [selectedTool, setSelectedTool] = useState<
    'text' | 'arrow' | 'circle' | 'rectangle' | 'measurement' | 'logo' | 'move'
  >('arrow')
  const [selectedColor, setSelectedColor] = useState('#ff6600') // Safety orange
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [fontSize, setFontSize] = useState(24)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [currentAnnotation, setCurrentAnnotation] =
    useState<Partial<Annotation> | null>(null)
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  )
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInputValue, setTextInputValue] = useState('')
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 })

  const colors = [
    { name: 'Safety Orange', value: '#ff6600' },
    { name: 'Arc Yellow', value: '#ffcc00' },
    { name: 'AISC Blue', value: '#0072ce' },
    { name: 'Safety Green', value: '#33cc33' },
    { name: 'Alert Red', value: '#ff0000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
  ]

  useEffect(() => {
    loadImage()
  }, [imageUrl])

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas()
    }
  }, [annotations, imageLoaded])

  const loadImage = () => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      if (canvasRef.current) {
        canvasRef.current.width = img.width
        canvasRef.current.height = img.height
        redrawCanvas()
      }
    }
    img.src = imageUrl
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !imageRef.current) return

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0)

    // Draw annotations
    annotations.forEach(annotation => {
      ctx.save()

      switch (annotation.type) {
        case 'text':
          ctx.font = `bold ${annotation.fontSize}px Arial`
          ctx.fillStyle = annotation.color
          ctx.strokeStyle = 'black'
          ctx.lineWidth = 3
          ctx.strokeText(annotation.text || '', annotation.x, annotation.y)
          ctx.fillText(annotation.text || '', annotation.x, annotation.y)
          break

        case 'arrow':
          drawArrow(
            ctx,
            annotation.x,
            annotation.y,
            annotation.endX || 0,
            annotation.endY || 0,
            annotation.color,
            annotation.strokeWidth
          )
          break

        case 'circle':
          ctx.strokeStyle = annotation.color
          ctx.lineWidth = annotation.strokeWidth
          ctx.beginPath()
          const radius =
            Math.sqrt(
              Math.pow(annotation.width || 0, 2) +
                Math.pow(annotation.height || 0, 2)
            ) / 2
          ctx.arc(annotation.x, annotation.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
          break

        case 'rectangle':
          ctx.strokeStyle = annotation.color
          ctx.lineWidth = annotation.strokeWidth
          ctx.strokeRect(
            annotation.x,
            annotation.y,
            annotation.width || 0,
            annotation.height || 0
          )
          break

        case 'measurement':
          drawMeasurement(ctx, annotation)
          break

        case 'logo':
          // Draw logo (would load actual logo image)
          ctx.fillStyle = annotation.color
          ctx.globalAlpha = 0.8
          ctx.fillRect(
            annotation.x,
            annotation.y,
            annotation.width || 150,
            annotation.height || 50
          )
          ctx.globalAlpha = 1
          ctx.fillStyle = 'white'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            'FSW LOGO',
            annotation.x + (annotation.width || 150) / 2,
            annotation.y + (annotation.height || 50) / 2
          )
          break
      }

      ctx.restore()
    })

    // Draw current annotation being created
    if (currentAnnotation && isDrawing) {
      ctx.save()
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = strokeWidth

      switch (selectedTool) {
        case 'arrow':
          drawArrow(
            ctx,
            startPoint.x,
            startPoint.y,
            currentAnnotation.endX || 0,
            currentAnnotation.endY || 0,
            selectedColor,
            strokeWidth
          )
          break
        case 'circle':
          const radius =
            Math.sqrt(
              Math.pow(currentAnnotation.width || 0, 2) +
                Math.pow(currentAnnotation.height || 0, 2)
            ) / 2
          ctx.beginPath()
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
          break
        case 'rectangle':
          ctx.strokeRect(
            startPoint.x,
            startPoint.y,
            currentAnnotation.width || 0,
            currentAnnotation.height || 0
          )
          break
      }

      ctx.restore()
    }
  }

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    width: number
  ) => {
    const headlen = 15
    const angle = Math.atan2(toY - fromY, toX - fromX)

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = width

    // Draw line
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()

    // Draw arrowhead
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }

  const drawMeasurement = (
    ctx: CanvasRenderingContext2D,
    annotation: Annotation
  ) => {
    const distance = Math.sqrt(
      Math.pow((annotation.endX || 0) - annotation.x, 2) +
        Math.pow((annotation.endY || 0) - annotation.y, 2)
    )

    // Draw line with end caps
    ctx.strokeStyle = annotation.color
    ctx.lineWidth = annotation.strokeWidth
    ctx.beginPath()
    ctx.moveTo(annotation.x, annotation.y)
    ctx.lineTo(annotation.endX || 0, annotation.endY || 0)
    ctx.stroke()

    // Draw end caps
    const angle = Math.atan2(
      (annotation.endY || 0) - annotation.y,
      (annotation.endX || 0) - annotation.x
    )
    const capLength = 10

    // Start cap
    ctx.beginPath()
    ctx.moveTo(
      annotation.x - capLength * Math.sin(angle),
      annotation.y + capLength * Math.cos(angle)
    )
    ctx.lineTo(
      annotation.x + capLength * Math.sin(angle),
      annotation.y - capLength * Math.cos(angle)
    )
    ctx.stroke()

    // End cap
    ctx.beginPath()
    ctx.moveTo(
      (annotation.endX || 0) - capLength * Math.sin(angle),
      (annotation.endY || 0) + capLength * Math.cos(angle)
    )
    ctx.lineTo(
      (annotation.endX || 0) + capLength * Math.sin(angle),
      (annotation.endY || 0) - capLength * Math.cos(angle)
    )
    ctx.stroke()

    // Draw measurement text
    const midX = (annotation.x + (annotation.endX || 0)) / 2
    const midY = (annotation.y + (annotation.endY || 0)) / 2

    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = annotation.color
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 3
    const measurementText = annotation.text || `${Math.round(distance)}px`
    ctx.strokeText(measurementText, midX, midY - 10)
    ctx.fillText(measurementText, midX, midY - 10)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (selectedTool === 'text') {
      setTextInputPosition({ x, y })
      setTextInputValue('')
      setShowTextInput(true)
      return
    }

    if (selectedTool === 'logo') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'logo',
        x: x - 75,
        y: y - 25,
        width: 150,
        height: 50,
        color: selectedColor,
        strokeWidth,
      }
      addAnnotation(newAnnotation)
      return
    }

    setIsDrawing(true)
    setStartPoint({ x, y })
    setCurrentAnnotation({ x, y })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    switch (selectedTool) {
      case 'arrow':
      case 'measurement':
        setCurrentAnnotation({ ...currentAnnotation, endX: x, endY: y })
        break
      case 'circle':
      case 'rectangle':
        setCurrentAnnotation({
          ...currentAnnotation,
          width: x - startPoint.x,
          height: y - startPoint.y,
        })
        break
    }
  }

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: selectedTool as any,
      x: startPoint.x,
      y: startPoint.y,
      color: selectedColor,
      strokeWidth,
      fontSize,
      ...currentAnnotation,
    }

    // Only add if there's actual content
    if (
      (selectedTool === 'arrow' || selectedTool === 'measurement') &&
      currentAnnotation.endX &&
      currentAnnotation.endY
    ) {
      addAnnotation(newAnnotation)
    } else if (
      (selectedTool === 'circle' || selectedTool === 'rectangle') &&
      currentAnnotation.width &&
      currentAnnotation.height
    ) {
      addAnnotation(newAnnotation)
    }

    setIsDrawing(false)
    setCurrentAnnotation(null)
  }

  const addAnnotation = (annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation]
    setAnnotations(newAnnotations)
    addToHistory(newAnnotations)
  }

  const addToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAnnotations)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAnnotations(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAnnotations(history[historyIndex + 1])
    }
  }

  const clearAnnotations = () => {
    setAnnotations([])
    addToHistory([])
  }

  const handleTextSubmit = () => {
    if (textInputValue.trim()) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'text',
        x: textInputPosition.x,
        y: textInputPosition.y,
        text: textInputValue,
        color: selectedColor,
        fontSize,
        strokeWidth,
      }
      addAnnotation(newAnnotation)
    }
    setShowTextInput(false)
    setTextInputValue('')
  }

  const saveAnnotatedImage = () => {
    if (!canvasRef.current) return

    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave?.(annotations, dataUrl)
  }

  const downloadImage = () => {
    if (!canvasRef.current) return

    const dataUrl = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'annotated-photo.png'
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="brushed-metal rounded-lg shadow-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Tool Selection */}
          <div className="flex gap-2">
            <Button
              variant={selectedTool === 'arrow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('arrow')}
              title="Arrow"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('circle')}
              title="Circle"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('rectangle')}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('text')}
              title="Text"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'measurement' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('measurement')}
              title="Measurement"
            >
              <Ruler className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'logo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('logo')}
              title="Add Logo"
            >
              <HardHatIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-600" />

          {/* Color Selection */}
          <div className="flex gap-2">
            {colors.map(color => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  selectedColor === color.value
                    ? 'border-white scale-110'
                    : 'border-gray-600'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          <div className="h-8 w-px bg-gray-600" />

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm text-white w-8 text-center">
              {strokeWidth}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStrokeWidth(Math.min(10, strokeWidth + 1))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-600" />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex === 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex === history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAnnotations}
              disabled={annotations.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Save/Download */}
          <div className="flex gap-2">
            <Button
              onClick={saveAnnotatedImage}
              className="bg-safety-orange hover:bg-orange-700"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={downloadImage}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="border border-gray-600 rounded cursor-crosshair max-w-full"
          style={{ maxHeight: '70vh' }}
        />

        {/* Text Input Overlay */}
        {showTextInput && (
          <div
            className="absolute"
            style={{ left: textInputPosition.x, top: textInputPosition.y }}
          >
            <input
              type="text"
              value={textInputValue}
              onChange={e => setTextInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleTextSubmit()
                } else if (e.key === 'Escape') {
                  setShowTextInput(false)
                }
              }}
              onBlur={handleTextSubmit}
              className="px-2 py-1 bg-gray-800 border border-safety-orange text-white rounded"
              style={{
                color: selectedColor,
                fontSize: `${fontSize}px`,
                minWidth: '200px',
              }}
              autoFocus
              placeholder="Type your annotation..."
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="brushed-metal rounded-lg shadow-lg p-4 text-sm text-gray-400">
        <p className="text-white font-semibold mb-2">Quick Tips:</p>
        <ul className="space-y-1">
          <li>• Use arrows to point out issues or important details</li>
          <li>• Add measurements to show exact dimensions</li>
          <li>• Circle problem areas that need attention</li>
          <li>• Add text for instructions or reminders</li>
          <li>• Drop your company logo to brand shared photos</li>
          <li>• Use safety orange for critical safety issues</li>
        </ul>
      </div>
    </div>
  )
}
