"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  CreditCard,
  FileText,
  PenTool,
  Users,
  ArrowLeft
} from "lucide-react"

interface OnboardingData {
  // Personal Info
  firstName: string
  middleName: string
  lastName: string
  gender: string
  civilStatus: string
  dateOfBirth: string
  contactNo: string
  email: string
  
  // Gov IDs
  sss: string
  tin: string
  philhealthNo: string
  pagibigNo: string
  
  // Documents
  validIdUrl: string
  birthCertUrl: string
  nbiClearanceUrl: string
  birForm2316Url: string
  idPhotoUrl: string
  signatureUrl: string
  policeClearanceUrl: string
  certificateEmpUrl: string
  sssDocUrl: string
  tinDocUrl: string
  philhealthDocUrl: string
  pagibigDocUrl: string
  
  // Emergency Contact
  emergencyContactName: string
  emergencyContactNo: string
  emergencyRelationship: string
  
  // Status
  personalInfoStatus: string
  govIdStatus: string
  documentsStatus: string
  signatureStatus: string
  emergencyContactStatus: string
  
  // Feedback
  personalInfoFeedback: string
  govIdFeedback: string
  documentsFeedback: string
  signatureFeedback: string
  emergencyContactFeedback: string
  
  completionPercent: number
  isComplete: boolean
}

export default function AdminOnboardingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const staffUserId = params.staffUserId as string

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [staff, setStaff] = useState<any>(null)
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchOnboardingDetails()
  }, [staffUserId])

  const fetchOnboardingDetails = async () => {
    try {
      const response = await fetch(`/api/admin/staff/onboarding/${staffUserId}`)
      if (!response.ok) throw new Error("Failed to fetch onboarding details")
      
      const data = await response.json()
      setStaff(data.staff)
      setOnboarding(data.onboarding)
    } catch (err) {
      setError("Failed to load onboarding details")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (section: string, action: "APPROVED" | "REJECTED") => {
    setProcessing(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`/api/admin/staff/onboarding/${staffUserId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          action,
          feedback: feedback[section] || ""
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to verify")
      }
      
      setSuccess(`Section ${action.toLowerCase()} successfully!`)
      setFeedback({ ...feedback, [section]: "" })
      await fetchOnboardingDetails()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!confirm("Complete this staff member's onboarding? This will create their profile and work schedule.")) {
      return
    }
    
    setCompleting(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`/api/admin/staff/onboarding/${staffUserId}/complete`, {
        method: "POST"
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to complete")
      }
      
      setSuccess("Onboarding completed! Profile and work schedule created.")
      await fetchOnboardingDetails()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED") {
      return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
    } else if (status === "REJECTED") {
      return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    } else if (status === "SUBMITTED") {
      return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>
    } else {
      return <Badge variant="outline" className="border-slate-500 text-slate-500">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!onboarding) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No onboarding data found for this staff member.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/admin/staff/onboarding")}
            variant="ghost"
            className="text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {staff?.name}
              </h1>
              <p className="text-slate-400">{staff?.email}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white mb-1">
                {onboarding.completionPercent}%
              </div>
              <p className="text-slate-400 text-sm">Complete</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-900/50 border-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Complete Onboarding Button */}
        {onboarding.completionPercent === 100 && !onboarding.isComplete && (
          <Card className="mb-6 bg-green-900/30 border-green-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    All Sections Approved!
                  </h3>
                  <p className="text-sm text-slate-300">
                    Ready to complete onboarding and create staff profile
                  </p>
                </div>
                <Button
                  onClick={handleCompleteOnboarding}
                  disabled={completing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {completing ? "Processing..." : "Complete Onboarding"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 1: Personal Information */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Personal Information</CardTitle>
              </div>
              {getStatusBadge(onboarding.personalInfoStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-400">Full Name</p>
                <p className="text-white">
                  {onboarding.firstName} {onboarding.middleName} {onboarding.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Gender</p>
                <p className="text-white">{onboarding.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Civil Status</p>
                <p className="text-white">{onboarding.civilStatus || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Date of Birth</p>
                <p className="text-white">
                  {onboarding.dateOfBirth 
                    ? new Date(onboarding.dateOfBirth).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Contact Number</p>
                <p className="text-white">{onboarding.contactNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white">{onboarding.email || "N/A"}</p>
              </div>
            </div>

            {onboarding.personalInfoFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <strong>Feedback:</strong> {onboarding.personalInfoFeedback}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.personalInfoStatus !== "APPROVED" && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add feedback (optional)"
                  value={feedback.personalInfo || ""}
                  onChange={(e) => setFeedback({ ...feedback, personalInfo: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVerify("personalInfo", "APPROVED")}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerify("personalInfo", "REJECTED")}
                    disabled={processing}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Government IDs */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Government IDs</CardTitle>
              </div>
              {getStatusBadge(onboarding.govIdStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-400">SSS Number</p>
                <p className="text-white font-mono">{onboarding.sss || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">TIN</p>
                <p className="text-white font-mono">{onboarding.tin || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">PhilHealth No</p>
                <p className="text-white font-mono">{onboarding.philhealthNo || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Pag-IBIG No</p>
                <p className="text-white font-mono">{onboarding.pagibigNo || "Not provided"}</p>
              </div>
            </div>

            {onboarding.govIdFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <strong>Feedback:</strong> {onboarding.govIdFeedback}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.govIdStatus !== "APPROVED" && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add feedback (optional)"
                  value={feedback.govId || ""}
                  onChange={(e) => setFeedback({ ...feedback, govId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVerify("govId", "APPROVED")}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerify("govId", "REJECTED")}
                    disabled={processing}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Documents */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Required Documents</CardTitle>
              </div>
              {getStatusBadge(onboarding.documentsStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-slate-400">
                Document upload functionality will be added in the next phase.
              </p>
            </div>

            {onboarding.documentsFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <strong>Feedback:</strong> {onboarding.documentsFeedback}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.documentsStatus !== "APPROVED" && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add feedback (optional)"
                  value={feedback.documents || ""}
                  onChange={(e) => setFeedback({ ...feedback, documents: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVerify("documents", "APPROVED")}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerify("documents", "REJECTED")}
                    disabled={processing}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Signature */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PenTool className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Signature</CardTitle>
              </div>
              {getStatusBadge(onboarding.signatureStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Signature upload functionality will be added in the next phase.
            </p>

            {onboarding.signatureFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <strong>Feedback:</strong> {onboarding.signatureFeedback}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.signatureStatus !== "APPROVED" && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add feedback (optional)"
                  value={feedback.signature || ""}
                  onChange={(e) => setFeedback({ ...feedback, signature: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVerify("signature", "APPROVED")}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerify("signature", "REJECTED")}
                    disabled={processing}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Emergency Contact */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Emergency Contact</CardTitle>
              </div>
              {getStatusBadge(onboarding.emergencyContactStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-400">Contact Name</p>
                <p className="text-white">{onboarding.emergencyContactName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Relationship</p>
                <p className="text-white">{onboarding.emergencyRelationship || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Contact Number</p>
                <p className="text-white">{onboarding.emergencyContactNo || "Not provided"}</p>
              </div>
            </div>

            {onboarding.emergencyContactFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <strong>Feedback:</strong> {onboarding.emergencyContactFeedback}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.emergencyContactStatus !== "APPROVED" && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add feedback (optional)"
                  value={feedback.emergencyContact || ""}
                  onChange={(e) => setFeedback({ ...feedback, emergencyContact: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVerify("emergencyContact", "APPROVED")}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerify("emergencyContact", "REJECTED")}
                    disabled={processing}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

