'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react'

interface TwoFactorLoginProps {
  email: string
  password: string
  onVerify: (twoFactorCode: string) => Promise<void>
  onBack: () => void
  isLoading?: boolean
  error?: string
}

export default function TwoFactorLogin({
  email,
  password,
  onVerify,
  onBack,
  isLoading = false,
  error,
}: TwoFactorLoginProps) {
  const [code, setCode] = useState('')
  const [isBackupCode, setIsBackupCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim()) {
      await onVerify(code.trim())
    }
  }

  const handleCodeChange = (value: string) => {
    if (isBackupCode) {
      // Backup codes are 8 digits
      setCode(value.replace(/\D/g, '').slice(0, 8))
    } else {
      // TOTP codes are 6 digits
      setCode(value.replace(/\D/g, '').slice(0, 6))
    }
  }

  const toggleBackupCode = () => {
    setIsBackupCode(!isBackupCode)
    setCode('')
  }

  const expectedLength = isBackupCode ? 8 : 6

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            {isBackupCode
              ? 'Enter one of your 8-digit backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            Signing in as: <strong>{email}</strong>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                {isBackupCode ? 'Backup Code' : 'Authentication Code'}
              </label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder={isBackupCode ? '12345678' : '123456'}
                maxLength={expectedLength}
                className="text-center font-mono text-lg"
                required
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || code.length !== expectedLength}
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </Button>
          </form>

          <div className="space-y-2">
            <button
              type="button"
              onClick={toggleBackupCode}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {isBackupCode
                ? 'Use authenticator app instead'
                : 'Use backup code instead'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </button>
          </div>

          {!isBackupCode && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Open your authenticator app</p>
              <p>• Find "Iron Task 726" account</p>
              <p>• Enter the 6-digit code</p>
            </div>
          )}

          {isBackupCode && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <div className="text-xs text-amber-800">
                <strong>Note:</strong> Each backup code can only be used once.
                Make sure to keep your remaining codes secure.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
