"use client"

/**
 * Client Interviews Dashboard
 * 
 * View all interview requests, scheduled interviews, and provide feedback
 */

import { useEffect, useState } from 'react'
import { Calendar, Clock, Video, MessageSquare, CheckCircle, X Circle, AlertCircle, FileText } from 'lucide-react'

interface InterviewRequest {
  id: string
  bpoc_candidate_id: string
  candidate_first_name: string
  preferred_times: string[]
  client_notes: string | null
  status: 'pending' | 'approved' | 'rejected' | 'scheduled'
  created_at: string
}

interface ScheduledInterview {
  id: string
  bpoc_candidate_id: string
  candidate_first_name: string
  scheduled_time: string
  daily_co_room_url: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  outcome_decision: string | null
  outcome_feedback: string | null
  outcome_created_at: string | null
}

type TabType = 'pending' | 'scheduled' | 'completed'

export default function ClientInterviewsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackModal, setFeedbackModal] = useState<{ show: boolean; interview: ScheduledInterview | null }>({
    show: false,
    interview: null,
  })

  useEffect(() => {
    fetchInterviews()
  }, [])

  async function fetchInterviews() {
    try {
      setLoading(true)
      const response = await fetch('/api/client/interviews')
      const data = await response.json()

      if (data.success) {
        setRequests(data.requests)
        setScheduledInterviews(data.scheduledInterviews)
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const scheduled = scheduledInterviews.filter(i => i.status === 'scheduled')
  const completed = scheduledInterviews.filter(i => i.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Interviews</h1>
          <p className="mt-2 text-gray-600">Manage interview requests and provide feedback</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <TabButton
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
            count={pendingRequests.length}
          >
            Pending Requests
          </TabButton>
          <TabButton
            active={activeTab === 'scheduled'}
            onClick={() => setActiveTab('scheduled')}
            count={scheduled.length}
          >
            Scheduled
          </TabButton>
          <TabButton
            active={activeTab === 'completed'}
            onClick={() => setActiveTab('completed')}
            count={completed.length}
          >
            Completed
          </TabButton>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Pending Requests Tab */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="No pending requests"
                    description="You haven't submitted any interview requests yet"
                  />
                ) : (
                  pendingRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))
                )}
              </div>
            )}

            {/* Scheduled Interviews Tab */}
            {activeTab === 'scheduled' && (
              <div className="space-y-4">
                {scheduled.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No scheduled interviews"
                    description="Your interview requests are pending approval"
                  />
                ) : (
                  scheduled.map((interview) => (
                    <ScheduledCard
                      key={interview.id}
                      interview={interview}
                      onProvideFeedback={() => setFeedbackModal({ show: true, interview })}
                    />
                  ))
                )}
              </div>
            )}

            {/* Completed Interviews Tab */}
            {activeTab === 'completed' && (
              <div className="space-y-4">
                {completed.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="No completed interviews"
                    description="Completed interviews will appear here"
                  />
                ) : (
                  completed.map((interview) => (
                    <CompletedCard key={interview.id} interview={interview} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackModal.show && feedbackModal.interview && (
        <FeedbackModal
          interview={feedbackModal.interview}
          onClose={() => {
            setFeedbackModal({ show: false, interview: null })
            fetchInterviews()
          }}
        />
      )}
    </div>
  )
}

function TabButton({ active, onClick, count, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition-colors relative ${
        active
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
      {count > 0 && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

function RequestCard({ request }: { request: InterviewRequest }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900">{request.candidate_first_name}</h3>
            <StatusBadge status={request.status} />
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Requested on {new Date(request.created_at).toLocaleDateString()}</span>
            </div>

            {request.preferred_times.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Preferred Times:</p>
                <ul className="space-y-1 ml-6">
                  {request.preferred_times.map((time, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(time).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {request.client_notes && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Your Notes:</p>
                <p className="text-gray-600 italic">{request.client_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          ⏳ Waiting for admin approval. We'll notify you once your interview is scheduled.
        </p>
      </div>
    </div>
  )
}

function ScheduledCard({ interview, onProvideFeedback }: { interview: ScheduledInterview; onProvideFeedback: () => void }) {
  const interviewTime = new Date(interview.scheduled_time)
  const isPast = interviewTime < new Date()
  const isWithin24Hours = interviewTime.getTime() - Date.now() < 24 * 60 * 60 * 1000

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{interview.candidate_first_name}</h3>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{interviewTime.toLocaleDateString()}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span className="font-medium">{interviewTime.toLocaleTimeString()}</span>
          </div>
        </div>
        {isWithin24Hours && !isPast && (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            Upcoming Soon
          </span>
        )}
      </div>

      {interview.daily_co_room_url && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Video className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Video Interview Link</span>
          </div>
          <a
            href={interview.daily_co_room_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Join Interview Room →
          </a>
          <p className="text-xs text-gray-600 mt-2">
            Join the meeting 5 minutes before the scheduled time
          </p>
        </div>
      )}

      {isPast && !interview.outcome_decision && (
        <button
          onClick={onProvideFeedback}
          className="mt-4 w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
        >
          Provide Feedback
        </button>
      )}
    </div>
  )
}

function CompletedCard({ interview }: { interview: ScheduledInterview }) {
  const decisionColors = {
    hire: 'bg-green-100 text-green-700',
    reject: 'bg-red-100 text-red-700',
    needs_review: 'bg-yellow-100 text-yellow-700',
  }

  const decisionLabels = {
    hire: 'Hire',
    reject: 'Reject',
    needs_review: 'Needs Review',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{interview.candidate_first_name}</h3>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Interview: {new Date(interview.scheduled_time).toLocaleDateString()}</span>
          </div>
        </div>
        {interview.outcome_decision && (
          <span className={`px-4 py-2 rounded-full font-semibold ${decisionColors[interview.outcome_decision as keyof typeof decisionColors]}`}>
            {decisionLabels[interview.outcome_decision as keyof typeof decisionLabels]}
          </span>
        )}
      </div>

      {interview.outcome_feedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Your Feedback:</span>
          </div>
          <p className="text-gray-700">{interview.outcome_feedback}</p>
          {interview.outcome_created_at && (
            <p className="text-xs text-gray-500 mt-2">
              Submitted on {new Date(interview.outcome_created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    scheduled: 'bg-blue-100 text-blue-700',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-20">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function FeedbackModal({ interview, onClose }: { interview: ScheduledInterview; onClose: () => void }) {
  const [decision, setDecision] = useState<'hire' | 'reject' | 'needs_review' | ''>('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!decision) {
      alert('Please select a decision')
      return
    }

    if (!feedback.trim()) {
      alert('Please provide feedback')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/client/interviews/${interview.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, client_feedback: feedback }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Feedback submitted successfully!')
        onClose()
      } else {
        alert('Failed to submit feedback: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Interview Feedback: {interview.candidate_first_name}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Decision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Decision *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('hire')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    decision === 'hire'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✅ Hire
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('needs_review')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    decision === 'needs_review'
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⏸️ Needs Review
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('reject')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    decision === 'reject'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ❌ Reject
                </button>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Feedback *
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={8}
                placeholder="Please provide detailed feedback about the interview, candidate's performance, skills demonstrated, cultural fit, and any concerns..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This feedback will be shared with our recruitment team
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50"
                disabled={submitting || !decision || !feedback.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

