'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { authApi } from '@/lib/api'
import {
  Shield,
  Mail,
  Lock,
  User,
  Phone,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Users,
  Zap,
  Wrench,
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneNumber: '',
    role: 'WORKER',
    unionMember: false,
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let score = 0
    const feedback = []

    if (password.length >= 8) score += 1
    else feedback.push('At least 8 characters')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Lowercase letter')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Uppercase letter')

    if (/[0-9]/.test(password)) score += 1
    else feedback.push('Number')

    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push('Special character')

    return { score, feedback }
  }

  const passwordStrength = calculatePasswordStrength(formData.password)
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ]

  // Calculate form completion progress
  const calculateFormProgress = () => {
    const requiredFields = ['name', 'email', 'password', 'confirmPassword']
    const completedFields = requiredFields.filter(
      field => formData[field as keyof typeof formData]
    )
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const formProgress = calculateFormProgress()

  // Real-time field validation
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ''
          : 'Please enter a valid email address'
      case 'name':
        return value.length >= 2 ? '' : 'Name must be at least 2 characters'
      case 'password':
        return value.length >= 8 ? '' : 'Password must be at least 8 characters'
      case 'confirmPassword':
        return value === formData.password ? '' : 'Passwords do not match'
      default:
        return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)

    try {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role,
        unionMember: formData.unionMember,
      })

      setShowSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Registration failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Users className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-shogun text-yellow-400">
              Join Iron Task
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Create your account to start documenting projects
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>30-day free trial</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>No credit card required</span>
                </div>
              </div>

              {/* Form Progress Indicator */}
              <div className="w-full max-w-xs mx-auto">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Registration Progress</span>
                  <span>{formProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${formProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Section */}
          <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400">Live</span>
                </div>
                <span className="text-gray-300">
                  Join <span className="font-bold text-orange-500">50+</span>{' '}
                  construction professionals
                </span>
              </div>

              <div className="text-xs text-gray-400">
                <span className="font-medium text-yellow-400">12 people</span>{' '}
                signed up in the last hour
              </div>
            </div>
          </div>

          {showSuccess ? (
            <div className="brushed-metal rounded-lg shadow-2xl p-8 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-shogun text-white">
                Registration Successful!
              </h2>
              <p className="text-gray-400">Redirecting you to sign in...</p>
              <Zap className="h-12 w-12 text-yellow-400 mx-auto animate-pulse" />
            </div>
          ) : (
            <div className="brushed-metal rounded-lg shadow-2xl p-8 space-y-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-800 border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        formData.name && validateField('name', formData.name)
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.name
                            ? 'border-green-500 focus:ring-green-500'
                            : 'border-gray-700 focus:ring-orange-500'
                      }`}
                      placeholder="John Steel"
                    />
                    {formData.name && validateField('name', formData.name) && (
                      <p className="mt-1 text-xs text-red-400">
                        {validateField('name', formData.name)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
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
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-800 border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        formData.email && validateField('email', formData.email)
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.email
                            ? 'border-green-500 focus:ring-green-500'
                            : 'border-gray-700 focus:ring-orange-500'
                      }`}
                      placeholder="john@construction-company.com"
                    />
                    {formData.email &&
                      validateField('email', formData.email) && (
                        <p className="mt-1 text-xs text-red-400">
                          {validateField('email', formData.email)}
                        </p>
                      )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="(720) 555-1234"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                  >
                    <option value="WORKER">Field Worker</option>
                    <option value="FOREMAN">Foreman</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-800 border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        formData.password &&
                        validateField('password', formData.password)
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.password && passwordStrength.score >= 3
                            ? 'border-green-500 focus:ring-green-500'
                            : formData.password
                              ? 'border-yellow-500 focus:ring-yellow-500'
                              : 'border-gray-700 focus:ring-orange-500'
                      }`}
                      placeholder="Create a strong password"
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded ${
                                i < passwordStrength.score
                                  ? strengthColors[passwordStrength.score - 1]
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength.score <= 2
                              ? 'text-red-400'
                              : passwordStrength.score <= 3
                                ? 'text-yellow-400'
                                : 'text-green-400'
                          }`}
                        >
                          {strengthLabels[passwordStrength.score - 1] ||
                            'Very Weak'}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-gray-400">
                          Missing: {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-800 border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        formData.confirmPassword &&
                        validateField(
                          'confirmPassword',
                          formData.confirmPassword
                        )
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.confirmPassword &&
                              formData.confirmPassword === formData.password
                            ? 'border-green-500 focus:ring-green-500'
                            : formData.confirmPassword
                              ? 'border-yellow-500 focus:ring-yellow-500'
                              : 'border-gray-700 focus:ring-orange-500'
                      }`}
                      placeholder="Confirm your password"
                    />
                    {formData.confirmPassword &&
                      validateField(
                        'confirmPassword',
                        formData.confirmPassword
                      ) && (
                        <p className="mt-1 text-xs text-red-400">
                          {validateField(
                            'confirmPassword',
                            formData.confirmPassword
                          )}
                        </p>
                      )}
                  </div>
                </div>

                {/* Union Member */}
                <div className="flex items-center">
                  <input
                    id="unionMember"
                    name="unionMember"
                    type="checkbox"
                    checked={formData.unionMember}
                    onChange={handleChange}
                    className="h-4 w-4 bg-gray-800 border-gray-700 rounded text-safety-orange focus:ring-safety-orange"
                  />
                  <label
                    htmlFor="unionMember"
                    className="ml-2 text-sm text-gray-300"
                  >
                    I am a union member
                  </label>
                </div>

                {error && (
                  <div className="rounded-md bg-red-900/20 border border-red-800 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
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
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-400">
                      Already have an account?{' '}
                      <Link
                        href="/login"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                    <p className="text-sm text-gray-400">
                      Want to explore first?{' '}
                      <Link
                        href="/demo"
                        className="text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Try our demo
                      </Link>
                    </p>
                  </div>
                </div>

                {/* What Happens Next Preview */}
                <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold text-center flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    What happens next?
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        1
                      </div>
                      <span>Instant access to your construction dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        2
                      </div>
                      <span>
                        Start documenting your first project in 2 minutes
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        3
                      </div>
                      <span>Invite your team and begin collaboration</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden diamond-plate">
        <div className="absolute inset-0 bg-gradient-to-bl from-black/80 via-black/60 to-transparent" />

        {/* Animated elements */}
        <div className="absolute top-1/3 right-20 animate-spin">
          <Wrench className="h-24 w-24 text-blue-400 opacity-20" />
        </div>
        <div className="absolute bottom-1/4 left-20 animate-pulse">
          <Zap className="h-20 w-20 text-yellow-400 opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="space-y-6">
            <h2 className="text-4xl font-shogun text-white">
              Document. Track. Succeed.
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Join thousands of ironworkers documenting their projects safely
              and efficiently.
            </p>
            <hr className="weld-seam w-48" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-arc-flash-yellow">
                Why Join Iron Task?
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-safety-green mt-0.5" />
                  <span>
                    Real-time project documentation and progress tracking
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-safety-green mt-0.5" />
                  <span>
                    OSHA compliant safety reporting and incident tracking
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-safety-green mt-0.5" />
                  <span>Collaborative team management and communication</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-safety-green mt-0.5" />
                  <span>Cloud-based storage with offline capabilities</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-safety-green mt-0.5" />
                  <span>Professional reports and client presentations</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <p className="text-sm text-gray-500">
                Trusted by over 500+ construction companies nationwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
