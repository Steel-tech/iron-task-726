'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/Button'
import { safetyIncidentService, type SafetyIncident } from '@/lib/safety-incident-service'
import {
  AlertTriangle,
  Siren,
  Shield,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  User,
  X,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Settings,
  Send,
  Eye,
  CheckCircle
} from 'lucide-react'

interface SafetyAlert {
  id: string
  type: 'critical_incident' | 'emergency' | 'safety_violation' | 'evacuation' | 'weather' | 'equipment_failure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  location?: {
    area: string
    coordinates?: { lat: number; lng: number }
  }
  triggeredBy: {
    id: string
    name: string
    role: string
  }
  timestamp: Date
  acknowledged: boolean
  acknowledgedBy?: string[]
  actionRequired: boolean
  broadcastChannels: ('sms' | 'push' | 'email' | 'radio')[]
  recipients: string[]
  relatedIncidentId?: string
  autoResolve?: Date
  resolved: boolean
}

interface SafetyContact {
  id: string
  name: string
  role: string
  phone: string
  email: string
  priority: 'emergency' | 'high' | 'medium' | 'low'
  departments: string[]
  onDuty: boolean
}

export default function SafetyAlertSystem() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([])
  const [activeAlert, setActiveAlert] = useState<SafetyAlert | null>(null)
  const [isCreatingAlert, setIsCreatingAlert] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emergencyContacts, setEmergencyContacts] = useState<SafetyContact[]>([])
  
  // Alert creation form
  const [newAlert, setNewAlert] = useState({
    type: 'critical_incident' as SafetyAlert['type'],
    severity: 'high' as SafetyAlert['severity'],
    title: '',
    message: '',
    location: { area: '' },
    actionRequired: true,
    broadcastChannels: ['push', 'sms'] as SafetyAlert['broadcastChannels'],
    recipients: [] as string[]
  })

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Initialize mock data and load alerts
    initializeMockData()
    loadActiveAlerts()
    
    // Listen for new incidents that might trigger alerts
    const unsubscribe = safetyIncidentService.onIncidentsUpdate((incidents) => {
      checkForCriticalIncidents(incidents)
    })

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      unsubscribe()
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const initializeMockData = () => {
    const mockContacts: SafetyContact[] = [
      {
        id: 'contact_1',
        name: 'Emergency Services',
        role: 'EMERGENCY',
        phone: '911',
        email: 'emergency@local.gov',
        priority: 'emergency',
        departments: ['emergency'],
        onDuty: true
      },
      {
        id: 'contact_2',
        name: 'Sarah Chen',
        role: 'SAFETY_OFFICER',
        phone: '555-0101',
        email: 'sarah.chen@company.com',
        priority: 'emergency',
        departments: ['safety', 'management'],
        onDuty: true
      },
      {
        id: 'contact_3',
        name: 'Mike Johnson',
        role: 'PROJECT_MANAGER',
        phone: '555-0102',
        email: 'mike.johnson@company.com',
        priority: 'high',
        departments: ['management', 'operations'],
        onDuty: true
      },
      {
        id: 'contact_4',
        name: 'Site Security',
        role: 'SECURITY',
        phone: '555-0103',
        email: 'security@company.com',
        priority: 'high',
        departments: ['security'],
        onDuty: true
      }
    ]

    const mockAlerts: SafetyAlert[] = [
      {
        id: 'alert_1',
        type: 'critical_incident',
        severity: 'critical',
        title: 'Critical Injury Reported',
        message: 'Serious injury reported at Bay 3, Level 2. Emergency services have been contacted. All non-essential personnel should clear the area immediately.',
        location: { area: 'Bay 3, Level 2' },
        triggeredBy: { id: 'user_1', name: 'Mike Johnson', role: 'FOREMAN' },
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        acknowledged: false,
        actionRequired: true,
        broadcastChannels: ['push', 'sms', 'email'],
        recipients: ['all_site_personnel'],
        resolved: false
      }
    ]

    setEmergencyContacts(mockContacts)
    setAlerts(mockAlerts)
    
    // Set active alert if there's a critical one
    const criticalAlert = mockAlerts.find(a => a.severity === 'critical' && !a.resolved)
    if (criticalAlert) {
      setActiveAlert(criticalAlert)
      playAlertSound()
    }
  }

  const loadActiveAlerts = async () => {
    // In a real implementation, this would load from API
    // For now, we'll use the mock data
  }

  const checkForCriticalIncidents = (incidents: SafetyIncident[]) => {
    incidents.forEach(incident => {
      if (incident.severity === 'critical' && incident.createdAt > new Date(Date.now() - 60000)) {
        // New critical incident in the last minute
        triggerAutomaticAlert(incident)
      }
    })
  }

  const triggerAutomaticAlert = (incident: SafetyIncident) => {
    const alert: SafetyAlert = {
      id: `alert_${Date.now()}`,
      type: 'critical_incident',
      severity: 'critical',
      title: `Critical Incident: ${incident.title}`,
      message: `${incident.description}\n\nLocation: ${incident.location.area}\nReported by: ${incident.reportedBy.name}`,
      location: incident.location,
      triggeredBy: incident.reportedBy,
      timestamp: new Date(),
      acknowledged: false,
      actionRequired: true,
      broadcastChannels: ['push', 'sms', 'email'],
      recipients: ['all_site_personnel'],
      relatedIncidentId: incident.id,
      resolved: false
    }

    createAlert(alert)
  }

  const createAlert = async (alertData: Omit<SafetyAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>) => {
    const alert: SafetyAlert = {
      ...alertData,
      id: `alert_${Date.now()}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    }

    setAlerts(prev => [alert, ...prev])
    
    // Set as active alert if critical
    if (alert.severity === 'critical') {
      setActiveAlert(alert)
      playAlertSound()
    }

    // Send notifications
    await broadcastAlert(alert)
  }

  const broadcastAlert = async (alert: SafetyAlert) => {
    // Browser notification
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`🚨 ${alert.title}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
        requireInteraction: alert.severity === 'critical'
      })
    }

    // In a real implementation, this would send SMS, emails, etc.
    // Alert broadcast system would be implemented here
  }

  const playAlertSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(error => {
        // Handle audio play error silently
      })
      setIsPlaying(true)
    }
  }

  const stopAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            acknowledged: true,
            acknowledgedBy: [...(alert.acknowledgedBy || []), 'Current User']
          }
        : alert
    ))

    if (activeAlert?.id === alertId) {
      stopAlertSound()
      setActiveAlert(null)
    }
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))

    if (activeAlert?.id === alertId) {
      stopAlertSound()
      setActiveAlert(null)
    }
  }

  const handleCreateAlert = async () => {
    if (!newAlert.title.trim() || !newAlert.message.trim()) return

    await createAlert({
      ...newAlert,
      triggeredBy: {
        id: 'current_user',
        name: 'Current User',
        role: 'FOREMAN'
      }
    })

    // Reset form
    setNewAlert({
      type: 'critical_incident',
      severity: 'high',
      title: '',
      message: '',
      location: { area: '' },
      actionRequired: true,
      broadcastChannels: ['push', 'sms'],
      recipients: []
    })
    setIsCreatingAlert(false)
  }

  const getAlertIcon = (type: SafetyAlert['type']) => {
    switch (type) {
      case 'critical_incident': return <AlertTriangle className="h-5 w-5" />
      case 'emergency': return <Siren className="h-5 w-5" />
      case 'safety_violation': return <Shield className="h-5 w-5" />
      case 'evacuation': return <MapPin className="h-5 w-5" />
      case 'weather': return <Clock className="h-5 w-5" />
      case 'equipment_failure': return <Settings className="h-5 w-5" />
    }
  }

  const getAlertColor = (severity: SafetyAlert['severity']) => {
    switch (severity) {
      case 'low': return 'border-l-green-500 bg-green-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'critical': return 'border-l-red-500 bg-red-50'
    }
  }

  const getSeverityTextColor = (severity: SafetyAlert['severity']) => {
    switch (severity) {
      case 'low': return 'text-green-800'
      case 'medium': return 'text-yellow-800'
      case 'high': return 'text-orange-800'
      case 'critical': return 'text-red-800'
    }
  }

  const activeAlerts = alerts.filter(a => !a.resolved)
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')

  return (
    <div className="space-y-6">
      {/* Audio element for alert sounds */}
      <audio
        ref={audioRef}
        loop
        onEnded={() => setIsPlaying(false)}
      >
        <source src="/sounds/alert.mp3" type="audio/mpeg" />
        <source src="/sounds/alert.wav" type="audio/wav" />
      </audio>

      {/* Active Critical Alert Banner */}
      {activeAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <Siren className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">CRITICAL SAFETY ALERT</h3>
                  <p className="text-sm">{activeAlert.title} - {activeAlert.location?.area}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopAlertSound}
                    className="text-white hover:bg-red-700"
                  >
                    <VolumeX className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => acknowledgeAlert(activeAlert.id)}
                  className="text-white hover:bg-red-700"
                >
                  Acknowledge
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveAlert(null)}
                  className="text-white hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between ${activeAlert ? 'mt-20' : ''}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">Safety Alert System</h2>
          {criticalAlerts.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={soundEnabled ? "outline" : "ghost"}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button
            variant={notificationsEnabled ? "outline" : "ghost"}
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="construction-primary"
            onClick={() => setIsCreatingAlert(true)}
          >
            Create Alert
          </Button>
        </div>
      </div>

      {/* Quick Emergency Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Emergency Services', 
            action: () => window.open('tel:911'), 
            color: 'bg-red-600 hover:bg-red-700', 
            icon: <Phone className="h-5 w-5" /> 
          },
          { 
            label: 'Site Evacuation', 
            action: () => createAlert({
              type: 'evacuation',
              severity: 'critical',
              title: 'Site Evacuation Order',
              message: 'All personnel must evacuate the site immediately. Report to designated assembly point.',
              triggeredBy: { id: 'current_user', name: 'Current User', role: 'FOREMAN' },
              actionRequired: true,
              broadcastChannels: ['push', 'sms', 'email'],
              recipients: ['all_site_personnel']
            }), 
            color: 'bg-orange-600 hover:bg-orange-700', 
            icon: <MapPin className="h-5 w-5" /> 
          },
          { 
            label: 'Safety Officer', 
            action: () => window.open('tel:555-0101'), 
            color: 'bg-blue-600 hover:bg-blue-700', 
            icon: <Shield className="h-5 w-5" /> 
          },
          { 
            label: 'First Aid Team', 
            action: () => createAlert({
              type: 'emergency',
              severity: 'high',
              title: 'First Aid Assistance Needed',
              message: 'First aid assistance requested. Responders please report to specified location.',
              triggeredBy: { id: 'current_user', name: 'Current User', role: 'FOREMAN' },
              actionRequired: true,
              broadcastChannels: ['push', 'sms'],
              recipients: ['first_aid_team', 'safety_officers']
            }), 
            color: 'bg-green-600 hover:bg-green-700', 
            icon: <User className="h-5 w-5" /> 
          }
        ].map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            className={`${action.color} text-white p-4 h-auto flex flex-col items-center gap-2 text-center`}
          >
            {action.icon}
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Active Alerts */}
      <div className="card-construction">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Active Alerts ({activeAlerts.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Auto-refresh every 30s</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {activeAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active safety alerts</p>
              <p className="text-sm">All systems normal</p>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 border-l-4 ${getAlertColor(alert.severity)} ${
                  alert.severity === 'critical' ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={getSeverityTextColor(alert.severity)}>
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-semibold ${getSeverityTextColor(alert.severity)}`}>
                          {alert.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        {alert.acknowledged && (
                          <span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      
                      <p className={`mb-3 ${getSeverityTextColor(alert.severity)}`}>
                        {alert.message}
                      </p>
                      
                      <div className={`flex items-center gap-4 text-sm ${getSeverityTextColor(alert.severity)} opacity-75`}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{alert.timestamp.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{alert.triggeredBy.name}</span>
                        </div>
                        {alert.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{alert.location.area}</span>
                          </div>
                        )}
                      </div>
                      
                      {alert.acknowledgedBy && alert.acknowledgedBy.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          Acknowledged by: {alert.acknowledgedBy.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!alert.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      Resolve
                    </Button>
                    {alert.relatedIncidentId && (
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Incident
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="card-construction">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Emergency Contacts</h3>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {emergencyContacts.map((contact) => (
            <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{contact.name}</h4>
                <div className={`w-2 h-2 rounded-full ${contact.onDuty ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
              <p className="text-sm text-gray-600 mb-2">{contact.role}</p>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open(`tel:${contact.phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {contact.phone}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${contact.email}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Alert Modal */}
      {isCreatingAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Create Safety Alert</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingAlert(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Type
                  </label>
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value as any }))}
                    className="input-construction w-full"
                  >
                    <option value="critical_incident">Critical Incident</option>
                    <option value="emergency">Emergency</option>
                    <option value="safety_violation">Safety Violation</option>
                    <option value="evacuation">Evacuation</option>
                    <option value="weather">Weather Alert</option>
                    <option value="equipment_failure">Equipment Failure</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="input-construction w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Title
                </label>
                <input
                  type="text"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                  className="input-construction w-full"
                  placeholder="Brief alert title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={newAlert.message}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                  className="input-construction w-full h-24"
                  placeholder="Detailed alert message"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newAlert.location.area}
                  onChange={(e) => setNewAlert(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, area: e.target.value }
                  }))}
                  className="input-construction w-full"
                  placeholder="Alert location/area"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newAlert.actionRequired}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, actionRequired: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Action Required</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIsCreatingAlert(false)}
              >
                Cancel
              </Button>
              <Button
                variant="construction-primary"
                onClick={handleCreateAlert}
                disabled={!newAlert.title.trim() || !newAlert.message.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Alert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}