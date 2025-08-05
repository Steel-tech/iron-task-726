'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { safetyIncidentService, type SafetyIncident } from '@/lib/safety-incident-service'
import {
  AlertTriangle,
  Clock,
  User,
  CheckCircle,
  XCircle,
  ArrowRight,
  MessageSquare,
  Camera,
  FileText,
  Calendar,
  Flag,
  Edit,
  Send,
  Eye,
  Download,
  Filter
} from 'lucide-react'

interface IncidentWorkflowManagerProps {
  incidentId?: string
  onIncidentUpdate?: (incident: SafetyIncident) => void
}

export default function IncidentWorkflowManager({ 
  incidentId,
  onIncidentUpdate 
}: IncidentWorkflowManagerProps) {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<SafetyIncident['status'] | 'all'>('all')
  const [filterSeverity, setFilterSeverity] = useState<SafetyIncident['severity'] | 'all'>('all')
  
  // Workflow management state
  const [assignToUser, setAssignToUser] = useState('')
  const [newComment, setNewComment] = useState('')
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('')
  const [correctiveActions, setCorrectiveActions] = useState<string[]>([''])
  const [preventiveMeasures, setPreventiveMeasures] = useState<string[]>([''])
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadIncidents()
    // Initialize mock data
    safetyIncidentService.initializeMockData()
  }, [filterStatus, filterSeverity])

  useEffect(() => {
    if (incidentId) {
      loadSpecificIncident(incidentId)
    }
  }, [incidentId])

  const loadIncidents = async () => {
    setIsLoading(true)
    try {
      const filters: any = {}
      if (filterStatus !== 'all') filters.status = filterStatus
      if (filterSeverity !== 'all') filters.severity = filterSeverity

      const incidentList = await safetyIncidentService.getIncidents(filters)
      setIncidents(incidentList)
      
      // Auto-select first incident if none selected
      if (!selectedIncident && incidentList.length > 0) {
        setSelectedIncident(incidentList[0])
        populateWorkflowForm(incidentList[0])
      }
    } catch (error) {
      console.error('Failed to load incidents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSpecificIncident = async (id: string) => {
    try {
      const allIncidents = await safetyIncidentService.getIncidents()
      const incident = allIncidents.find(i => i.id === id)
      if (incident) {
        setSelectedIncident(incident)
        populateWorkflowForm(incident)
      }
    } catch (error) {
      console.error('Failed to load specific incident:', error)
    }
  }

  const populateWorkflowForm = (incident: SafetyIncident) => {
    setAssignToUser(incident.assignedTo?.name || '')
    setRootCauseAnalysis(incident.rootCause || '')
    setCorrectiveActions(incident.correctiveActions?.length ? incident.correctiveActions : [''])
    setPreventiveMeasures(incident.preventiveMeasures?.length ? incident.preventiveMeasures : [''])
  }

  const handleStatusUpdate = async (newStatus: SafetyIncident['status']) => {
    if (!selectedIncident) return

    setIsUpdating(true)
    try {
      const updates: Partial<SafetyIncident> = {
        status: newStatus,
        ...(newStatus === 'resolved' && { resolvedAt: new Date() })
      }

      const updatedIncident = await safetyIncidentService.updateIncident(
        selectedIncident.id,
        updates
      )

      if (updatedIncident) {
        setSelectedIncident(updatedIncident)
        updateIncidentInList(updatedIncident)
        onIncidentUpdate?.(updatedIncident)
      }
    } catch (error) {
      console.error('Failed to update incident status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssignIncident = async () => {
    if (!selectedIncident || !assignToUser.trim()) return

    setIsUpdating(true)
    try {
      const updates: Partial<SafetyIncident> = {
        assignedTo: {
          id: 'assigned_user',
          name: assignToUser,
          role: 'SAFETY_OFFICER'
        },
        status: selectedIncident.status === 'reported' ? 'investigating' : selectedIncident.status
      }

      const updatedIncident = await safetyIncidentService.updateIncident(
        selectedIncident.id,
        updates
      )

      if (updatedIncident) {
        setSelectedIncident(updatedIncident)
        updateIncidentInList(updatedIncident)
        onIncidentUpdate?.(updatedIncident)
      }
    } catch (error) {
      console.error('Failed to assign incident:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInvestigationUpdate = async () => {
    if (!selectedIncident) return

    setIsUpdating(true)
    try {
      const updates: Partial<SafetyIncident> = {
        rootCause: rootCauseAnalysis,
        correctiveActions: correctiveActions.filter(action => action.trim()),
        preventiveMeasures: preventiveMeasures.filter(measure => measure.trim()),
        status: selectedIncident.status === 'reported' ? 'investigating' : selectedIncident.status
      }

      const updatedIncident = await safetyIncidentService.updateIncident(
        selectedIncident.id,
        updates
      )

      if (updatedIncident) {
        setSelectedIncident(updatedIncident)
        updateIncidentInList(updatedIncident)
        onIncidentUpdate?.(updatedIncident)
      }
    } catch (error) {
      console.error('Failed to update investigation:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updateIncidentInList = (updatedIncident: SafetyIncident) => {
    setIncidents(prev => prev.map(incident => 
      incident.id === updatedIncident.id ? updatedIncident : incident
    ))
  }

  const addCorrectiveAction = () => {
    setCorrectiveActions(prev => [...prev, ''])
  }

  const updateCorrectiveAction = (index: number, value: string) => {
    setCorrectiveActions(prev => prev.map((action, i) => i === index ? value : action))
  }

  const removeCorrectiveAction = (index: number) => {
    setCorrectiveActions(prev => prev.filter((_, i) => i !== index))
  }

  const addPreventiveMeasure = () => {
    setPreventiveMeasures(prev => [...prev, ''])
  }

  const updatePreventiveMeasure = (index: number, value: string) => {
    setPreventiveMeasures(prev => prev.map((measure, i) => i === index ? value : measure))
  }

  const removePreventiveMeasure = (index: number) => {
    setPreventiveMeasures(prev => prev.filter((_, i) => i !== index))
  }

  const getStatusColor = (status: SafetyIncident['status']) => {
    switch (status) {
      case 'reported': return 'bg-blue-100 text-blue-800'
      case 'investigating': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: SafetyIncident['severity']) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
    }
  }

  const getWorkflowActions = (status: SafetyIncident['status']) => {
    switch (status) {
      case 'reported':
        return [
          { label: 'Start Investigation', action: () => handleStatusUpdate('investigating'), color: 'bg-orange-600' },
          { label: 'Mark Resolved', action: () => handleStatusUpdate('resolved'), color: 'bg-green-600' }
        ]
      case 'investigating':
        return [
          { label: 'Mark Resolved', action: () => handleStatusUpdate('resolved'), color: 'bg-green-600' }
        ]
      case 'resolved':
        return [
          { label: 'Close Incident', action: () => handleStatusUpdate('closed'), color: 'bg-gray-600' },
          { label: 'Reopen Investigation', action: () => handleStatusUpdate('investigating'), color: 'bg-orange-600' }
        ]
      case 'closed':
        return [
          { label: 'Reopen', action: () => handleStatusUpdate('investigating'), color: 'bg-orange-600' }
        ]
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold">Incident Workflow Management</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input-construction text-sm"
          >
            <option value="all">All Status</option>
            <option value="reported">Reported</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="input-construction text-sm"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-1">
          <div className="card-construction">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold">Incidents ({incidents.length})</h3>
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {incidents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No incidents found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      onClick={() => {
                        setSelectedIncident(incident)
                        populateWorkflowForm(incident)
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedIncident?.id === incident.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                          {incident.title}
                        </h4>
                        <div className="flex flex-col gap-1 ml-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(incident.severity)}`}>
                            {incident.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(incident.status)}`}>
                            {incident.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{incident.datetime.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{incident.reportedBy.name}</span>
                        </div>
                        {incident.assignedTo && (
                          <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            <span>Assigned to {incident.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Incident Details & Workflow */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="space-y-6">
              {/* Incident Overview */}
              <div className="card-construction">
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{selectedIncident.title}</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded ${getSeverityColor(selectedIncident.severity)}`}>
                        {selectedIncident.severity.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedIncident.status)}`}>
                        {selectedIncident.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{selectedIncident.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Project:</span> {selectedIncident.projectName}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {selectedIncident.location.area}
                      </div>
                      <div>
                        <span className="font-medium">Reported by:</span> {selectedIncident.reportedBy.name}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {selectedIncident.datetime.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Risk Score:</span> {selectedIncident.riskScore}/100
                      </div>
                      <div>
                        <span className="font-medium">Follow-up:</span> {selectedIncident.followUpRequired ? 'Required' : 'Not required'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Full
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="p-6">
                  <h4 className="font-semibold mb-3">Workflow Actions</h4>
                  <div className="flex gap-3">
                    {getWorkflowActions(selectedIncident.status).map((action, index) => (
                      <Button
                        key={index}
                        onClick={action.action}
                        disabled={isUpdating}
                        className={`text-white ${action.color} hover:opacity-90`}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="card-construction">
                <div className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Assignment
                  </h4>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={assignToUser}
                      onChange={(e) => setAssignToUser(e.target.value)}
                      placeholder="Assign to team member..."
                      className="input-construction flex-1"
                    />
                    <Button 
                      onClick={handleAssignIncident}
                      disabled={isUpdating || !assignToUser.trim()}
                    >
                      Assign
                    </Button>
                  </div>
                  
                  {selectedIncident.assignedTo && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Currently assigned to: <strong>{selectedIncident.assignedTo.name}</strong> ({selectedIncident.assignedTo.role})
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Investigation Details */}
              <div className="card-construction">
                <div className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Investigation & Resolution
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Root Cause Analysis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Root Cause Analysis
                      </label>
                      <textarea
                        value={rootCauseAnalysis}
                        onChange={(e) => setRootCauseAnalysis(e.target.value)}
                        className="input-construction w-full h-20"
                        placeholder="Identify the root cause of this incident..."
                      />
                    </div>
                    
                    {/* Corrective Actions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Corrective Actions
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCorrectiveAction}
                        >
                          Add Action
                        </Button>
                      </div>
                      
                      {correctiveActions.map((action, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={action}
                            onChange={(e) => updateCorrectiveAction(index, e.target.value)}
                            className="input-construction flex-1"
                            placeholder="Describe corrective action..."
                          />
                          {correctiveActions.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCorrectiveAction(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Preventive Measures */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Preventive Measures
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addPreventiveMeasure}
                        >
                          Add Measure
                        </Button>
                      </div>
                      
                      {preventiveMeasures.map((measure, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={measure}
                            onChange={(e) => updatePreventiveMeasure(index, e.target.value)}
                            className="input-construction flex-1"
                            placeholder="Describe preventive measure..."
                          />
                          {preventiveMeasures.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePreventiveMeasure(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={handleInvestigationUpdate}
                        disabled={isUpdating}
                        variant="construction-primary"
                      >
                        {isUpdating ? 'Updating...' : 'Update Investigation'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* People Involved & Actions Taken */}
              {(selectedIncident.peopleInvolved.length > 0 || selectedIncident.immediateActions) && (
                <div className="card-construction">
                  <div className="p-6">
                    <h4 className="font-semibold mb-4">Incident Details</h4>
                    
                    {selectedIncident.peopleInvolved.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">People Involved</h5>
                        <div className="space-y-2">
                          {selectedIncident.peopleInvolved.map((person, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{person.name}</span>
                                <span className="text-sm text-gray-600 ml-2">({person.role})</span>
                              </div>
                              {person.medicalAttention && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                  Medical Attention
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedIncident.immediateActions && (
                      <div>
                        <h5 className="font-medium mb-2">Immediate Actions Taken</h5>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">
                          {selectedIncident.immediateActions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card-construction">
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Incident Selected</h3>
                <p>Select an incident from the list to view details and manage workflow</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}