'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { ConstructionSafety, type SafetyCheck } from '@/lib/construction-safety'
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  X,
  Loader2,
  Eye,
  AlertCircle
} from 'lucide-react'

interface SafetyAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  activityType: string
  location: string
}

export default function SafetyAnalysisModal({
  isOpen,
  onClose,
  imageFile,
  activityType,
  location
}: SafetyAnalysisModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheck | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(true)

  const safety = new ConstructionSafety()

  const startAnalysis = async () => {
    if (!imageFile) return

    setIsAnalyzing(true)
    
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const result = safety.checkActivity(activityType)
    setSafetyCheck(result)
    setIsAnalyzing(false)
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />
      case 'medium':
        return <AlertCircle className="h-5 w-5" />
      case 'low':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-construction">
      <div className="modal-content-construction">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Safety Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Image Preview */}
        {imageFile && (
          <div className="mb-6">
            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Analysis preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                <Eye className="h-4 w-4 inline mr-1" />
                AI Analysis
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p><strong>Activity:</strong> {activityType}</p>
              {location && <p><strong>Location:</strong> {location}</p>}
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {!safetyCheck && !isAnalyzing && (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Click below to analyze this image for potential safety hazards
            </p>
            <Button
              onClick={startAnalysis}
              variant="construction-primary"
              size="lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              Analyze Safety
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 mb-2">Analyzing image for safety hazards...</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        )}

        {safetyCheck && (
          <div className="space-y-6">
            {/* Risk Level */}
            <div className={`p-4 rounded-lg border-2 ${getSeverityColor(safetyCheck.hazardLevel)}`}>
              <div className="flex items-center gap-3 mb-2">
                {getSeverityIcon(safetyCheck.hazardLevel)}
                <h3 className="font-semibold text-lg">
                  Risk Level: {safetyCheck.hazardLevel.toUpperCase()}
                </h3>
              </div>
              <p className="text-sm">
                Activity: {safetyCheck.activity} operations detected
              </p>
            </div>

            {/* Safety Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety Recommendations
                </h4>
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {showRecommendations ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showRecommendations && (
                <ul className="space-y-2">
                  {safetyCheck.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* General Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                General Safety Guidelines
              </h4>
              <ul className="space-y-1">
                {safety.getGeneralGuidelines().map((guideline, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    {guideline}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={startAnalysis}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
              <Button
                onClick={onClose}
                variant="construction-primary"
                className="flex-1"
              >
                Continue Upload
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}