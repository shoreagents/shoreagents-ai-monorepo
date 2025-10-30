"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Video,
  Loader2,
  CalendarCheck,
  UserCheck
} from "lucide-react"

interface InterviewRequest {
  id: string
  candidateFirstName: string
  bpocCandidateId: string
  preferredTimes: string[]
  clientNotes: string | null
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'HIRED'
  scheduledTime: string | null
  meetingLink: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export default function ClientInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInterviews()
  }, [])

  async function fetchInterviews() {
    try {
      const response = await fetch('/api/client/interviews')
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setInterviews(data.interviews)
    } catch (error) {
      console.error('Error fetching interviews:', error)
      setError('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: InterviewRequest['status']) {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
      HIRED: 'bg-purple-100 text-purple-800 border-purple-300'
    }

    const icons = {
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      SCHEDULED: <CalendarCheck className="h-3 w-3 mr-1" />,
      COMPLETED: <CheckCircle2 className="h-3 w-3 mr-1" />,
      CANCELLED: <AlertCircle className="h-3 w-3 mr-1" />,
      HIRED: <UserCheck className="h-3 w-3 mr-1" />
    }

    return (
      <Badge variant="outline" className={`${styles[status]} flex items-center`}>
        {icons[status]}
        {status}
      </Badge>
    )
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading interviews...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Interviews</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview Requests</h1>
            <p className="text-gray-600 mt-1">
              Track your candidate interview requests and schedule updates
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {interviews.length} Total
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {interviews.filter(i => i.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Scheduled</p>
                <p className="text-2xl font-bold text-blue-900">
                  {interviews.filter(i => i.status === 'SCHEDULED').length}
                </p>
              </div>
              <CalendarCheck className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {interviews.filter(i => i.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Hired</p>
                <p className="text-2xl font-bold text-purple-900">
                  {interviews.filter(i => i.status === 'HIRED').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Interview List */}
        {interviews.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Interview Requests Yet
            </h3>
            <p className="text-gray-600">
              Browse the talent pool and request interviews with candidates
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {interview.candidateFirstName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Requested on {formatDate(interview.createdAt)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(interview.status)}
                    </div>

                    {/* Status Message */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {interview.status === 'PENDING' && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Waiting for Admin</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Our admin team is coordinating with the candidate to schedule your interview. 
                              You'll be notified once a time is confirmed.
                            </p>
                          </div>
                        </div>
                      )}

                      {interview.status === 'SCHEDULED' && interview.scheduledTime && (
                        <div className="flex items-start gap-3">
                          <CalendarCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Interview Scheduled</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(interview.scheduledTime)}
                            </p>
                            {interview.meetingLink && (
                              <a 
                                href={interview.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Video className="h-4 w-4" />
                                Join Meeting
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {interview.status === 'COMPLETED' && (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Interview Completed</p>
                            <p className="text-sm text-gray-600 mt-1">
                              This interview has been completed. Next steps will be communicated by our team.
                            </p>
                          </div>
                        </div>
                      )}

                      {interview.status === 'HIRED' && (
                        <div className="flex items-start gap-3">
                          <UserCheck className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Candidate Hired! 🎉</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Congratulations! This candidate has been hired and is moving forward with onboarding.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Your Preferred Times */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Your Preferred Times:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {interview.preferredTimes.map((time, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Your Notes */}
                    {interview.clientNotes && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Your Notes:</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                          {interview.clientNotes}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {interview.adminNotes && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Admin Notes:</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                          {interview.adminNotes}
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

