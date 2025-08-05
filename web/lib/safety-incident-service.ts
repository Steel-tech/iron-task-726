/**
 * Safety Incident Management Service
 * Handles incident reporting, tracking, and compliance management
 */

export interface SafetyIncident {
  id: string
  projectId: string
  projectName: string
  reportedBy: {
    id: string
    name: string
    role: string
  }
  incidentType: 'near_miss' | 'injury' | 'property_damage' | 'safety_violation' | 'equipment_failure' | 'environmental'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  title: string
  description: string
  location: {
    area: string
    coordinates?: { lat: number; lng: number }
    address?: string
  }
  datetime: Date
  peopleInvolved: Array<{
    name: string
    role: string
    injuryType?: string
    medicalAttention?: boolean
  }>
  witnessNames: string[]
  immediateActions: string
  rootCause?: string
  correctiveActions?: string[]
  preventiveMeasures?: string[]
  photos: Array<{
    id: string
    url: string
    description: string
    timestamp: Date
  }>
  documents: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  assignedTo?: {
    id: string
    name: string
    role: string
  }
  dueDate?: Date
  resolvedAt?: Date
  tags: string[]
  riskScore: number
  complianceFlags: string[]
  followUpRequired: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SafetyMetrics {
  totalIncidents: number
  incidentsByType: Record<string, number>
  incidentsBySeverity: Record<string, number>
  incidentsByStatus: Record<string, number>
  averageResolutionTime: number
  nearMissRatio: number
  injuryRate: number
  lostTimeIncidents: number
  safetyScore: number
  compliancePercentage: number
  trendsOverTime: Array<{
    date: Date
    incidents: number
    severity: number
    resolved: number
  }>
}

export interface ComplianceRequirement {
  id: string
  title: string
  description: string
  type: 'osha' | 'local' | 'company' | 'insurance'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  dueDate: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  assignedTo: string
  projectId?: string
  completedAt?: Date
  evidence?: Array<{
    type: 'photo' | 'document' | 'checklist'
    url: string
    description: string
  }>
}

class SafetyIncidentService {
  private incidents: SafetyIncident[] = []
  private complianceRequirements: ComplianceRequirement[] = []
  private callbacks: Array<(incidents: SafetyIncident[]) => void> = []

  async reportIncident(incident: Omit<SafetyIncident, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>): Promise<SafetyIncident> {
    const newIncident: SafetyIncident = {
      ...incident,
      id: `incident_${Date.now()}`,
      riskScore: this.calculateRiskScore(incident),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.incidents.push(newIncident)
    this.notifyCallbacks()

    // Trigger alerts for critical incidents
    if (newIncident.severity === 'critical') {
      await this.triggerCriticalIncidentAlert(newIncident)
    }

    return newIncident
  }

  async updateIncident(id: string, updates: Partial<SafetyIncident>): Promise<SafetyIncident | null> {
    const index = this.incidents.findIndex(i => i.id === id)
    if (index === -1) return null

    this.incidents[index] = {
      ...this.incidents[index],
      ...updates,
      updatedAt: new Date()
    }

    this.notifyCallbacks()
    return this.incidents[index]
  }

  async getIncidents(filters?: {
    projectId?: string
    status?: SafetyIncident['status']
    severity?: SafetyIncident['severity']
    type?: SafetyIncident['incidentType']
    dateRange?: { start: Date; end: Date }
  }): Promise<SafetyIncident[]> {
    let filtered = [...this.incidents]

    if (filters) {
      if (filters.projectId) {
        filtered = filtered.filter(i => i.projectId === filters.projectId)
      }
      if (filters.status) {
        filtered = filtered.filter(i => i.status === filters.status)
      }
      if (filters.severity) {
        filtered = filtered.filter(i => i.severity === filters.severity)
      }
      if (filters.type) {
        filtered = filtered.filter(i => i.incidentType === filters.type)
      }
      if (filters.dateRange) {
        filtered = filtered.filter(i => 
          i.datetime >= filters.dateRange!.start && 
          i.datetime <= filters.dateRange!.end
        )
      }
    }

    return filtered.sort((a, b) => b.datetime.getTime() - a.datetime.getTime())
  }

  async getSafetyMetrics(projectId?: string, dateRange?: { start: Date; end: Date }): Promise<SafetyMetrics> {
    const incidents = await this.getIncidents({ 
      projectId, 
      dateRange 
    })

    const totalIncidents = incidents.length
    const incidentsByType = this.groupBy(incidents, 'incidentType')
    const incidentsBySeverity = this.groupBy(incidents, 'severity')
    const incidentsByStatus = this.groupBy(incidents, 'status')

    const resolvedIncidents = incidents.filter(i => i.resolvedAt)
    const averageResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, i) => 
          sum + (i.resolvedAt!.getTime() - i.createdAt.getTime()), 0
        ) / resolvedIncidents.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0

