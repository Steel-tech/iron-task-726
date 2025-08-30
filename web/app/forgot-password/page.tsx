'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { authApi } from '@/lib/api'
import {
  HardHatIcon,
  SparkAnimationIcon,
} from '@/components/icons/SteelConstructionIcons'
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // In a real app, this would send a reset email
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      setIsSuccess(true)
    } catch (err: any) {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-spark opacity-20">
          <SparkAnimationIcon
            className="h-32 w-32 text-arc-flash-yellow"
            size={128}
            isAnimating={true}
          />
        </div>
        <div className="absolute bottom-20 right-10 animate-lift opacity-20">
          <HardHatIcon className="h-24 w-24 text-safety-orange" size={96} />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <HardHatIcon
            className="h-16 w-16 text-arc-flash-yellow mx-auto mb-4"
            size={64}
          />
          <h1 className="text-3xl font-shogun text-arc-flash-yellow">
            Iron Task
          </h1>
        </div>

        <div className="brushed-metal rounded-lg shadow-2xl p-8 space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-safety-green mx-auto" />
              <h2 className="text-2xl font-shogun text-white">
                Check Your Email
              </h2>
              <p className="text-gray-400">
                We&apos;ve sent password reset instructions to{' '}
                <span className="text-arc-flash-yellow">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or try
                again.
              </p>
              <Link href="/login">
                <Button className="w-full bg-aisc-blue hover:bg-blue-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-shogun text-white">
                  Reset Your Password
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Enter your email address and we&apos;ll send you instructions
                  to reset your password.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
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
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent transition-all"
                      placeholder="worker@fsw-denver.com"
                    />
                  </div>
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
                    className="w-full bg-safety-orange hover:bg-orange-700 text-white font-bold py-3 text-lg"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Sending Instructions...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5 mr-2" />
                        Send Reset Instructions
                      </>
                    )}
                  </Button>

                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Need help? Contact support@fsw-denver.com
        </p>
      </div>
    </div>
  )
}
