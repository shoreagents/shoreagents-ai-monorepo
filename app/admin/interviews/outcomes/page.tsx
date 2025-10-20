"use client"

/**
 * Admin Interview Outcomes Dashboard
 * 
 * View client feedback and hiring decisions
 */

import { useEffect, useState } from 'react'
import { Calendar, User, Building, MessageSquare, FileText, TrendingUp } from 'lucide-react'

interface InterviewOutcome {
  id: string
  bpoc_candidate_id: string
  candidate_first_name: string
  decision: 'hire' | 'reject' | 'needs_review'
  client_feedback: string
  admin_notes: string | null
  created_at: string
  scheduled_time: string
  daily_co_room_url: string | null
  client_name: string
  client_email: string
  client_company: string | null
}

interface Stats {
  total: number
  hired: number
  rejected: number
  needsReview: number
}

export default function AdminInterviewOutcomesPage() {
  const [outcomes, setOutcomes] = useState<InterviewOutcome[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [decisionFilter, setDecisionFilter] = useState<string>('')

  useEffect(() => {
    fetchOutcomes()
  }, [decisionFilter])

  async function fetchOutcomes() {
    try {
      setLoading(true)
      const url = decisionFilter
        ? `/api/admin/interviews/outcomes?decision=${decisionFilter}`
        : '/api/admin/interviews/outcomes'
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setOutcomes(data.outcomes)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch outcomes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateAdminNotes(outcomeId: string, notes: string) {
    try {
      const response = await fetch('/api/admin/interviews/outcomes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome_id: outcomeId, admin_notes: notes }),
      })

      const data = await response.json()

      if (data.success) {
        fetchOutcomes()
      } else {
        alert('Failed to update notes: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to update notes')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Interview Outcomes</h1>
        <p className="mt-2 text-gray-600">Review client feedback and hiring decisions</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Interviews"
            value={stats.total}
            color="bg-blue-100 text-blue-700"
            icon={TrendingUp}
          />
          <StatCard
            label="Hired"
            value={stats.hired}
            color="bg-green-100 text-green-700"
            icon={TrendingUp}
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            color="bg-red-100 text-red-700"
            icon={TrendingUp}
          />
          <StatCard
            label="Needs Review"
            value={stats.needsReview}
            color="bg-yellow-100 text-yellow-700"
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setDecisionFilter('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            decisionFilter === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setDecisionFilter('hire')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            decisionFilter === 'hire'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Hired
        </button>
        <button
          onClick={() => setDecisionFilter('reject')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            decisionFilter === 'reject'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setDecisionFilter('needs_review')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            decisionFilter === 'needs_review'
              ? 'bg-yellow-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Needs Review
        </button>
      </div>

      {/* Outcomes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : outcomes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl">
          <p className="text-gray-500 text-lg">No outcomes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {outcomes.map((outcome) => (
            <OutcomeCard
              key={outcome.id}
              outcome={outcome}
              onUpdateNotes={updateAdminNotes}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function OutcomeCard({ outcome, onUpdateNotes }: { outcome: InterviewOutcome; onUpdateNotes: (id: string, notes: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [adminNotes, setAdminNotes] = useState(outcome.admin_notes || '')

  const decisionColors = {
    hire: 'bg-green-100 text-green-700 border-green-300',
    reject: 'bg-red-100 text-red-700 border-red-300',
    needs_review: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  }

  const decisionLabels = {
    hire: '✅ Hire',
    reject: '❌ Reject',
    needs_review: '⏸️ Needs Review',
  }

  function handleSaveNotes() {
    onUpdateNotes(outcome.id, adminNotes)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900">
              {outcome.candidate_first_name}
            </h3>
            <span className={`px-4 py-1.5 rounded-full font-semibold text-sm border-2 ${decisionColors[outcome.decision]}`}>
              {decisionLabels[outcome.decision]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Client Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Client
              </h4>
              <div className="ml-6 space-y-1 text-gray-600">
                <p>{outcome.client_name}</p>
                <p className="text-xs">{outcome.client_email}</p>
                {outcome.client_company && <p className="text-xs">{outcome.client_company}</p>}
              </div>
            </div>

            {/* Interview Details */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Interview
              </h4>
              <div className="ml-6 space-y-1 text-gray-600">
                <p>{new Date(outcome.scheduled_time).toLocaleDateString()}</p>
                <p className="text-xs">Feedback: {new Date(outcome.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Feedback */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Client Feedback
        </h4>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{outcome.client_feedback}</p>
      </div>

      {/* Admin Notes */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Admin Notes
          </h4>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Add internal notes..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setAdminNotes(outcome.admin_notes || '')
                  setEditing(false)
                }}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 text-sm">
            {adminNotes || <span className="text-gray-400 italic">No admin notes yet</span>}
          </p>
        )}
      </div>
    </div>
  )
}

