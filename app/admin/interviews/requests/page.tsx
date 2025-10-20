"use client"

/**
 * Admin Interview Requests Dashboard
 * 
 * Manage pending interview requests and schedule interviews
 */

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, Building, FileText, Check, X, Video } from 'lucide-react'

interface InterviewRequest {
  id: string
  bpoc_candidate_id: string
  candidate_first_name: string
  preferred_times: string[]
  client_notes: string | null
  status: string
  created_at: string
  client_name: string
  client_email: string
  client_company: string | null
}

export default function AdminInterviewRequestsPage() {
  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [scheduleModal, setScheduleModal] = useState<{ show: boolean; request: InterviewRequest | null }>({
    show: false,
    request: null,
  })

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  async function fetchRequests() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/interviews/requests?status=${statusFilter}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Interview Requests</h1>
        <p className="mt-2 text-gray-600">Review and schedule client interview requests</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['pending', 'scheduled', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl">
          <p className="text-gray-500 text-lg">No {statusFilter} requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onSchedule={() => setScheduleModal({ show: true, request })}
              onRefresh={fetchRequests}
            />
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModal.show && scheduleModal.request && (
        <ScheduleModal
          request={scheduleModal.request}
          onClose={() => {
            setScheduleModal({ show: false, request: null })
            fetchRequests()
          }}
        />
      )}
    </div>
  )
}

function RequestCard({ request, onSchedule, onRefresh }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900">
              {request.candidate_first_name}
            </h3>
            <StatusBadge status={request.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Client Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Client Information
              </h4>
              <div className="ml-6 space-y-1 text-gray-600">
                <p><span className="font-medium">Name:</span> {request.client_name}</p>
                <p><span className="font-medium">Email:</span> {request.client_email}</p>
                {request.client_company && (
                  <p><span className="font-medium">Company:</span> {request.client_company}</p>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Request Details
              </h4>
              <div className="ml-6 space-y-1 text-gray-600">
                <p><span className="font-medium">Requested:</span> {new Date(request.created_at).toLocaleDateString()}</p>
                <p><span className="font-medium">Candidate ID:</span> {request.bpoc_candidate_id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Preferred Times */}
          {request.preferred_times.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Client's Preferred Times
              </h4>
              <ul className="space-y-1 ml-6">
                {request.preferred_times.map((time, i) => (
                  <li key={i} className="text-blue-700 text-sm">
                    {new Date(time).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Client Notes */}
          {request.client_notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Client Notes
              </h4>
              <p className="text-gray-700 text-sm">{request.client_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onSchedule}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Approve & Schedule
          </button>
          <button
            className="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Reject
          </button>
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
    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

function ScheduleModal({ request, onClose }: { request: InterviewRequest; onClose: () => void }) {
  const [scheduledTime, setScheduledTime] = useState('')
  const [candidateConfirmed, setCandidateConfirmed] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!scheduledTime) {
      alert('Please select a scheduled time')
      return
    }

    if (!candidateConfirmed) {
      alert('Please confirm candidate availability')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/admin/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_request_id: request.id,
          scheduled_time: scheduledTime,
          candidate_confirmed: true,
          admin_notes: adminNotes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Interview scheduled successfully!\nDaily.co room created: ' + data.dailyRoomUrl)
        onClose()
      } else {
        alert('Failed to schedule interview: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
      alert('Failed to schedule interview')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Schedule Interview: {request.candidate_first_name}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Preferred Times Reference */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Client's Preferred Times:</h3>
              <ul className="space-y-1">
                {request.preferred_times.map((time, i) => (
                  <li key={i} className="text-blue-700 text-sm flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {new Date(time).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>

            {/* Scheduled Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Scheduled Time *
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Candidate Confirmation */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="candidate-confirmed"
                checked={candidateConfirmed}
                onChange={(e) => setCandidateConfirmed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="candidate-confirmed" className="text-sm text-gray-700">
                <span className="font-semibold">I confirm that the candidate is available at the selected time</span>
                <br />
                <span className="text-xs text-gray-600">You must verify candidate availability before scheduling</span>
              </label>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Any internal notes about this interview..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Info */}
            <div className="p-4 bg-green-50 rounded-lg flex items-start gap-3">
              <Video className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">A Daily.co video room will be created automatically</p>
                <p className="text-xs mt-1">The client and candidate will receive the video link</p>
              </div>
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50"
                disabled={submitting || !candidateConfirmed}
              >
                {submitting ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

