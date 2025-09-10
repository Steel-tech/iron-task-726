'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  MessageCircle,
  Settings,
  Globe,
  AtSign,
  Bell,
  Camera,
} from 'lucide-react'
import TeamChat from '@/components/TeamChat'
import Comments from '@/components/Comments'
import NotificationBell from '@/components/NotificationBell'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'

interface Project {
  id: string
  name: string
  status: string
}

// Demo data for communication features
const demoMedia = {
  id: 'demo-media-1',
  fileUrl:
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2000',
  mediaType: 'PHOTO' as const,
  project: {
    id: 'demo-project-1',
    name: 'Downtown Tower Construction',
  },
}

const demoProjectMembers = [
  { id: '1', name: 'John Steel', role: 'STEEL_ERECTOR' },
  { id: '2', name: 'Mike Welder', role: 'WELDER' },
  { id: '3', name: 'Sarah Safety', role: 'SAFETY_INSPECTOR' },
  { id: '4', name: 'Tom Manager', role: 'PROJECT_MANAGER' },
  { id: '5', name: 'Carlos Constructor', role: 'STEEL_ERECTOR' },
  { id: '6', name: 'Maria Engineer', role: 'ADMIN' },
]

export default function ChatPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [showCompanyChat, setShowCompanyChat] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'comments'>('chat')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await api.get('/projects')
        setProjects(projectsData.data || [])

        // Select first active project by default
        const activeProject = projectsData.data?.find(
          (p: Project) => p.status === 'ACTIVE'
        )
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
          { id: '2', name: 'Boulder Tech Campus', status: 'PLANNING' },
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
            <h1 className="text-xl font-shogun text-white">
              Team Communication
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-aisc-blue" />
              <span className="text-sm text-gray-400">
                Auto-Translation Enabled
              </span>
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Communication Features Overview */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-safety-orange" />
            <div>
              <h3 className="font-medium text-white text-sm">
                Auto-Translation
              </h3>
              <p className="text-xs text-gray-400">
                Messages translated to your language
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AtSign className="h-8 w-8 text-safety-orange" />
            <div>
              <h3 className="font-medium text-white text-sm">@Mentions</h3>
              <p className="text-xs text-gray-400">
                Tag team members for urgent messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-safety-orange" />
            <div>
              <h3 className="font-medium text-white text-sm">
                Smart Notifications
              </h3>
              <p className="text-xs text-gray-400">
                Get notified of mentions and replies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-white border-b-2 border-safety-orange bg-gray-700'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Team Chat
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'comments'
                ? 'text-white border-b-2 border-safety-orange bg-gray-700'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Camera className="h-4 w-4 inline mr-2" />
            Photo Comments
          </button>
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
            {projects
              .filter(p => p.id !== 'company-general')
              .map(project => (
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
                    <div
                      className={`w-2 h-2 rounded-full ${
                        project.status === 'ACTIVE'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    ></div>
                    <div>
                      <p className="text-white font-medium">{project.name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {project.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {/* Chat Settings */}
          <div className="p-4 border-t border-gray-700">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Chat Settings
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'chat' ? (
            // Team Chat View
            selectedProject ? (
              <TeamChat
                projectId={selectedProject}
                projectName={
                  selectedProject === 'company-general'
                    ? 'Company General Chat'
                    : projects.find(p => p.id === selectedProject)?.name || 'Unknown Project'
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
            )
          ) : (
            // Photo Comments View
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Photo Preview */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Construction Photo
                    </h3>
                    <img
                      src={demoMedia.fileUrl}
                      alt="Construction site"
                      className="w-full rounded-lg shadow-lg"
                    />
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-white mb-2">
                        Photo Comment Features:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li>• Type @ to mention team members</li>
                        <li>• Add reactions to comments (👍 ❤️ ❓ ✓)</li>
                        <li>• Reply to create threaded discussions</li>
                        <li>• Edit or delete your own comments</li>
                        <li>• See auto-translation indicators 🌐</li>
                      </ul>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <Comments
                      mediaId={demoMedia.id}
                      projectMembers={demoProjectMembers}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
