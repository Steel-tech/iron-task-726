'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'

export default function NewProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    jobNumber: '',
    location: '',
    address: '',
    companyId: '',
    status: 'PLANNING' as const,
    description: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [canCreate, setCanCreate] = useState(false)
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user can create projects and get form data
    const checkPermissions = async () => {
      try {
        const response = await api.get('/projects/new')
        setCanCreate(response.data.canCreate)
        setCompanies(response.data.companies || [])
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('You do not have permission to create projects')
        } else {
          setError('Failed to load project creation form')
        }
      }
    }

    checkPermissions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Ensure company is selected
      if (!formData.companyId && companies.length === 1 && companies[0]) {
        formData.companyId = companies[0].id
      }

      if (!formData.companyId) {
        setError('Please select a company')
        setIsLoading(false)
        return
      }

      const response = await api.post('/projects', formData)

      // Redirect to the new project
      router.push(`/dashboard/projects/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (error && !canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-400 text-lg">{error}</div>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-shogun text-white mb-2">
          Create New Project
        </h1>
        <p className="text-gray-400">
          Set up a new construction project for documentation and tracking.
        </p>
      </div>

      <div className="brushed-metal rounded-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
              placeholder="e.g., Downtown Office Tower"
            />
          </div>

          <div>
            <label
              htmlFor="jobNumber"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Job Number *
            </label>
            <input
              type="text"
              id="jobNumber"
              name="jobNumber"
              required
              pattern="[A-Z0-9-]+"
              title="Job number should only contain uppercase letters, numbers, and hyphens"
              value={formData.jobNumber}
              onChange={e => {
                // Convert to uppercase automatically
                const value = e.target.value.toUpperCase()
                setFormData({ ...formData, jobNumber: value })
              }}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
              placeholder="e.g., JOB-2025-001"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
              placeholder="e.g., 123 Main St, Denver, CO"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
              placeholder="e.g., 789 Industrial Blvd, Suite 100"
            />
          </div>

          {companies.length > 1 && (
            <div>
              <label
                htmlFor="companyId"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Company *
              </label>
              <select
                id="companyId"
                name="companyId"
                required
                value={formData.companyId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
              >
                <option value="">Select a company</option>
                {companies.map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Initial Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
              placeholder="Brief description of the project..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-safety-orange hover:bg-orange-700 text-white font-bold"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
