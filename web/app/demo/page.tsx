'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { 
  Shield, 
  Camera, 
  BarChart3, 
  Users, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  Clock,
  MapPin,
  Star,
  HardHat,
  Building,
  Image
} from 'lucide-react'

// Mock demo data
const demoProjects = [
  {
    id: 1,
    name: "Downtown Office Tower",
    progress: 78,
    photos: 156,
    location: "Denver, CO",
    status: "On Track",
    lastUpdate: "2 hours ago"
  },
  {
    id: 2,
    name: "Steel Bridge Renovation",
    progress: 45,
    photos: 89,
    location: "Boulder, CO",
    status: "In Progress",
    lastUpdate: "1 day ago"
  },
  {
    id: 3,
    name: "Warehouse Expansion",
    progress: 92,
    photos: 203,
    location: "Aurora, CO",
    status: "Near Completion",
    lastUpdate: "3 hours ago"
  }
]

// Construction photo data with realistic metadata
const constructionPhotos = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=400&fit=crop",
    title: "Steel Beam Installation - Level 12",
    project: "Downtown Office Tower",
    category: "Structural",
    timestamp: "2 hours ago",
    location: "Denver, CO",
    coordinates: "39.7392° N, 104.9903° W",
    worker: "Mike Torres",
    equipment: "Tower Crane TC-400",
    safetyStatus: "Compliant",
    description: "Installation of main structural beams on 12th floor"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=400&fit=crop",
    title: "Welding Operations - Beam Connection",
    project: "Downtown Office Tower",
    category: "Welding",
    timestamp: "4 hours ago",
    location: "Denver, CO",
    coordinates: "39.7392° N, 104.9903° W",
    worker: "Carlos Rivera",
    equipment: "MIG Welder WM-350",
    safetyStatus: "Compliant",
    description: "Critical beam-to-column connection welding"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    title: "Foundation Inspection",
    project: "Warehouse Expansion",
    category: "Inspection",
    timestamp: "1 day ago",
    location: "Aurora, CO",
    coordinates: "39.7294° N, 104.8319° W",
    worker: "Sarah Johnson",
    equipment: "Level Sensor LS-200",
    safetyStatus: "Compliant",
    description: "Quality control inspection of concrete foundation"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop",
    title: "Bridge Structural Assessment",
    project: "Steel Bridge Renovation",
    category: "Assessment",
    timestamp: "6 hours ago",
    location: "Boulder, CO",
    coordinates: "40.0150° N, 105.2705° W",
    worker: "David Kim",
    equipment: "Ultrasonic Tester UT-500",
    safetyStatus: "Under Review",
    description: "Structural integrity assessment of main bridge supports"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop",
    title: "Concrete Pour - Foundation",
    project: "Warehouse Expansion",
    category: "Concrete",
    timestamp: "3 days ago",
    location: "Aurora, CO",
    coordinates: "39.7294° N, 104.8319° W",
    worker: "Mike Torres",
    equipment: "Concrete Pump CP-180",
    safetyStatus: "Compliant",
    description: "Main foundation concrete pour for warehouse section B"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1600321948231-7a90f133d18e?w=400&h=400&fit=crop",
    title: "Safety Equipment Check",
    project: "Downtown Office Tower",
    category: "Safety",
    timestamp: "1 hour ago",
    location: "Denver, CO",
    coordinates: "39.7392° N, 104.9903° W",
    worker: "Sarah Johnson",
    equipment: "Safety Harness SH-Pro",
    safetyStatus: "Compliant",
    description: "Daily safety equipment inspection and documentation"
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1600497900402-daecbc0f9b89?w=400&h=400&fit=crop",
    title: "Bridge Deck Renovation",
    project: "Steel Bridge Renovation",
    category: "Renovation",
    timestamp: "8 hours ago",
    location: "Boulder, CO",
    coordinates: "40.0150° N, 105.2705° W",
    worker: "Carlos Rivera",
    equipment: "Surface Grinder SG-300",
    safetyStatus: "Compliant",
    description: "Bridge deck surface preparation and renovation work"
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1597149959819-8c5168e21742?w=400&h=400&fit=crop",
    title: "Steel Frame Assembly",
    project: "Warehouse Expansion",
    category: "Assembly",
    timestamp: "5 hours ago",
    location: "Aurora, CO",
    coordinates: "39.7294° N, 104.8319° W",
    worker: "David Kim",
    equipment: "Mobile Crane MC-250",
    safetyStatus: "Compliant",
    description: "Steel frame assembly for warehouse section C"
  }
]

