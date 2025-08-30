'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  FileText,
  Download,
  Share2,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  ListTodo,
  FileSpreadsheet,
  Sparkles,
  Mail,
  MessageSquare,
  Link as LinkIcon,
  Eye,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'

interface Report {
  id: string
  reportType: 'PROGRESS_RECAP' | 'SUMMARY' | 'DAILY_LOG'
  title: string
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  summary?: string
  createdAt: string
  generatedAt?: string
  pdfUrl?: string
  shareToken: string
  user: {
    id: string
    name: string
    email: string
  }
  _count: {
    shares: number
  }
}

const reportTypeInfo = {
  PROGRESS_RECAP: {
    title: 'Progress Recap',
    description: 'Best for showing everything that has happened at a project',
    icon: FileSpreadsheet,
    color: 'bg-blue-500',
  },
  SUMMARY: {
    title: 'Summary',
    description: 'Best for adding context to a group of photos',
    icon: FileText,
    color: 'bg-green-500',
  },
  DAILY_LOG: {
    title: 'Daily Log',
    description: "Best for seeing what got done and what's next",
    icon: ListTodo,
    color: 'bg-purple-500',
  },
}

export default function ProjectReportsPage() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [creatingReport, setCreatingReport] = useState(false)

  // Form state
  const [reportType, setReportType] =
    useState<Report['reportType']>('PROGRESS_RECAP')
  const [reportTitle, setReportTitle] = useState('')
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })

  // Share form state
  const [shareMethod, setShareMethod] = useState<'email' | 'sms' | 'link'>(
    'link'
  )
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  useEffect(() => {
    fetchReports()
  }, [projectId])

  const fetchReports = async () => {
    try {
      const response = await api.get(`/api/projects/${projectId}/reports`)
      setReports(response.data.reports)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createReport = async () => {
    if (!reportTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a report title',
        variant: 'destructive',
      })
      return
    }

    setCreatingReport(true)
    try {
      const response = await api.post('/api/reports', {
        projectId,
        reportType,
        title: reportTitle,
        dateRange: reportType === 'DAILY_LOG' ? undefined : dateRange,
      })

      const newReport = response.data.report
      setReports([newReport, ...reports])
      setShowCreateDialog(false)
      setReportTitle('')

      toast({
        title: 'Report Created',
        description:
          'Your report is being generated. This may take a few moments.',
      })

      // Poll for completion
      pollReportStatus(newReport.id)
    } catch (error) {
      console.error('Failed to create report:', error)
      toast({
        title: 'Error',
        description: 'Failed to create report',
        variant: 'destructive',
      })
    } finally {
      setCreatingReport(false)
    }
  }

  const pollReportStatus = async (reportId: string) => {
    const checkStatus = async () => {
      try {
        const response = await api.get(`/api/reports/${reportId}`)
        const report = response.data.report

        setReports(prev => prev.map(r => (r.id === reportId ? report : r)))

        if (report.status === 'COMPLETED') {
          toast({
            title: 'Report Ready',
            description: 'Your report has been generated successfully!',
          })
        } else if (report.status === 'FAILED') {
          toast({
            title: 'Generation Failed',
            description: 'Failed to generate the report. Please try again.',
            variant: 'destructive',
          })
        } else if (report.status === 'GENERATING') {
          // Continue polling
          setTimeout(checkStatus, 3000)
        }
      } catch (error) {
        console.error('Failed to check report status:', error)
      }
    }

    setTimeout(checkStatus, 3000)
  }

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return
    }

    try {
      await api.delete(`/api/reports/${reportId}`)
      setReports(reports.filter(r => r.id !== reportId))
      toast({
        title: 'Report Deleted',
        description: 'The report has been deleted successfully',
      })
    } catch (error) {
      console.error('Failed to delete report:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive',
      })
    }
  }

  const shareReport = async () => {
    if (!selectedReport) return

    if (shareMethod === 'email' && !recipientEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      })
      return
    }

    if (shareMethod === 'sms' && !recipientPhone) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.post(
        `/api/reports/${selectedReport.id}/share`,
        {
          method: shareMethod,
          recipientEmail: shareMethod === 'email' ? recipientEmail : undefined,
          recipientPhone: shareMethod === 'sms' ? recipientPhone : undefined,
        }
      )

      const shareUrl = response.data.shareUrl

      if (shareMethod === 'link') {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: 'Link Copied',
          description: 'The shareable link has been copied to your clipboard',
        })
      } else {
        toast({
          title: 'Report Shared',
          description: `Report has been sent via ${shareMethod}`,
        })
      }

      setShowShareDialog(false)
      setRecipientEmail('')
      setRecipientPhone('')
    } catch (error) {
      console.error('Failed to share report:', error)
      toast({
        title: 'Error',
        description: 'Failed to share report',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'GENERATING':
        return <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Reports</h1>
            <p className="text-gray-400">
              Pages build themselves with AI actions
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Report Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(reportTypeInfo).map(([key, info]) => {
          const Icon = info.icon
          return (
            <div key={key} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className={`${info.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    {info.title}
                  </h3>
                  <p className="text-sm text-gray-400">{info.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-lg text-gray-400 mb-4">No reports yet</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create your first report
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => {
            const typeInfo = reportTypeInfo[report.reportType]
            const TypeIcon = typeInfo.icon

            return (
              <div
                key={report.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`${typeInfo.color} p-3 rounded-lg`}>
                      <TypeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                        <span>{typeInfo.title}</span>
                        <span>•</span>
                        <span>
                          Created{' '}
                          {format(new Date(report.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span>•</span>
                        <span>By {report.user.name}</span>
                      </div>
                      {report.summary && (
                        <p className="text-sm text-gray-300 mb-3">
                          {report.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <span className="text-sm text-gray-400">
                          {report.status === 'GENERATING'
                            ? 'Generating...'
                            : report.status.toLowerCase()}
                        </span>
                        {report._count.shares > 0 && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-sm text-gray-400">
                              Shared {report._count.shares} time
                              {report._count.shares !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {report.status === 'COMPLETED' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/${projectId}/reports/${report.id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/reports/${report.id}/download`,
                              '_blank'
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report)
                            setShowShareDialog(true)
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {report.user.id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Report Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create AI Report</DialogTitle>
            <DialogDescription>
              Select a report type and let AI generate it for you
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={reportType}
                onValueChange={value =>
                  setReportType(value as Report['reportType'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypeInfo).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <info.icon className="h-4 w-4" />
                        <span>{info.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-400">
                {reportTypeInfo[reportType].description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Report Title</Label>
              <Input
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                placeholder={`${reportTypeInfo[reportType].title} - ${format(new Date(), 'MMMM d, yyyy')}`}
              />
            </div>

            {reportType !== 'DAILY_LOG' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={e =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={e =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createReport} disabled={creatingReport}>
              {creatingReport ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Report
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Report Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
            <DialogDescription>
              Choose how you want to share this report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share Method</Label>
              <Select
                value={shareMethod}
                onValueChange={value =>
                  setShareMethod(value as typeof shareMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      <span>Copy Link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Send via Email</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Send via SMS</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shareMethod === 'email' && (
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            )}

            {shareMethod === 'sms' && (
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={shareReport}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
