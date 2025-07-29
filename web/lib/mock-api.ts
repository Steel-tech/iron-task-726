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