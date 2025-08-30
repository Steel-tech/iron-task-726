'use client'

import React, { useState, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from 'date-fns'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/Button'

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

interface ProductionCalendarProps {
  projectId?: string
  events?: CalendarEvent[]
  onEventCreate?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  className?: string
}

const defaultEvents: CalendarEvent[] = [
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
]

export default function ProductionCalendar({
  projectId,
  events = defaultEvents,
  onEventCreate,
  onEventClick,
  className = '',
}: ProductionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => isSameDay(parseISO(event.date), date))
  }

  const getEventTypeColor = (
    type: CalendarEvent['type'],
    status: CalendarEvent['status']
  ) => {
    if (status === 'completed') return 'bg-green-500'
    if (status === 'overdue') return 'bg-red-500'

    switch (type) {
      case 'milestone':
        return 'bg-safety-orange'
      case 'inspection':
        return 'bg-aisc-blue'
      case 'delivery':
        return 'bg-purple-500'
      case 'meeting':
        return 'bg-yellow-500'
      case 'deadline':
        return 'bg-red-600'
      default:
        return 'bg-gray-500'
    }
  }

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'milestone':
        return CheckCircle
      case 'inspection':
        return AlertTriangle
      case 'delivery':
        return MapPin
      case 'meeting':
        return Users
      case 'deadline':
        return Clock
      default:
        return Calendar
    }
  }

  const renderCalendarDays = () => {
    const days = []
    let day = startDate

    while (day <= endDate) {
      const dayEvents = getEventsForDate(day)
      const isCurrentMonth = isSameMonth(day, monthStart)
      const isSelected = selectedDate && isSameDay(day, selectedDate)
      const isCurrentDay = isToday(day)

      days.push(
        <div
          key={day.toString()}
          className={`
            min-h-[80px] p-1 border border-gray-700 cursor-pointer transition-colors
            ${isCurrentMonth ? 'bg-steel-gray' : 'bg-gray-800'}
            ${isSelected ? 'ring-2 ring-safety-orange' : ''}
            ${isCurrentDay ? 'bg-safety-orange/10' : ''}
            hover:bg-gray-700
          `}
          onClick={() => {
            setSelectedDate(day)
            if (onEventCreate && isCurrentMonth) {
              onEventCreate(day)
            }
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <span
              className={`
              text-sm font-medium
              ${isCurrentMonth ? 'text-white' : 'text-gray-500'}
              ${isCurrentDay ? 'text-safety-orange font-bold' : ''}
            `}
            >
              {format(day, 'd')}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs text-gray-400">{dayEvents.length}</span>
            )}
          </div>

          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => {
              const IconComponent = getEventIcon(event.type)
              return (
                <div
                  key={event.id}
                  className={`
                    px-1 py-0.5 rounded text-xs text-white truncate flex items-center gap-1
                    ${getEventTypeColor(event.type, event.status)}
                    hover:opacity-80
                  `}
                  onClick={e => {
                    e.stopPropagation()
                    if (onEventClick) onEventClick(event)
                  }}
                >
                  <IconComponent className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.title}</span>
                </div>
              )
            })}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-400 px-1">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }

    return days
  }

  return (
    <div
      className={`bg-steel-gray rounded-lg border border-gray-700 ${className}`}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-safety-orange" />
          <h3 className="text-lg font-shogun text-white">
            Production Schedule
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-white font-medium min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>

          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {onEventCreate && (
            <Button
              size="sm"
              className="ml-2"
              onClick={() => onEventCreate(selectedDate || new Date())}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-gray-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center">
            <span className="text-sm font-medium text-gray-400">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">{renderCalendarDays()}</div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Event Types:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-safety-orange rounded"></div>
            <span className="text-gray-300">Milestone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-aisc-blue rounded"></div>
            <span className="text-gray-300">Inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-300">Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span className="text-gray-300">Deadline</span>
          </div>
        </div>
      </div>
    </div>
  )
}
