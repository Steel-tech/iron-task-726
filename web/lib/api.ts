import axios, { AxiosError } from 'axios'
import { mockAPI } from './mock-api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Track if API is available
let apiAvailable = true

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Add request logging for debugging
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    data: config.data,
    headers: config.headers
  })
  
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    // Add response logging for debugging
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data,
      headers: response.headers
    })
    return response
  },
  async (error: AxiosError) => {
    // Add error logging for debugging
    console.error(`❌ ${error.response?.status || 'NETWORK'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      message: error.message,
      code: error.code,
      response: error.response?.data
    })
    const originalRequest = error.config as any

    // Handle project endpoints with mock fallback
    if ((error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !apiAvailable) && originalRequest.url) {
      const token = localStorage.getItem('accessToken')
      
      // Handle specific project endpoints
      if (originalRequest.url === '/projects/new' && originalRequest.method === 'get' && token) {
        console.log('🔧 Using mock API for project creation data')
        const mockData = await mockAPI.getProjectCreationData(token)
        return { data: mockData, status: 200, statusText: 'OK', headers: {}, config: originalRequest }
      }
      
      if (originalRequest.url === '/projects' && originalRequest.method === 'get' && token) {
        console.log('🔧 Using mock API for projects list')
        const mockData = await mockAPI.getProjects(token)
        return { data: mockData, status: 200, statusText: 'OK', headers: {}, config: originalRequest }
      }
      
      if (originalRequest.url === '/projects' && originalRequest.method === 'post' && token) {
        console.log('🔧 Using mock API for project creation')
        const mockData = await mockAPI.createProject(token, originalRequest.data)
        localStorage.setItem('mockMode', 'true')
        return { data: mockData, status: 201, statusText: 'Created', headers: {}, config: originalRequest }
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch((err) => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await api.post('/auth/refresh')
        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  accessToken: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  phoneNumber?: string
  role: string
  unionMember: boolean
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    console.log('🚀 Starting login process...')
    console.log('📡 Making API call to:', `${API_BASE_URL}/api/auth/login`)
    console.log('🔧 API Available Status:', apiAvailable)
    console.time('login-debug')
    
    try {
      console.log('📡 Sending request with credentials:', { email: credentials.email, password: '***' })
      const response = await api.post<LoginResponse>('/auth/login', credentials)
      console.log('✅ API response received:', response.status, response.data)
      localStorage.setItem('accessToken', response.data.accessToken)
      apiAvailable = true
      console.timeEnd('login-debug')
      return response.data
    } catch (error: any) {
      console.error('❌ API error:', error.code, error.message)
      
      // If network error or connection refused, use mock API with timeout protection
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !apiAvailable) {
        console.log('🔧 API unavailable, using mock authentication...')
        apiAvailable = false
        
        // Add timeout protection for mock API
        const mockTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Mock API timeout after 5 seconds')), 5000)
        )
        
        try {
          console.log('🔄 Attempting mock API fallback...')  
          const mockResponse = await Promise.race([
            mockAPI.login(credentials.email, credentials.password),
            mockTimeout
          ])
          console.log('✅ Mock API response received')
          localStorage.setItem('accessToken', mockResponse.accessToken)
          localStorage.setItem('mockMode', 'true')
          console.timeEnd('login-debug')
          return mockResponse
        } catch (mockError: any) {
          console.error('❌ Mock API failed:', mockError.message)
          console.timeEnd('login-debug')
          throw new Error(`Login failed: ${mockError.message}`)
        }
      }
      console.timeEnd('login-debug')
      throw error
    }
  },

  register: async (credentials: RegisterCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', credentials)
    localStorage.setItem('accessToken', response.data.accessToken)
    return response.data
  },

  logout: async (): Promise<void> => {
    try {
      if (localStorage.getItem('mockMode') === 'true') {
        await mockAPI.logout()
      } else {
        await api.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('mockMode')
    }
  },

  refresh: async (): Promise<string> => {
    const response = await api.post('/auth/refresh')
    const { accessToken } = response.data
    localStorage.setItem('accessToken', accessToken)
    return accessToken
  },

  getSessions: async () => {
    const response = await api.get('/auth/sessions')
    return response.data.sessions
  },

  revokeSession: async (sessionId: string) => {
    await api.delete(`/auth/sessions/${sessionId}`)
  },

  revokeAllSessions: async () => {
    await api.post('/auth/revoke-all-sessions')
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error: any) {
      // If in mock mode or API unavailable, use mock data
      if (localStorage.getItem('mockMode') === 'true' || !apiAvailable) {
        const token = localStorage.getItem('accessToken')
        if (token) {
          return await mockAPI.getMe(token)
        }
      }
      throw error
    }
  },
}

export default api