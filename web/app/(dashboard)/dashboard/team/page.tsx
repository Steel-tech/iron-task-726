'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  HardHat,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  UserCheck,
  AlertTriangle,
  Key,
} from 'lucide-react'
import { IronworkersTeamIcon } from '@/components/icons/SteelConstructionIcons'

interface User {
  id: string
  email: string
  name: string
  role: string
  unionMember: boolean
  phoneNumber: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    media: number
    activities: number
  }
}

interface NewUser {
  email: string
  name: string
  password: string
  role: string
  unionMember: boolean
  phoneNumber: string
}

const roleConfig = {
  ADMIN: {
    label: 'Administrator',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Full system access',
  },
  PROJECT_MANAGER: {
    label: 'Project Manager',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Manage projects and teams',
  },
  FOREMAN: {
    label: 'Foreman',
    icon: HardHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Field supervisor',
  },
  WORKER: {
    label: 'Worker',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Field worker',
  },
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<NewUser>({
    email: '',
    name: '',
    password: '',
    role: 'WORKER',
    unionMember: false,
    phoneNumber: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
      setFilteredUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Apply filters
    let filtered = [...users]

    if (searchQuery) {
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phoneNumber?.includes(searchQuery)
      )
    }

    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    setFilteredUsers(filtered)
  }, [searchQuery, selectedRole, users])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await api.post('/auth/register', formData)
      await fetchUsers()
      setShowAddModal(false)
      resetForm()
      alert('User added successfully!')
    } catch (error: any) {
      console.error('Failed to add user:', error)
      alert(error.response?.data?.error || 'Failed to add user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsSubmitting(true)

    try {
      const updateData: any = {
        name: formData.name,
        role: formData.role,
        unionMember: formData.unionMember,
        phoneNumber: formData.phoneNumber || null,
      }

      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password
      }

      await api.patch(`/users/${selectedUser.id}`, updateData)
      await fetchUsers()
      setShowEditModal(false)
      setSelectedUser(null)
      resetForm()
      alert('User updated successfully!')
    } catch (error: any) {
      console.error('Failed to update user:', error)
      alert(error.response?.data?.error || 'Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await api.delete(`/users/${userId}`)
      await fetchUsers()
      alert('User deleted successfully!')
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      alert(error.response?.data?.error || 'Failed to delete user')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'WORKER',
      unionMember: false,
      phoneNumber: '',
    })
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      password: '', // Don't populate password
      role: user.role,
      unionMember: user.unionMember,
      phoneNumber: user.phoneNumber || '',
    })
    setShowEditModal(true)
  }

  // Calculate statistics
  const stats = {
    total: users.length,
    byRole: Object.entries(roleConfig).map(([role, config]) => ({
      role,
      ...config,
      count: users.filter(u => u.role === role).length,
    })),
    unionMembers: users.filter(u => u.unionMember).length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IronworkersTeamIcon className="h-8 w-8 text-primary" size={32} />
          <h1 className="text-3xl font-bold font-shogun">Team Management</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Team</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {stats.byRole.map(
          ({ role, label, icon: Icon, color, bgColor, count }) => (
            <div key={role} className="bg-card rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}s</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <div className={`p-2 rounded-lg ${bgColor}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
              </div>
            </div>
          )
        )}

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Union Members</p>
              <p className="text-2xl font-bold">{stats.unionMembers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Roles</option>
            {Object.entries(roleConfig).map(([role, { label }]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-medium">Team Member</th>
              <th className="text-left p-4 text-sm font-medium">Role</th>
              <th className="text-left p-4 text-sm font-medium">Contact</th>
              <th className="text-left p-4 text-sm font-medium">Status</th>
              <th className="text-left p-4 text-sm font-medium">Activity</th>
              <th className="text-left p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const roleInfo = roleConfig[user.role as keyof typeof roleConfig]
              const RoleIcon = roleInfo.icon

              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-safety-orange flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${roleInfo.bgColor}`}>
                        <RoleIcon className={`h-4 w-4 ${roleInfo.color}`} />
                      </div>
                      <span className="text-sm font-medium">
                        {roleInfo.label}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.phoneNumber ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {user.phoneNumber}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No phone</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {user.unionMember && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Union
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p>{user._count?.media || 0} uploads</p>
                      <p className="text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No team members found</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Add Team Member</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {Object.entries(roleConfig).map(
                    ([role, { label, description }]) => (
                      <option key={role} value={role}>
                        {label} - {description}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={e =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.unionMember}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        unionMember: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Union Member</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Team Member</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  placeholder="Leave blank to keep current password"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {Object.entries(roleConfig).map(
                    ([role, { label, description }]) => (
                      <option key={role} value={role}>
                        {label} - {description}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={e =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.unionMember}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        unionMember: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Union Member</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Update Team Member
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
