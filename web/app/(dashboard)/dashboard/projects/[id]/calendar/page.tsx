'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, Plus, ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import ProductionCalendar from '@/components/ProductionCalendar'
import { api } from '@/lib/api'

interface Project {
  id: string
  name: string
  description: string | null
  location: string | null
  status: string
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'milestone' | 'inspection' | 'delivery' | 'meeting' | 'deadline'
  status: 'pending' | 'completed' | 'overdue'
  location?: string
  assignedTo?: string[]
  description?: string
}

export default function ProjectCalendarPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchProject()
    fetchEvents()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data)
    } catch (error) {
      setProject({
        id: projectId,
        name: 'Denver Convention Center',
        description: 'Steel fabrication and installation project',
        location: 'Denver, CO',
        status: 'ACTIVE',
      })
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/calendar`)
      setEvents(response.data)
    } catch (error) {
      setEvents([
        {
          id: '1',
          title: 'Steel Delivery - Main Beams',
          date: '2024-07-29',
          type: 'delivery',
          status: 'pending',
          location: 'Site A - East Wing',
          assignedTo: ['foreman@fsw-denver.com'],
        },
        {
          id: '2',
          title: 'Safety Inspection',
          date: '2024-07-30',
          type: 'inspection',
          status: 'pending',
          assignedTo: ['inspector@fsw-denver.com'],
        },
        {
          id: '3',
          title: 'Foundation Complete',
          date: '2024-07-25',
          type: 'milestone',
          status: 'completed',
        },
        {
          id: '4',
          title: 'Beam Installation Deadline',
          date: '2024-08-05',
          type: 'deadline',
          status: 'pending',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleEventCreate = (date: Date) => {
    setSelectedDate(date)
    setShowEventModal(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    // Open event details modal
  }

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/projects/${projectId}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Calendar className="h-8 w-8 text-safety-orange" />
                Production Schedule
              </h1>
              <p className="text-muted-foreground mt-1">{project.name}</p>
              {project.location && (
                <p className="text-sm text-gray-400">{project.location}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleEventCreate(new Date())}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="bg-card rounded-lg shadow">
        <ProductionCalendar
          projectId={projectId}
          events={events}
          onEventCreate={handleEventCreate}
          onEventClick={handleEventClick}
          className="border-0"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold text-white">{events.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">
                {events.filter(e => e.status === 'pending').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-500">
                {events.filter(e => e.status === 'completed').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-500">
                {events.filter(e => e.status === 'overdue').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Upcoming Events
        </h2>
        <div className="space-y-3">
          {events
            .filter(event => event.status === 'pending')
            .slice(0, 5)
            .map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      event.type === 'milestone'
                        ? 'bg-safety-orange'
                        : event.type === 'inspection'
                          ? 'bg-aisc-blue'
                          : event.type === 'delivery'
                            ? 'bg-purple-500'
                            : event.type === 'meeting'
                              ? 'bg-yellow-500'
                              : 'bg-red-600'
                    }`}
                  ></div>
                  <div>
                    <p className="text-white font-medium">{event.title}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.date).toLocaleDateString()}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full capitalize">
                  {event.type}
                </span>
              </div>
            ))}

          {events.filter(event => event.status === 'pending').length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No upcoming events scheduled</p>
              <Button
                onClick={() => handleEventCreate(new Date())}
                className="mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Event
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
