'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Users,
  Cloud,
  Truck,
  AlertTriangle,
  FileText,
  Save,
  Car,
  Wrench,
  Package,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

interface TimesheetEmployee {
  name: string
  startTime: string
  lunch: boolean
  stopTime: string
  extraWork: string
  total: string
  jobNumber: string
}

interface TimesheetData {
  date: string
  foreman: string
  employees: TimesheetEmployee[]
  issues: string
}

interface WeatherData {
  conditions: string
  windSpeed: string
  deliveries: string
  needs: string
}

interface JHAHazard {
  checked: boolean
  preventive: string
}

interface JHAData {
  date: string
  jobName: string
  jobNumber: string
  supervisor: string
  scopeOfWork: string[]
  personnel: Array<{ name: string; task: string }>
  hazards: {
    workingHeights: JHAHazard
    tripHazards: JHAHazard
    lifting: JHAHazard
  }
}

interface VehicleInspectionData {
  operatorName: string
  vehicleDescription: string
  licenseNumber: string
  mileage: string
  date: string
  conditions: Record<string, 'good' | 'fair' | 'poor'>
  lights: {
    brake: boolean
    head: boolean
    signal: boolean
  }
  notes: string
}

interface WelderInspectionData {
  fswNumber: string
  description: string
  currentHours: string
  checks: {
    coolantLevel: boolean
    fuelLevel: boolean
    engineOil: boolean
    hydraulicFluid: boolean
    cuttingTorch: boolean
    weldingLeads: boolean
    groundCable: boolean
  }
  notes: string
}

interface ForkliftInspectionDay {
  date: string
  inspector: string
  items: {
    tires: boolean
    forks: boolean
    mast: boolean
    hydraulics: boolean
    brakes: boolean
    steering: boolean
    horn: boolean
    lights: boolean
    seatBelt: boolean
    fireExtinguisher: boolean
  }
}

interface ForkliftInspectionData {
  forkliftId: string
  weekStarting: string
  weeklyChecks: {
    monday: ForkliftInspectionDay
    tuesday: ForkliftInspectionDay
    wednesday: ForkliftInspectionDay
    thursday: ForkliftInspectionDay
    friday: ForkliftInspectionDay
  }
}

interface SafetyMeetingData {
  project: string
  meetingDate: string
  facilitator: string
  hazardsOnJob: string
  topics: string[]
  attendees: Array<{
    name: string
    signature: string
  }>
}

interface FSWIronTaskProps {
  projectId: string
}

