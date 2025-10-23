"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  CreditCard, 
  FileText, 
  PenTool, 
  Users, 
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2,
  Pencil,
  Eraser,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Shield
} from "lucide-react"

const STEPS = [
  { id: 1, name: "Personal Info", icon: User, field: "personalInfoStatus" },
  { id: 2, name: "Resume", icon: Briefcase, field: "resumeStatus" },
  { id: 3, name: "Government IDs & Documents", icon: CreditCard, field: "govIdStatus" },
  { id: 4, name: "Education Documents", icon: GraduationCap, field: "educationStatus" },
  { id: 5, name: "Medical Certificate", icon: Stethoscope, field: "medicalStatus" },
  { id: 6, name: "Data Privacy & Bank", icon: Shield, field: "dataPrivacyStatus" },
  { id: 7, name: "Signature", icon: PenTool, field: "signatureStatus" },
  { id: 8, name: "Emergency Contact", icon: Users, field: "emergencyContactStatus" },
]

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
  policeClearanceUrl: string
  idPhotoUrl: string
  signatureUrl: string
  sssDocUrl: string
  tinDocUrl: string
  philhealthDocUrl: string
  pagibigDocUrl: string
  birForm2316Url: string
  certificateEmpUrl: string
  
  // Emergency Contact
  emergencyContactName: string
  emergencyContactNo: string
  emergencyRelationship: string
  
  // NEW: Resume, Medical, Education, Data Privacy
  resumeUrl?: string
  resumeStatus: string
  resumeFeedback?: string
  
  medicalCertUrl?: string
  medicalStatus: string
  medicalFeedback?: string
  
  diplomaTorUrl?: string
  educationStatus: string
  educationFeedback?: string
  
  dataPrivacyConsentUrl?: string
  bankAccountDetails?: string
  dataPrivacyStatus: string
  dataPrivacyFeedback?: string
  
  // Status
  personalInfoStatus: string
  govIdStatus: string
  documentsStatus: string
  signatureStatus: string
  emergencyContactStatus: string
  completionPercent: number
  
  // Feedback
  personalInfoFeedback?: string
  govIdFeedback?: string
  documentsFeedback?: string
  signatureFeedback?: string
  emergencyContactFeedback?: string
}

