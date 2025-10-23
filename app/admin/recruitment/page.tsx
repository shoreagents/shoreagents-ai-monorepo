"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Zap
} from "lucide-react"

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
  client_user_id: string
  bpoc_candidate_id: string
  candidate_first_name: string
  preferred_times: string[]
  client_notes: string | null
  status: string
  created_at: string
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
  
  // Stats
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeJobs: 0,
    pendingInterviews: 0,
    totalApplications: 0
  })

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
        setInterviews(data.interviews)
        const pendingCount = data.interviews.filter((i: InterviewRequest) => i.status === 'pending').length
        setStats(prev => ({ ...prev, pendingInterviews: pendingCount }))
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
    } finally {
      setInterviewsLoading(false)
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
  const filteredInterviews = interviews.filter(i =>
    i.candidate_first_name.toLowerCase().includes(interviewSearch.toLowerCase()) ||
    i.status.toLowerCase().includes(interviewSearch.toLowerCase())
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interviews by candidate name or status..."
                  value={interviewSearch}
                  onChange={(e) => setInterviewSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {interviewsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading interviews...</div>
            ) : filteredInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No interview requests found</div>
            ) : (
              <div className="space-y-3">
                {filteredInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedInterview(interview)}
                  >
                    <div className="p-3 bg-muted rounded-lg">
                      <Calendar className="h-6 w-6 text-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{interview.candidate_first_name}</h3>
                        <Badge className={
                          interview.status === 'pending' 
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : interview.status === 'scheduled'
                            ? 'bg-green-600 text-white border border-green-500'
                            : 'bg-muted text-foreground border border-border'
                        }>
                          {interview.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Preferred Times:</p>
                        <ul className="list-disc list-inside mt-1">
                          {interview.preferred_times.map((time, idx) => (
                            <li key={idx}>{new Date(time).toLocaleString()}</li>
                          ))}
                        </ul>
                      </div>
                      {interview.client_notes && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium text-foreground">Notes:</p>
                          <p className="text-muted-foreground">{interview.client_notes}</p>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Requested: {new Date(interview.created_at).toLocaleString()}
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
                <h3 className="text-xl font-bold text-foreground">{selectedInterview.candidate_first_name}</h3>
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
                  {selectedInterview.preferred_times.map((time, idx) => (
                    <li key={idx} className="text-foreground">{new Date(time).toLocaleString()}</li>
                  ))}
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
    </div>
  )
}

