'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import {
  safetyIncidentService,
  type SafetyIncident,
  type SafetyMetrics,
  type ComplianceRequirement,
} from '@/lib/safety-incident-service'
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  Download,
  Filter,
  RefreshCw,
  Users,
  Activity,
  Target,
  Award,
  Eye,
  Plus,
} from 'lucide-react'

interface SafetyComplianceDashboardProps {
  projectId?: string
}

export default function SafetyComplianceDashboard({
  projectId,
}: SafetyComplianceDashboardProps) {
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics | null>(null)
  const [recentIncidents, setRecentIncidents] = useState<SafetyIncident[]>([])
  const [complianceRequirements, setComplianceRequirements] = useState<
    ComplianceRequirement[]
  >([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    '7d' | '30d' | '90d'
  >('30d')
  const [selectedProject, setSelectedProject] = useState<string>(
    projectId || 'all'
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()

    // Initialize mock data for development
    safetyIncidentService.initializeMockData()
  }, [selectedTimeRange, selectedProject])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const dateRange = getDateRange(selectedTimeRange)
      const projectFilter =
        selectedProject === 'all' ? undefined : selectedProject

      const [metrics, incidents, compliance] = await Promise.all([
        safetyIncidentService.getSafetyMetrics(projectFilter, dateRange),
        safetyIncidentService.getIncidents({
          ...(projectFilter && { projectId: projectFilter }),
          dateRange,
        }),
        safetyIncidentService.getComplianceRequirements(projectFilter),
      ])

      setSafetyMetrics(metrics)
      setRecentIncidents(incidents.slice(0, 10))
      setComplianceRequirements(compliance)
    } catch (error) {
      console.error('Failed to load safety dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRange = (range: string) => {
    const end = new Date()
    const start = new Date()

    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7)
        break
      case '30d':
        start.setDate(end.getDate() - 30)
        break
      case '90d':
        start.setDate(end.getDate() - 90)
        break
    }

    return { start, end }
  }

  const getSeverityColor = (severity: SafetyIncident['severity']) => {
    switch (severity) {
      case 'low':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'critical':
        return 'text-red-600 bg-red-50'
    }
  }

  const getStatusColor = (status: SafetyIncident['status']) => {
    switch (status) {
      case 'reported':
        return 'text-blue-600 bg-blue-50'
      case 'investigating':
        return 'text-orange-600 bg-orange-50'
      case 'resolved':
        return 'text-green-600 bg-green-50'
      case 'closed':
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getComplianceStatusColor = (
    status: ComplianceRequirement['status']
  ) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'overdue':
        return 'text-red-600 bg-red-50'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getIncidentTypeIcon = (type: SafetyIncident['incidentType']) => {
    switch (type) {
      case 'near_miss':
        return '⚠️'
      case 'injury':
        return '🩹'
      case 'property_damage':
        return '🔨'
      case 'safety_violation':
        return '🚫'
      case 'equipment_failure':
        return '⚙️'
      case 'environmental':
        return '🌍'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const overallSafetyScore = safetyMetrics?.safetyScore || 0
  const compliancePercentage = safetyMetrics?.compliancePercentage || 0
  const overdueCompliance = complianceRequirements.filter(
    req => req.status === 'overdue'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">Safety & Compliance Dashboard</h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="input-construction text-sm"
          >
            <option value="all">All Projects</option>
            <option value="project_1">Downtown Office Complex</option>
            <option value="project_2">Highway Bridge Project</option>
            <option value="project_3">Industrial Warehouse</option>
          </select>

          <select
            value={selectedTimeRange}
            onChange={e => setSelectedTimeRange(e.target.value as any)}
            className="input-construction text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-construction">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Safety Score</p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-bold ${
                    overallSafetyScore >= 90
                      ? 'text-green-600'
                      : overallSafetyScore >= 80
                        ? 'text-yellow-600'
                        : overallSafetyScore >= 70
                          ? 'text-orange-600'
                          : 'text-red-600'
                  }`}
                >
                  {Math.round(overallSafetyScore)}
                </p>
                <span className="text-sm text-gray-500">/100</span>
              </div>
            </div>
            <div
              className={`p-3 rounded-lg ${
                overallSafetyScore >= 90
                  ? 'bg-green-100'
                  : overallSafetyScore >= 80
                    ? 'bg-yellow-100'
                    : overallSafetyScore >= 70
                      ? 'bg-orange-100'
                      : 'bg-red-100'
              }`}
            >
              <Shield
                className={`h-6 w-6 ${
                  overallSafetyScore >= 90
                    ? 'text-green-600'
                    : overallSafetyScore >= 80
                      ? 'text-yellow-600'
                      : overallSafetyScore >= 70
                        ? 'text-orange-600'
                        : 'text-red-600'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="card-construction">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Incidents
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-red-600">
                  {safetyMetrics?.totalIncidents || 0}
                </p>
                <span className="text-xs text-gray-500">this period</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card-construction">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Compliance Rate
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-bold ${
                    compliancePercentage >= 95
                      ? 'text-green-600'
                      : compliancePercentage >= 85
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {Math.round(compliancePercentage)}%
                </p>
                {overdueCompliance > 0 && (
                  <span className="text-xs text-red-500">
                    {overdueCompliance} overdue
                  </span>
                )}
              </div>
            </div>
            <div
              className={`p-3 rounded-lg ${
                compliancePercentage >= 95
                  ? 'bg-green-100'
                  : compliancePercentage >= 85
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
              }`}
            >
              <CheckCircle
                className={`h-6 w-6 ${
                  compliancePercentage >= 95
                    ? 'text-green-600'
                    : compliancePercentage >= 85
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="card-construction">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Near Miss Ratio
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-bold ${
                    (safetyMetrics?.nearMissRatio || 0) >= 0.7
                      ? 'text-green-600'
                      : (safetyMetrics?.nearMissRatio || 0) >= 0.5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {Math.round((safetyMetrics?.nearMissRatio || 0) * 100)}%
                </p>
                <span className="text-xs text-gray-500">of total</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <div className="xl:col-span-2">
          <div className="card-construction">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Incidents
              </h3>
              <Button variant="construction-primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Report Incident
              </Button>
            </div>

            <div className="space-y-4">
              {recentIncidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No incidents reported in this period</p>
                  <p className="text-sm">Great safety record!</p>
                </div>
              ) : (
                recentIncidents.map(incident => (
                  <div
                    key={incident.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getIncidentTypeIcon(incident.incidentType)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {incident.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {incident.description.length > 100
                              ? `${incident.description.substring(0, 100)}...`
                              : incident.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{incident.projectName}</span>
                            <span>{incident.location.area}</span>
                            <span>{formatDate(incident.datetime)}</span>
                            <span>by {incident.reportedBy.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(incident.severity)}`}
                        >
                          {incident.severity.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(incident.status)}`}
                        >
                          {incident.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {incident.peopleInvolved.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {incident.peopleInvolved.length} person(s) involved
                          {incident.peopleInvolved.some(
                            p => p.medicalAttention
                          ) && (
                            <span className="ml-2 text-red-600 font-medium">
                              Medical attention required
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Risk Score: {incident.riskScore}/100</span>
                        {incident.followUpRequired && (
                          <span className="text-orange-600 font-medium">
                            Follow-up required
                          </span>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Compliance Requirements */}
        <div className="xl:col-span-1">
          <div className="card-construction">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compliance Status
              </h3>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {complianceRequirements.slice(0, 8).map(requirement => (
                <div
                  key={requirement.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {requirement.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {requirement.description.length > 60
                          ? `${requirement.description.substring(0, 60)}...`
                          : requirement.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getComplianceStatusColor(requirement.status)}`}
                    >
                      {requirement.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                        {requirement.type.toUpperCase()}
                      </span>
                      <span>{requirement.frequency}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span
                        className={
                          requirement.status === 'overdue' ? 'text-red-600' : ''
                        }
                      >
                        Due {formatDate(requirement.dueDate)}
                      </span>
                    </div>
                  </div>

                  {requirement.assignedTo && (
                    <div className="mt-2 text-xs text-gray-500">
                      Assigned to: {requirement.assignedTo}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <Button variant="outline" size="sm" className="w-full">
                View All Requirements
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Type */}
        <div className="card-construction">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Incidents by Type
          </h3>

          <div className="space-y-3">
            {Object.entries(safetyMetrics?.incidentsByType || {}).map(
              ([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getIncidentTypeIcon(type as any)}
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(count / (safetyMetrics?.totalIncidents || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Incidents by Severity */}
        <div className="card-construction">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Incidents by Severity
          </h3>

          <div className="space-y-3">
            {Object.entries(safetyMetrics?.incidentsBySeverity || {}).map(
              ([severity, count]) => {
                const severityColors = {
                  low: 'bg-green-500',
                  medium: 'bg-yellow-500',
                  high: 'bg-orange-500',
                  critical: 'bg-red-500',
                }

                return (
                  <div
                    key={severity}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${severityColors[severity as keyof typeof severityColors]}`}
                      />
                      <span className="text-sm font-medium capitalize">
                        {severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${severityColors[severity as keyof typeof severityColors]}`}
                          style={{
                            width: `${(count / (safetyMetrics?.totalIncidents || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
