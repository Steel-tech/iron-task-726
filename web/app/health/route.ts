import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }

    // Check API connectivity
    let apiStatus = 'unknown'
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (apiUrl) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        apiStatus = response.ok ? 'connected' : 'disconnected'
      }
    } catch (error) {
      apiStatus = 'error'
    }

    const detailedHealth = {
      ...health,
      services: {
        api: apiStatus,
      },
    }

    return NextResponse.json(detailedHealth, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}
