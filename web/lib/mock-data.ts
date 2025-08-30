// Mock data for demo purposes when API is unavailable

export const mockProjects = [
  {
    id: '1',
    name: 'Denver Convention Center Expansion',
    description: 'Steel frame construction for the new east wing',
    location: 'Denver, CO',
    status: 'in_progress',
    startDate: '2024-01-15',
    endDate: '2024-08-30',
    teamMembers: 12,
    completionPercentage: 65,
    safetyScore: 98,
    lastUpdate: '2024-07-25T10:30:00Z',
  },
  {
    id: '2',
    name: 'Boulder Tech Campus',
    description: 'Multi-story office building with steel framework',
    location: 'Boulder, CO',
    status: 'planning',
    startDate: '2024-09-01',
    endDate: '2025-03-15',
    teamMembers: 8,
    completionPercentage: 5,
    safetyScore: 100,
    lastUpdate: '2024-07-20T14:15:00Z',
  },
  {
    id: '3',
    name: 'Aurora Bridge Repair',
    description: 'Structural steel reinforcement and safety upgrades',
    location: 'Aurora, CO',
    status: 'completed',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    teamMembers: 6,
    completionPercentage: 100,
    safetyScore: 95,
    lastUpdate: '2024-06-30T16:45:00Z',
  },
]

export const mockMedia = [
  {
    id: '1',
    projectId: '1',
    filename: 'beam-installation-001.jpg',
    type: 'image',
    uploadedAt: '2024-07-25T09:15:00Z',
    uploadedBy: 'John Smith',
    tags: ['beam', 'installation', 'safety-check'],
    description: 'Main support beam installation with proper safety protocols',
  },
  {
    id: '2',
    projectId: '1',
    filename: 'welding-progress-002.jpg',
    type: 'image',
    uploadedAt: '2024-07-25T11:30:00Z',
    uploadedBy: 'Maria Garcia',
    tags: ['welding', 'progress', 'quality-control'],
    description: 'Welding joints inspection and quality verification',
  },
]

export const mockNotifications = [
  {
    id: '1',
    title: 'Safety Inspection Required',
    message:
      'Weekly safety inspection due for Denver Convention Center project',
    type: 'warning',
    createdAt: '2024-07-25T08:00:00Z',
    read: false,
  },
  {
    id: '2',
    title: 'New Team Member Added',
    message: 'Sarah Johnson has been added to Boulder Tech Campus project',
    type: 'info',
    createdAt: '2024-07-24T16:30:00Z',
    read: true,
  },
]

export const mockDashboardStats = {
  totalProjects: 3,
  activeProjects: 1,
  completedProjects: 1,
  averageSafetyScore: 97.7,
  totalTeamMembers: 26,
  thisWeekUploads: 15,
  pendingTasks: 4,
}
