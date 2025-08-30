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
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { api } from '@/lib/api'

interface TwoFactorSetupProps {
  onSetupComplete?: () => void
  onCancel?: () => void
}

export default function TwoFactorSetup({
  onSetupComplete,
  onCancel,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'password' | 'scan' | 'verify' | 'backup'>(
    'password'
  )
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [manualKey, setManualKey] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedCodes, setCopiedCodes] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await api.post('/auth/2fa/setup', { password })
      setQrCode(response.data.qrCode)
      setManualKey(response.data.manualEntryKey)
      setStep('scan')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to setup 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await api.post('/auth/2fa/verify', {
        token: verificationCode,
      })
      setBackupCodes(response.data.backupCodes)
      setStep('backup')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const copyBackupCodes = async () => {
    const codesText = backupCodes.join('\n')
    await navigator.clipboard.writeText(codesText)
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 3000)
  }

  const downloadBackupCodes = () => {
    const codesText = `Iron Task 726 - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

These codes can be used to access your account if you lose your authenticator device.
Each code can only be used once.

${backupCodes.join('\n')}

Store these codes securely and do not share them with anyone.`

    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'iron-task-726-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleComplete = () => {
    onSetupComplete?.()
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Password Verification Step */}
      {step === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Setup Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Enter your password to begin setting up 2FA for enhanced security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Verifying...' : 'Continue'}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* QR Code Scan Step */}
      {step === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Use your authenticator app to scan this QR code or enter the
              manual key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img src={qrCode} alt="2FA QR Code" className="border rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Manual Entry Key:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={manualKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(manualKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Popular authenticator apps: Google Authenticator, Authy, Microsoft
              Authenticator
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              I've Added the Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Step */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Setup</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app to complete
              setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="verification"
                  className="block text-sm font-medium mb-2"
                >
                  Verification Code
                </label>
                <Input
                  id="verification"
                  type="text"
                  value={verificationCode}
                  onChange={e =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, '').slice(0, 6)
                    )
                  }
                  placeholder="123456"
                  maxLength={6}
                  className="text-center font-mono text-lg"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('scan')}
                >
                  Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes Step */}
      {step === 'backup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              2FA Enabled Successfully!
            </CardTitle>
            <CardDescription>
              Save these backup codes securely. You can use them to access your
              account if you lose your authenticator device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white rounded border text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyBackupCodes}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedCodes ? 'Copied!' : 'Copy Codes'}
              </Button>
              <Button
                onClick={downloadBackupCodes}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Important:</strong> Store these codes securely. Each
                  code can only be used once, and they cannot be recovered if
                  lost.
                </div>
              </div>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
