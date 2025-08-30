'use client'

import { useState } from 'react'
import {
  HardHatIcon,
  IBeamCraneIcon,
  WeldingTorchIcon,
  IronworkersTeamIcon,
  UploadFabricationIcon,
  ProjectDrawingsIcon,
  MediaGalleryIcon,
  SparkAnimationIcon,
  CraneHookAnimationIcon,
  BoltRotationIcon,
} from '@/components/icons/SteelConstructionIcons'

export default function IconsShowcasePage() {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)

  const icons = [
    {
      name: 'Hard Hat',
      description: 'Hard hat silhouette - Dashboard',
      icon: HardHatIcon,
      filename: 'icon-helmet.svg',
    },
    {
      name: 'I-Beam with Crane',
      description: 'I-beam floating with crane hook',
      icon: IBeamCraneIcon,
      filename: 'icon-beam.svg',
    },
    {
      name: 'Welding Torch',
      description: 'Torch with spark - Capture',
      icon: WeldingTorchIcon,
      filename: 'icon-weld.svg',
    },
    {
      name: 'Ironworkers Team',
      description: 'Group of ironworkers - Team',
      icon: IronworkersTeamIcon,
      filename: 'icon-team-ironworker.svg',
    },
    {
      name: 'Upload Fabrication',
      description: 'Up arrow with plate steel - Upload',
      icon: UploadFabricationIcon,
      filename: 'icon-upload-fabrication.svg',
    },
    {
      name: 'Project Drawings',
      description: 'Rolled-up blueprints - Projects',
      icon: ProjectDrawingsIcon,
      filename: 'icon-project-drawings.svg',
    },
    {
      name: 'Media Gallery',
      description: 'Photo frames - Media',
      icon: MediaGalleryIcon,
      filename: 'icon-media-gallery.svg',
    },
  ]

  const animatedIcons = [
    {
      name: 'Spark Animation',
      description: 'Welding sparks effect',
      icon: SparkAnimationIcon,
      isAnimating: true,
    },
    {
      name: 'Crane Hook Animation',
      description: 'Lifting motion',
      icon: CraneHookAnimationIcon,
      isAnimating: true,
    },
    {
      name: 'Bolt Rotation',
      description: 'Tightening animation',
      icon: BoltRotationIcon,
      isAnimating: true,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-shogun mb-2">
          Steel Construction Icons
        </h1>
        <p className="text-muted-foreground">Custom icon set for Iron Task</p>
      </div>

      {/* Color Palette */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Color Theme</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="h-24 rounded bg-steel-gray mb-2"></div>
            <p className="text-sm font-medium">Steel Gray</p>
            <p className="text-xs text-muted-foreground">#2e2e2e</p>
          </div>
          <div>
            <div className="h-24 rounded bg-safety-orange mb-2"></div>
            <p className="text-sm font-medium">Safety Orange</p>
            <p className="text-xs text-muted-foreground">#ff6600</p>
          </div>
          <div>
            <div className="h-24 rounded bg-aisc-blue mb-2"></div>
            <p className="text-sm font-medium">AISC Blue</p>
            <p className="text-xs text-muted-foreground">#0072ce</p>
          </div>
          <div>
            <div className="h-24 rounded bg-arc-flash-yellow mb-2"></div>
            <p className="text-sm font-medium">Arc Flash Yellow</p>
            <p className="text-xs text-muted-foreground">#ffcc00</p>
          </div>
          <div>
            <div className="h-24 rounded bg-safety-green mb-2"></div>
            <p className="text-sm font-medium">Safety Green</p>
            <p className="text-xs text-muted-foreground">#33cc33</p>
          </div>
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Navigation Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {icons.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="text-center p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredIcon(item.name)}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-3 bg-gray-100 rounded-lg">
                  <Icon
                    className={`h-8 w-8 ${
                      hoveredIcon === item.name
                        ? 'text-aisc-blue'
                        : 'text-steel-gray'
                    }`}
                    size={32}
                  />
                </div>
                <h3 className="font-medium text-sm">{item.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {item.filename}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Animated Icons */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Hover Animations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {animatedIcons.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="text-center p-6 rounded-lg bg-gray-100"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
                  <Icon
                    className="h-10 w-10 text-safety-orange"
                    size={40}
                    isAnimating={item.isAnimating}
                  />
                </div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
        <div className="space-y-4">
          <div className="bg-steel-gray text-white p-4 rounded-lg">
            <h3 className="font-medium mb-2">Dark Sidebar Example</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 transition-colors">
                <HardHatIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-arc-flash-yellow text-steel-gray font-bold">
                <ProjectDrawingsIcon className="h-5 w-5" />
                <span>Projects (Active)</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 transition-colors">
                <WeldingTorchIcon className="h-5 w-5" />
                <span>Capture</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Button Examples</h3>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-aisc-blue text-white rounded hover:bg-blue-700 transition-colors">
                <UploadFabricationIcon className="h-5 w-5" />
                Upload Files
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded hover:bg-orange-700 transition-colors">
                <WeldingTorchIcon className="h-5 w-5" />
                Start Capture
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
