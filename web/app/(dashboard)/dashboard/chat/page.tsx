'use client'

import React, { useState, useEffect } from 'react'
import { Users, MessageCircle, Settings, Globe } from 'lucide-react'
import TeamChat from '@/components/TeamChat'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'

interface Project {
  id: string
  name: string
  status: string
}

export default function ChatPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [showCompanyChat, setShowCompanyChat] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await api.get('/projects')
        setProjects(projectsData.data || [])
        
        // Select first active project by default
        const activeProject = projectsData.data?.find((p: Project) => p.status === 'ACTIVE')
        if (activeProject) {
          setSelectedProject(activeProject.id)
          setShowCompanyChat(false)
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        // Use mock data if API fails
        const mockProjects = [
          { id: 'company-general', name: 'Company General', status: 'ACTIVE' },
          { id: '1', name: 'Denver Convention Center', status: 'ACTIVE' },
          { id: '2', name: 'Boulder Tech Campus', status: 'PLANNING' }
        ]
        setProjects(mockProjects)
        setSelectedProject('company-general')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-safety-orange mx-auto animate-pulse" />
          <p className="mt-4 text-gray-400">Loading team chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-steel-gray">
      {/* Header */}
      <div className="bg-gradient-to-r from-steel-gray via-gray-800 to-steel-gray p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-safety-orange" />
            <h1 className="text-xl font-shogun text-white">Team Communication</h1>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-aisc-blue" />
            <span className="text-sm text-gray-400">Auto-Translation Enabled</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Chat Rooms */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4" />
              Chat Rooms
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Company-wide chat option */}
            <button
              onClick={() => {
                setShowCompanyChat(true)
                setSelectedProject('company-general')
              }}
              className={`w-full p-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 ${
                showCompanyChat && selectedProject === 'company-general' 
                  ? 'bg-safety-orange/10 border-l-2 border-l-safety-orange' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-white font-medium">Company General</p>
                  <p className="text-xs text-gray-400">All team members</p>
                </div>
              </div>
            </button>

            {/* Project-specific chats */}
            {projects.filter(p => p.id !== 'company-general').map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProject(project.id)
                  setShowCompanyChat(false)
                }}
                className={`w-full p-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 ${
                  !showCompanyChat && selectedProject === project.id 
                    ? 'bg-safety-orange/10 border-l-2 border-l-safety-orange' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="text-white font-medium">{project.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{project.status}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat Settings */}
          <div className="p-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Chat Settings
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedProject ? (
            <TeamChat 
              projectId={selectedProject}
              projectName={
                selectedProject === 'company-general' 
                  ? 'Company General Chat'
                  : projects.find(p => p.id === selectedProject)?.name
              }
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Select a chat room
                </h3>
                <p className="text-gray-400">
                  Choose a project or company chat to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}