interface UploadingState {
  [key: string]: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploading, setUploading] = useState<UploadingState>({})
  const [viewFileModal, setViewFileModal] = useState<{ url: string; title: string } | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  
  const [formData, setFormData] = useState<Partial<OnboardingData>>({})
  
  // Signature drawing states
  const [isDrawMode, setIsDrawMode] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureImageLoading, setSignatureImageLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // NEW: States for new onboarding steps
  const [nearbyClinics, setNearbyClinics] = useState<any[]>([])
  const [privacyData, setPrivacyData] = useState({
    dataPrivacyConsent: false,
    bankName: '',
    accountName: '',
    accountNumber: ''
  })

  useEffect(() => {
    fetchOnboardingData()
  }, [])

  // Initialize canvas with white background when draw mode is activated
  useEffect(() => {
    if (isDrawMode && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Clear any existing drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Fill with white background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [isDrawMode])

  // Clear messages when step changes
  useEffect(() => {
    setError("")
    setSuccess("")
  }, [currentStep])

  // Reset image loading when modal opens/closes
  useEffect(() => {
    if (viewFileModal) {
      setImageLoading(true)
    }
  }, [viewFileModal])

  // Reset signature image loading when signature URL changes
  useEffect(() => {
    if (formData.signatureUrl) {
      setSignatureImageLoading(true)
    }
  }, [formData.signatureUrl])

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch("/api/onboarding")
      if (!response.ok) throw new Error("Failed to fetch onboarding data")
      
      const data = await response.json()
      if (data.onboarding) {
        const onboardingData = {
          ...data.onboarding,
          dateOfBirth: data.onboarding.dateOfBirth 
            ? new Date(data.onboarding.dateOfBirth).toISOString().split('T')[0]
            : ""
        }
        setFormData(onboardingData)
        
        // Determine which step the user should be on based on their progress
        const { personalInfoStatus, govIdStatus, documentsStatus, signatureStatus, emergencyContactStatus } = data.onboarding
        
        if (personalInfoStatus !== "APPROVED" && personalInfoStatus !== "SUBMITTED") {
          setCurrentStep(1)
        } else if (govIdStatus !== "APPROVED" && govIdStatus !== "SUBMITTED") {
          setCurrentStep(2)
        } else if (documentsStatus !== "APPROVED" && documentsStatus !== "SUBMITTED") {
          setCurrentStep(3)
        } else if (signatureStatus !== "APPROVED" && signatureStatus !== "SUBMITTED") {
          setCurrentStep(4)
        } else if (emergencyContactStatus !== "APPROVED" && emergencyContactStatus !== "SUBMITTED") {
          setCurrentStep(5)
        } else {
          // All steps completed, stay on last step
          setCurrentStep(5)
        }
      }
    } catch (err) {
      setError("Failed to load onboarding data")
    } finally {
      setLoading(false)
    }
  }

  const handlePersonalInfoSubmit = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch("/api/onboarding/personal-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          gender: formData.gender,
          civilStatus: formData.civilStatus,
          dateOfBirth: formData.dateOfBirth,
          contactNo: formData.contactNo,
          email: formData.email
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save")
      }
      
      setSuccess("Personal information saved!")
      await fetchOnboardingData()
      setTimeout(() => setCurrentStep(2), 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // NEW: Resume upload handler
  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading({ ...uploading, resume: true })
    setError("")

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/onboarding/resume', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setSuccess('Resume uploaded successfully!')
      await fetchOnboardingData()
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume')
    } finally {
      setUploading({ ...uploading, resume: false })
    }
  }

  // NEW: Education upload handler
  async function handleEducationUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading({ ...uploading, education: true })
    setError("")

    try {
      const formData = new FormData()
      formData.append('education', file)

      const response = await fetch('/api/onboarding/education', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setSuccess('Education document uploaded successfully!')
      await fetchOnboardingData()
    } catch (err: any) {
      setError(err.message || 'Failed to upload education document')
    } finally {
      setUploading({ ...uploading, education: false })
    }
  }

  // NEW: Medical upload handler
  async function handleMedicalUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading({ ...uploading, medical: true })
    setError("")

    try {
      const formData = new FormData()
      formData.append('medical', file)

      const response = await fetch('/api/onboarding/medical', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setSuccess('Medical certificate uploaded successfully!')
      await fetchOnboardingData()
    } catch (err: any) {
      setError(err.message || 'Failed to upload medical certificate')
    } finally {
      setUploading({ ...uploading, medical: false })
    }
  }

  // NEW: Data privacy and bank details handler
  async function handleSaveDataPrivacy() {
    setSaving(true)
    setError("")

    try {
      const response = await fetch('/api/onboarding/data-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacyData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save')
      }

      setSuccess('Data privacy consent and bank details saved!')
      setTimeout(() => setCurrentStep(currentStep + 1), 1000)
      await fetchOnboardingData()
    } catch (err: any) {
      setError(err.message || 'Failed to save data privacy consent')
    } finally {
      setSaving(false)
    }
  }

  // NEW: Fetch nearby clinics on mount
  useEffect(() => {
    async function fetchNearbyClinics() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch(`/api/clinics/nearby?lat=${latitude}&lng=${longitude}`)
            const data = await response.json()
            if (data.success) {
              setNearbyClinics(data.clinics)
            }
          } catch (error) {
            console.error('Error fetching clinics:', error)
          }
        })
      }
    }
    fetchNearbyClinics()
  }, [])

  const handleGovIdsSubmit = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    
    try {
      // First save the government IDs
      const response = await fetch("/api/onboarding/gov-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sss: formData.sss,
          tin: formData.tin,
          philhealthNo: formData.philhealthNo,
          pagibigNo: formData.pagibigNo
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save")
      }
      
      setSuccess("Government IDs saved!")
      await fetchOnboardingData()
      setTimeout(() => setCurrentStep(3), 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEmergencyContactSubmit = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error("⏰ Save timeout after 30 seconds")
      setError("Save is taking too long. Please check your connection and try again.")
      setSaving(false)
    }, 30000) // 30 second timeout
    
    try {
      console.log("📝 Saving emergency contact...")
      console.log("Data:", {
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNo: formData.emergencyContactNo,
        emergencyRelationship: formData.emergencyRelationship
      })
      
      const response = await fetch("/api/onboarding/emergency-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyContactName: formData.emergencyContactName,
          emergencyContactNo: formData.emergencyContactNo,
          emergencyRelationship: formData.emergencyRelationship
        })
      })
      
      console.log("✅ Response received:", response.status, response.statusText)
      
      if (!response.ok) {
        const data = await response.json()
        console.error("❌ Error response:", data)
        throw new Error(data.error || "Failed to save")
      }
      
      const responseData = await response.json()
      console.log("✅ Save successful:", responseData)
      console.log("📊 Completion percent from response:", responseData.completionPercent)
      
      setSuccess("Emergency contact saved!")
      
      console.log("🔄 Refreshing onboarding data...")
      await fetchOnboardingData()
      console.log("✅ Onboarding data refreshed!")
      
      clearTimeout(timeoutId) // Clear timeout on success
      
      // Show completion modal if onboarding is 100% complete
      console.log("🎯 Checking completion - responseData:", responseData.completionPercent)
      if (responseData.completionPercent === 100) {
        console.log("🎉 Showing completion modal!")
        setTimeout(() => {
          setShowCompletionModal(true)
        }, 500)
      } else {
        console.log("⚠️ Not 100% complete yet:", responseData.completionPercent)
      }
    } catch (err: any) {
      console.error("❌ Error saving emergency contact:", err)
      setError(err.message || "Failed to save. Please try again.")
      clearTimeout(timeoutId)
    } finally {
      console.log("✅ Setting saving to false")
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File, documentType: string) => {
    setUploading({ ...uploading, [documentType]: true })
    setError("")
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", documentType)
      
      const response = await fetch("/api/onboarding/documents/upload", {
        method: "POST",
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload")
      }
      
      await fetchOnboardingData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading({ ...uploading, [documentType]: false })
    }
  }

  const handleSignatureUpload = async (file: File) => {
    setUploading({ ...uploading, signature: true })
    setError("")
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/onboarding/signature", {
        method: "POST",
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload")
      }
      
      await fetchOnboardingData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading({ ...uploading, signature: false })
    }
  }

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Refill with white background
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    return new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve()
          return
        }
        
        const file = new File([blob], "signature.png", { type: "image/png" })
        await handleSignatureUpload(file)
        setIsDrawMode(false) // Switch back to preview after saving
        resolve()
      }, "image/png")
    })
  }

  const getStatusIcon = (status: string) => {
    if (status === "APPROVED") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === "REJECTED") return <AlertCircle className="h-4 w-4 text-red-500" />
    if (status === "SUBMITTED") return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-700">
        {/* Header */}
        <div className="text-center mb-8 mt-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to ShoreAgents! <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h1>
          <p className="text-slate-300">
            Complete your onboarding to get started
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-6 bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
          <CardContent className="py-6">
            <div className="flex justify-between mb-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const status = formData[step.field as keyof OnboardingData] as string
                const isActive = currentStep === step.id
                const isCompleted = status === "SUBMITTED"
                const isApproved = status === "APPROVED"
                const isRejected = status === "REJECTED"
                const isClickable = true // Allow navigation to any step
                
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => {
                        if (isClickable) {
                          setCurrentStep(step.id)
                          setError("")
                          setSuccess("")
                        }
                      }}
                      disabled={!isClickable}
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                        isApproved
                          ? "bg-green-600 text-white hover:bg-green-500"
                          : isCompleted
                          ? "bg-purple-600 text-white hover:bg-purple-500"
                          : isRejected
                          ? "bg-red-600 text-white hover:bg-red-500"
                          : isActive
                          ? "bg-purple-600 text-white hover:bg-purple-500"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      } hover:scale-110 cursor-pointer`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : isCompleted ? (
                        <Icon className="h-5 w-5" />
                      ) : isRejected ? (
                        <AlertCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </button>
                    <span className="text-xs text-center text-slate-300">
                      {step.name}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="relative">
              <Progress value={formData.completionPercent || 0} className="h-6" />
              <p className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                {formData.completionPercent || 0}% Complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-white">
                  {STEPS[currentStep - 1].name}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {currentStep === 1 && "Tell us about yourself"}
                  {currentStep === 2 && "Enter your government ID numbers and upload supporting documents"}
                  {currentStep === 3 && "Upload your additional documents below."}
                  {currentStep === 4 && "Upload your signature image (white background recommended). You can also skip and add it later."}
                  {currentStep === 5 && "Who should we contact in case of emergency?"}
                </CardDescription>
              </div>
              {/* Status Badge */}
              {currentStep === 1 && formData.personalInfoStatus === "APPROVED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/50 border border-green-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-200 text-sm font-medium">Approved</span>
                </div>
              )}
              {currentStep === 1 && formData.personalInfoStatus === "REJECTED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/50 border border-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-200 text-sm font-medium">Rejected</span>
                </div>
              )}
              {currentStep === 2 && formData.govIdStatus === "APPROVED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/50 border border-green-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-200 text-sm font-medium">Approved</span>
                </div>
              )}
              {currentStep === 2 && formData.govIdStatus === "REJECTED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/50 border border-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-200 text-sm font-medium">Rejected</span>
                </div>
              )}
              {currentStep === 3 && formData.documentsStatus === "APPROVED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/50 border border-green-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-200 text-sm font-medium">Approved</span>
                </div>
              )}
              {currentStep === 3 && formData.documentsStatus === "REJECTED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/50 border border-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-200 text-sm font-medium">Rejected</span>
                </div>
              )}
              {currentStep === 4 && formData.signatureStatus === "APPROVED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/50 border border-green-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-200 text-sm font-medium">Approved</span>
                </div>
              )}
              {currentStep === 4 && formData.signatureStatus === "REJECTED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/50 border border-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-200 text-sm font-medium">Rejected</span>
                </div>
              )}
              {currentStep === 5 && formData.emergencyContactStatus === "APPROVED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/50 border border-green-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-200 text-sm font-medium">Approved</span>
                </div>
              )}
              {currentStep === 5 && formData.emergencyContactStatus === "REJECTED" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/50 border border-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-200 text-sm font-medium">Rejected</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Feedback Display - Full Width */}
            {currentStep === 1 && formData.personalInfoFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700 w-full">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  <strong>Admin Feedback:</strong> {formData.personalInfoFeedback}
                </AlertDescription>
              </Alert>
            )}
            {currentStep === 2 && formData.govIdFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700 w-full">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  <strong>Admin Feedback:</strong> {formData.govIdFeedback}
                </AlertDescription>
              </Alert>
            )}
            {currentStep === 3 && formData.documentsFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700 w-full">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  <strong>Admin Feedback:</strong> {formData.documentsFeedback}
                </AlertDescription>
              </Alert>
            )}
            {currentStep === 4 && formData.signatureFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700 w-full">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  <strong>Admin Feedback:</strong> {formData.signatureFeedback}
                </AlertDescription>
              </Alert>
            )}
            {currentStep === 5 && formData.emergencyContactFeedback && (
              <Alert className="mb-4 bg-yellow-900/50 border-yellow-700 w-full">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  <strong>Admin Feedback:</strong> {formData.emergencyContactFeedback}
                </AlertDescription>
              </Alert>
            )}
            
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

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName || ""}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Juan"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName" className="text-slate-300">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName || ""}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      placeholder="Santos"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName || ""}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Dela Cruz"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-slate-300">Gender *</Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    >
                      <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="civilStatus" className="text-slate-300">Civil Status *</Label>
                    <Select
                      value={formData.civilStatus || ""}
                      onValueChange={(value) => setFormData({ ...formData, civilStatus: value })}
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    >
                      <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-slate-300">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNo" className="text-slate-300">Contact Number *</Label>
                    <Input
                      id="contactNo"
                      value={formData.contactNo || ""}
                      onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                      placeholder="09XXXXXXXXX"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan.delacruz@email.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.personalInfoStatus === "APPROVED"}
                  />
                </div>

                {formData.personalInfoStatus !== "APPROVED" && (
                  <Button
                    onClick={handlePersonalInfoSubmit}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 mt-8"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : "Save"}
                  </Button>
                )}
              </div>
            )}

            {/* NEW STEP 2: Resume Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <Label htmlFor="resume-upload" className="cursor-pointer">
                    <span className="text-lg font-semibold text-white">Click to upload resume</span>
                    <p className="text-sm text-slate-400 mt-2">PDF, DOC, or DOCX (Max 5MB)</p>
                  </Label>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleResumeUpload(e)}
                    className="hidden"
                    disabled={uploading.resume || formData.resumeStatus === "APPROVED"}
                  />
                  {uploading.resume && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <span className="text-purple-300">Uploading...</span>
                    </div>
                  )}
                </div>

                {formData.resumeUrl && (
                  <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-green-100">Resume uploaded</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(formData.resumeUrl, '_blank')}
                      className="border-green-600 text-green-400 hover:bg-green-900/50"
                    >
                      View
                    </Button>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(1)}
                    className="border-slate-600 text-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(3)} 
                    disabled={!formData.resumeUrl}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Government IDs */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* SSS Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sss" className="text-slate-300 text-sm">SSS Number (XX-XXXXXXX-X)</Label>
                    <Input
                      id="sss"
                      value={formData.sss || ""}
                      onChange={(e) => setFormData({ ...formData, sss: e.target.value })}
                      placeholder="02-3731640-2"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.govIdStatus === "APPROVED"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">SSS Document</Label>
                    {formData.sssDocUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.sssDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.sssDocUrl!, title: "SSS Document" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.govIdStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="sssDoc-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="sssDoc-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "sssDoc") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.sssDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.govIdStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "sssDoc") }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* TIN Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tin" className="text-slate-300 text-sm">TIN ID (XXX-XXX-XXX-XXX)</Label>
                    <Input
                      id="tin"
                      value={formData.tin || ""}
                      onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                      placeholder="474-887-785-000"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.govIdStatus === "APPROVED"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">BIR Form 1902 (TIN)</Label>
                    {formData.tinDocUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.tinDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.tinDocUrl!, title: "BIR Form 1902 (TIN)" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.govIdStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="tinDoc-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="tinDoc-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "tinDoc") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.tinDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.govIdStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "tinDoc") }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* PhilHealth Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="philhealth" className="text-slate-300 text-sm">PhilHealth Number (XX-XXXXXXXXX-X)</Label>
                    <Input
                      id="philhealth"
                      value={formData.philhealthNo || ""}
                      onChange={(e) => setFormData({ ...formData, philhealthNo: e.target.value })}
                      placeholder="07-025676881-8"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.govIdStatus === "APPROVED"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">PhilHealth Document</Label>
                    {formData.philhealthDocUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.philhealthDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.philhealthDocUrl!, title: "PhilHealth Document" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.govIdStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="philhealthDoc-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="philhealthDoc-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "philhealthDoc") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.philhealthDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.govIdStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "philhealthDoc") }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pag-IBIG Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pagibig" className="text-slate-300 text-sm">Pag-IBIG Number (XXXX-XXXX-XXXX)</Label>
                    <Input
                      id="pagibig"
                      value={formData.pagibigNo || ""}
                      onChange={(e) => setFormData({ ...formData, pagibigNo: e.target.value })}
                      placeholder="1211-5400-1513"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.govIdStatus === "APPROVED"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Pag-IBIG Document</Label>
                    {formData.pagibigDocUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.pagibigDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.pagibigDocUrl!, title: "Pag-IBIG Document" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.govIdStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="pagibigDoc-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="pagibigDoc-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "pagibigDoc") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.pagibigDoc ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.govIdStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "pagibigDoc") }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                  >
                    Back
                  </Button>
                  {formData.govIdStatus !== "APPROVED" && (
                    <Button
                      onClick={handleGovIdsSubmit}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : "Save"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">Valid ID (National ID, Driver's License, etc.)</Label>
                    {formData.validIdUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.validId ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.validIdUrl!, title: "Valid ID" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.documentsStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="validId-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="validId-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileUpload(file, "validId")
                                  }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.validId ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="bg-slate-700 border-slate-600 text-white"
                            disabled={formData.documentsStatus === "APPROVED"}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(file, "validId")
                            }}
                          />
                        )}
                      </div>
                    )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Birth Certificate (PSA)</Label>
                    {formData.birthCertUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.birthCert ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.birthCertUrl!, title: "Birth Certificate" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.documentsStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="birthCert-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="birthCert-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "birthCert") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.birthCert ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "birthCert") }} />
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">NBI Clearance (Attach receipt if appointment or release date is after start date)</Label>
                    {formData.nbiClearanceUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.nbiClearance ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.nbiClearanceUrl!, title: "NBI Clearance" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.documentsStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="nbiClearance-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="nbiClearance-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "nbiClearance") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.nbiClearance ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "nbiClearance") }} />
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Police Clearance</Label>
                    {formData.policeClearanceUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.policeClearance ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.policeClearanceUrl!, title: "Police Clearance" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.documentsStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="policeClearance-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="policeClearance-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "policeClearance") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.policeClearance ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "policeClearance") }} />
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">BIR 2316 (Current year from previous employer, if employed)</Label>
                    {formData.birForm2316Url ? (
                      <div className="mt-2 space-y-2">
                        {uploading.birForm2316 ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.birForm2316Url!, title: "BIR 2316 (Current year from previous employer, if employed)" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.documentsStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="birForm2316-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="birForm2316-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "birForm2316") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.birForm2316 ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "birForm2316") }} />
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">COE (If you have a previous employer)</Label>
                    {formData.certificateEmpUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.certificateEmp ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.certificateEmpUrl!, title: "COE (Certificate of Employment)" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.documentsStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="certificateEmp-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="certificateEmp-upload"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "certificateEmp") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.certificateEmp ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "certificateEmp") }} />
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">ID Photo (2x2, white background)</Label>
                    {formData.idPhotoUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.idPhoto ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                            <button 
                              onClick={() => {
                                setImageLoading(true)
                                setViewFileModal({ url: formData.idPhotoUrl!, title: "ID Photo" })
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            {formData.documentsStatus !== "APPROVED" && (
                              <>
                                <span className="text-slate-500">|</span>
                                <label htmlFor="idPhoto-upload" className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer">
                                  Change File
                                </label>
                                <input
                                  id="idPhoto-upload"
                                  type="file"
                                  accept=".jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "idPhoto") }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.idPhoto ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <Input type="file" accept=".jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED"}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "idPhoto") }} />
                        )}
                      </div>
                    )}
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    className="flex-1"
                    disabled={saving || Object.values(uploading).some(v => v)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={async () => {
                      // Mark as submitted
                      setSaving(true)
                      try {
                        const response = await fetch("/api/onboarding/documents/submit", {
                          method: "POST"
                        })
                        if (response.ok) {
                          await fetchOnboardingData()
                        }
                      } catch (err) {
                        console.error("Failed to submit documents:", err)
                      } finally {
                        setSaving(false)
                      }
                      setCurrentStep(4)
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                    disabled={saving || Object.values(uploading).some(v => v)}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      formData.documentsStatus === "APPROVED" ? "Next" : "Save"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* NEW STEP 4: Education Documents */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                  <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <Label htmlFor="education-upload" className="cursor-pointer">
                    <span className="text-lg font-semibold text-white">Upload Diploma or Transcript of Records (TOR)</span>
                    <p className="text-sm text-slate-400 mt-2">PDF, JPG, or PNG (Max 5MB)</p>
                  </Label>
                  <Input
                    id="education-upload"
                    type="file"
                    accept=".pdf,.jpg,.png,.jpeg"
                    onChange={(e) => handleEducationUpload(e)}
                    className="hidden"
                    disabled={uploading.education || formData.educationStatus === "APPROVED"}
                  />
                  {uploading.education && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <span className="text-purple-300">Uploading...</span>
                    </div>
                  )}
                </div>

                {formData.diplomaTorUrl && (
                  <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-green-100">Education document uploaded</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(formData.diplomaTorUrl, '_blank')}
                      className="border-green-600 text-green-400 hover:bg-green-900/50"
                    >
                      View
                    </Button>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(3)}
                    className="border-slate-600 text-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(5)} 
                    disabled={!formData.diplomaTorUrl}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* NEW STEP 5: Medical Certificate */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Stethoscope className="h-8 w-8 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Medical Certificate (Fit to Work)</h3>
                  </div>

                  {nearbyClinics.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-medium text-slate-200">Partner Clinics Near You</h4>
                      <div className="grid gap-3">
                        {nearbyClinics.slice(0, 3).map((clinic: any) => (
                          <div key={clinic.id} className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                            <h5 className="font-semibold text-white">{clinic.name}</h5>
                            <p className="text-sm text-slate-300 mt-1">{clinic.address}</p>
                            <p className="text-xs text-slate-400 mt-1">Distance: {clinic.distance.toFixed(1)}km away</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg space-y-2">
                    <h4 className="font-semibold text-blue-200">Visit Any Licensed Clinic</h4>
                    <p className="text-sm text-blue-100">Request a "Fit to Work" certificate with:</p>
                    <ul className="text-sm text-blue-100 list-disc list-inside space-y-1 ml-2">
                      <li>Complete physical exam</li>
                      <li>Chest X-ray</li>
                      <li>Drug test</li>
                      <li>Blood test (CBC, Blood type)</li>
                    </ul>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <Label htmlFor="medical-upload" className="cursor-pointer">
                    <span className="text-lg font-semibold text-white">Upload Medical Certificate</span>
                    <p className="text-sm text-slate-400 mt-2">PDF, JPG, or PNG (Max 5MB)</p>
                  </Label>
                  <Input
                    id="medical-upload"
                    type="file"
                    accept=".pdf,.jpg,.png,.jpeg"
                    onChange={(e) => handleMedicalUpload(e)}
                    className="hidden"
                    disabled={uploading.medical || formData.medicalStatus === "APPROVED"}
                  />
                  {uploading.medical && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <span className="text-purple-300">Uploading...</span>
                    </div>
                  )}
                </div>

                {formData.medicalCertUrl && (
                  <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-green-100">Medical certificate uploaded</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(formData.medicalCertUrl, '_blank')}
                      className="border-green-600 text-green-400 hover:bg-green-900/50"
                    >
                      View
                    </Button>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(4)}
                    className="border-slate-600 text-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(6)} 
                    disabled={!formData.medicalCertUrl}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* NEW STEP 6: Data Privacy & Bank Details */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-8 w-8 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Data Privacy Consent & Bank Details</h3>
                </div>

                <div className="p-6 bg-slate-700/50 border border-slate-600 rounded-lg space-y-4">
                  <h4 className="font-semibold text-white">Data Privacy Consent (Annex C)</h4>
                  <div className="max-h-64 overflow-y-auto p-4 bg-slate-800/50 border border-slate-600 rounded text-sm text-slate-300 space-y-2">
                    <p>I hereby consent to the collection, use, and disclosure of my personal information by ShoreAgents for the purpose of employment processing, payroll management, and compliance with legal requirements.</p>
                    <p>I understand that my information will be kept confidential and will only be shared with authorized personnel and government agencies as required by law.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="privacy-consent"
                      checked={privacyData.dataPrivacyConsent}
                      onChange={(e) => setPrivacyData({ ...privacyData, dataPrivacyConsent: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700"
                    />
                    <Label htmlFor="privacy-consent" className="text-slate-300 cursor-pointer">
                      I have read and agree to the Data Privacy Consent
                    </Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Bank Account Details</h4>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Bank Name *</Label>
                      <Select
                        value={privacyData.bankName}
                        onValueChange={(value) => setPrivacyData({ ...privacyData, bankName: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BDO">BDO (Banco de Oro)</SelectItem>
                          <SelectItem value="BPI">BPI (Bank of the Philippine Islands)</SelectItem>
                          <SelectItem value="Metrobank">Metrobank</SelectItem>
                          <SelectItem value="PNB">PNB (Philippine National Bank)</SelectItem>
                          <SelectItem value="UnionBank">UnionBank</SelectItem>
                          <SelectItem value="Security Bank">Security Bank</SelectItem>
                          <SelectItem value="Landbank">Landbank</SelectItem>
                          <SelectItem value="RCBC">RCBC (Rizal Commercial Banking Corporation)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Account Name *</Label>
                      <Input
                        placeholder="As shown on your bank account"
                        value={privacyData.accountName}
                        onChange={(e) => setPrivacyData({ ...privacyData, accountName: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Account Number *</Label>
                      <Input
                        placeholder="Your bank account number"
                        value={privacyData.accountNumber}
                        onChange={(e) => setPrivacyData({ ...privacyData, accountNumber: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(5)}
                    className="border-slate-600 text-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleSaveDataPrivacy}
                    disabled={!privacyData.dataPrivacyConsent || !privacyData.bankName || !privacyData.accountName || !privacyData.accountNumber || saving}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : "Save & Continue"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 7: Signature (was Step 4) */}
            {currentStep === 7 && (
              <div className="space-y-6">
                {!isDrawMode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Signature Image (PNG or JPG)</Label>
                      {formData.signatureStatus !== "APPROVED" && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDrawMode(true)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            disabled={uploading.signature}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Draw Signature
                          </Button>
                          {formData.signatureUrl && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => document.getElementById('signature-upload')?.click()}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                disabled={uploading.signature}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Reupload
                              </Button>
                              <input
                                id="signature-upload"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleSignatureUpload(file)
                                }}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.signatureUrl ? (
                      <div className="mt-2 space-y-2">
                        {uploading.signature ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="border-2 border-slate-600 rounded-lg p-4 bg-white relative min-h-[160px] flex items-center justify-center">
                            {signatureImageLoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                              </div>
                            )}
                            <img 
                              src={`${formData.signatureUrl}?t=${Date.now()}`} 
                              alt="Signature preview" 
                              className="max-h-32 mx-auto"
                              onLoad={() => setSignatureImageLoading(false)}
                              onLoadStart={() => setSignatureImageLoading(true)}
                              onError={() => setSignatureImageLoading(false)}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {uploading.signature ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-blue-200 text-sm">Uploading file...</span>
                          </div>
                        ) : (
                          <>
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              className="bg-slate-700 border-slate-600 text-white"
                              disabled={formData.signatureStatus === "APPROVED"}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleSignatureUpload(file)
                              }}
                            />
                            <p className="text-xs text-slate-400">
                              Sign on white paper, take a photo, or use a drawing app
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isDrawMode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Draw Your Signature</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDrawMode(false)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        disabled={uploading.signature}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {formData.signatureUrl ? "Reupload Instead" : "Upload Instead"}
                      </Button>
                    </div>
                    <div className="border-2 border-slate-600 rounded-lg p-4 bg-white relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCanvas}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white shadow-md"
                        disabled={uploading.signature}
                      >
                        <Eraser className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={async () => await saveDrawnSignature()}
                      disabled={uploading.signature}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      {uploading.signature ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save Signature"
                      )}
                    </Button>
                    <p className="text-xs text-slate-400">
                      Draw your signature using your mouse or trackpad
                    </p>
                  </div>
                )}

                {!isDrawMode && (
                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={() => setCurrentStep(3)}
                      variant="outline"
                      className="flex-1"
                      disabled={saving || uploading.signature}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={async () => {
                        // Mark as submitted if not already
                        setSaving(true)
                        if (formData.signatureStatus !== "SUBMITTED" && formData.signatureStatus !== "APPROVED") {
                          try {
                            const response = await fetch("/api/onboarding/signature", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({}) // Empty - just mark as submitted
                            })
                            if (response.ok) {
                              await fetchOnboardingData()
                            }
                          } catch (err) {
                            console.error("Failed to submit signature:", err)
                          }
                        }
                        setSaving(false)
                        setCurrentStep(5)
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                      disabled={saving || uploading.signature}
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        formData.signatureStatus === "APPROVED" ? "Next" : "Save"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 8: Emergency Contact (was Step 5) */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName" className="text-slate-300">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContactName || ""}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Reynaldo T. Samson"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.emergencyContactStatus === "APPROVED"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyNo" className="text-slate-300">Emergency Contact Number *</Label>
                  <Input
                    id="emergencyNo"
                    value={formData.emergencyContactNo || ""}
                    onChange={(e) => setFormData({ ...formData, emergencyContactNo: e.target.value })}
                    placeholder="09267834844"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.emergencyContactStatus === "APPROVED"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship" className="text-slate-300">Relationship *</Label>
                  <Select
                    value={formData.emergencyRelationship || ""}
                    onValueChange={(value) => setFormData({ ...formData, emergencyRelationship: value })}
                    disabled={formData.emergencyContactStatus === "APPROVED"}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-full">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Son">Son</SelectItem>
                      <SelectItem value="Daughter">Daughter</SelectItem>
                      <SelectItem value="Brother">Brother</SelectItem>
                      <SelectItem value="Sister">Sister</SelectItem>
                      <SelectItem value="Grandfather">Grandfather</SelectItem>
                      <SelectItem value="Grandmother">Grandmother</SelectItem>
                      <SelectItem value="Uncle">Uncle</SelectItem>
                      <SelectItem value="Aunt">Aunt</SelectItem>
                      <SelectItem value="Cousin">Cousin</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    onClick={() => setCurrentStep(4)}
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                  >
                    Back
                  </Button>
                {formData.emergencyContactStatus !== "APPROVED" && (
                  <Button
                    onClick={handleEmergencyContactSubmit}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : "Save & Finish"}
                  </Button>
                )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File View Modal */}
      <Dialog open={!!viewFileModal} onOpenChange={() => {
        setViewFileModal(null)
        setImageLoading(true)
      }}>
        <DialogContent className={`${viewFileModal?.url?.endsWith('.pdf') ? 'w-[100vw] h-[100vh] max-w-none max-h-none !w-screen !h-screen rounded-none' : 'max-w-5xl'} bg-slate-800 border-slate-700 p-0`} style={viewFileModal?.url?.endsWith('.pdf') ? { width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none', borderRadius: '0' } : {}}>
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-white">{viewFileModal?.title}</DialogTitle>
            </DialogHeader>
          </div>
          <div className={`${viewFileModal?.url?.endsWith('.pdf') ? 'h-[calc(100vh-120px)]' : 'h-[40vh]'} relative px-6 pb-6 flex items-center justify-center`}>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                  <span className="text-slate-300 text-sm">Loading file...</span>
                </div>
              </div>
            )}
            {viewFileModal?.url && (
              viewFileModal.url.endsWith('.pdf') ? (
                <iframe
                  src={`${viewFileModal.url}?t=${Date.now()}#toolbar=0&scrollbar=0`}
                  className="w-full h-full"
                  title={viewFileModal.title}
                  onLoad={() => setImageLoading(false)}
                />
              ) : (
                <img
                  src={`${viewFileModal.url}?t=${Date.now()}`}
                  alt={viewFileModal.title}
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-gradient-to-br from-green-900/90 to-emerald-900/90 border-green-500/50" showCloseButton={false}>
          <div className="text-center py-6 px-2">
            <div className="mb-6 flex flex-col items-center">
              <div className="w-24 h-24 flex items-center justify-center mb-4">
                <span className="text-7xl">🎉</span>
              </div>
              <DialogHeader className="text-center space-y-2">
                <DialogTitle className="text-2xl font-bold text-white text-center">
                  Onboarding 100% Complete!
                </DialogTitle>
              </DialogHeader>
              <p className="text-green-100 text-sm text-center mt-2">
                Your documents will be reviewed and verified by admin.
              </p>
            </div>
            <Button
              onClick={() => {
                setShowCompletionModal(false)
                router.push("/")
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            >
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return to Dashboard */}
      <div className="max-w-4xl mx-auto w-full text-center mt-8">
        <Button
          onClick={() => router.push("/")}
          variant="ghost"
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}

