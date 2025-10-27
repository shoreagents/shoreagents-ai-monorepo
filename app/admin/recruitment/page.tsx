"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Briefcase, 
  Users, 
  Calendar, 
  Eye,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  UserCheck,
  TrendingUp,
  Star,
  Award,
  Zap,
  CheckCircle,
  Mail,
  XCircle
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

// Types
interface Candidate {
  id: string
  first_name: string
  avatar_url: string | null
  location_city: string
  location_country: string
  position: string
  bio: string
  resume_data: any
  latest_primary_type: string
  overall_score: number
}

interface JobRequest {
  id: number
  job_title: string
  job_description: string
  work_type: string
  work_arrangement: string
  experience_level: string
  salary_min: string
  salary_max: string
  currency: string
  department: string
  industry: string
  status: string
  skills: string[]
  created_at: string
  applicants: number
  views: number
  company_id: string
}

interface InterviewRequest {
  id: string
  clientUserId: string
  bpocCandidateId: string
  candidateFirstName: string
  preferredTimes: string[]
  clientNotes: string | null
  status: string
  createdAt: string
  clientPreferredStart?: string | null
  client_name?: string
  client_email?: string
  company_name?: string
  client_users?: {
    id: string
    name: string
    email: string
    companyId: string
    company?: {
      id: string
      companyName: string
    }
  }
}

type TabType = 'candidates' | 'job-requests' | 'interviews'