const demoActivities = [
  {
    id: 1,
    type: "photo",
    description: "Beam installation progress documented",
    project: "Downtown Office Tower",
    time: "2 hours ago",
    icon: Camera
  },
  {
    id: 2,
    type: "report",
    description: "Weekly safety report generated",
    project: "Steel Bridge Renovation",
    time: "1 day ago",
    icon: FileText
  },
  {
    id: 3,
    type: "team",
    description: "New crew member added to team",
    project: "Warehouse Expansion",
    time: "3 hours ago",
    icon: Users
  }
]

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedPhoto, setSelectedPhoto] = useState<typeof constructionPhotos[0] | null>(null)
  
  // Get unique categories from photos
  const photoCategories = ['All', ...Array.from(new Set(constructionPhotos.map(photo => photo.category)))]
  
  // Filter photos based on selected category
  const filteredPhotos = selectedCategory === 'All' 
    ? constructionPhotos 
    : constructionPhotos.filter(photo => photo.category === selectedCategory)

  const demoSteps = [
    {
      title: "Project Dashboard",
      description: "See all your construction projects at a glance with real-time progress tracking.",
      component: "dashboard"
    },
    {
      title: "Photo Documentation",
      description: "Capture and organize construction photos with automatic GPS tagging.",
      component: "photos"
    },
    {
      title: "Team Management",
      description: "Track your crew activities and manage team communications.",
      component: "team"
    },
    {
      title: "Progress Reports",
      description: "Generate professional reports for clients and stakeholders.",
      component: "reports"
    }
  ]

  const renderDemoContent = () => {
    switch (demoSteps[currentStep].component) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoProjects.map((project) => (
                <div key={project.id} className="brushed-metal rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-lg">{project.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      project.status === 'On Track' ? 'bg-safety-green text-white' :
                      project.status === 'Near Completion' ? 'bg-arc-flash-yellow text-black' :
                      'bg-aisc-blue text-white'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-safety-orange h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        <span>{project.photos} photos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{project.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Updated {project.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case 'photos':
        return (
          <div className="space-y-6">
            {/* Photo Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {photoCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {category}
                  <span className="ml-2 text-xs opacity-75">
                    ({category === 'All' ? constructionPhotos.length : constructionPhotos.filter(p => p.category === category).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer shadow-lg"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {/* Construction Photo */}
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay with photo details */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-semibold truncate">{photo.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gray-300 text-xs">{photo.timestamp}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">{photo.worker}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        photo.category === 'Safety' ? 'bg-red-500 text-white' :
                        photo.category === 'Structural' ? 'bg-blue-500 text-white' :
                        photo.category === 'Welding' ? 'bg-orange-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {photo.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        photo.safetyStatus === 'Compliant' ? 'bg-green-600 text-white' :
                        'bg-yellow-600 text-black'
                      }`}>
                        {photo.safetyStatus}
                      </span>
                    </div>
                  </div>

                  {/* GPS Location Indicator */}
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>

                  {/* Equipment Badge */}
                  <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1">
                    <p className="text-white text-xs font-medium">{photo.equipment.split(' ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="brushed-metal rounded-lg p-4">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-orange-500" />
                  Photo Management
                </h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Automatic GPS location tagging</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Equipment and worker attribution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Category-based organization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Cloud storage with offline sync</span>
                  </li>
                </ul>
              </div>

              <div className="brushed-metal rounded-lg p-4">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  Safety & Compliance
                </h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time safety status tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>OSHA compliance documentation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Automated safety inspection logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Equipment usage monitoring</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Photo Statistics */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-500">{filteredPhotos.length}</p>
                  <p className="text-gray-400 text-sm">
                    {selectedCategory === 'All' ? 'Total Photos' : `${selectedCategory} Photos`}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {filteredPhotos.filter(p => p.safetyStatus === 'Compliant').length}
                  </p>
                  <p className="text-gray-400 text-sm">Safety Compliant</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">
                    {Array.from(new Set(filteredPhotos.map(p => p.worker))).length}
                  </p>
                  <p className="text-gray-400 text-sm">Team Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    {Array.from(new Set(filteredPhotos.map(p => p.project))).length}
                  </p>
                  <p className="text-gray-400 text-sm">Active Projects</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'team':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="brushed-metal rounded-lg p-6">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-aisc-blue" />
                  Active Team Members
                </h4>
                <div className="space-y-3">
                  {[
                    { name: "Mike Torres", role: "Site Foreman", status: "online" },
                    { name: "Sarah Johnson", role: "Safety Officer", status: "online" },
                    { name: "Carlos Rivera", role: "Ironworker", status: "offline" },
                    { name: "David Kim", role: "Project Manager", status: "online" }
                  ].map((member, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${member.status === 'online' ? 'bg-safety-green' : 'bg-gray-500'}`}></div>
                        <div>
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-gray-400 text-sm">{member.role}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${member.status === 'online' ? 'bg-safety-green/20 text-safety-green' : 'bg-gray-700 text-gray-400'}`}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="brushed-metal rounded-lg p-6">
                <h4 className="text-white font-bold mb-4">Recent Activity</h4>
                <div className="space-y-3">
                  {demoActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-safety-orange rounded-full flex items-center justify-center">
                        <activity.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.description}</p>
                        <p className="text-gray-400 text-xs">{activity.project} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="brushed-metal rounded-lg p-6">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-arc-flash-yellow" />
                  Progress Analytics
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Overall Progress</span>
                      <span className="text-white font-bold">72%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-safety-orange to-arc-flash-yellow h-3 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-safety-green">448</p>
                      <p className="text-gray-400 text-sm">Photos Taken</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-aisc-blue">12</p>
                      <p className="text-gray-400 text-sm">Reports Generated</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="brushed-metal rounded-lg p-6">
                <h4 className="text-white font-bold mb-4">Available Reports</h4>
                <div className="space-y-3">
                  {[
                    { name: "Daily Progress Report", status: "Ready", type: "progress" },
                    { name: "Safety Compliance Report", status: "Ready", type: "safety" },
                    { name: "Weekly Summary", status: "Generating", type: "summary" },
                    { name: "Client Presentation", status: "Ready", type: "client" }
                  ].map((report, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">{report.name}</p>
                        <p className="text-gray-400 text-sm capitalize">{report.type} report</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        report.status === 'Ready' ? 'bg-safety-green text-white' : 'bg-arc-flash-yellow text-black'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <div className="relative py-12">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          )`
        }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <HardHat className="h-16 w-16 text-yellow-400 rounded-full" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-shogun text-white mb-4">
              Iron Task Demo
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Experience the power of professional construction documentation
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-green" />
                <span>No registration required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-green" />
                <span>Interactive demo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-green" />
                <span>Real construction data</span>
              </div>
            </div>
          </div>

          {/* Demo Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
              {demoSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    currentStep === index
                      ? 'bg-safety-orange text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {step.title}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {demoSteps[currentStep].title}
              </h2>
              <p className="text-gray-400">
                {demoSteps[currentStep].description}
              </p>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-6 mb-8">
              {renderDemoContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Previous
              </button>
              
              <div className="flex space-x-2">
                {demoSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      currentStep === index ? 'bg-safety-orange' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(Math.min(demoSteps.length - 1, currentStep + 1))}
                disabled={currentStep === demoSteps.length - 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-16 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-shogun text-white mb-6">
            Ready to Start Your Own Projects?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Get started with a 30-day free trial - no credit card required
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-5 w-5 text-safety-green" />
              <span>30-day free trial</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-5 w-5 text-safety-green" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-5 w-5 text-safety-green" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-safety-orange hover:bg-orange-700 text-white font-bold px-8 py-4 text-lg arc-weld-glow">
                <Shield className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-gray-400 bg-white text-black hover:bg-gray-100 hover:text-black hover:border-gray-300 px-8 py-4 text-lg">
                Already Have Account?
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="mt-8">
            <p className="text-gray-500 text-sm">
              Join over 500+ construction companies using Iron Task • 
              <Link href="/" className="text-aisc-blue hover:text-blue-400 ml-1">
                Back to Homepage
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 z-10 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full-size Image */}
            <img
              src={selectedPhoto.url.replace('w=400&h=400', 'w=800&h=600')}
              alt={selectedPhoto.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Photo Details */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-6 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div>
                  <h3 className="text-xl font-bold mb-2">{selectedPhoto.title}</h3>
                  <p className="text-gray-300 mb-3">{selectedPhoto.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-400" />
                      <span>{selectedPhoto.project}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-400" />
                      <span>{selectedPhoto.location} • {selectedPhoto.coordinates}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span>{selectedPhoto.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>Documented by: {selectedPhoto.worker}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-orange-400" />
                      <span>Equipment: {selectedPhoto.equipment}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      selectedPhoto.category === 'Safety' ? 'bg-red-500 text-white' :
                      selectedPhoto.category === 'Structural' ? 'bg-blue-500 text-white' :
                      selectedPhoto.category === 'Welding' ? 'bg-orange-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {selectedPhoto.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      selectedPhoto.safetyStatus === 'Compliant' ? 'bg-green-600 text-white' :
                      'bg-yellow-600 text-black'
                    }`}>
                      {selectedPhoto.safetyStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}