'use client'

import { useState } from 'react'
import VideoPlayer from '@/components/VideoPlayer'
import VideoGalleryViewer from '@/components/VideoGalleryViewer'
import VideoPlayerErrorDemo from '@/components/VideoPlayerErrorDemo'
import { Button } from '@/components/Button'
import { Play, Grid, Video } from 'lucide-react'

export default function VideoDemoPage() {
  const [showGallery, setShowGallery] = useState(false)
  
  // Demo media data
  const demoMedia = [
    {
      id: '1',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Video+1',
      mediaType: 'VIDEO' as const,
      timestamp: new Date().toISOString(),
      activityType: 'ERECTION',
      location: 'Bay 3, Level 2',
      notes: 'Steel beam installation progress',
      tags: ['welding', 'beam', 'safety'],
      fileSize: 5242880,
      width: 1920,
      height: 1080,
      duration: 60,
      project: {
        id: '1',
        name: 'Downtown Tower'
      },
      user: {
        id: '1',
        name: 'John Steel'
      }
    },
    {
      id: '2',
      fileUrl: 'https://via.placeholder.com/1920x1080?text=Construction+Photo+1',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Photo+1',
      mediaType: 'PHOTO' as const,
      timestamp: new Date().toISOString(),
      activityType: 'FABRICATION',
      location: 'Shop Floor',
      notes: 'Fabrication progress',
      tags: ['fabrication', 'steel'],
      fileSize: 2097152,
      width: 1920,
      height: 1080,
      project: {
        id: '1',
        name: 'Downtown Tower'
      },
      user: {
        id: '2',
        name: 'Mike Welder'
      }
    },
    {
      id: '3',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Video+2',
      mediaType: 'VIDEO' as const,
      timestamp: new Date().toISOString(),
      activityType: 'SAFETY',
      location: 'Site Entrance',
      notes: 'Safety inspection video',
      tags: ['safety', 'inspection'],
      fileSize: 10485760,
      width: 1920,
      height: 1080,
      duration: 120,
      project: {
        id: '2',
        name: 'Bridge Project'
      },
      user: {
        id: '3',
        name: 'Sarah Safety'
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-shogun text-white">Video Components Demo</h1>
        <Button onClick={() => setShowGallery(true)} className="bg-safety-orange hover:bg-orange-700">
          <Grid className="h-4 w-4 mr-2" />
          Open Gallery Viewer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standard Video Player */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Standard Video Player</h2>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              poster="https://via.placeholder.com/800x450?text=Video+Poster"
              title="Steel Beam Installation - Bay 3"
              className="w-full aspect-video"
            />
            <div className="mt-4 text-sm text-gray-400">
              <p>Features:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Custom controls with safety orange theme</li>
                <li>Playback speed control</li>
                <li>Volume control with mute</li>
                <li>Full screen support</li>
                <li>Skip forward/backward 10 seconds</li>
                <li>Download and share buttons</li>
                <li>Progress bar with buffering indicator</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Picture-in-Picture Video Player */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Dual Camera (Picture-in-Picture)</h2>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
              secondarySrc="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              isPictureInPicture={true}
              title="Welding Process - Front & Back View"
              className="w-full aspect-video"
            />
            <div className="mt-4 text-sm text-gray-400">
              <p>Features:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Synchronized dual video playback</li>
                <li>Click PiP window to change position</li>
                <li>Both videos stay in sync during seek</li>
                <li>Perfect for safety documentation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Auto-play Video */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Auto-play Loop Video</h2>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              autoPlay={true}
              muted={true}
              loop={true}
              showDownload={false}
              showShare={false}
              title="Safety Demonstration Loop"
              className="w-full aspect-video"
            />
            <div className="mt-4 text-sm text-gray-400">
              <p>Perfect for:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Safety training videos on repeat</li>
                <li>Site entrance displays</li>
                <li>Training room presentations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Video with Error Handling */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Error Handling Demo</h2>
          <div className="brushed-metal rounded-lg shadow-lg p-4">
            <VideoPlayerErrorDemo />
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-white mb-2">Error Handling Features:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Graceful error state with icon and message</li>
                <li>Error callback for custom handling</li>
                <li>Maintains aspect ratio even on error</li>
                <li>Clear user feedback about the issue</li>
                <li>Toggle between error and success states</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Viewer */}
      {showGallery && (
        <VideoGalleryViewer
          media={demoMedia}
          initialIndex={0}
          onClose={() => setShowGallery(false)}
          title="Construction Progress Gallery"
          subtitle="Mixed media gallery with photos and videos"
        />
      )}

      {/* Instructions */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Video Gallery Viewer Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-white">Navigation</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Arrow keys to navigate between items</li>
              <li>• Click thumbnails at bottom to jump to specific media</li>
              <li>• Swipe gestures on touch devices</li>
              <li>• Escape key to close</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-white">Video Controls</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Space bar to play/pause</li>
              <li>• M key to mute/unmute</li>
              <li>• F key for fullscreen</li>
              <li>• I key to toggle info panel</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-white">Features</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Mixed photo and video support</li>
              <li>• Detailed metadata display</li>
              <li>• Download individual items</li>
              <li>• Share functionality</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-white">Mobile Support</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Touch-friendly controls</li>
              <li>• Responsive layout</li>
              <li>• Auto-hide controls</li>
              <li>• Pinch to zoom on photos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}