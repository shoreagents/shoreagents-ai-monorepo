"use client"

/**
 * COMBINED RECRUITMENT PAGE - Talent Pool + Job Requests
 * 
 * Tab 1: 🔍 Talent Pool - Browse & Search 26 candidates
 * Tab 2: 📋 Job Requests - Create & Manage job postings
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Briefcase, 
  Plus, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users,
  Calendar,
  Building2,
  Target,
  CheckCircle2,
  X,
  Loader2,
  FileText,
  UserCheck,
  Star,
  Search,
  Filter,
  Zap,
  Award,
  TrendingUp,
  UserSearch
} from "lucide-react"

// Types
interface JobRequest {
  id: number
  job_title: string
  work_type: string
  work_arrangement: string
  experience_level: string
  status: string
  created_at: string
  applicants: number
  views: number
}

interface Candidate {
  id: string
  firstName: string
  avatar: string | null
  position: string
  location: string
  bio: string | null
  skills: string[]
  experienceYears: number
  culturalFitScore: number | null
  discType: string | null
  typingWpm: number | null
  leaderboardScore: number | null
}

interface InterviewRequest {
  id: string
  candidateFirstName: string
  bpocCandidateId: string
  preferredTimes: any
  clientNotes: string | null
  status: string
  createdAt: string
  scheduledTime: string | null
  adminNotes: string | null
  meetingLink: string | null
  clientPreferredStart?: string | null
}

type TabType = 'talent-pool' | 'job-requests' | 'interviews'

export default function RecruitmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('talent-pool')
  
  // Job Requests State
  const [showForm, setShowForm] = useState(false)
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Talent Pool State
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Interviews State
  const [interviews, setInterviews] = useState<InterviewRequest[]>([])
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [hireRequestingId, setHireRequestingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  
  // Hire/Reject Modals
  const [hireModalOpen, setHireModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<InterviewRequest | null>(null)
  const [hireData, setHireData] = useState({ 
    preferredStartDate: '', 
    hireNotes: '',
    isMonToFri: true,
    workStartTime: '09:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  })
  const [rejectData, setRejectData] = useState({ rejectReason: '' })
  
  // Filters
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [minExperience, setMinExperience] = useState(0)
  const [selectedDiscTypes, setSelectedDiscTypes] = useState<string[]>([])
  const [minCulturalFit, setMinCulturalFit] = useState(0)
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    job_title: "",
    job_description: "",
    work_type: "full-time",
    work_arrangement: "remote",
    experience_level: "mid-level",
    salary_min: "",
    salary_max: "",
    currency: "PHP",
    salary_type: "monthly",
    department: "",
    industry: "",
    shift: "day",
    priority: "medium",
    application_deadline: "",
    requirements: [""],
    responsibilities: [""],
    benefits: [""],
    skills: [""]
  })

  // Fetch job requests
  useEffect(() => {
    if (activeTab === 'job-requests') {
    fetchJobRequests()
    }
  }, [activeTab])

  // Fetch candidates
  useEffect(() => {
    if (activeTab === 'talent-pool') {
      fetchCandidates()
    }
  }, [activeTab, searchQuery, selectedSkills, location, minExperience, selectedDiscTypes, minCulturalFit])

  // Fetch interviews
  useEffect(() => {
    if (activeTab === 'interviews') {
      fetchInterviews()
    }
  }, [activeTab])

  async function fetchJobRequests() {
    try {
      setJobsLoading(true)
      const response = await fetch("/api/client/job-requests")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setJobRequests(data)
    } catch (error) {
      console.error("Error fetching job requests:", error)
    } finally {
      setJobsLoading(false)
    }
  }

  async function fetchCandidates() {
    try {
      setCandidatesLoading(true)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedSkills.length > 0) params.append('skills', selectedSkills.join(','))
      if (location) params.append('location', location)
      if (minExperience > 0) params.append('minExperience', minExperience.toString())
      if (selectedDiscTypes.length > 0) params.append('discType', selectedDiscTypes[0])
      if (minCulturalFit > 0) params.append('culturalFitMin', minCulturalFit.toString())

      const response = await fetch(`/api/client/candidates?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCandidates(data.candidates)
        
        const allSkills = new Set<string>()
        data.candidates.forEach((c: Candidate) => {
          c.skills?.forEach((skill: string) => allSkills.add(skill))
        })
        setAvailableSkills(Array.from(allSkills).sort())
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setCandidatesLoading(false)
    }
  }

  async function fetchInterviews() {
    try {
      setInterviewsLoading(true)
      const response = await fetch("/api/client/interviews")
      if (!response.ok) throw new Error("Failed to fetch interviews")
      const data = await response.json()
      if (data.success) {
        setInterviews(data.interviews || [])
        console.log(`✅ [CLIENT] Loaded ${data.interviews?.length || 0} interviews`)
      }
    } catch (error) {
      console.error('❌ Failed to fetch interviews:', error)
    } finally {
      setInterviewsLoading(false)
    }
  }

  async function handleHireRequest() {
    if (!selectedInterview) return
    
    try {
      setHireRequestingId(selectedInterview.id)
      
      const response = await fetch("/api/client/interviews/hire-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewRequestId: selectedInterview.id,
          preferredStartDate: hireData.preferredStartDate,
          notes: hireData.hireNotes || "Client would like to hire this candidate",
          workSchedule: {
            workDays: hireData.workDays,
            workStartTime: hireData.workStartTime,
            isMonToFri: hireData.isMonToFri,
            clientTimezone: "Australia/Brisbane" // TODO: Get from client profile
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Hire Request Submitted Successfully",
          description: "Our admin team has been notified and will proceed with the following steps:\n\n1. Send a formal job offer to the candidate\n2. Schedule a confirmation call to discuss role details\n3. Verify the candidate's interest and availability\n\nYou'll be notified once the candidate confirms their acceptance. Thank you for your patience!",
          duration: 8000,
        })
        setHireModalOpen(false)
        setHireData({ 
          preferredStartDate: '', 
          hireNotes: '',
          isMonToFri: true,
          workStartTime: '09:00',
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        })
        setSelectedInterview(null)
        // Refresh interviews to show updated status
        await fetchInterviews()
      } else {
        throw new Error(data.error || "Failed to send hire request")
      }
    } catch (error) {
      console.error('❌ Error sending hire request:', error)
      toast({
        title: "Error",
        description: `Failed to send hire request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setHireRequestingId(null)
    }
  }

  async function handleRejectRequest() {
    if (!selectedInterview || !rejectData.rejectReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }
    
    try {
      setRejectingId(selectedInterview.id)
      
      const response = await fetch("/api/client/interviews/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewRequestId: selectedInterview.id,
          rejectReason: rejectData.rejectReason
        })
      })

      const data = await response.json()

      if (data.success) {
        alert("✅ Rejection sent to admin successfully!")
        setRejectModalOpen(false)
        setRejectData({ rejectReason: '' })
        setSelectedInterview(null)
        // Refresh interviews to show updated status
        await fetchInterviews()
      } else {
        throw new Error(data.error || "Failed to send rejection")
      }
    } catch (error) {
      console.error('❌ Error sending rejection:', error)
      alert(`Failed to send rejection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRejectingId(null)
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setSelectedSkills([])
    setLocation('')
    setMinExperience(0)
    setSelectedDiscTypes([])
    setMinCulturalFit(0)
  }

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function toggleDiscType(type: string) {
    setSelectedDiscTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], ""]
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }))
  }

  const updateArrayItem = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        skills: formData.skills.filter(s => s.trim()),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        application_deadline: formData.application_deadline || null
      }

      const response = await fetch("/api/client/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData)
      })

      if (!response.ok) throw new Error("Failed to create job request")

      await fetchJobRequests()
      setShowForm(false)
      
      // Reset form
      setFormData({
        job_title: "",
        job_description: "",
        work_type: "full-time",
        work_arrangement: "remote",
        experience_level: "mid-level",
        salary_min: "",
        salary_max: "",
        currency: "PHP",
        salary_type: "monthly",
        department: "",
        industry: "",
        shift: "day",
        priority: "medium",
        application_deadline: "",
        requirements: [""],
        responsibilities: [""],
        benefits: [""],
        skills: [""]
      })
    } catch (error) {
      console.error("Error submitting job request:", error)
      alert("Failed to create job request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recruitment</h1>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'talent-pool' 
                  ? 'Discover top Filipino professionals ready to join your team'
                  : 'Create and manage job requests for your team'
                }
              </p>
            </div>
            {activeTab === 'talent-pool' && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {candidates.length} candidates available
                </span>
              </div>
            )}
            {activeTab === 'job-requests' && !showForm && (
            <Button 
                onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
                New Job Request
            </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('talent-pool')
                setShowForm(false)
              }}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === 'talent-pool'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserSearch className="w-5 h-5" />
              Talent Pool
              {activeTab === 'talent-pool' && (
                <Badge className="bg-blue-500 text-white">{candidates.length}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('job-requests')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === 'job-requests'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Job Requests
              {activeTab === 'job-requests' && jobRequests.length > 0 && (
                <Badge className="bg-blue-500 text-white">{jobRequests.length}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === 'interviews'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Interviews
              {activeTab === 'interviews' && interviews.length > 0 && (
                <Badge className="bg-blue-500 text-white">{interviews.length}</Badge>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'talent-pool' && (
          <TalentPoolTab 
            candidates={candidates}
            loading={candidatesLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            selectedSkills={selectedSkills}
            toggleSkill={toggleSkill}
            location={location}
            setLocation={setLocation}
            minExperience={minExperience}
            setMinExperience={setMinExperience}
            selectedDiscTypes={selectedDiscTypes}
            toggleDiscType={toggleDiscType}
            minCulturalFit={minCulturalFit}
            setMinCulturalFit={setMinCulturalFit}
            availableSkills={availableSkills}
            clearFilters={clearFilters}
            router={router}
          />
        )}

        {activeTab === 'job-requests' && (
          <JobRequestsTab
            showForm={showForm}
            setShowForm={setShowForm}
            jobRequests={jobRequests}
            loading={jobsLoading}
            submitting={submitting}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        )}

        {activeTab === 'interviews' && (
          <InterviewsTab
            interviews={interviews}
            loading={interviewsLoading}
            hireRequestingId={hireRequestingId}
            rejectingId={rejectingId}
            hireModalOpen={hireModalOpen}
            setHireModalOpen={setHireModalOpen}
            rejectModalOpen={rejectModalOpen}
            setRejectModalOpen={setRejectModalOpen}
            setSelectedInterview={setSelectedInterview}
            hireData={hireData}
            setHireData={setHireData}
            rejectData={rejectData}
            setRejectData={setRejectData}
            handleHireRequest={handleHireRequest}
            handleRejectRequest={handleRejectRequest}
          />
        )}
      </main>
    </div>
  )
}

// ============================================================================
// TAB 1: TALENT POOL
// ============================================================================

function TalentPoolTab({ 
  candidates, 
  loading,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedSkills,
  toggleSkill,
  location,
  setLocation,
  minExperience,
  setMinExperience,
  selectedDiscTypes,
  toggleDiscType,
  minCulturalFit,
  setMinCulturalFit,
  availableSkills,
  clearFilters,
  router
}: any) {
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by skills, role, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            showFilters
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {(selectedSkills.length > 0 || minExperience > 0 || minCulturalFit > 0) && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedSkills.length + (minExperience > 0 ? 1 : 0) + (minCulturalFit > 0 ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {availableSkills.slice(0, 20).map((skill: string) => (
                  <label key={skill} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="City or Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min. Experience: {minExperience} years
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={minExperience}
                onChange={(e) => setMinExperience(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Cultural Fit Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min. Cultural Fit: {minCulturalFit}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={minCulturalFit}
                onChange={(e) => setMinCulturalFit(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* DISC Type Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personality Type (DISC)
            </label>
            <div className="flex gap-2">
              {['D', 'I', 'S', 'C'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleDiscType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDiscTypes.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Candidates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No candidates found matching your criteria</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate: Candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => router.push(`/client/talent-pool/${candidate.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Candidate Card Component (same as before, keeping it compact)
function CandidateCard({ candidate, onClick }: { candidate: Candidate; onClick: () => void }) {
  const getGradient = () => {
    if (!candidate.culturalFitScore) return 'from-blue-500 via-indigo-500 to-purple-600'
    if (candidate.culturalFitScore >= 80) return 'from-emerald-500 via-teal-500 to-cyan-600'
    if (candidate.culturalFitScore >= 70) return 'from-blue-500 via-indigo-500 to-purple-600'
    return 'from-indigo-500 via-purple-500 to-pink-600'
  }

  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 hover:border-transparent hover:-translate-y-2 overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm -z-10"></div>
      
      <div className={`h-1.5 bg-gradient-to-r ${getGradient()} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      </div>

      <div className={`relative bg-gradient-to-br ${getGradient()} p-6 text-white overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              {candidate.avatar ? (
                <div className="relative">
                  <img
                    src={candidate.avatar}
                    alt={candidate.firstName}
                    className="w-20 h-20 rounded-2xl border-3 border-white/30 shadow-2xl backdrop-blur-sm ring-4 ring-white/20 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                </div>
              ) : (
                <div className="relative w-20 h-20 rounded-2xl border-3 border-white/30 shadow-2xl backdrop-blur-sm bg-white/20 flex items-center justify-center text-3xl font-bold ring-4 ring-white/20 group-hover:scale-105 transition-transform duration-300">
                  {candidate.firstName[0]}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                </div>
              )}
              <div>
                <h3 className="font-bold text-2xl tracking-tight mb-1 drop-shadow-sm">
                  {candidate.firstName}
                </h3>
                <p className="text-sm text-white/90 font-medium">{candidate.position}</p>
              </div>
            </div>
            
            {candidate.leaderboardScore && candidate.leaderboardScore > 50 && (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold">{candidate.leaderboardScore}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/95 backdrop-blur-sm bg-white/10 rounded-lg px-3 py-1.5 w-fit">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{candidate.location}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {candidate.bio && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-5">
            {candidate.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {candidate.culturalFitScore && candidate.culturalFitScore >= 60 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{candidate.culturalFitScore}% Match</span>
            </div>
          )}
          {candidate.discType && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>DISC: {candidate.discType}</span>
            </div>
          )}
          {candidate.typingWpm && candidate.typingWpm >= 40 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{candidate.typingWpm} WPM</span>
            </div>
          )}
        </div>

        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-blue-400 to-transparent"></span>
            Top Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 5 && (
              <span className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 rounded-lg text-xs font-semibold border border-gray-200">
                +{candidate.skills.length - 5} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-5">
          <Award className="w-4 h-4 text-blue-500" />
          <span className="font-semibold">{candidate.experienceYears}</span>
          <span>years of experience</span>
        </div>

        <button className="relative w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold rounded-xl overflow-hidden group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          <span className="relative flex items-center justify-center gap-2">
            View Full Profile
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </span>
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// TAB 2: JOB REQUESTS
// ============================================================================

function JobRequestsTab({
  showForm,
  setShowForm,
  jobRequests,
  loading,
  submitting,
  formData,
  setFormData,
  handleSubmit,
  addArrayItem,
  removeArrayItem,
  updateArrayItem
}: any) {
  if (showForm) {
    return (
                  <div className="bg-white shadow rounded-lg text-gray-900">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Job Request</h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill out the details below to post your job request
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                            <Label htmlFor="job_title" className="text-sm font-medium text-gray-900">
                              Job Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="job_title"
                              type="text"
                              required
                              value={formData.job_title}
                              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                              placeholder="e.g. Senior Virtual Assistant"
                              className="mt-1 text-gray-900 bg-white border-gray-300"
                            />
                  </div>

                  <div>
                    <Label htmlFor="job_description" className="text-sm font-medium text-gray-900">
                      Job Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="job_description"
                      required
                      rows={4}
                      value={formData.job_description}
                      onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                      placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="department" className="text-sm font-medium text-gray-900">
                        Department
                      </Label>
                      <Input
                        id="department"
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g. Marketing, IT, Operations"
                        className="mt-1 text-gray-900 bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry" className="text-sm font-medium text-gray-900">
                        Industry
                      </Label>
                      <Input
                        id="industry"
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g. Technology, Finance, Healthcare"
                        className="mt-1 text-gray-900 bg-white border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <Clock className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">Work Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="work_type" className="text-sm font-medium text-gray-900">
                      Work Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.work_type}
                      onValueChange={(value) => setFormData({ ...formData, work_type: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="work_arrangement" className="text-sm font-medium text-gray-900">
                      Work Arrangement
                    </Label>
                    <Select
                      value={formData.work_arrangement}
                      onValueChange={(value) => setFormData({ ...formData, work_arrangement: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select arrangement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">Onsite</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience_level" className="text-sm font-medium text-gray-900">
                      Experience Level
                    </Label>
                    <Select
                      value={formData.experience_level}
                      onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry-level">Entry Level</SelectItem>
                        <SelectItem value="mid-level">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="shift" className="text-sm font-medium text-gray-900">
                      Shift
                    </Label>
                    <Select
                      value={formData.shift}
                      onValueChange={(value) => setFormData({ ...formData, shift: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day Shift</SelectItem>
                        <SelectItem value="night">Night Shift</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium text-gray-900">
                      Priority
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="application_deadline" className="text-sm font-medium text-gray-900">
                      Application Deadline
                    </Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-medium text-gray-900">Compensation</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label htmlFor="currency" className="text-sm font-medium text-gray-900">
                      Currency <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHP">PHP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salary_type" className="text-sm font-medium text-gray-900">
                      Salary Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.salary_type}
                      onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salary_min" className="text-sm font-medium text-gray-900">
                      Min Salary
                    </Label>
                    <Input
                      id="salary_min"
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                      placeholder="20000"
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary_max" className="text-sm font-medium text-gray-900">
                      Max Salary
                    </Label>
                    <Input
                      id="salary_max"
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                      placeholder="30000"
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
                </div>
                
                <div className="space-y-4">
              {formData.requirements.map((req: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={req}
                        onChange={(e) => updateArrayItem('requirements', index, e.target.value)}
                        placeholder={`Requirement ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('requirements', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('requirements')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Requirement
                  </Button>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <UserCheck className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Responsibilities</h3>
                </div>
                
                <div className="space-y-4">
              {formData.responsibilities.map((resp: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={resp}
                        onChange={(e) => updateArrayItem('responsibilities', index, e.target.value)}
                        placeholder={`Responsibility ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.responsibilities.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('responsibilities', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('responsibilities')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Responsibility
                  </Button>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <Star className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-medium text-gray-900">Required Skills</h3>
                </div>
                
                <div className="space-y-4">
              {formData.skills.map((skill: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={skill}
                        onChange={(e) => updateArrayItem('skills', index, e.target.value)}
                        placeholder={`Skill ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.skills.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('skills', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('skills')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-medium text-gray-900">Benefits</h3>
                </div>
                
                <div className="space-y-4">
              {formData.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={benefit}
                        onChange={(e) => updateArrayItem('benefits', index, e.target.value)}
                        placeholder={`Benefit ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('benefits', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('benefits')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Job Request
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Your job request will be posted to the BPOC platform for candidate matching
                </p>
              </div>
            </form>
          </div>
    )
  }

  // Job Requests List
  if (loading) {
    return (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading job requests...</p>
          </div>
    )
  }

  if (jobRequests.length === 0) {
    return (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Requests Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first job request to find top talent from the BPOC platform
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Job Request
            </Button>
          </div>
    )
  }

  return (
          <div className="space-y-4">
      {jobRequests.map((job: JobRequest) => (
              <Card key={job.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{job.job_title}</h3>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <Badge className={
                        job.status === 'active' ? 'bg-green-100 text-green-800' :
                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {job.status.toUpperCase()}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        {job.work_type}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {job.work_arrangement}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        {job.experience_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job.applicants} applicants
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
    </div>
  )
}

// ============================================================================
// TAB 3: INTERVIEWS
// ============================================================================

function InterviewsTab({ 
  interviews, 
  loading, 
  hireRequestingId,
  rejectingId,
  hireModalOpen,
  setHireModalOpen,
  rejectModalOpen,
  setRejectModalOpen,
  setSelectedInterview,
  hireData,
  setHireData,
  rejectData,
  setRejectData,
  handleHireRequest,
  handleRejectRequest
}: { 
  interviews: InterviewRequest[]
  loading: boolean
  hireRequestingId: string | null
  rejectingId: string | null
  hireModalOpen: boolean
  setHireModalOpen: (open: boolean) => void
  rejectModalOpen: boolean
  setRejectModalOpen: (open: boolean) => void
  setSelectedInterview: (interview: InterviewRequest | null) => void
  hireData: { preferredStartDate: string; hireNotes: string; isMonToFri: boolean; workStartTime: string; workDays: string[] }
  setHireData: (data: { preferredStartDate: string; hireNotes: string; isMonToFri: boolean; workStartTime: string; workDays: string[] }) => void
  rejectData: { rejectReason: string }
  setRejectData: (data: { rejectReason: string }) => void
  handleHireRequest: () => void
  handleRejectRequest: () => void
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (interviews.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interview Requests Yet</h3>
        <p className="text-gray-600">
          When you request interviews with candidates, they will appear here
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview: InterviewRequest) => {
        // Normalize status to lowercase for comparison
        const status = interview.status.toLowerCase()
        
        return (
        <Card key={interview.id} className="p-6 bg-white shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-semibold text-gray-900">{interview.candidateFirstName}</h3>
                    <Badge className={
                      status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : status === 'hire-requested' || status === 'hire_requested'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : status === 'offer-sent' || status === 'offer_sent'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : status === 'offer-accepted' || status === 'offer_accepted'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : status === 'offer-declined' || status === 'offer_declined'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : status === 'hired'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : status === 'completed'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }>
                      {status.toUpperCase().replace(/_/g, ' ').replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Requested: {new Date(interview.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {status === 'pending' && (
                <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      <Clock className="h-5 w-5 text-yellow-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-yellow-900">Waiting for Admin ⏳</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Our admin team is coordinating with the candidate to schedule your interview. You'll be notified once a time is confirmed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'scheduled' && (
                <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">Interview Scheduled! 📅</p>
                      {interview.scheduledTime && (
                        <p className="text-sm text-blue-800 mt-2 font-medium">
                          📆 {new Date(interview.scheduledTime).toLocaleString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      )}
                      {interview.meetingLink && (
                        <a 
                          href={interview.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {status === 'completed' && (
                <div className="rounded-lg p-4 bg-green-50 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Interview Complete! 🎉</p>
                      <p className="text-sm text-green-800 mt-1">
                        The interview is complete. Would you like to hire this candidate?
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(status === 'hire-requested' || status === 'hire_requested') && (
                <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <Clock className="h-5 w-5 text-orange-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900">Hire Request Sent ⏳</p>
                      <p className="text-sm text-orange-800 mt-1">
                        Your hire request has been sent to the admin. Waiting for them to send the job offer to the candidate.
                      </p>
                      {interview.clientPreferredStart && (
                        <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                          <p className="text-xs font-medium text-orange-900 mb-1">Your Preferred Start Date:</p>
                          <p className="text-sm font-semibold text-orange-900">
                            📅 {new Date(interview.clientPreferredStart).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(status === 'offer-sent' || status === 'offer_sent') && (
                <div className="rounded-lg p-4 bg-indigo-50 border border-indigo-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                      <Calendar className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-indigo-900">Job Offer Sent 📧</p>
                      <p className="text-sm text-indigo-800 mt-1">
                        Admin has sent the job offer to the candidate. Waiting for their response.
                      </p>
                      {interview.clientPreferredStart && (
                        <div className="mt-3 p-3 bg-indigo-100 border border-indigo-200 rounded-lg">
                          <p className="text-xs font-medium text-indigo-900 mb-1">Your Preferred Start Date:</p>
                          <p className="text-sm font-semibold text-indigo-900">
                            📅 {new Date(interview.clientPreferredStart).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(status === 'offer-accepted' || status === 'offer_accepted') && (
                <div className="rounded-lg p-4 bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-900">Offer Accepted! 🎉</p>
                      <p className="text-sm text-emerald-800 mt-1">
                        Candidate has accepted the job offer! Waiting for them to create their account and complete onboarding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(status === 'offer-declined' || status === 'offer_declined') && (
                <div className="rounded-lg p-4 bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <X className="h-5 w-5 text-red-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">Offer Declined</p>
                      <p className="text-sm text-red-800 mt-1">
                        Unfortunately, the candidate has declined the job offer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'hired' && (
                <div className="rounded-lg p-4 bg-purple-50 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <UserCheck className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">Candidate Hired! 🎉</p>
                      <p className="text-sm text-purple-800 mt-1">
                        The candidate has created their account and is now part of your team!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'rejected' && (
                <div className="rounded-lg p-4 bg-gray-50 border border-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-200 rounded-lg flex-shrink-0">
                      <X className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Candidate Rejected</p>
                      <p className="text-sm text-gray-700 mt-1">
                        You have declined to move forward with this candidate. Admin has been notified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Your Preferred Times - Only show before hiring stage */}
              {interview.preferredTimes && interview.preferredTimes.length > 0 && 
               (status === 'pending' || status === 'scheduled' || status === 'completed') && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-gray-200 rounded">
                      <Clock className="h-4 w-4 text-gray-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Your Preferred Interview Times:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interview.preferredTimes.map((time: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(time).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Notes */}
              {interview.clientNotes && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-gray-200 rounded">
                      <FileText className="h-4 w-4 text-gray-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Your Notes:</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {interview.clientNotes}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {interview.adminNotes && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-200 rounded">
                      <FileText className="h-4 w-4 text-blue-700" />
                    </div>
                    <span className="text-sm font-semibold text-blue-900">Message from Admin:</span>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">{interview.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              {status === 'completed' && (
                <>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setSelectedInterview(interview)
                      setHireData({ 
                        preferredStartDate: '', 
                        hireNotes: '',
                        isMonToFri: true,
                        workStartTime: '09:00',
                        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                      })
                      setHireModalOpen(true)
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Request to Hire
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      setSelectedInterview(interview)
                      setRejectData({ rejectReason: '' })
                      setRejectModalOpen(true)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Candidate
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
        )
      })}

      {/* Hire Modal */}
      <Dialog open={hireModalOpen} onOpenChange={setHireModalOpen}>
        <DialogContent className="bg-white text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Request to Hire Candidate
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Provide details about the hire request for the admin team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 max-h-[500px] overflow-y-auto">
            {/* Preferred Start Date */}
            <div>
              <Label htmlFor="preferredStartDate" className="text-gray-900 font-medium mb-2 block">
                Preferred Start Date *
              </Label>
              <Input
                id="preferredStartDate"
                type="date"
                value={hireData.preferredStartDate}
                onChange={(e) => setHireData({ ...hireData, preferredStartDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white text-gray-900 border-gray-300"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Date will display in your local format (DD/MM/YYYY). Admin will confirm with candidate.
              </p>
            </div>

            {/* Work Schedule Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <Label className="text-gray-900 font-semibold text-base">Work Schedule</Label>
              </div>

              {/* Work Days */}
              <div className="space-y-3 mb-4">
                <Label className="text-gray-900 font-medium">Work Days *</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hireData.isMonToFri}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setHireData({ 
                          ...hireData, 
                          isMonToFri: checked,
                          workDays: checked 
                            ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                            : hireData.workDays
                        })
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Monday to Friday</span>
                  </label>
                </div>
                {!hireData.isMonToFri && (
                  <div className="ml-6 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-900 mb-1">Custom Schedule</p>
                    <p>Select 5 consecutive working days in the next step with admin</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Filipino staff work 9-hour shifts (including breaks)</p>
              </div>

              {/* Start Time */}
              <div>
                <Label htmlFor="workStartTime" className="text-gray-900 font-medium mb-2 block">
                  Work Start Time (Your Timezone) *
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="workStartTime"
                    type="time"
                    value={hireData.workStartTime}
                    onChange={(e) => setHireData({ ...hireData, workStartTime: e.target.value })}
                    className="bg-white text-gray-900 border-gray-300 w-40"
                    required
                  />
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <span className="font-medium">End: </span>
                    {(() => {
                      const [hours, minutes] = hireData.workStartTime.split(':').map(Number)
                      const endHour = (hours + 9) % 24
                      return `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    })()}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Times will be converted to Philippines timezone (Manila)
                </p>
              </div>

              {/* Timezone Display */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Your Timezone:</span>
                  <span className="text-blue-700">Brisbane (AEST)</span>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="border-t pt-4">
              <Label htmlFor="hireNotes" className="text-gray-900 font-medium mb-2 block">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="hireNotes"
                value={hireData.hireNotes}
                onChange={(e) => setHireData({ ...hireData, hireNotes: e.target.value })}
                placeholder="Any additional information for the admin (e.g., salary offer, benefits, role details, etc.)"
                className="bg-white text-gray-900 border-gray-300"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setHireModalOpen(false)
                setHireData({ 
                  preferredStartDate: '', 
                  hireNotes: '',
                  isMonToFri: true,
                  workStartTime: '09:00',
                  workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                })
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleHireRequest}
              disabled={!hireData.preferredStartDate || hireRequestingId !== null}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {hireRequestingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Send Hire Request
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="bg-white text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Reject Candidate
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide a reason for rejecting this candidate
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectReason" className="text-gray-900 font-medium mb-2 block">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectData.rejectReason}
                onChange={(e) => setRejectData({ rejectReason: e.target.value })}
                placeholder="Please explain why this candidate is not a good fit..."
                className="bg-white text-gray-900 border-gray-300"
                rows={5}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be sent to the admin team for their records
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false)
                setRejectData({ rejectReason: '' })
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectRequest}
              disabled={!rejectData.rejectReason.trim() || rejectingId !== null}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {rejectingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
