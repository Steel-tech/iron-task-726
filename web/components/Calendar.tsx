'use client'

import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
} from 'lucide-react'
import { Button } from './Button'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  location?: string
  attendees?: number
  type: 'meeting' | 'inspection' | 'deadline' | 'safety'
}

// Mock events for demonstration
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Safety Inspection',
    date: new Date(2024, 11, 15),
    time: '09:00 AM',
    location: 'Site A - Tower Foundation',
    attendees: 5,
    type: 'inspection',
  },
  {
    id: '2',
    title: 'Steel Beam Installation',
    date: new Date(2024, 11, 18),
    time: '07:00 AM',
    location: 'Site A - Floor 15',
    attendees: 8,
    type: 'deadline',
  },
  {
    id: '3',
    title: 'Weekly Team Meeting',
    date: new Date(2024, 11, 20),
    time: '02:00 PM',
    location: 'Conference Room',
    attendees: 12,
    type: 'meeting',
  },
  {
    id: '4',
    title: 'Safety Training',
    date: new Date(2024, 11, 22),
    time: '10:00 AM',
    location: 'Training Center',
    attendees: 15,
    type: 'safety',
  },
]

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Get events for current month
  const monthEvents = mockEvents.filter(
    event =>
      event.date.getMonth() === currentMonth &&
      event.date.getFullYear() === currentYear
  )

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(
      new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1)
    )
  }

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500'
      case 'inspection':
        return 'bg-safety-orange'
      case 'deadline':
        return 'bg-red-500'
      case 'safety':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getDayEvents = (day: number) => {
    return monthEvents.filter(event => event.date.getDate() === day)
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-700"></div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getDayEvents(day)
      const isToday =
        today.getDate() === day &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear
      const isSelected =
        selectedDate?.getDate() === day &&
        selectedDate?.getMonth() === currentMonth &&
        selectedDate?.getFullYear() === currentYear

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-700 p-1 cursor-pointer hover:bg-gray-700 transition-colors ${
            isToday ? 'bg-safety-orange/20 border-safety-orange' : ''
          } ${isSelected ? 'bg-gray-600' : ''}`}
          onClick={() =>
            setSelectedDate(new Date(currentYear, currentMonth, day))
          }
        >
          <div
            className={`text-sm font-medium mb-1 ${
              isToday ? 'text-safety-orange' : 'text-white'
            }`}
          >
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded text-white truncate ${getEventTypeColor(event.type)}`}
                title={`${event.title} - ${event.time}`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-400">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  const selectedDateEvents = selectedDate
    ? getDayEvents(selectedDate.getDate())
    : []

  return (
    <div className="brushed-metal rounded-lg shadow-lg">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-safety-orange" />
          <h2 className="text-xl font-semibold text-white">Project Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium text-white px-4">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0 border border-gray-700">
            {renderCalendarDays()}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-400">Meetings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-safety-orange rounded"></div>
              <span className="text-sm text-gray-400">Inspections</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-400">Deadlines</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-400">Safety</span>
            </div>
          </div>
        </div>

        {/* Event Details Sidebar */}
        {selectedDate && (
          <div className="w-80 border-l border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.type)}`}
                      ></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                            <Users className="h-3 w-3" />
                            {event.attendees} attendees
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No events scheduled for this day.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