    const nearMisses = incidents.filter(i => i.incidentType === 'near_miss').length
    const injuries = incidents.filter(i => i.incidentType === 'injury').length
    const nearMissRatio = totalIncidents > 0 ? nearMisses / totalIncidents : 0
    const injuryRate = totalIncidents > 0 ? injuries / totalIncidents : 0

    const lostTimeIncidents = incidents.filter(i => 
      i.incidentType === 'injury' && 
      i.peopleInvolved.some(p => p.medicalAttention)
    ).length

    const safetyScore = this.calculateSafetyScore(incidents)
    const compliancePercentage = this.calculateCompliancePercentage()

    // Generate trends over time (last 30 days)
    const trendsOverTime = this.generateTrendsData(incidents, 30)

    return {
      totalIncidents,
      incidentsByType,
      incidentsBySeverity,
      incidentsByStatus,
      averageResolutionTime,
      nearMissRatio,
      injuryRate,
      lostTimeIncidents,
      safetyScore,
      compliancePercentage,
      trendsOverTime
    }
  }

  async getComplianceRequirements(projectId?: string): Promise<ComplianceRequirement[]> {
    let filtered = [...this.complianceRequirements]
    
    if (projectId) {
      filtered = filtered.filter(req => 
        !req.projectId || req.projectId === projectId
      )
    }

    return filtered.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  async updateComplianceRequirement(id: string, updates: Partial<ComplianceRequirement>): Promise<ComplianceRequirement | null> {
    const index = this.complianceRequirements.findIndex(req => req.id === id)
    if (index === -1) return null

    this.complianceRequirements[index] = {
      ...this.complianceRequirements[index],
      ...updates
    }

    return this.complianceRequirements[index]
  }

  private calculateRiskScore(incident: Omit<SafetyIncident, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>): number {
    let score = 0

    // Severity weighting
    const severityWeights = { low: 1, medium: 3, high: 7, critical: 10 }
    score += severityWeights[incident.severity]

    // Type weighting
    const typeWeights = {
      near_miss: 1,
      safety_violation: 2,
      property_damage: 3,
      equipment_failure: 4,
      environmental: 5,
      injury: 8
    }
    score += typeWeights[incident.incidentType]

    // People involved multiplier
    score += incident.peopleInvolved.length * 2

    // Medical attention multiplier
    if (incident.peopleInvolved.some(p => p.medicalAttention)) {
      score += 5
    }

    return Math.min(score, 100) // Cap at 100
  }

  private calculateSafetyScore(incidents: SafetyIncident[]): number {
    if (incidents.length === 0) return 100

    const totalRisk = incidents.reduce((sum, i) => sum + i.riskScore, 0)
    const averageRisk = totalRisk / incidents.length
    
    // Convert risk to safety score (inverse relationship)
    return Math.max(0, 100 - averageRisk)
  }

  private calculateCompliancePercentage(): number {
    if (this.complianceRequirements.length === 0) return 100

    const completed = this.complianceRequirements.filter(req => req.status === 'completed').length
    return (completed / this.complianceRequirements.length) * 100
  }

  private generateTrendsData(incidents: SafetyIncident[], days: number) {
    const trends = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      const dayIncidents = incidents.filter(incident => 
        incident.datetime.toDateString() === date.toDateString()
      )

      trends.push({
        date,
        incidents: dayIncidents.length,
        severity: dayIncidents.reduce((sum, i) => {
          const weights = { low: 1, medium: 2, high: 3, critical: 4 }
          return sum + weights[i.severity]
        }, 0),
        resolved: dayIncidents.filter(i => i.status === 'resolved').length
      })
    }

    return trends
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = String(item[key])
      groups[value] = (groups[value] || 0) + 1
      return groups
    }, {} as Record<string, number>)
  }

  private async triggerCriticalIncidentAlert(incident: SafetyIncident): Promise<void> {
    // In a real implementation, this would send notifications
    // to safety officers, project managers, and other stakeholders
    console.warn('CRITICAL SAFETY INCIDENT REPORTED:', incident.title)
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback([...this.incidents]))
  }

  onIncidentsUpdate(callback: (incidents: SafetyIncident[]) => void) {
    this.callbacks.push(callback)
    
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  // Initialize with mock data for development
  initializeMockData() {
    // Mock incidents
    const mockIncidents: SafetyIncident[] = [
      {
        id: 'incident_1',
        projectId: 'project_1',
        projectName: 'Downtown Office Complex',
        reportedBy: { id: 'user_1', name: 'Mike Johnson', role: 'FOREMAN' },
        incidentType: 'near_miss',
        severity: 'medium',
        status: 'resolved',
        title: 'Falling Object Near Miss',
        description: 'Small piece of debris fell from Level 3, nearly hitting worker below. No injuries occurred.',
        location: { area: 'Bay 3, Level 2', address: 'Downtown construction site' },
        datetime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        peopleInvolved: [{ name: 'John Smith', role: 'IRONWORKER' }],
        witnessNames: ['Sarah Chen', 'Roberto Martinez'],
        immediateActions: 'Area cleared, debris removed, safety briefing conducted',
        rootCause: 'Inadequate securing of materials on upper level',
        correctiveActions: ['Install additional safety netting', 'Review material handling procedures'],
        preventiveMeasures: ['Daily housekeeping inspections', 'Enhanced safety training'],
        photos: [],
        documents: [],
        tags: ['falling_object', 'housekeeping'],
        riskScore: 45,
        complianceFlags: [],
        followUpRequired: false,
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'incident_2',
        projectId: 'project_1',
        projectName: 'Downtown Office Complex',
        reportedBy: { id: 'user_2', name: 'Sarah Chen', role: 'SAFETY_OFFICER' },
        incidentType: 'injury',
        severity: 'high',
        status: 'investigating',
        title: 'Minor Laceration from Sharp Edge',
        description: 'Worker sustained minor cut on hand from unfinished steel edge while moving materials.',
        location: { area: 'Bay 1, Ground Level' },
        datetime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        peopleInvolved: [{ 
          name: 'Carlos Rodriguez', 
          role: 'IRONWORKER', 
          injuryType: 'Laceration - hand',
          medicalAttention: true
        }],
        witnessNames: ['Mike Johnson'],
        immediateActions: 'First aid administered, worker sent to clinic, area cordoned off',
        photos: [],
        documents: [],
        assignedTo: { id: 'user_2', name: 'Sarah Chen', role: 'SAFETY_OFFICER' },
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ['injury', 'sharp_edge', 'material_handling'],
        riskScore: 75,
        complianceFlags: ['OSHA_RECORDABLE'],
        followUpRequired: true,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    ]

    // Mock compliance requirements
    const mockCompliance: ComplianceRequirement[] = [
      {
        id: 'comp_1',
        title: 'Daily Safety Toolbox Talk',
        description: 'Conduct daily safety briefing with all workers',
        type: 'company',
        frequency: 'daily',
        dueDate: new Date(),
        status: 'completed',
        assignedTo: 'Mike Johnson',
        projectId: 'project_1',
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'comp_2',
        title: 'Weekly Safety Inspection',
        description: 'Comprehensive safety inspection of work areas and equipment',
        type: 'osha',
        frequency: 'weekly',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'pending',
        assignedTo: 'Sarah Chen',
        projectId: 'project_1'
      },
      {
        id: 'comp_3',
        title: 'Monthly Safety Training',
        description: 'Monthly safety training session for all workers',
        type: 'osha',
        frequency: 'monthly',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        assignedTo: 'Sarah Chen'
      }
    ]

    this.incidents = mockIncidents
    this.complianceRequirements = mockCompliance
  }
}

export const safetyIncidentService = new SafetyIncidentService()