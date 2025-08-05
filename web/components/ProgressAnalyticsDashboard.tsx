'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

interface ProjectProgress {
  id: string
  name: string
  startDate: Date
  endDate: Date
  currentProgress: number
  phases: {
    name: string
    progress: number
    startDate: Date
    endDate: Date
    status: 'completed' | 'in_progress' | 'pending' | 'delayed'
  }[]
  team: {
    assigned: number
    active: number
  }
  budget: {
    allocated: number
    spent: number
  }
  safetyScore: number
  lastUpdated: Date
}

interface ProgressMetric {
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  unit: string
  color: string
}

interface ActivityTrend {
  date: Date
  uploads: number
  safetyChecks: number
  progressUpdates: number
  teamActivity: number
}

export default function ProgressAnalyticsDashboard() {
  const [projects, setProjects] = useState<ProjectProgress[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [metrics, setMetrics] = useState<ProgressMetric[]>([])
  const [activityTrends, setActivityTrends] = useState<ActivityTrend[]>([])

  // Initialize with mock data
  useEffect(() => {
    const mockProjects: ProjectProgress[] = [
      {
        id: 'project_1',
        name: 'Downtown Office Complex',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        currentProgress: 65,
        phases: [
          { name: 'Foundation', progress: 100, startDate: new Date('2024-01-15'), endDate: new Date('2024-02-28'), status: 'completed' },
          { name: 'Steel Erection', progress: 80, startDate: new Date('2024-03-01'), endDate: new Date('2024-04-30'), status: 'in_progress' },
          { name: 'Flooring & Roofing', progress: 30, startDate: new Date('2024-05-01'), endDate: new Date('2024-06-15'), status: 'in_progress' },
          { name: 'Finishing', progress: 0, startDate: new Date('2024-06-16'), endDate: new Date('2024-06-30'), status: 'pending' }
        ],
        team: { assigned: 12, active: 10 },
        budget: { allocated: 2500000, spent: 1625000 },
        safetyScore: 92,
        lastUpdated: new Date()
      },
      {
        id: 'project_2',
        name: 'Highway Bridge Project',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-15'),
        currentProgress: 45,
        phases: [
          { name: 'Site Preparation', progress: 100, startDate: new Date('2024-02-01'), endDate: new Date('2024-02-28'), status: 'completed' },
          { name: 'Foundation Piers', progress: 90, startDate: new Date('2024-03-01'), endDate: new Date('2024-04-15'), status: 'in_progress' },
          { name: 'Bridge Deck', progress: 20, startDate: new Date('2024-04-16'), endDate: new Date('2024-06-30'), status: 'in_progress' },
          { name: 'Finishing Work', progress: 0, startDate: new Date('2024-07-01'), endDate: new Date('2024-08-15'), status: 'pending' }
        ],
        team: { assigned: 8, active: 7 },
        budget: { allocated: 1800000, spent: 810000 },
        safetyScore: 88,
        lastUpdated: new Date()
      },
      {
        id: 'project_3',
        name: 'Industrial Warehouse',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-07-31'),
        currentProgress: 25,
        phases: [
          { name: 'Site Work', progress: 100, startDate: new Date('2024-03-01'), endDate: new Date('2024-03-15'), status: 'completed' },
          { name: 'Steel Frame', progress: 60, startDate: new Date('2024-03-16'), endDate: new Date('2024-05-30'), status: 'in_progress' },
          { name: 'Siding & Roofing', progress: 10, startDate: new Date('2024-06-01'), endDate: new Date('2024-07-15'), status: 'in_progress' },
          { name: 'Final Systems', progress: 0, startDate: new Date('2024-07-16'), endDate: new Date('2024-07-31'), status: 'pending' }
        ],
        team: { assigned: 6, active: 5 },
        budget: { allocated: 950000, spent: 237500 },
        safetyScore: 95,
        lastUpdated: new Date()
      }
    ]

    const mockMetrics: ProgressMetric[] = [
      { label: 'Overall Progress', value: 45, change: 5.2, trend: 'up', unit: '%', color: 'text-blue-600' },
      { label: 'Active Projects', value: 3, change: 0, trend: 'stable', unit: '', color: 'text-green-600' },
      { label: 'Team Efficiency', value: 87, change: 3.1, trend: 'up', unit: '%', color: 'text-purple-600' },
      { label: 'Safety Score', value: 92, change: -1.5, trend: 'down', unit: '/100', color: 'text-orange-600' },
      { label: 'Budget Utilization', value: 62, change: 8.3, trend: 'up', unit: '%', color: 'text-red-600' },
      { label: 'On-Time Delivery', value: 89, change: 2.7, trend: 'up', unit: '%', color: 'text-indigo-600' }
    ]

    // Generate mock activity trends
    const mockActivityTrends: ActivityTrend[] = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      uploads: Math.floor(Math.random() * 20) + 5,
      safetyChecks: Math.floor(Math.random() * 10) + 2,
      progressUpdates: Math.floor(Math.random() * 8) + 1,
      teamActivity: Math.floor(Math.random() * 50) + 20
    }))

    setProjects(mockProjects)
    setMetrics(mockMetrics)
    setActivityTrends(mockActivityTrends)
  }, [])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'delayed': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateProjectHealth = (project: ProjectProgress) => {
    const progressHealth = project.currentProgress
    const budgetHealth = 100 - (project.budget.spent / project.budget.allocated) * 100
    const safetyHealth = project.safetyScore
    const teamHealth = (project.team.active / project.team.assigned) * 100
    
    return Math.round((progressHealth + budgetHealth + safetyHealth + teamHealth) / 4)
  }

  const filteredProjects = selectedProject === 'all' 
    ? projects 
    : projects.filter(p => p.id === selectedProject)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Progress Analytics</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-construction text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="input-construction text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="card-construction">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}{metric.unit}
              </span>
              <span className={`text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Project Progress Overview */}
        <div className="card-construction">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              Project Progress Overview
            </h3>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
          </div>

          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const health = calculateProjectHealth(project)
              return (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-500">
                        {project.team.active} of {project.team.assigned} team members active
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {project.currentProgress}%
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        health >= 80 ? 'bg-green-100 text-green-800' :
                        health >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Health: {health}%
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span>{project.currentProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${project.currentProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Budget:</span>
                      <div className="text-gray-600">
                        {formatCurrency(project.budget.spent)} / {formatCurrency(project.budget.allocated)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((project.budget.spent / project.budget.allocated) * 100)}% utilized
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Safety Score:</span>
                      <div className={`font-semibold ${
                        project.safetyScore >= 90 ? 'text-green-600' :
                        project.safetyScore >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {project.safetyScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Phase Progress */}
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Project Phases</div>
                    <div className="flex gap-1">
                      {project.phases.map((phase, index) => (
                        <div
                          key={index}
                          className="flex-1 h-2 rounded-full relative overflow-hidden"
                          title={`${phase.name}: ${phase.progress}%`}
                        >
                          <div className={`absolute inset-0 ${getPhaseStatusColor(phase.status)} opacity-20`} />
                          <div
                            className={`h-full ${getPhaseStatusColor(phase.status)} transition-all`}
                            style={{ width: `${phase.progress}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      {project.phases.map((phase, index) => (
                        <span key={index} className="truncate max-w-[20%]">
                          {phase.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity Trends Chart */}
        <div className="card-construction">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Trends ({timeRange})
            </h3>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Simple bar chart representation */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="w-4 h-4 bg-blue-500 rounded mx-auto mb-1"></div>
                <span className="text-xs text-gray-600">Uploads</span>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-red-500 rounded mx-auto mb-1"></div>
                <span className="text-xs text-gray-600">Safety</span>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-green-500 rounded mx-auto mb-1"></div>
                <span className="text-xs text-gray-600">Progress</span>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-purple-500 rounded mx-auto mb-1"></div>
                <span className="text-xs text-gray-600">Activity</span>
              </div>
            </div>

            <div className="h-48 flex items-end justify-between gap-1">
              {activityTrends.slice(-14).map((trend, index) => {
                const maxValue = Math.max(...activityTrends.map(t => t.teamActivity))
                const height = (trend.teamActivity / maxValue) * 100
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex flex-col gap-1 w-full">
                      <div
                        className="bg-purple-500 rounded-sm opacity-80"
                        style={{ height: `${height * 0.4}px` }}
                        title={`Team Activity: ${trend.teamActivity}`}
                      />
                      <div
                        className="bg-blue-500 rounded-sm opacity-80"
                        style={{ height: `${(trend.uploads / 20) * 30}px` }}
                        title={`Uploads: ${trend.uploads}`}
                      />
                      <div
                        className="bg-red-500 rounded-sm opacity-80"
                        style={{ height: `${(trend.safetyChecks / 10) * 20}px` }}
                        title={`Safety Checks: ${trend.safetyChecks}`}
                      />
                      <div
                        className="bg-green-500 rounded-sm opacity-80"
                        style={{ height: `${(trend.progressUpdates / 8) * 15}px` }}
                        title={`Progress Updates: ${trend.progressUpdates}`}
                      />
                    </div>
                    <div className="text-xs text-gray-500 transform rotate-45 origin-left">
                      {trend.date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activityTrends.reduce((sum, t) => sum + t.uploads, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Uploads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {activityTrends.reduce((sum, t) => sum + t.safetyChecks, 0)}
              </div>
              <div className="text-sm text-gray-600">Safety Checks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}