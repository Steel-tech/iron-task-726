'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button'
import {
  HardHatIcon,
  IBeamCraneIcon,
  WeldingTorchIcon,
  IronworkersTeamIcon,
  UploadFabricationIcon,
  ProjectDrawingsIcon,
  MediaGalleryIcon,
  SparkAnimationIcon,
  CraneHookAnimationIcon,
  BoltRotationIcon,
  PencilRulerIcon
} from '@/components/icons/SteelConstructionIcons'
import { LogOut, Menu, X, Settings, MessageCircle } from 'lucide-react'
import { authApi } from '@/lib/api'
import NotificationBell from '@/components/NotificationBell'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface IconProps {
  className?: string
  size?: number
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getMe()
        setUser(userData)
      } catch (error) {
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await authApi.logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-steel-gray">
        <div className="text-center">
          <SparkAnimationIcon className="h-12 w-12 text-safety-orange mx-auto" isAnimating={true} />
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: HardHatIcon,
      hoverIcon: CraneHookAnimationIcon
    },
    { 
      name: 'Projects', 
      href: '/dashboard/projects', 
      icon: ProjectDrawingsIcon,
      hoverIcon: BoltRotationIcon
    },
    { 
      name: 'Capture', 
      href: '/dashboard/capture', 
      icon: WeldingTorchIcon,
      hoverIcon: SparkAnimationIcon
    },
    { 
      name: 'Media & Tags', 
      href: '/dashboard/media', 
      icon: MediaGalleryIcon,
      hoverIcon: SparkAnimationIcon
    },
    { 
      name: 'Team Chat', 
      href: '/dashboard/chat', 
      icon: MessageCircle,
      hoverIcon: SparkAnimationIcon
    },
    { 
      name: 'Upload', 
      href: '/dashboard/upload', 
      icon: UploadFabricationIcon,
      hoverIcon: CraneHookAnimationIcon
    },
  ]

  if (user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER') {
    navigation.push(
      { 
        name: 'Team', 
        href: '/dashboard/team', 
        icon: IronworkersTeamIcon,
        hoverIcon: CraneHookAnimationIcon
      }
    )
  }

  // Wrapper for Settings icon to match custom icon interface
  const SettingsIconWrapper: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <Settings className={className} size={size} />
  )

  // Add Settings at the end
  navigation.push(
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: SettingsIconWrapper,
      hoverIcon: BoltRotationIcon
    }
  )

  // Add demo pages only in development
  if (process.env.NODE_ENV === 'development') {
    navigation.push(
      { 
        name: 'Forms Demo', 
        href: '/dashboard/forms-demo', 
        icon: SettingsIconWrapper,
        hoverIcon: SparkAnimationIcon
      },
      { 
        name: 'Communication', 
        href: '/dashboard/communication-demo', 
        icon: SettingsIconWrapper,
        hoverIcon: SparkAnimationIcon
      }
    )
  }

  const isActive = (href: string) => {
    // For dashboard, only exact match
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    // For other routes, check if pathname starts with the href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 sidebar-dark diamond-plate shadow-xl transform transition-transform lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-700">
            <h2 className="text-xl font-shogun text-arc-flash-yellow">Iron Task</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-gray-700"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const active = isActive(item.href)
              const Icon = hoveredItem === item.name && !active ? item.hoverIcon : item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setHoveredItem(null)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={
                    active 
                      ? 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-arc-flash-yellow text-steel-gray font-bold arc-weld-glow' 
                      : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 hover:shadow-[0_0_10px_rgba(0,114,206,0.5)] transition-all duration-200'
                  }
                >
                  <Icon 
                    className={`h-5 w-5 ${
                      hoveredItem === item.name && !active ? 
                        item.name === 'Capture' || item.name === 'Media' ? 'animate-spark' :
                        item.name === 'Projects' || item.name === 'Upload' ? 'animate-tighten' :
                        'animate-lift'
                      : ''
                    }`} 
                    size={20}
                    isAnimating={hoveredItem === item.name && !active}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Weld seam divider */}
          <div className="px-4">
            <hr className="weld-seam" />
          </div>

          {/* User menu */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-safety-orange flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 brushed-metal shadow-lg border-b border-gray-700">
          <div className="h-full px-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-white">
              {user.role.replace('_', ' ')}
            </h1>
            <div className="ml-auto flex items-center gap-4">
              {typeof window !== 'undefined' && localStorage.getItem('mockMode') === 'true' && (
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg px-3 py-1">
                  <span className="text-yellow-400 text-xs font-medium">DEMO MODE</span>
                </div>
              )}
              <NotificationBell />
              <span className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#0a0a0a' }}>
          {children}
        </main>
      </div>
    </div>
  )
}