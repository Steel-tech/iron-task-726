'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { authApi } from '@/lib/api'
import { 
  HardHatIcon,
  WeldingTorchIcon,
  SparkAnimationIcon,
  IBeamCraneIcon,
  CraneHookAnimationIcon
} from '@/components/icons/SteelConstructionIcons'
import { Shield, Mail, Lock, AlertTriangle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import ClientOnly from '@/components/ClientOnly'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showSparks, setShowSparks] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [captchaChallenge, setCaptchaChallenge] = useState<{num1: number, num2: number} | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)

  useEffect(() => {
    // Trigger sparks animation periodically
    const interval = setInterval(() => {
      setShowSparks(true)
      setTimeout(() => setShowSparks(false), 2000)
    }, 5000)
    
    // Load remembered email if device was remembered
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    const deviceRemembered = localStorage.getItem('rememberDevice') === 'true'
    
    if (deviceRemembered && rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberDevice(true)
      console.log('📧 Loaded remembered email for this device')
    }
    
    // Auto-focus appropriate field on page load
    setTimeout(() => {
      const emailField = document.getElementById('email')
      const passwordField = document.getElementById('password')
      
      if (rememberedEmail && passwordField) {
        passwordField.focus()
      } else if (emailField) {
        emailField.focus()
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Verify CAPTCHA if required
    if (captchaChallenge) {
      const expectedAnswer = captchaChallenge.num1 + captchaChallenge.num2
      if (parseInt(captchaAnswer) !== expectedAnswer) {
        setError('Please solve the math problem correctly')
        return
      }
    }
    
    setIsLoading(true)
    setLoadingMessage('Authenticating...')

    // Add timeout to prevent infinite loading
    const loginTimeout = setTimeout(() => {
      setIsLoading(false)
      setError('Login timeout - please check your connection and try again')
    }, 15000) // 15 second timeout

    try {
      console.log('🔐 Attempting login with:', { email, password: password ? '***' : 'empty' })
      setLoadingMessage('Verifying credentials...')
      await authApi.login({ email, password })
      
      // Handle remember device option
      if (rememberDevice) {
        localStorage.setItem('rememberDevice', 'true')
        localStorage.setItem('rememberedEmail', email)
        console.log('💾 Device and email saved for future logins')
      }
      
      setLoadingMessage('Login successful! Redirecting...')
      clearTimeout(loginTimeout)
      console.log('✅ Login successful, redirecting to dashboard')
      // Reset failed attempts and CAPTCHA on successful login
      setFailedAttempts(0)
      setCaptchaChallenge(null)
      setCaptchaAnswer('')
      router.push('/dashboard')
    } catch (err: any) {
      clearTimeout(loginTimeout)
      console.error('❌ Login failed:', err)
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)
      setError(err.message || err.response?.data?.message || 'Invalid email or password')
      
      // Show CAPTCHA after 3 failed attempts
      if (newFailedAttempts >= 3) {
        const num1 = Math.floor(Math.random() * 10) + 1
        const num2 = Math.floor(Math.random() * 10) + 1
        setCaptchaChallenge({ num1, num2 })
        setCaptchaAnswer('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
      <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden diamond-plate">
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-transparent" />
        
        {/* Animated elements */}
        <div className="absolute top-20 left-20 animate-lift">
          <IBeamCraneIcon className="h-32 w-32 text-safety-orange opacity-20" size={128} />
        </div>
        <div className="absolute bottom-20 right-20 animate-spark">
          <WeldingTorchIcon className="h-24 w-24 text-arc-flash-yellow opacity-20" size={96} />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <CraneHookAnimationIcon 
            className="h-48 w-48 text-aisc-blue opacity-10 animate-lift" 
            size={192} 
            isAnimating={true} 
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <HardHatIcon className="h-16 w-16 text-arc-flash-yellow" size={64} />
              <h1 className="text-5xl font-shogun text-arc-flash-yellow">
                Iron Task
              </h1>
            </div>
            <p className="text-xl text-gray-300 leading-relaxed">
              Professional Construction Documentation System
            </p>
            <hr className="weld-seam w-48" />
            <div className="space-y-4 text-gray-400">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-safety-orange" />
                <span>OSHA Compliant Documentation</span>
              </div>
              <div className="flex items-center gap-3">
                <HardHatIcon className="h-5 w-5 text-arc-flash-yellow" />
                <span>Real-time Safety Monitoring</span>
              </div>
              <div className="flex items-center gap-3">
                <IBeamCraneIcon className="h-5 w-5 text-aisc-blue" />
                <span>Project Progress Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sparks effect */}
        {showSparks && (
          <div className="absolute inset-0 pointer-events-none">
            <SparkAnimationIcon 
              className="absolute top-1/4 left-1/3 h-16 w-16 text-arc-flash-yellow animate-spark" 
              isAnimating={true} 
            />
            <SparkAnimationIcon 
              className="absolute bottom-1/3 right-1/4 h-12 w-12 text-safety-orange animate-spark" 
              isAnimating={true} 
            />
          </div>
        )}
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <HardHatIcon className="h-16 w-16 text-arc-flash-yellow mx-auto mb-4" size={64} />
            <h1 className="text-3xl font-shogun text-arc-flash-yellow">Iron Task</h1>
          </div>

          <div className="brushed-metal rounded-lg shadow-2xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-shogun text-white">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Sign in to access your construction projects
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-safety-green" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-safety-green" />
                  <span>256-bit Encryption</span>
                </div>
              </div>
            </div>

            <ClientOnly fallback={<div className="space-y-6"><div className="space-y-4"><div className="h-16 bg-gray-800 rounded-lg animate-pulse"></div><div className="h-16 bg-gray-800 rounded-lg animate-pulse"></div></div></div>}>
              <form className="space-y-6" onSubmit={handleSubmit} aria-label="Login form">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          document.getElementById('password')?.focus()
                        }
                      }}
                      aria-describedby={error ? 'login-error email-help' : 'email-help'}
                      aria-invalid={error ? 'true' : 'false'}
                      className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                      placeholder="worker@fsw-denver.com"
                    />
                  </div>
                  <div id="email-help" className="sr-only">
                    Enter your work email address to sign in
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmit(e as any)
                        }
                      }}
                      aria-describedby={error ? 'login-error password-help' : 'password-help'}
                      aria-invalid={error ? 'true' : 'false'}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div id="password-help" className="sr-only">
                    Enter your account password. Use the eye icon to show or hide password.
                  </div>
                </div>
              </div>

              {/* CAPTCHA Challenge */}
              {captchaChallenge && (
                <div className="space-y-2">
                  <label htmlFor="captcha" className="block text-sm font-medium text-gray-300">
                    Security Verification
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700 px-4 py-2 rounded-md border border-gray-600">
                      <span className="text-lg font-mono text-white">
                        {captchaChallenge.num1} + {captchaChallenge.num2} = ?
                      </span>
                    </div>
                    <input
                      id="captcha"
                      type="number"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
                      placeholder="?"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Multiple failed attempts detected. Please solve this simple math problem.
                  </p>
                </div>
              )}

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-4 w-4 bg-gray-800 border-gray-700 rounded text-safety-orange focus:ring-safety-orange"
                    aria-describedby="remember-help"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-sm text-gray-300">
                    Remember this device
                  </label>
                  <div id="remember-help" className="sr-only">
                    Keep you signed in on this device for 30 days
                  </div>
                </div>
                <div className="text-sm">
                  <Link
                    href="/demo"
                    className="text-aisc-blue hover:text-blue-400 transition-colors"
                  >
                    Try demo instead?
                  </Link>
                </div>
              </div>

              {error && (
                <div 
                  className="rounded-md bg-red-900/20 border border-red-800 p-4"
                  role="alert" 
                  aria-live="polite"
                  id="login-error"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-safety-orange hover:bg-orange-700 text-white font-bold py-3 text-lg arc-weld-glow"
                  size="lg"
                  disabled={isLoading}
                  aria-describedby={isLoading ? 'login-status' : undefined}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                      <span id="login-status" aria-live="polite">{loadingMessage}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Sign In Securely
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-aisc-blue hover:text-blue-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                  <Link
                    href="/register"
                    className="text-aisc-blue hover:text-blue-400 transition-colors"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </form>
            </ClientOnly>

            <hr className="weld-seam" />

            {/* Social Proof */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-400">Trusted by construction professionals</p>
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-bold text-safety-orange">50+</p>
                  <p>Companies</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-aisc-blue">200+</p>
                  <p>Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-arc-flash-yellow">5K+</p>
                  <p>Photos</p>
                </div>
              </div>
            </div>

          </div>
          <p className="text-center text-xs text-gray-500">
            © 2024 Iron Task • Denver, CO
          </p>
        </div>
      </div>
      </div>
    </>
  )
}