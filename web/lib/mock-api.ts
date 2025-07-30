// Mock API for development when backend is not available
export interface MockUser {
  id: string
  email: string
  name: string
  role: string
}

export interface MockLoginResponse {
  user: MockUser
  accessToken: string
}

// Demo users matching the login page
const DEMO_USERS: MockUser[] = [
  {
    id: '1',
    email: 'admin@fsw-denver.com',
    name: 'Site Administrator',
    role: 'admin'
  },
  {
    id: '2', 
    email: 'worker@fsw-denver.com',
    name: 'Field Worker',
    role: 'worker'
  },
  {
    id: '3',
    email: 'pm@fsw-denver.com',
    name: 'Project Manager', 
    role: 'pm'
  },
  {
    id: '4',
    email: 'foreman@fsw-denver.com',
    name: 'Foreman',
    role: 'foreman'
  },
  {
    id: '5',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin'
  }
]

const DEMO_PASSWORD = 'Test1234!'
const TEST_PASSWORD = 'Test123@' // Alternative password for test@example.com

class MockAPIService {
  private isEnabled = true

  async login(email: string, password: string): Promise<MockLoginResponse> {
    console.log('🔧 Mock API login attempt:', { email, password: password ? '***' : 'empty' })
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Check password - allow both demo and test passwords
    const validPassword = password === DEMO_PASSWORD || 
                         (email === 'test@example.com' && password === TEST_PASSWORD)
    
    if (!validPassword) {
      console.error('🔧 Mock API: Invalid password')
      throw new Error('Invalid credentials')
    }

    const user = DEMO_USERS.find(u => u.email === email)
    if (!user) {
      console.error('🔧 Mock API: User not found')
      throw new Error('User not found')
    }

    const accessToken = `mock_token_${user.id}_${Date.now()}`
    console.log('🔧 Mock API: Login successful for', user.name)
    
    return {
      user,
      accessToken
    }
  }

  async getMe(token: string): Promise<MockUser> {
    await new Promise(resolve => setTimeout(resolve, 200))

    // Extract user ID from mock token
    const userId = token.split('_')[2]
    const user = DEMO_USERS.find(u => u.id === userId)
    
    if (!user) {
      throw new Error('Invalid token')
    }

    return user
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    // Mock logout - just remove token from localStorage
  }

  // Mock project endpoints
  async getProjectCreationData(token: string) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const user = await this.getMe(token)
    
    return {
      canCreate: ['admin', 'pm'].includes(user.role),
      companies: [
        { id: 'mock_company_1', name: 'Flawless Steel Welding (FSW)' },
        { id: 'mock_company_2', name: 'Denver Construction Co.' }
      ]
    }
  }

  async createProject(token: string, projectData: any) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = await this.getMe(token)
    
    if (!['admin', 'pm'].includes(user.role)) {
      throw new Error('Insufficient permissions to create projects')
    }

    // Mock project creation
    const projectId = `mock_project_${Date.now()}`
    
    return {
      id: projectId,
      ...projectData,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    }
  }

  async getProjects(token: string) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Mock projects data
    return [
      {
        id: 'mock_project_1',
        name: 'Downtown Office Tower',
        description: 'Steel framework construction for 25-story office building',
        location: '1234 Main St, Denver, CO',
        status: 'ACTIVE',
        createdAt: '2024-01-15T08:00:00Z',
        _count: { photos: 156 }
      },
      {
        id: 'mock_project_2', 
        name: 'Industrial Warehouse Complex',
        description: 'Large warehouse with overhead crane systems',
        location: '5678 Industrial Blvd, Denver, CO',
        status: 'PLANNING',
        createdAt: '2024-02-01T09:30:00Z',
        _count: { photos: 42 }
      },
      {
        id: 'mock_project_3',
        name: 'Bridge Repair Project',
        description: 'Structural steel repairs on highway overpass',
        location: 'I-25 & Colfax Ave, Denver, CO',
        status: 'COMPLETED',
        createdAt: '2023-11-20T07:15:00Z',
        _count: { photos: 89 }
      }
    ]
  }

  isApiDown(): boolean {
    return this.isEnabled
  }

  enable() {
    this.isEnabled = true
  }

  disable() {
    this.isEnabled = false
  }
}

export const mockAPI = new MockAPIService()