'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import {
  FolderOpen,
  Image,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Activity,
  Users,
  CheckCircle,
  Zap
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  location: string | null
  status: string
  createdAt: string
  _count: {
    photos: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects')
        setProjects(response.data)
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects/feed">
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Project Feed
            </Button>
          </Link>
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </p>
          {!searchQuery && (
            <Link href="/dashboard/projects/new">
              <Button className="mt-4">Create your first project</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block"
            >
              <div className="bg-card rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        project.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault()
                      // TODO: Add dropdown menu
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {project.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span>{project._count.photos} photos</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* How It Works Section */}
      <div className="mt-16 bg-gray-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
        <p className="text-gray-300 text-center mb-8">So easy the newbie can do it. Just follow these steps!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-safety-orange text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              1
            </div>
            <h3 className="font-semibold text-white mb-2">Create Project</h3>
            <p className="text-sm text-gray-400">Create a project in FSW Iron Task for each job.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-safety-orange text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              2
            </div>
            <h3 className="font-semibold text-white mb-2">Add Crews</h3>
            <p className="text-sm text-gray-400">Add your crews so all the right people can see and add updates.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-safety-orange text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              3
            </div>
            <h3 className="font-semibold text-white mb-2">Track Progress</h3>
            <p className="text-sm text-gray-400">Check out the project feed on your phone or computer to see updates roll in from the field.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-safety-orange text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              4
            </div>
            <h3 className="font-semibold text-white mb-2">Problem Solve</h3>
            <p className="text-sm text-gray-400">Now that you have live updates from the field, you can problem solve in real time!</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard/projects/feed">
            <Button size="lg" className="bg-safety-orange hover:bg-safety-orange/90">
              <Zap className="h-5 w-5 mr-2" />
              View Project Feed
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}