export default function AdminRecruitmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('candidates')
  
  // Candidates State
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  
  // Job Requests State
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobSearch, setJobSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null)
  
  // Interview Requests State
  const [interviews, setInterviews] = useState<InterviewRequest[]>([])
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [interviewSearch, setInterviewSearch] = useState('')
  const [selectedInterview, setSelectedInterview] = useState<InterviewRequest | null>(null)
  
  // Hire Modal State
  const [hireModalOpen, setHireModalOpen] = useState(false)
  const [interviewToHire, setInterviewToHire] = useState<InterviewRequest | null>(null)
  const [companies, setCompanies] = useState<Array<{id: string, companyName: string}>>([])
  const [hireFormData, setHireFormData] = useState({
    position: '',
    companyId: '',
    candidateEmail: '',
    candidatePhone: '',
    clientPreferredStart: '' // NEW: Client's preferred start date
  })
  const [hiring, setHiring] = useState(false)
  
  // Schedule Interview Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [interviewToSchedule, setInterviewToSchedule] = useState<InterviewRequest | null>(null)
  const [scheduleFormData, setScheduleFormData] = useState({
    scheduledTime: '',
    meetingLink: '',
    adminNotes: ''
  })
  const [scheduling, setScheduling] = useState(false)
  
  // Finalize Hire Modal State (consolidated with confirm acceptance)
  const [confirmAcceptanceModalOpen, setConfirmAcceptanceModalOpen] = useState(false)
  const [interviewToConfirm, setInterviewToConfirm] = useState<InterviewRequest | null>(null)
  const [confirmFormData, setConfirmFormData] = useState({
    confirmedStartDate: '',
    staffEmail: '',
    adminNotes: ''
  })
  const [confirming, setConfirming] = useState(false)
  
  // Decline Offer Modal State
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [interviewToDecline, setInterviewToDecline] = useState<InterviewRequest | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeJobs: 0,
    pendingInterviews: 0,
    totalApplications: 0
  })
  
  const { toast } = useToast()

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'candidates') {
      fetchCandidates()
    } else if (activeTab === 'job-requests') {
      fetchJobRequests()
    } else if (activeTab === 'interviews') {
      fetchInterviews()
    }
  }, [activeTab])

  async function fetchCandidates() {
    try {
      setCandidatesLoading(true)
      const response = await fetch('/api/admin/recruitment/candidates')
      const data = await response.json()
      if (data.success) {
        setCandidates(data.candidates)
        setStats(prev => ({ ...prev, totalCandidates: data.candidates.length }))
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setCandidatesLoading(false)
    }
  }

  async function fetchJobRequests() {
    try {
      setJobsLoading(true)
      const response = await fetch('/api/admin/recruitment/job-requests')
      const data = await response.json()
      if (data.success) {
        setJobRequests(data.jobRequests)
        const activeCount = data.jobRequests.filter((j: JobRequest) => j.status === 'active').length
        const totalApps = data.jobRequests.reduce((sum: number, j: JobRequest) => sum + (j.applicants || 0), 0)
        setStats(prev => ({ 
          ...prev, 
          activeJobs: activeCount,
          totalApplications: totalApps 
        }))
      }
    } catch (error) {
      console.error('Error fetching job requests:', error)
    } finally {
      setJobsLoading(false)
    }
  }

  async function fetchInterviews() {
    try {
      setInterviewsLoading(true)
      const response = await fetch('/api/admin/recruitment/interviews')
      const data = await response.json()
      if (data.success) {
        console.log('🔍 [FRONTEND] Interviews received:', data.interviews.length)
        console.log('🔍 [FRONTEND] Interview statuses:', data.interviews.map((i: InterviewRequest) => ({ name: i.candidateFirstName, status: i.status })))
        setInterviews(data.interviews)
        const pendingCount = data.interviews.filter((i: InterviewRequest) => i.status === 'pending').length
        console.log('🔍 [FRONTEND] Pending count:', pendingCount)
        setStats(prev => ({ ...prev, pendingInterviews: pendingCount }))
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
    } finally {
      setInterviewsLoading(false)
    }
  }

  async function fetchCompanies() {
    try {
      const response = await fetch('/api/admin/companies')
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  // Load companies on mount
  useEffect(() => {
    fetchCompanies()
  }, [])

  async function handleScheduleInterview() {
    if (!interviewToSchedule) return

    // Validation
    if (!scheduleFormData.scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please provide a scheduled time for the interview.",
        variant: "destructive"
      })
      return
    }

    setScheduling(true)
    try {
      const response = await fetch(`/api/admin/recruitment/interviews/${interviewToSchedule.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledTime: scheduleFormData.scheduledTime,
          meetingLink: scheduleFormData.meetingLink,
          adminNotes: scheduleFormData.adminNotes
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Interview Scheduled!",
          description: `Interview with ${interviewToSchedule.candidateFirstName} has been scheduled.`,
        })
        setScheduleModalOpen(false)
        fetchInterviews() // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to schedule interview')
      }
    } catch (error: any) {
      console.error('Error scheduling interview:', error)
      toast({
        title: "Schedule Failed",
        description: error.message || "Failed to schedule the interview. Please try again.",
        variant: "destructive"
      })
    } finally {
      setScheduling(false)
    }
  }

  async function openHireModal(interview: InterviewRequest) {
    setInterviewToHire(interview)
    setHiring(true) // Show loading state
    
    try {
      // Fetch candidate details from BPOC database to get email
      const bpocResponse = await fetch(`/api/admin/recruitment/candidates/${interview.bpocCandidateId}`)
      let candidateEmail = ''
      let candidatePhone = ''
      let candidatePosition = ''
      
      if (bpocResponse.ok) {
        const bpocData = await bpocResponse.json()
        if (bpocData.success && bpocData.candidate) {
          candidateEmail = bpocData.candidate.email || ''
          candidatePhone = bpocData.candidate.phone || ''
          candidatePosition = bpocData.candidate.position || ''
        }
      }
      
      // Get client's company ID from interview request
      const clientCompanyId = interview.client_users?.company?.id || interview.client_users?.companyId || ''
      
      // Format client preferred start date if it exists
      let preferredStart = ''
      if (interview.clientPreferredStart) {
        const date = new Date(interview.clientPreferredStart)
        preferredStart = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      }
      
      console.log('📋 Pre-filling hire form:', {
        position: candidatePosition,
        companyId: clientCompanyId,
        companyName: interview.client_users?.company?.companyName || interview.company_name,
        preferredStart: preferredStart,
        clientName: interview.client_users?.name || interview.client_name
      })
      
      setHireFormData({
        position: candidatePosition, // Pre-fill from BPOC
        companyId: clientCompanyId, // Pre-fill from client's company
        candidateEmail: candidateEmail, // Pre-fill from BPOC
        candidatePhone: candidatePhone, // Pre-fill from BPOC
        clientPreferredStart: preferredStart // Pre-fill from client's request
      })
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      // Still open modal with empty form if fetch fails
      setHireFormData({
        position: '',
        companyId: '',
        candidateEmail: '',
        candidatePhone: '',
        clientPreferredStart: ''
      })
    } finally {
      setHiring(false)
    }
    
    setHireModalOpen(true)
  }

  async function handleHireCandidate() {
    if (!interviewToHire) return

    // Validation
    if (!hireFormData.position) {
      toast({
        title: "Error",
        description: "Position is required",
        variant: "destructive"
      })
      return
    }

    if (!hireFormData.companyId) {
      toast({
        title: "Error",
        description: "Company is required",
        variant: "destructive"
      })
      return
    }

    if (!hireFormData.candidateEmail) {
      toast({
        title: "Error",
        description: "Candidate email is required",
        variant: "destructive"
      })
      return
    }

    try {
      setHiring(true)

      const response = await fetch('/api/admin/recruitment/interviews/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewRequestId: interviewToHire.id,
          position: hireFormData.position,
          companyId: hireFormData.companyId,
          candidateEmail: hireFormData.candidateEmail,
          candidatePhone: hireFormData.candidatePhone,
          bpocCandidateId: interviewToHire.bpocCandidateId,
          clientPreferredStart: hireFormData.clientPreferredStart // NEW: Client's preferred start date
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Job Offer Sent Successfully! 🎉",
          description: `Offer email has been sent to ${hireFormData.candidateEmail}. Waiting for candidate response.`,
        })

        console.log('📧 Offer acceptance link:', data.offerLink)

        // Refresh interviews list
        await fetchInterviews()

        // Close modal
        setHireModalOpen(false)
        setInterviewToHire(null)
      } else {
        throw new Error(data.error || 'Failed to send job offer')
      }
    } catch (error) {
      console.error('Error sending job offer:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send job offer",
        variant: "destructive"
      })
    } finally {
      setHiring(false)
    }
  }

  // Finalize Hire (consolidated with confirm acceptance)
  async function openConfirmAcceptanceModal(interview: InterviewRequest) {
    setInterviewToConfirm(interview)
    
    // Pre-fill with client's preferred start date if available
    let startDate = ''
    if (interview.clientPreferredStart) {
      const date = new Date(interview.clientPreferredStart)
      startDate = date.toISOString().split('T')[0]
    }
    
    // Fetch candidate email from BPOC database
    let candidateEmail = ''
    try {
      const response = await fetch(`/api/admin/recruitment/candidates/${interview.bpocCandidateId}`)
      if (response.ok) {
        const candidateData = await response.json()
        candidateEmail = candidateData.resume_data?.email || candidateData.resume_data?.contact?.email || ''
        console.log('📧 Pre-filled candidate email:', candidateEmail)
      }
    } catch (error) {
      console.error('Error fetching candidate email:', error)
    }
    
    setConfirmFormData({
      confirmedStartDate: startDate,
      staffEmail: candidateEmail,
      adminNotes: ''
    })
    
    setConfirmAcceptanceModalOpen(true)
  }

  async function handleConfirmAcceptance() {
    if (!interviewToConfirm) return

    // Validation
    if (!confirmFormData.confirmedStartDate) {
      toast({
        title: "Validation Error",
        description: "Please provide a confirmed start date",
        variant: "destructive"
      })
      return
    }

    if (!confirmFormData.staffEmail) {
      toast({
        title: "Validation Error",
        description: "Please provide the staff email address",
        variant: "destructive"
      })
      return
    }

    try {
      setConfirming(true)

      const response = await fetch('/api/admin/recruitment/interviews/confirm-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewRequestId: interviewToConfirm.id,
          bpocCandidateId: interviewToConfirm.bpocCandidateId,
          confirmedStartDate: confirmFormData.confirmedStartDate,
          staffEmail: confirmFormData.staffEmail,
          adminNotes: confirmFormData.adminNotes
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Hire Finalized! 🎉",
          description: `${interviewToConfirm.candidateFirstName} can now sign up using ${confirmFormData.staffEmail} to begin onboarding.`,
        })

        // Refresh interviews list
        await fetchInterviews()

        // Close modal
        setConfirmAcceptanceModalOpen(false)
        setInterviewToConfirm(null)
      } else {
        throw new Error(data.error || 'Failed to finalize hire')
      }
    } catch (error) {
      console.error('Error finalizing hire:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to finalize hire",
        variant: "destructive"
      })
    } finally {
      setConfirming(false)
    }
  }

  // Mark Offer as Declined
  async function openDeclineModal(interview: InterviewRequest) {
    setInterviewToDecline(interview)
    setDeclineReason('')
    setDeclineModalOpen(true)
  }

  async function handleMarkDeclined() {
    if (!interviewToDecline) return

    // Validation
    if (!declineReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the decline",
        variant: "destructive"
      })
      return
    }

    try {
      setDeclining(true)

      const response = await fetch('/api/admin/recruitment/interviews/mark-declined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewRequestId: interviewToDecline.id,
          declineReason: declineReason
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Offer Marked as Declined",
          description: `${interviewToDecline.candidateFirstName} has declined the offer. The interview request has been closed.`,
        })

        // Refresh interviews list
        await fetchInterviews()

        // Close modal
        setDeclineModalOpen(false)
        setInterviewToDecline(null)
      } else {
        throw new Error(data.error || 'Failed to mark as declined')
      }
    } catch (error) {
      console.error('Error marking as declined:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as declined",
        variant: "destructive"
      })
    } finally {
      setDeclining(false)
    }
  }

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const searchLower = candidateSearch.toLowerCase()
    const firstName = c.first_name?.toLowerCase() || ''
    const position = c.position?.toLowerCase() || ''
    const locationCity = c.location_city?.toLowerCase() || ''
    const locationCountry = c.location_country?.toLowerCase() || ''
    const bio = c.bio?.toLowerCase() || ''
    const skills = c.resume_data?.skills || []
    
    return firstName.includes(searchLower) ||
      position.includes(searchLower) ||
      locationCity.includes(searchLower) ||
      locationCountry.includes(searchLower) ||
      bio.includes(searchLower) ||
      skills.some((s: string) => s?.toLowerCase().includes(searchLower))
  })

  // Filter job requests
  const filteredJobs = jobRequests.filter(j =>
    j.job_title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.department?.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.industry?.toLowerCase().includes(jobSearch.toLowerCase())
  )

  // Filter interviews
  const filteredInterviews = (interviews || []).filter(i =>
    (i.candidateFirstName || '')?.toLowerCase().includes(interviewSearch.toLowerCase()) ||
    (i.status || '')?.toLowerCase().includes(interviewSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recruitment Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage candidates, job postings, and interview requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Users className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCandidates}</p>
              <p className="text-sm text-muted-foreground">Total Candidates</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Briefcase className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Calendar className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingInterviews}</p>
              <p className="text-sm text-muted-foreground">Pending Interviews</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <TrendingUp className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalApplications}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
          <Button
            variant={activeTab === 'candidates' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('candidates')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Candidates
            <Badge variant="secondary" className="ml-1">{candidates.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'job-requests' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('job-requests')}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Job Requests
            <Badge variant="secondary" className="ml-1">{jobRequests.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'interviews' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('interviews')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Interviews
            <Badge variant="secondary" className="ml-1">{interviews.length}</Badge>
          </Button>
        </div>

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates by name, role, location, or skills..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {candidatesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading candidates...</div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No candidates found</div>
            ) : (
              <div className="space-y-3">
                {filteredCandidates.map((candidate) => {
                  const location = [candidate.location_city, candidate.location_country].filter(Boolean).join(', ') || 'N/A'
                  const experience = candidate.resume_data?.experience || []
                  const skills = candidate.resume_data?.skills || []
                  
                  return (
                    <div
                      key={candidate.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.avatar_url || undefined} />
                        <AvatarFallback>{candidate.first_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{candidate.first_name || 'Unknown'}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {candidate.position || 'Professional'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {location}
                          </span>
                          {experience.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {experience.length} positions
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {candidate.latest_primary_type && (
                          <Badge className="bg-muted text-foreground border border-border">
                            {candidate.latest_primary_type}
                          </Badge>
                        )}
                        {candidate.overall_score > 0 && (
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <Star className="h-4 w-4" />
                            <span className="font-semibold">{candidate.overall_score}</span>
                          </div>
                        )}
                        {skills.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {skills.length} skills
                          </Badge>
                        )}
                      </div>

                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Job Requests Tab */}
        {activeTab === 'job-requests' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job requests by title, department, or industry..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {jobsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading job requests...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No job requests found</div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="p-3 bg-muted rounded-lg">
                      <Briefcase className="h-6 w-6 text-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{job.job_title}</h3>
                        <Badge className={
                          job.status === 'active' 
                            ? 'bg-green-600 text-white border border-green-500' 
                            : 'bg-muted text-foreground border border-border'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {job.department || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.work_arrangement}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.work_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {job.currency} {job.salary_min} - {job.salary_max}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          👁️ {job.views} views
                        </span>
                        <span className="text-xs text-muted-foreground">
                          📝 {job.applicants} applicants
                        </span>
                        <span className="text-xs text-muted-foreground">
                          📅 {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-300">
                      {interviews.filter(i => i.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-400">Offers Pending</p>
                    <p className="text-2xl font-bold text-orange-300">
                      {interviews.filter(i => {
                        const s = i.status.toLowerCase().replace(/_/g, '-')
                        return ['hire-requested', 'offer-sent'].includes(s)
                      }).length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-orange-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-400">Offer Accepted</p>
                    <p className="text-2xl font-bold text-green-300">
                      {interviews.filter(i => i.status === 'offer-accepted').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-400">Completed</p>
                    <p className="text-2xl font-bold text-blue-300">
                      {interviews.filter(i => i.status === 'completed').length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-400">Hired</p>
                    <p className="text-2xl font-bold text-purple-300">
                      {interviews.filter(i => i.status === 'hired').length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-purple-400/70" />
                </div>
              </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search interviews by candidate name or status..."
                  value={interviewSearch}
                  onChange={(e) => setInterviewSearch(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700/50 text-foreground placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Interview Cards */}
            {interviewsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading interviews...</div>
            ) : filteredInterviews.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Interview Requests</h3>
                <p className="text-muted-foreground">
                  Interview requests from clients will appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredInterviews.map((interview) => {
                  // Normalize status to lowercase for comparison
                  const status = interview.status.toLowerCase().replace(/_/g, '-')
                  
                  return (
                  <Card key={interview.id} className="p-6 hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between gap-4">
                      
                      {/* Left: Candidate Info */}
                      <div className="flex-1 space-y-4">
                        
                        {/* Header */}
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <UserCheck className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-xl font-semibold text-foreground">{interview.candidateFirstName}</h3>
                              <Badge className={
                                status === 'pending' 
                                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30'
                                  : status === 'scheduled'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
                                  : status === 'hire-requested'
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30'
                                  : status === 'offer-sent'
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30'
                                  : status === 'offer-accepted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                                  : status === 'offer-declined'
                                  ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                                  : status === 'hired'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                                  : status === 'completed'
                                  ? 'bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                              }>
                                {status.toUpperCase().replace(/-/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Requested: {new Date(interview.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Status Message Box */}
                        <div className={`rounded-lg p-4 border-l-4 ${
                          status === 'pending'
                            ? 'bg-yellow-500/10 border-l-yellow-500'
                            : status === 'scheduled'
                            ? 'bg-blue-500/10 border-l-blue-500'
                            : status === 'hire-requested'
                            ? 'bg-orange-500/10 border-l-orange-500'
                            : status === 'offer-sent'
                            ? 'bg-indigo-500/10 border-l-indigo-500'
                            : status === 'offer-accepted'
                            ? 'bg-emerald-500/10 border-l-emerald-500'
                            : status === 'offer-declined'
                            ? 'bg-red-500/10 border-l-red-500'
                            : status === 'hired'
                            ? 'bg-purple-500/10 border-l-purple-500'
                            : status === 'completed'
                            ? 'bg-green-500/10 border-l-green-500'
                            : 'bg-gray-500/10 border-l-gray-500'
                        }`}>
                          {status === 'pending' && (
                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-yellow-300">Action Required</p>
                                <p className="text-sm text-yellow-400/80 mt-1">
                                  Coordinate with the candidate to schedule this interview. Click "Schedule" to set a time.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'scheduled' && (
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-blue-300">Interview Scheduled</p>
                                <p className="text-sm text-blue-400/80 mt-1">
                                  Interview has been scheduled. Waiting for completion.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'hire-requested' && (
                            <div className="flex items-start gap-3">
                              <UserCheck className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-orange-300">Client Wants to Hire! 🎯</p>
                                <p className="text-sm text-orange-400/80 mt-1">
                                  Client has requested to hire this candidate. Click "Send Offer" to proceed.
                                </p>
                                {interview.clientPreferredStart && (
                                  <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                    <p className="text-xs font-medium text-orange-300 mb-1">Client's Preferred Start Date:</p>
                                    <p className="text-sm font-semibold text-orange-200">
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
                          )}
                          {status === 'offer-sent' && (
                            <div className="flex items-start gap-3">
                              <Mail className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-indigo-300">Job Offer Sent 📧</p>
                                <p className="text-sm text-indigo-400/80 mt-1">
                                  Job offer has been sent to candidate. Waiting for their response.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'offer-accepted' && (
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-emerald-300">Offer Accepted! 🎉</p>
                                <p className="text-sm text-emerald-400/80 mt-1">
                                  Candidate has accepted the job offer! Waiting for them to create account and complete onboarding.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'offer-declined' && (
                            <div className="flex items-start gap-3">
                              <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-red-300">Offer Declined</p>
                                <p className="text-sm text-red-400/80 mt-1">
                                  Candidate has declined the job offer. You may close this request.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'hired' && (
                            <div className="flex items-start gap-3">
                              <UserCheck className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-purple-300">Candidate Hired! 🎉</p>
                                <p className="text-sm text-purple-400/80 mt-1">
                                  Candidate has created their account and started onboarding. They are now part of the team!
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'completed' && (
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-green-300">Interview Complete</p>
                                <p className="text-sm text-green-400/80 mt-1">
                                  Interview completed. Ready to send job offer when you're ready.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Preferred Interview Times - Only show before hiring stage */}
                        {(status === 'pending' || status === 'scheduled' || status === 'completed') && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Client's Preferred Interview Times:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const times = interview.preferredTimes || interview.preferred_times || [];
                                const timesArray = Array.isArray(times) ? times : (typeof times === 'string' ? JSON.parse(times) : []);
                                return timesArray.map((time, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/50">
                                    {new Date(time).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Badge>
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Client Notes */}
                        {interview.client_notes && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Client Notes:</span>
                            </div>
                            <p className="text-sm bg-muted/50 p-3 rounded border">
                              {interview.client_notes}
                            </p>
                          </div>
                        )}

                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedInterview(interview)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full
                        </Button>
                        {status === 'pending' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setInterviewToSchedule(interview)
                              setScheduleFormData({
                                scheduledTime: '',
                                meetingLink: '',
                                adminNotes: ''
                              })
                              setScheduleModalOpen(true)
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule
                          </Button>
                        )}
                        {/* Show "Send Offer" button for completed interviews or hire-requested */}
                        {(status === 'completed' || status === 'hire-requested') && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              openHireModal(interview)
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Offer
                          </Button>
                        )}
                        {/* Show "Finalize Hire" and "Mark Declined" buttons for offer-sent */}
                        {status === 'offer-sent' && (
                          <div className="flex gap-2 w-full">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                openConfirmAcceptanceModal(interview)
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Finalize Hire
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeclineModal(interview)
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark Declined
                            </Button>
                          </div>
                        )}
                      </div>

                    </div>
                  </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Candidate Detail Modal */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedCandidate.avatar_url || undefined} />
                  <AvatarFallback>{selectedCandidate.first_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedCandidate.first_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground">{selectedCandidate.position || 'Professional'}</p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedCandidate.location_city, selectedCandidate.location_country].filter(Boolean).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedCandidate.bio && (
                <div>
                  <label className="text-sm text-muted-foreground">Bio</label>
                  <p className="text-foreground">{selectedCandidate.bio}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {selectedCandidate.resume_data?.experience && (
                  <div>
                    <label className="text-sm text-muted-foreground">Experience</label>
                    <p className="text-foreground font-medium">{selectedCandidate.resume_data.experience.length} positions</p>
                  </div>
                )}
                {selectedCandidate.latest_primary_type && (
                  <div>
                    <label className="text-sm text-muted-foreground">DISC Type</label>
                    <p className="text-foreground font-medium">{selectedCandidate.latest_primary_type}</p>
                  </div>
                )}
                {selectedCandidate.overall_score > 0 && (
                  <div>
                    <label className="text-sm text-muted-foreground">Overall Score</label>
                    <p className="text-foreground font-medium">{selectedCandidate.overall_score}</p>
                  </div>
                )}
              </div>

              {selectedCandidate.resume_data?.skills && selectedCandidate.resume_data.skills.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCandidate.resume_data.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-muted text-foreground border border-border">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Request Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedJob.job_title}</h3>
                <Badge className={
                  selectedJob.status === 'active' 
                    ? 'bg-green-600 text-white border border-green-500' 
                    : 'bg-muted text-foreground border border-border'
                }>
                  {selectedJob.status}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground">Department</label>
                  <p className="text-foreground font-medium">{selectedJob.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Industry</label>
                  <p className="text-foreground font-medium">{selectedJob.industry || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Work Type</label>
                  <p className="text-foreground font-medium">{selectedJob.work_type}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Work Arrangement</label>
                  <p className="text-foreground font-medium">{selectedJob.work_arrangement}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Experience Level</label>
                  <p className="text-foreground font-medium">{selectedJob.experience_level}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Salary Range</label>
                  <p className="text-foreground font-medium">
                    {selectedJob.currency} {selectedJob.salary_min} - {selectedJob.salary_max}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <p className="text-foreground mt-1">{selectedJob.job_description}</p>
              </div>

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Required Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedJob.skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-muted text-foreground border border-border">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>👁️ {selectedJob.views} views</span>
                <span>📝 {selectedJob.applicants} applicants</span>
                <span>📅 Posted {new Date(selectedJob.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Interview Detail Modal */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interview Request Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">{selectedInterview.candidateFirstName}</h3>
                <Badge className={
                  selectedInterview.status === 'pending' 
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : selectedInterview.status === 'scheduled'
                    ? 'bg-green-600 text-white border border-green-500'
                    : 'bg-muted text-foreground border border-border'
                }>
                  {selectedInterview.status}
                </Badge>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Candidate ID</label>
                <p className="text-foreground font-mono text-sm">{selectedInterview.bpoc_candidate_id}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Preferred Interview Times</label>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {(() => {
                    const times = selectedInterview.preferredTimes || selectedInterview.preferred_times || [];
                    const timesArray = Array.isArray(times) ? times : (typeof times === 'string' ? JSON.parse(times) : []);
                    return timesArray.map((time, idx) => (
                      <li key={idx} className="text-foreground">{new Date(time).toLocaleString()}</li>
                    ));
                  })()}
                </ul>
              </div>

              {selectedInterview.client_notes && (
                <div>
                  <label className="text-sm text-muted-foreground">Client Notes</label>
                  <p className="text-foreground mt-1">{selectedInterview.client_notes}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Request Date</label>
                <p className="text-foreground">{new Date(selectedInterview.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Job Offer Modal */}
      <Dialog open={hireModalOpen} onOpenChange={setHireModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Send Job Offer
            </DialogTitle>
          </DialogHeader>
          {interviewToHire && (
            <div className="space-y-6">
              {/* Client Company Information */}
              {interviewToHire.client_users?.company && (
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    {interviewToHire.client_users.company.logo ? (
                      <img 
                        src={interviewToHire.client_users.company.logo} 
                        alt={interviewToHire.client_users.company.companyName}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-blue-500/50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-500/50">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Hiring Company</p>
                      <h3 className="text-lg font-bold text-foreground">{interviewToHire.client_users.company.companyName}</h3>
                      <p className="text-sm text-muted-foreground">Client: {interviewToHire.client_users.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Candidate Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{interviewToHire.candidateFirstName}</span></p>
                  <p><span className="text-muted-foreground">BPOC ID:</span> <span className="text-foreground font-mono text-xs">{interviewToHire.bpocCandidateId}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position / Job Title *</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Customer Service Representative"
                    value={hireFormData.position}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Assign to Company *</Label>
                  {interviewToHire?.client_users?.company ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        ✓ {interviewToHire.client_users.company.companyName}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Pre-selected from client's hire request
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={hireFormData.companyId}
                      onValueChange={(value) => setHireFormData(prev => ({ ...prev, companyId: value }))}
                    >
                      <SelectTrigger id="company">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="candidateEmail">Candidate Email *</Label>
                  <Input
                    id="candidateEmail"
                    type="email"
                    placeholder="candidate@example.com"
                    value={hireFormData.candidateEmail}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Job offer will be sent to this email</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="candidatePhone">Candidate Phone (Optional)</Label>
                  <Input
                    id="candidatePhone"
                    type="tel"
                    placeholder="+63 XXX XXX XXXX"
                    value={hireFormData.candidatePhone}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, candidatePhone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPreferredStart">Preferred Start Date (Optional)</Label>
                  <Input
                    id="clientPreferredStart"
                    type="date"
                    value={hireFormData.clientPreferredStart}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, clientPreferredStart: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the client's preferred start date. The final start date will be negotiated with the candidate.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-2">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Next Steps</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      After sending the offer, the candidate will receive an email with details. They can accept or decline the offer.
                      Once accepted, they'll receive a signup link to create their account and complete onboarding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleHireCandidate}
                  disabled={hiring}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {hiring ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending Offer...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Job Offer to Candidate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setHireModalOpen(false)}
                  disabled={hiring}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-100">
              Schedule Interview with {interviewToSchedule?.candidateFirstName}
            </DialogTitle>
          </DialogHeader>

          {interviewToSchedule && (
            <div className="space-y-4">
              {/* Client's Preferred Times */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <p className="text-sm font-medium text-blue-300 mb-2">Client's Preferred Times:</p>
                <div className="space-y-1">
                  {interviewToSchedule.preferredTimes.map((time, idx) => (
                    <p key={idx} className="text-xs text-blue-400/80">
                      • {new Date(time).toLocaleString()}
                    </p>
                  ))}
                </div>
                {interviewToSchedule.clientNotes && (
                  <p className="text-xs text-blue-400/60 mt-2 italic">
                    Note: {interviewToSchedule.clientNotes}
                  </p>
                )}
              </div>

              {/* Scheduled Time */}
              <div className="space-y-2">
                <Label htmlFor="scheduledTime" className="text-sm font-medium text-slate-200">
                  Scheduled Time *
                </Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={scheduleFormData.scheduledTime}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  required
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              {/* Meeting Link */}
              <div className="space-y-2">
                <Label htmlFor="meetingLink" className="text-sm font-medium text-slate-200">
                  Meeting Link (Optional)
                </Label>
                <Input
                  id="meetingLink"
                  type="url"
                  value={scheduleFormData.meetingLink}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes" className="text-sm font-medium text-slate-200">
                  Internal Notes (Optional)
                </Label>
                <Textarea
                  id="adminNotes"
                  value={scheduleFormData.adminNotes}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Any internal notes about this interview..."
                  rows={3}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleScheduleInterview}
                  disabled={scheduling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {scheduling ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Confirm Schedule
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={scheduling}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Finalize Hire Modal (consolidated) */}
      <Dialog open={confirmAcceptanceModalOpen} onOpenChange={setConfirmAcceptanceModalOpen}>
        <DialogContent className="bg-slate-900 text-slate-100 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Finalize Hire & Create Staff Account
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Candidate has accepted the offer! Finalize the hire by confirming the start date and email for onboarding.
            </DialogDescription>
          </DialogHeader>

          {interviewToConfirm && (
            <div className="space-y-6 py-4">
              {/* Success Message */}
              <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-lg">
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-300">Candidate: {interviewToConfirm.candidateFirstName} 🎉</p>
                    <p className="text-xs text-emerald-400/80">
                      The candidate has accepted the job offer! Complete the details below to finalize the hire.
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmed Start Date */}
              <div className="space-y-2">
                <Label htmlFor="confirmedStartDate" className="text-slate-200 font-medium">
                  Confirmed Start Date *
                </Label>
                <Input
                  id="confirmedStartDate"
                  type="date"
                  value={confirmFormData.confirmedStartDate}
                  onChange={(e) => setConfirmFormData({ ...confirmFormData, confirmedStartDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
                <p className="text-xs text-slate-400">
                  Pre-filled from client's preferred date. Update if candidate requested a different date.
                </p>
              </div>

              {/* Staff Email */}
              <div className="space-y-2">
                <Label htmlFor="staffEmail" className="text-slate-200 font-medium">
                  Staff Email Address *
                </Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={confirmFormData.staffEmail}
                  onChange={(e) => setConfirmFormData({ ...confirmFormData, staffEmail: e.target.value })}
                  placeholder="staff@example.com"
                  className="bg-slate-800 border-slate-700 text-slate-100 font-medium placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-400">
                  Pre-filled from candidate's BPOC profile. This email will be used for staff signup and onboarding.
                </p>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="confirmNotes" className="text-slate-200 font-medium">
                  Admin Notes (Optional)
                </Label>
                <Textarea
                  id="confirmNotes"
                  placeholder="E.g., Spoke with candidate on phone, they're excited to start..."
                  value={confirmFormData.adminNotes}
                  onChange={(e) => setConfirmFormData({ ...confirmFormData, adminNotes: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100 min-h-[100px]"
                />
              </div>

              {/* What Happens Next Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <div className="flex gap-2">
                  <UserCheck className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-300">What Happens Next?</p>
                    <ul className="text-xs text-blue-400/80 space-y-1 list-disc list-inside">
                      <li>Job acceptance record will be created/updated</li>
                      <li>Interview status will be updated to "HIRED"</li>
                      <li>Staff member can create their account using <strong className="text-blue-300">{confirmFormData.staffEmail}</strong></li>
                      <li>When they sign up, their profile will auto-populate from BPOC data</li>
                      <li>They'll be automatically assigned to the correct company</li>
                      <li>Contract signing & onboarding process will begin</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmAcceptance}
                  disabled={confirming || !confirmFormData.confirmedStartDate || !confirmFormData.staffEmail}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {confirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finalizing Hire...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalize Hire & Prepare Onboarding
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAcceptanceModalOpen(false)}
                  disabled={confirming}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Declined Modal */}
      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent className="bg-slate-900 text-slate-100 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-400">
              ❌ Mark Offer as Declined
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Record why the candidate declined the offer
            </DialogDescription>
          </DialogHeader>

          {interviewToDecline && (
            <div className="space-y-6 py-4">
              {/* Candidate Info */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h3 className="font-semibold text-red-300 mb-2">Candidate: {interviewToDecline.candidateFirstName}</h3>
                <p className="text-sm text-slate-300">
                  Document the reason for declining so the team understands what happened.
                </p>
              </div>

              {/* Decline Reason */}
              <div className="space-y-2">
                <Label htmlFor="declineReason" className="text-slate-200 font-medium">
                  Reason for Declining *
                </Label>
                <Textarea
                  id="declineReason"
                  placeholder="E.g., Accepted another job offer, Personal circumstances changed, Salary expectations not met..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 min-h-[120px]"
                  required
                />
              </div>

              {/* Quick Reason Buttons */}
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Quick reasons:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Candidate accepted another job offer')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Accepted Another Job
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Personal circumstances changed')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Personal Circumstances
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Salary/compensation not acceptable')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Salary Issues
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Location/remote work requirements not met')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Location Issues
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleMarkDeclined}
                  disabled={declining || !declineReason.trim()}
                  className="flex-1"
                >
                  {declining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Marking as Declined...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark as Declined
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeclineModalOpen(false)}
                  disabled={declining}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

