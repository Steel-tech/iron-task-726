'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { api, authApi } from '@/lib/api'
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Palette,
  Globe,
  Key,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Camera,
  HardHat,
} from 'lucide-react'
import { BoltRotationIcon } from '@/components/icons/SteelConstructionIcons'

interface UserSettings {
  id: string
  email: string
  name: string
  role: string
  phoneNumber: string | null
  unionMember: boolean
  notificationPreferences: {
    email: boolean
    sms: boolean
    projectUpdates: boolean
    safetyAlerts: boolean
    weeklyReports: boolean
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    phoneNumber: '',
    unionMember: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notificationForm, setNotificationForm] = useState({
    email: true,
    sms: false,
    projectUpdates: true,
    safetyAlerts: true,
    weeklyReports: false,
  })

  useEffect(() => {
    fetchUserSettings()
  }, [])

  const fetchUserSettings = async () => {
    try {
      const userData = await authApi.getMe()
      const settings: UserSettings = {
        ...userData,
        notificationPreferences: {
          email: true,
          sms: false,
          projectUpdates: true,
          safetyAlerts: true,
          weeklyReports: false,
        },
      }

      setUserSettings(settings)
      setProfileForm({
        name: settings.name,
        phoneNumber: settings.phoneNumber || '',
        unionMember: settings.unionMember,
      })
      setNotificationForm(settings.notificationPreferences)
    } catch (error) {
      console.error('Failed to fetch user settings:', error)
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileSave = async () => {
    setError('')
    setIsSaving(true)

    try {
      await api.patch(`/users/${userSettings?.id}`, profileForm)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSaving(true)

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      setSaveSuccess(true)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ]

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
      <div className="flex items-center gap-3">
        <BoltRotationIcon className="h-8 w-8 text-safety-orange" size={32} />
        <h1 className="text-3xl font-bold font-shogun text-white">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="brushed-metal rounded-lg shadow-lg p-2">
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? 'bg-arc-flash-yellow text-steel-gray arc-weld-glow'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="rounded-md bg-green-900/20 border border-green-800 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-400">
              Settings saved successfully!
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-900/20 border border-red-800 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Profile Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={userSettings?.email || ''}
                    disabled
                    className="w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-md text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={e =>
                      setProfileForm({
                        ...profileForm,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HardHat className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={userSettings?.role.replace('_', ' ') || ''}
                    disabled
                    className="w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-md text-gray-400 capitalize cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={profileForm.unionMember}
                  onChange={e =>
                    setProfileForm({
                      ...profileForm,
                      unionMember: e.target.checked,
                    })
                  }
                  className="h-4 w-4 bg-gray-800 border-gray-700 rounded text-safety-orange focus:ring-safety-orange"
                />
                <span className="text-sm text-gray-300">
                  I am a union member
                </span>
              </label>
            </div>

            <Button
              onClick={handleProfileSave}
              disabled={isSaving}
              className="bg-safety-orange hover:bg-orange-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Security Settings
            </h2>

            <form
              onSubmit={handlePasswordChange}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="bg-safety-orange hover:bg-orange-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </form>

            <hr className="weld-seam" />

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Two-Factor Authentication
              </h3>
              <p className="text-gray-400 mb-4">
                Add an extra layer of security to your account
              </p>
              <Button
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Enable 2FA
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Notification Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-400">
                    Receive updates via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.email}
                    onChange={e =>
                      setNotificationForm({
                        ...notificationForm,
                        email: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-safety-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-orange"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-400">
                    Receive text messages for urgent updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.sms}
                    onChange={e =>
                      setNotificationForm({
                        ...notificationForm,
                        sms: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-safety-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-orange"></div>
                </label>
              </div>

              <hr className="border-gray-700" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Project Updates</p>
                  <p className="text-sm text-gray-400">
                    New photos, milestones, and progress
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.projectUpdates}
                    onChange={e =>
                      setNotificationForm({
                        ...notificationForm,
                        projectUpdates: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-safety-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-orange"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Safety Alerts</p>
                  <p className="text-sm text-gray-400">
                    Critical safety notifications and incidents
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.safetyAlerts}
                    onChange={e =>
                      setNotificationForm({
                        ...notificationForm,
                        safetyAlerts: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-safety-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-orange"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Weekly Reports</p>
                  <p className="text-sm text-gray-400">
                    Summary of weekly project activity
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.weeklyReports}
                    onChange={e =>
                      setNotificationForm({
                        ...notificationForm,
                        weeklyReports: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-safety-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-orange"></div>
                </label>
              </div>
            </div>

            <Button
              onClick={() => {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
              }}
              className="bg-safety-orange hover:bg-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              App Preferences
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Display Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Language
                    </label>
                    <select className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="weld-seam" />

              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Default Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Project View
                    </label>
                    <select className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent">
                      <option>Grid View</option>
                      <option>List View</option>
                      <option>Timeline View</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Media Quality
                    </label>
                    <select className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent">
                      <option>High (Original)</option>
                      <option>Medium (Compressed)</option>
                      <option>Low (Mobile)</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="weld-seam" />

              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Photo Annotation
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Auto-Edit Mode</p>
                      <p className="text-sm text-gray-400">
                        Automatically open annotation tools after capturing
                        photos
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-safety-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-orange"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Default Annotation Color
                      </p>
                      <p className="text-sm text-gray-400">
                        Pre-selected color for annotations
                      </p>
                    </div>
                    <select className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent">
                      <option value="#ff6600">Safety Orange</option>
                      <option value="#ffcc00">Arc Yellow</option>
                      <option value="#0072ce">AISC Blue</option>
                      <option value="#33cc33">Safety Green</option>
                      <option value="#ff0000">Alert Red</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Show Logo Watermark
                      </p>
                      <p className="text-sm text-gray-400">
                        Automatically add company logo to annotated photos
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-safety-orange/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-orange"></div>
                    </label>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setSaveSuccess(true)
                  setTimeout(() => setSaveSuccess(false), 3000)
                }}
                className="bg-safety-orange hover:bg-orange-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
