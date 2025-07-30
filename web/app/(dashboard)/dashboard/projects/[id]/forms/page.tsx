'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/Button'
import FSWIronTask from '@/components/forms/FSWIronTask'
import FSWHarnessInspection from '@/components/forms/FSWHarnessInspection'
import { FileText, Shield, ChevronLeft } from 'lucide-react'

type FormType = 'ironTask' | 'harnessInspection'

export default function ProjectFormsPage() {
  const params = useParams()
  const projectId = params.id as string
  const [activeForm, setActiveForm] = useState<FormType | null>(null)
  
  if (activeForm === 'ironTask') {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => setActiveForm(null)}
          variant="outline"
          className="border-gray-600 text-white hover:bg-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
        <FSWIronTask projectId={projectId} />
      </div>
    )
  }
  
  if (activeForm === 'harnessInspection') {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => setActiveForm(null)}
          variant="outline"
          className="border-gray-600 text-white hover:bg-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
        <FSWHarnessInspection projectId={projectId} />
      </div>
    )
  }
  
  // Form selection screen
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-safety-orange rounded-lg">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-shogun text-white">Project Forms</h1>
          <p className="text-gray-400">Select a form to complete for this project</p>
        </div>
      </div>

      {/* Form Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Iron Task Form */}
        <div className="brushed-metal rounded-lg shadow-lg p-6 hover:bg-gray-700/50 transition-colors cursor-pointer group"
             onClick={() => setActiveForm('ironTask')}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-aisc-blue rounded-lg group-hover:bg-blue-600 transition-colors">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">FSW Iron Task</h3>
              <p className="text-gray-400 mb-4">
                Daily project reporting including timesheet, weather conditions, 
                Job Hazard Analysis (JHA), and project activities.
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Employee timesheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Weather & site conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Job Hazard Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Daily activities log</span>
                </div>
              </div>
              <Button 
                className="mt-4 bg-aisc-blue hover:bg-blue-600 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveForm('ironTask')
                }}
              >
                Open Iron Task Form
              </Button>
            </div>
          </div>
        </div>

        {/* Harness Inspection Form */}
        <div className="brushed-metal rounded-lg shadow-lg p-6 hover:bg-gray-700/50 transition-colors cursor-pointer group"
             onClick={() => setActiveForm('harnessInspection')}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-safety-orange rounded-lg group-hover:bg-orange-600 transition-colors">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">FSW Harness Inspection</h3>
              <p className="text-gray-400 mb-4">
                Comprehensive safety harness inspection checklist including visual, 
                functional testing, and compliance documentation.
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Visual inspection checklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Functional testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Equipment tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  <span>Compliance documentation</span>
                </div>
              </div>
              <Button 
                className="mt-4 bg-safety-orange hover:bg-orange-600 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveForm('harnessInspection')
                }}
              >
                Open Harness Inspection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-400 font-semibold mb-2">Safety Compliance</h3>
            <p className="text-yellow-200 text-sm">
              All forms are part of FSW's safety and compliance program. 
              Complete forms accurately and submit promptly to ensure project safety and regulatory compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}