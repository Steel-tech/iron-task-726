import axios from 'axios'

// Mock localStorage before importing the module
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(), 
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

// Mock window.location
const mockLocationAssign = jest.fn()
Object.defineProperty(window, 'location', {
  value: { 
    href: '',
    assign: mockLocationAssign
  },
  writable: true,
})

// Set environment variable for API URL
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api'

// Mock localStorage globally
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Import after mocking
import { api, authApi } from '@/lib/api'

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    window.location.href = ''
    
    // Reset mocks
    jest.restoreAllMocks()
  })

  describe('api instance', () => {
    it('creates axios instance with correct base URL', () => {
      expect(api.defaults.baseURL).toBe('http://localhost:3001/api')
    })
  })

  describe('authApi', () => {
    describe('login', () => {
      it('should login successfully and store token', async () => {
        const credentials = { email: 'test@example.com', password: 'Password123!' }
        const mockResponse = {
          data: {
            accessToken: 'test-token',
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        }

        // Mock the API call
        const mockPost = jest.spyOn(api, 'post').mockResolvedValue(mockResponse)

        const result = await authApi.login(credentials)

        expect(mockPost).toHaveBeenCalledWith('/auth/login', credentials)
        expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'test-token')
        expect(result).toEqual(mockResponse.data)
      })

      it('should handle login error', async () => {
        const credentials = { email: 'test@example.com', password: 'wrong' }
        const testError = new Error('Invalid credentials')
        
        jest.spyOn(api, 'post').mockRejectedValue(testError)

        await expect(authApi.login(credentials)).rejects.toThrow('Invalid credentials')
        expect(localStorageMock.setItem).not.toHaveBeenCalled()
      })
    })

    describe('logout', () => {
      it('should logout and clear token', async () => {
        const mockPost = jest.spyOn(api, 'post').mockResolvedValue({ data: { success: true } })

        await authApi.logout()

        expect(mockPost).toHaveBeenCalledWith('/auth/logout')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('mockMode')
      })
    })

    describe('getMe', () => {
      it('should fetch current user data', async () => {
        const mockUser = {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }
        
        const mockGet = jest.spyOn(api, 'get').mockResolvedValue({ data: mockUser })

        const result = await authApi.getMe()

        expect(mockGet).toHaveBeenCalledWith('/auth/me')
        expect(result).toEqual(mockUser)
      })
    })
  })

  describe('interceptors', () => {
    it('should add auth token to requests when available', () => {
      localStorageMock.getItem.mockReturnValue('test-token')
      
      // Get the request interceptor function using type assertion
      const requestInterceptor = (api.interceptors.request as any).handlers[0].fulfilled
      const mockConfig = { headers: {} }
      
      const result = requestInterceptor(mockConfig)
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken')
      expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('should redirect to login on 401 error', async () => {
      const error = {
        config: { url: '/test', method: 'get' },
        response: { status: 401 },
        isAxiosError: true
      }
      
      // Mock the refresh call to fail
      jest.spyOn(api, 'post').mockRejectedValue(new Error('Refresh failed'))
      
      // Get the response error interceptor using type assertion
      const responseErrorHandler = (api.interceptors.response as any).handlers[0].rejected
      
      try {
        await responseErrorHandler(error)
      } catch (e) {
        // Expected to reject
      }
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
      expect(window.location.href).toBe('/login')
    })
  })
})