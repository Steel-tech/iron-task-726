'use client'

import React, { useState } from 'react'
import VideoPlayer from './VideoPlayer'
import { Button } from './Button'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function VideoPlayerErrorDemo() {
  const [showError, setShowError] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  
  const validVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  const invalidVideoUrl = 'https://example.invalid/non-existent-video-404.mp4'
  
  return (
    <div className="space-y-4">
      {/* Force error state for demo */}
      {showError ? (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white z-10 bg-gray-900">
            <AlertTriangle className="h-16 w-16 text-red-500" />
            <div className="text-center space-y-2 px-4">
              <p className="text-lg font-semibold">Video source not found</p>
              <p className="text-sm text-gray-400">Please check the video source and try again</p>
            </div>
          </div>
        </div>
      ) : (
        <VideoPlayer
          src={validVideoUrl}
          title="Successfully Loaded Video"
          className="w-full aspect-video"
          onError={(e) => {
            console.log('Video error:', e)
            setErrorMessage('Video failed to load')
          }}
        />
      )}
      
      <div className="flex gap-2">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setShowError(true)}
          className="text-xs"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Show Error State
        </Button>
        <Button 
          size="sm"
          onClick={() => setShowError(false)}
          className="text-xs bg-safety-green hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Load Valid Video
        </Button>
      </div>
      
      {errorMessage && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}
    </div>
  )
}