const FSWIronTask: React.FC<FSWIronTaskProps> = ({ projectId }) => {
  const { toast } = useToast()

  // State for Daily Timesheet
  const [timesheetData, setTimesheetData] = useState<TimesheetData>({
    date: '',
    foreman: '',
    employees: Array(5)
      .fill(null)
      .map(() => ({
        name: '',
        startTime: '',
        lunch: false,
        stopTime: '',
        extraWork: '',
        total: '',
        jobNumber: '',
      })),
    issues: '',
  })

  // State to track number of visible employees
  const [visibleEmployees, setVisibleEmployees] = useState(5)

  // State for Weather & Conditions
  const [weatherData, setWeatherData] = useState<WeatherData>({
    conditions: '',
    windSpeed: '',
    deliveries: '',
    needs: '',
  })

  // State for Job Hazard Analysis
  const [jhaData, setJhaData] = useState<JHAData>({
    date: '',
    jobName: '',
    jobNumber: '',
    supervisor: '',
    scopeOfWork: ['', '', '', '', ''],
    personnel: Array(6)
      .fill(null)
      .map(() => ({ name: '', task: '' })),
    hazards: {
      workingHeights: {
        checked: true,
        preventive: 'Use harness, Safety Lines, Retractables and or Beamers',
      },
      tripHazards: {
        checked: true,
        preventive: 'Be aware of changes in elevations',
      },
      lifting: {
        checked: true,
        preventive: 'Utilize proper lifting techniques',
      },
    },
  })

  // State for Vehicle Inspection
  const [vehicleInspection, setVehicleInspection] =
    useState<VehicleInspectionData>({
      operatorName: '',
      vehicleDescription: '',
      licenseNumber: '',
      mileage: '',
      date: '',
      conditions: {
        motorOil: 'good',
        coolant: 'good',
        brakes: 'good',
        tires: 'good',
        transmission: 'good',
        battery: 'good',
        belts: 'good',
        hoses: 'good',
        wipers: 'good',
        mirrors: 'good',
        windshield: 'good',
        exhaust: 'good',
        steering: 'good',
        suspension: 'good',
      },
      lights: {
        brake: true,
        head: true,
        signal: true,
      },
      notes: '',
    })

  // State for Welder Inspection
  const [welderInspections, setWelderInspections] = useState<
    WelderInspectionData[]
  >([
    {
      fswNumber: '',
      description: '',
      currentHours: '',
      checks: {
        coolantLevel: false,
        fuelLevel: false,
        engineOil: false,
        hydraulicFluid: false,
        cuttingTorch: false,
        weldingLeads: false,
        groundCable: false,
      },
      notes: '',
    },
  ])

  // State for Forklift Inspection
  const createEmptyDay = (): ForkliftInspectionDay => ({
    date: '',
    inspector: '',
    items: {
      tires: false,
      forks: false,
      mast: false,
      hydraulics: false,
      brakes: false,
      steering: false,
      horn: false,
      lights: false,
      seatBelt: false,
      fireExtinguisher: false,
    },
  })

  const [forkliftInspection, setForkliftInspection] =
    useState<ForkliftInspectionData>({
      forkliftId: '',
      weekStarting: '',
      weeklyChecks: {
        monday: createEmptyDay(),
        tuesday: createEmptyDay(),
        wednesday: createEmptyDay(),
        thursday: createEmptyDay(),
        friday: createEmptyDay(),
      },
    })

  // State for Safety Meeting
  const [safetyMeeting, setSafetyMeeting] = useState<SafetyMeetingData>({
    project: '',
    meetingDate: '',
    facilitator: '',
    hazardsOnJob: '',
    topics: [
      'PPE Requirements',
      'Fall Protection',
      'Hazard Communication',
      'Tool Safety',
      'Fire Prevention',
    ],
    attendees: Array(10)
      .fill(null)
      .map(() => ({ name: '', signature: '' })),
  })

  const [activeForm, setActiveForm] = useState('timesheet')

  // Calculate total hours for timesheet
  const calculateHours = (
    start: string,
    lunch: boolean,
    stop: string
  ): string => {
    if (start && stop) {
      const startTime = new Date(`2000-01-01T${start}`)
      let stopTime = new Date(`2000-01-01T${stop}`)

      // Handle overnight shifts - if stop time is earlier than start time, assume next day
      if (stopTime <= startTime) {
        stopTime = new Date(`2000-01-02T${stop}`)
      }

      const diffMs = stopTime.getTime() - startTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      const lunchDeduction = lunch ? 0.5 : 0
      return (diffHours - lunchDeduction).toFixed(1)
    }
    return ''
  }

  const updateEmployee = (
    index: number,
    field: keyof TimesheetEmployee,
    value: any
  ) => {
    const newEmployees = [...timesheetData.employees]
    const existingEmployee = newEmployees[index]
    if (!existingEmployee) return
    
    newEmployees[index] = { ...existingEmployee, [field]: value }

    if (field === 'startTime' || field === 'lunch' || field === 'stopTime') {
      const updatedEmployee = newEmployees[index]
      if (updatedEmployee) {
        updatedEmployee.total = calculateHours(
          updatedEmployee.startTime,
          updatedEmployee.lunch,
          updatedEmployee.stopTime
        )
      }
    }

    setTimesheetData({ ...timesheetData, employees: newEmployees })
  }

  const addEmployee = () => {
    const newEmployee = {
      name: '',
      startTime: '',
      lunch: false,
      stopTime: '',
      extraWork: '',
      total: '',
      jobNumber: '',
    }
    setTimesheetData({
      ...timesheetData,
      employees: [...timesheetData.employees, newEmployee],
    })
  }

  const removeEmployee = (index: number) => {
    if (timesheetData.employees.length > 1) {
      const newEmployees = timesheetData.employees.filter((_, i) => i !== index)
      setTimesheetData({ ...timesheetData, employees: newEmployees })
    }
  }

  const saveData = async () => {
    try {
      const allData = {
        timesheet: timesheetData,
        weather: weatherData,
        jha: jhaData,
        vehicleInspection,
        welderInspections,
        forkliftInspection,
        safetyMeeting,
        savedAt: new Date().toISOString(),
      }

      // Save to the database with projectId
      await api.post(`/projects/${projectId}/forms`, allData)

      toast({
        title: 'Success',
        description: 'All forms have been saved successfully!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save forms. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const navigationTabs = [
    { id: 'timesheet', label: 'Daily Timesheet', icon: Calendar },
    { id: 'weather', label: 'Weather & Conditions', icon: Cloud },
    { id: 'jha', label: 'Job Hazard Analysis', icon: AlertTriangle },
    { id: 'vehicle', label: 'Vehicle Inspection', icon: Car },
    { id: 'welder', label: 'Welder Inspection', icon: Wrench },
    { id: 'forklift', label: 'Forklift Inspection', icon: Package },
    { id: 'safety', label: 'Safety Meeting', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold">FSW IRON TASK</div>
            <div className="text-sm text-gray-400">
              FSW Iron Task Digital Forms
            </div>
          </div>
          <Button
            onClick={saveData}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Save size={20} />
            <span>Save All Forms</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 overflow-x-auto">
            {navigationTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveForm(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeForm === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Daily Timesheet Form */}
        {activeForm === 'timesheet' && (
          <div className="brushed-metal rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
              <Calendar className="mr-2" />
              Daily Timesheet
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={timesheetData.date}
                  onChange={e =>
                    setTimesheetData({ ...timesheetData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Foreman
                </label>
                <input
                  type="text"
                  value={timesheetData.foreman}
                  onChange={e =>
                    setTimesheetData({
                      ...timesheetData,
                      foreman: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="border border-gray-600 px-4 py-2 text-left text-gray-300">
                      Employee
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-gray-300">
                      Start Time
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-gray-300">
                      Lunch
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-gray-300">
                      Stop Time
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-gray-300">
                      Extra Work
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-gray-300">
                      Total
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-gray-300">
                      Job #
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timesheetData.employees.map((employee, index) => (
                    <tr key={index}>
                      <td className="border border-gray-600 px-2 py-1">
                        <input
                          type="text"
                          value={employee.name}
                          onChange={e =>
                            updateEmployee(index, 'name', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-600 px-2 py-1">
                        <input
                          type="time"
                          value={employee.startTime}
                          onChange={e =>
                            updateEmployee(index, 'startTime', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-600 px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={employee.lunch}
                          onChange={e =>
                            updateEmployee(index, 'lunch', e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="border border-gray-600 px-2 py-1">
                        <input
                          type="time"
                          value={employee.stopTime}
                          onChange={e =>
                            updateEmployee(index, 'stopTime', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-600 px-2 py-1">
                        <input
                          type="text"
                          value={employee.extraWork}
                          onChange={e =>
                            updateEmployee(index, 'extraWork', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-600 px-2 py-1 text-center bg-gray-800 text-white">
                        {employee.total}
                      </td>
                      <td className="border border-gray-600 px-2 py-1">
                        <input
                          type="text"
                          value={employee.jobNumber}
                          onChange={e =>
                            updateEmployee(index, 'jobNumber', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-600 px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeEmployee(index)}
                          disabled={timesheetData.employees.length <= 1}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={addEmployee}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Add Employee
              </button>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Issues (Describe any issues that occurred on the job today)
              </label>
              <textarea
                value={timesheetData.issues}
                onChange={e =>
                  setTimesheetData({ ...timesheetData, issues: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
          </div>
        )}

        {/* Weather & Conditions Form */}
        {activeForm === 'weather' && (
          <div className="brushed-metal rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
              <Cloud className="mr-2" />
              Weather & Daily Conditions
            </h2>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-white">
                Weather Conditions
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  'Sunny',
                  'Cloudy',
                  'Partly Cloudy',
                  'Rain',
                  'Thunderstorm',
                  'Snow',
                  'Fog',
                  'Frost',
                  'Wind',
                ].map(condition => (
                  <label
                    key={condition}
                    className="flex items-center text-gray-300"
                  >
                    <input
                      type="radio"
                      checked={weatherData.conditions === condition}
                      onChange={() =>
                        setWeatherData({
                          ...weatherData,
                          conditions: condition,
                        })
                      }
                      className="mr-2"
                    />
                    <span>{condition}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Wind Speed
                </label>
                <input
                  type="text"
                  value={weatherData.windSpeed}
                  onChange={e =>
                    setWeatherData({
                      ...weatherData,
                      windSpeed: e.target.value,
                    })
                  }
                  placeholder="mph"
                  className="w-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2 flex items-center text-white">
                <Truck className="mr-2" size={20} />
                Deliveries
              </h3>
              <textarea
                value={weatherData.deliveries}
                onChange={e =>
                  setWeatherData({ ...weatherData, deliveries: e.target.value })
                }
                placeholder="Describe what was delivered"
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-white">Needs</h3>
              <p className="text-sm text-gray-400 mb-2">
                What do you need? (Consumables, Drawings, Tools, Equipment,
                Manpower, Etc.)
              </p>
              <textarea
                value={weatherData.needs}
                onChange={e =>
                  setWeatherData({ ...weatherData, needs: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
          </div>
        )}

        {/* Job Hazard Analysis Form */}
        {activeForm === 'jha' && (
          <div className="brushed-metal rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
              <AlertTriangle className="mr-2" />
              Pretask Job Hazard Analysis
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={jhaData.date}
                  onChange={e =>
                    setJhaData({ ...jhaData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Job Name
                </label>
                <input
                  type="text"
                  value={jhaData.jobName}
                  onChange={e =>
                    setJhaData({ ...jhaData, jobName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Job Number
                </label>
                <input
                  type="text"
                  value={jhaData.jobNumber}
                  onChange={e =>
                    setJhaData({ ...jhaData, jobNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Supervisor
                </label>
                <input
                  type="text"
                  value={jhaData.supervisor}
                  onChange={e =>
                    setJhaData({ ...jhaData, supervisor: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-white">Scope of Work</h3>
              {jhaData.scopeOfWork.map((scope, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={scope}
                    onChange={e => {
                      const newScope = [...jhaData.scopeOfWork]
                      newScope[index] = e.target.value
                      setJhaData({ ...jhaData, scopeOfWork: newScope })
                    }}
                    placeholder={`Task ${index + 1}`}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-white">Task Hazards</h3>
              <div className="space-y-4">
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={jhaData.hazards.workingHeights.checked}
                      onChange={e =>
                        setJhaData({
                          ...jhaData,
                          hazards: {
                            ...jhaData.hazards,
                            workingHeights: {
                              ...jhaData.hazards.workingHeights,
                              checked: e.target.checked,
                            },
                          },
                        })
                      }
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">
                        Working in heights over 6&apos; - Falling Hazard
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Preventive Action:{' '}
                        {jhaData.hazards.workingHeights.preventive}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={jhaData.hazards.tripHazards.checked}
                      onChange={e =>
                        setJhaData({
                          ...jhaData,
                          hazards: {
                            ...jhaData.hazards,
                            tripHazards: {
                              ...jhaData.hazards.tripHazards,
                              checked: e.target.checked,
                            },
                          },
                        })
                      }
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">Trip Hazards</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Preventive Action:{' '}
                        {jhaData.hazards.tripHazards.preventive}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={jhaData.hazards.lifting.checked}
                      onChange={e =>
                        setJhaData({
                          ...jhaData,
                          hazards: {
                            ...jhaData.hazards,
                            lifting: {
                              ...jhaData.hazards.lifting,
                              checked: e.target.checked,
                            },
                          },
                        })
                      }
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">Lifting Injury</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Preventive Action: {jhaData.hazards.lifting.preventive}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Inspection Form */}
        {activeForm === 'vehicle' && (
          <div className="brushed-metal rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
              <Car className="mr-2" />
              Vehicle Inspection Form
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Operator Name
                </label>
                <input
                  type="text"
                  value={vehicleInspection.operatorName}
                  onChange={e =>
                    setVehicleInspection({
                      ...vehicleInspection,
                      operatorName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Vehicle Description
                </label>
                <input
                  type="text"
                  value={vehicleInspection.vehicleDescription}
                  onChange={e =>
                    setVehicleInspection({
                      ...vehicleInspection,
                      vehicleDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={vehicleInspection.licenseNumber}
                  onChange={e =>
                    setVehicleInspection({
                      ...vehicleInspection,
                      licenseNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Mileage
                </label>
                <input
                  type="text"
                  value={vehicleInspection.mileage}
                  onChange={e =>
                    setVehicleInspection({
                      ...vehicleInspection,
                      mileage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={vehicleInspection.date}
                  onChange={e =>
                    setVehicleInspection({
                      ...vehicleInspection,
                      date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-white">
                Vehicle Condition Checklist
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(vehicleInspection.conditions).map(
                  ([item, condition]) => (
                    <div
                      key={item}
                      className="flex items-center justify-between border border-gray-600 rounded p-3"
                    >
                      <span className="text-gray-300 capitalize">
                        {item.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <select
                        value={condition}
                        onChange={e =>
                          setVehicleInspection({
                            ...vehicleInspection,
                            conditions: {
                              ...vehicleInspection.conditions,
                              [item]: e.target.value as
                                | 'good'
                                | 'fair'
                                | 'poor',
                            },
                          })
                        }
                        className="ml-2 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                      >
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-white">Lights Check</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(vehicleInspection.lights).map(
                  ([light, checked]) => (
                    <label
                      key={light}
                      className="flex items-center text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e =>
                          setVehicleInspection({
                            ...vehicleInspection,
                            lights: {
                              ...vehicleInspection.lights,
                              [light]: e.target.checked,
                            },
                          })
                        }
                        className="mr-2"
                      />
                      <span className="capitalize">{light} Lights</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={vehicleInspection.notes}
                onChange={e =>
                  setVehicleInspection({
                    ...vehicleInspection,
                    notes: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
          </div>
        )}

        {/* Welder Inspection Form */}
        {activeForm === 'welder' && (
          <div className="brushed-metal rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
              <Wrench className="mr-2" />
              Welder Machine Inspection
            </h2>

            {welderInspections.map((welder, welderIndex) => (
              <div
                key={welderIndex}
                className="mb-8 p-4 border border-gray-600 rounded-lg"
              >
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      FSW Number
                    </label>
                    <input
                      type="text"
                      value={welder.fswNumber}
                      onChange={e => {
                        const newWelders = [...welderInspections]
                        const welder = newWelders[welderIndex]
                        if (welder) {
                          welder.fswNumber = e.target.value
                          setWelderInspections(newWelders)
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Machine Description
                    </label>
                    <input
                      type="text"
                      value={welder.description}
                      onChange={e => {
                        const newWelders = [...welderInspections]
                        const welder = newWelders[welderIndex]
                        if (welder) {
                          welder.description = e.target.value
                          setWelderInspections(newWelders)
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Current Hours
                    </label>
                    <input
                      type="text"
                      value={welder.currentHours}
                      onChange={e => {
                        const newWelders = [...welderInspections]
                        const welder = newWelders[welderIndex]
                        if (welder) {
                          welder.currentHours = e.target.value
                          setWelderInspections(newWelders)
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-white">
                    Inspection Checklist
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(welder.checks).map(([check, checked]) => (
                      <label
                        key={check}
                        className="flex items-center text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const newWelders = [...welderInspections]
                            const welder = newWelders[welderIndex]
                            if (welder) {
                              welder.checks[
                                check as keyof typeof welder.checks
                              ] = e.target.checked
                              setWelderInspections(newWelders)
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="capitalize">
                          {check.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={welder.notes}
                    onChange={e => {
                      const newWelders = [...welderInspections]
                      const welder = newWelders[welderIndex]
                      if (welder) {
                        welder.notes = e.target.value
                        setWelderInspections(newWelders)
                      }
                    }}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
            ))}

            <Button
              onClick={() =>
                setWelderInspections([
                  ...welderInspections,
                  {
                    fswNumber: '',
                    description: '',
                    currentHours: '',
                    checks: {
                      coolantLevel: false,
                      fuelLevel: false,
                      engineOil: false,
                      hydraulicFluid: false,
                      cuttingTorch: false,
                      weldingLeads: false,
                      groundCable: false,
                    },
                    notes: '',
                  },
                ])
              }
              variant="outline"
            >
              Add Another Welder
            </Button>
          </div>
        )}

        {/* Forklift Inspection Form */}
        {activeForm === 'forklift' && (
          <div className="brushed-metal rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
              <Package className="mr-2" />
              Weekly Forklift Inspection
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Forklift ID
                </label>
                <input
                  type="text"
                  value={forkliftInspection.forkliftId}
                  onChange={e =>
                    setForkliftInspection({
                      ...forkliftInspection,
                      forkliftId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Week Starting
                </label>
                <input
                  type="date"
                  value={forkliftInspection.weekStarting}
                  onChange={e =>
                    setForkliftInspection({
                      ...forkliftInspection,
                      weekStarting: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(forkliftInspection.weeklyChecks).map(
                ([day, dayData]) => (
                  <div
                    key={day}
                    className="border border-gray-600 rounded-lg p-4"
                  >
                    <h4 className="font-medium mb-3 text-white capitalize">
                      {day}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={dayData.date}
                          onChange={e =>
                            setForkliftInspection({
                              ...forkliftInspection,
                              weeklyChecks: {
                                ...forkliftInspection.weeklyChecks,
                                [day]: { ...dayData, date: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Inspector
                        </label>
                        <input
                          type="text"
                          value={dayData.inspector}
                          onChange={e =>
                            setForkliftInspection({
                              ...forkliftInspection,
                              weeklyChecks: {
                                ...forkliftInspection.weeklyChecks,
                                [day]: {
                                  ...dayData,
                                  inspector: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(dayData.items).map(([item, checked]) => (
                        <label
                          key={item}
                          className="flex items-center text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e =>
                              setForkliftInspection({
                                ...forkliftInspection,
                                weeklyChecks: {
                                  ...forkliftInspection.weeklyChecks,
                                  [day]: {
                                    ...dayData,
                                    items: {
                                      ...dayData.items,
                                      [item]: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="mr-2"
                          />
                          <span className="capitalize text-sm">
                            {item.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Safety Meeting Form */}
        {activeForm === 'safety' && (
          <div className="brushed-metal rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
              <Shield className="mr-2" />
              Safety Meeting Sign-In Sheet
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project
                </label>
                <input
                  type="text"
                  value={safetyMeeting.project}
                  onChange={e =>
                    setSafetyMeeting({
                      ...safetyMeeting,
                      project: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={safetyMeeting.meetingDate}
                  onChange={e =>
                    setSafetyMeeting({
                      ...safetyMeeting,
                      meetingDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Facilitator
                </label>
                <input
                  type="text"
                  value={safetyMeeting.facilitator}
                  onChange={e =>
                    setSafetyMeeting({
                      ...safetyMeeting,
                      facilitator: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hazards on Job Site
              </label>
              <textarea
                value={safetyMeeting.hazardsOnJob}
                onChange={e =>
                  setSafetyMeeting({
                    ...safetyMeeting,
                    hazardsOnJob: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-white">
                Topics Discussed
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {safetyMeeting.topics.map((topic, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-gray-300">• {topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-white">Attendees</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="border border-gray-600 px-4 py-2 text-left text-gray-300">
                        Name
                      </th>
                      <th className="border border-gray-600 px-4 py-2 text-left text-gray-300">
                        Signature
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safetyMeeting.attendees.map((attendee, index) => (
                      <tr key={index}>
                        <td className="border border-gray-600 px-2 py-1">
                          <input
                            type="text"
                            value={attendee.name}
                            onChange={e => {
                              const newAttendees = [...safetyMeeting.attendees]
                              const attendee = newAttendees[index]
                              if (attendee) {
                                attendee.name = e.target.value
                                setSafetyMeeting({
                                  ...safetyMeeting,
                                  attendees: newAttendees,
                                })
                              }
                            }}
                            className="w-full px-2 py-1 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-600 px-2 py-1">
                          <input
                            type="text"
                            value={attendee.signature}
                            placeholder="Type name to sign"
                            onChange={e => {
                              const newAttendees = [...safetyMeeting.attendees]
                              const attendee = newAttendees[index]
                              if (attendee) {
                                attendee.signature = e.target.value
                                setSafetyMeeting({
                                  ...safetyMeeting,
                                  attendees: newAttendees,
                                })
                              }
                            }}
                            className="w-full px-2 py-1 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FSWIronTask
