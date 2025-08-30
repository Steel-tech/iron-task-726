'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import FSWIronTask from '@/components/forms/FSWIronTask'
import FSWHarnessInspection from '@/components/forms/FSWHarnessInspection'
import { FileText, Shield, ChevronLeft, Settings, Eye } from 'lucide-react'

type FormType = 'selection' | 'ironTask' | 'harnessInspection'

export default function FormsDemoPage() {
  const [activeForm, setActiveForm] = useState<FormType>('selection')
  const demoProjectId = 'demo-project-123'

  const renderForm = () => {
    switch (activeForm) {
      case 'ironTask':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setActiveForm('selection')}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Forms Demo
              </Button>
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg px-3 py-1">
                <span className="text-blue-400 text-sm font-medium">
                  DEMO MODE
                </span>
              </div>
            </div>
            <FSWIronTask projectId={demoProjectId} />
          </div>
        )

      case 'harnessInspection':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setActiveForm('selection')}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Forms Demo
              </Button>
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg px-3 py-1">
                <span className="text-blue-400 text-sm font-medium">
                  DEMO MODE
                </span>
              </div>
            </div>
            <FSWHarnessInspection projectId={demoProjectId} />
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-safety-orange rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-shogun text-white">
                  Forms Demo & Testing
                </h1>
                <p className="text-gray-400">
                  Review, test, and modify all FSW forms in one place
                </p>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-blue-400 font-semibold mb-2">
                    Demo Environment
                  </h3>
                  <p className="text-blue-300 text-sm">
                    This is a testing environment where you can review all
                    forms, test functionality, and identify any needed
                    modifications. Changes made here won&apos;t affect real
                    project data.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Iron Task Form */}
              <div className="brushed-metal rounded-lg shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-aisc-blue rounded-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      FSW Iron Task
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Daily project reporting including timesheet, weather
                      conditions, Job Hazard Analysis (JHA), and project
                      activities.
                    </p>

                    {/* Features List */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Current Features:
                      </h4>
                      <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Employee timesheet tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Weather & site conditions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Job Hazard Analysis (JHA)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Daily activities log</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Issue tracking</span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Status:</span>
                      <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded">
                        ✓ Production Ready
                      </span>
                    </div>

                    <Button
                      className="bg-aisc-blue hover:bg-blue-600 w-full"
                      onClick={() => setActiveForm('ironTask')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Iron Task Form
                    </Button>
                  </div>
                </div>
              </div>

              {/* Harness Inspection Form */}
              <div className="brushed-metal rounded-lg shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-safety-orange rounded-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      FSW Harness Inspection
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Comprehensive safety harness inspection checklist
                      including visual, functional testing, and compliance
                      documentation.
                    </p>

                    {/* Features List */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Current Features:
                      </h4>
                      <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>7-point visual inspection checklist</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>5-point functional testing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Equipment tracking & serial numbers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Pass/Fail/N/A status indicators</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Digital signature capture</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-safety-orange rounded-full"></div>
                          <span>Automatic compliance warnings</span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Status:</span>
                      <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded">
                        ✓ New - Ready for Review
                      </span>
                    </div>

                    <Button
                      className="bg-safety-orange hover:bg-orange-600 w-full"
                      onClick={() => setActiveForm('harnessInspection')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Harness Inspection
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Forms Section */}
            <div className="brushed-metal rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Potential Additional Forms
              </h2>
              <p className="text-gray-400 mb-4">
                Based on FSW&apos;s operations, you might want to consider
                adding these forms:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    🔧 Tool & Equipment Inspection
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Daily/weekly inspection of power tools, welding equipment,
                    etc.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    ⚠️ Incident Report
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Near-miss and accident reporting with photos and witness
                    statements.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    📋 Pre-Task Safety Brief
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Daily safety briefing checklist and crew acknowledgment.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    📦 Material Delivery Log
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Track material deliveries, quantities, condition upon
                    arrival.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    🏗️ Quality Control Checklist
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Weld quality, structural integrity, specification
                    compliance.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    🎓 Training Record
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Document safety training, certifications, and refresher
                    courses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return renderForm()
}
