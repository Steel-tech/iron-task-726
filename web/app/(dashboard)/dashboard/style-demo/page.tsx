'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { 
  HardHatIcon, 
  IBeamCraneIcon, 
  WeldingTorchIcon,
  MediaGalleryIcon,
  SparkAnimationIcon
} from '@/components/icons/SteelConstructionIcons'

export default function StyleDemoPage() {
  const [activeTab, setActiveTab] = useState(0)
  
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold font-shogun text-white">Industrial Steel Theme Demo</h1>
        <p className="text-lg text-gray-400">Showcasing the new dark steel texture and arc weld effects</p>
      </div>

      {/* Weld Seam Divider */}
      <hr className="weld-seam" />

      {/* Typography Demo */}
      <div className="brushed-metal rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-shogun text-white mb-4">Typography System</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400 mb-1">Shogun Font (Headers)</p>
            <h1 className="text-3xl font-shogun text-white">Heavy Steel Construction</h1>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Inter Font (Body Text)</p>
            <p className="text-white">Clean, readable body text using Inter font for optimal readability on dark backgrounds. Perfect for technical documentation and safety instructions.</p>
          </div>
        </div>
      </div>

      {/* Arc Weld Glow Demo */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-shogun text-white mb-6">Arc Weld Glow Effects</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="px-6 py-3 bg-arc-flash-yellow text-steel-gray font-bold rounded-lg arc-weld-glow">
            Active Tab (Arc Weld Glow)
          </button>
          <button className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:shadow-[0_0_10px_rgba(0,114,206,0.5)] transition-all duration-200">
            Hover for Blue Spark
          </button>
          <button className="px-6 py-3 bg-safety-orange text-white rounded-lg hover:shadow-[0_0_15px_rgba(255,102,0,0.8)] transition-all duration-200">
            Safety Orange Glow
          </button>
        </div>
      </div>

      {/* Texture Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="brushed-metal rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-3">Brushed Metal Texture</h3>
          <p className="text-gray-300">This card uses the brushed metal effect with subtle horizontal lines that simulate real brushed steel surfaces.</p>
          <div className="mt-4 flex gap-2">
            <HardHatIcon className="h-6 w-6 text-safety-orange" />
            <IBeamCraneIcon className="h-6 w-6 text-aisc-blue" />
            <WeldingTorchIcon className="h-6 w-6 text-arc-flash-yellow" />
          </div>
        </div>
        
        <div className="diamond-plate rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-3">Diamond Plate Texture</h3>
          <p className="text-gray-300">This card uses the diamond plate texture pattern commonly found on industrial equipment and walkways.</p>
          <div className="mt-4">
            <SparkAnimationIcon className="h-8 w-8 text-arc-flash-yellow animate-spark" isAnimating={true} />
          </div>
        </div>
      </div>

      {/* Tab Navigation Demo */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-shogun text-white mb-6">Navigation States</h2>
        <div className="flex gap-2">
          {['Projects', 'Safety', 'Documentation', 'Equipment'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${activeTab === index 
                  ? 'bg-arc-flash-yellow text-steel-gray arc-weld-glow' 
                  : 'bg-gray-700 text-gray-300 hover:text-white hover:shadow-[0_0_10px_rgba(0,114,206,0.5)]'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-shogun text-white mb-6">Industrial Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-full h-24 bg-steel-gray rounded-lg mb-2 border border-gray-600"></div>
            <p className="text-sm text-white font-medium">Steel Gray</p>
            <p className="text-xs text-gray-400">#2e2e2e</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-safety-orange rounded-lg mb-2"></div>
            <p className="text-sm text-white font-medium">Safety Orange</p>
            <p className="text-xs text-gray-400">#ff6600</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-aisc-blue rounded-lg mb-2"></div>
            <p className="text-sm text-white font-medium">AISC Blue</p>
            <p className="text-xs text-gray-400">#0072ce</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-arc-flash-yellow rounded-lg mb-2"></div>
            <p className="text-sm text-white font-medium">Arc Flash Yellow</p>
            <p className="text-xs text-gray-400">#ffcc00</p>
          </div>
        </div>
      </div>

      {/* Button Variants */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-shogun text-white mb-6">Button Styles</h2>
        <div className="flex gap-4 flex-wrap">
          <Button className="bg-safety-orange hover:bg-orange-700">
            Primary Action
          </Button>
          <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
            Secondary Action
          </Button>
          <Button className="bg-aisc-blue hover:bg-blue-700">
            <MediaGalleryIcon className="h-4 w-4 mr-2" />
            With Icon
          </Button>
          <Button variant="destructive">
            Delete
          </Button>
        </div>
      </div>

      {/* Background Pattern Info */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-shogun text-white mb-4">Background Texture</h2>
        <p className="text-gray-300 mb-4">The page background uses a subtle steel texture pattern created with CSS gradients:</p>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
          <li>45° and -45° repeating gradients for crosshatch pattern</li>
          <li>Radial gradient for depth and dimension</li>
          <li>Fixed diamond plate overlay for industrial feel</li>
          <li>Dark base color (#0a0a0a) for maximum contrast</li>
        </ul>
      </div>

      {/* Weld Seam Examples */}
      <div className="space-y-6">
        <h2 className="text-2xl font-shogun text-white text-center">Weld Seam Dividers</h2>
        <hr className="weld-seam" />
        <p className="text-center text-gray-400">Used to separate major sections with an industrial welded steel appearance</p>
        <hr className="weld-seam" />
      </div>
    </div>
  )
}