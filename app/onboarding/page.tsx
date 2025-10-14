"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  CreditCard, 
  FileText, 
  PenTool, 
  Users, 
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2
} from "lucide-react"

const STEPS = [
  { id: 1, name: "Personal Info", icon: User, field: "personalInfoStatus" },
  { id: 2, name: "Government IDs", icon: CreditCard, field: "govIdStatus" },
  { id: 3, name: "Documents", icon: FileText, field: "documentsStatus" },
  { id: 4, name: "Signature", icon: PenTool, field: "signatureStatus" },
  { id: 5, name: "Emergency Contact", icon: Users, field: "emergencyContactStatus" },
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
  completionPercent: number
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
  
  const [formData, setFormData] = useState<Partial<OnboardingData>>({})

  useEffect(() => {
    fetchOnboardingData()
  }, [])

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch("/api/onboarding")
      if (!response.ok) throw new Error("Failed to fetch onboarding data")
      
      const data = await response.json()
      if (data.onboarding) {
        setFormData({
          ...data.onboarding,
          dateOfBirth: data.onboarding.dateOfBirth 
            ? new Date(data.onboarding.dateOfBirth).toISOString().split('T')[0]
            : ""
        })
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
      
      setSuccess("Emergency contact saved! Onboarding 100% complete! Admin will verify your documents.")
      
      console.log("🔄 Refreshing onboarding data...")
      await fetchOnboardingData()
      console.log("✅ Onboarding data refreshed!")
      
      clearTimeout(timeoutId) // Clear timeout on success
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
      
      const data = await response.json()
      setSuccess(`${documentType} uploaded successfully!`)
      await fetchOnboardingData()
      setTimeout(() => setSuccess(""), 3000)
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
      
      setSuccess("Signature uploaded successfully!")
      await fetchOnboardingData()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading({ ...uploading, signature: false })
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === "APPROVED") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === "REJECTED") return <AlertCircle className="h-4 w-4 text-red-500" />
    if (status === "SUBMITTED") return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to ShoreAgents! 👋
          </h1>
          <p className="text-slate-300">
            Complete your onboarding to get started
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex justify-between mb-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const status = formData[step.field as keyof OnboardingData] as string
                const isActive = currentStep === step.id
                const isCompleted = status === "APPROVED"
                
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isActive
                          ? "bg-purple-600 text-white"
                          : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-slate-300 text-center">
                      {step.name}
                    </span>
                    {getStatusIcon(status)}
                  </div>
                )
              })}
            </div>
            <Progress value={formData.completionPercent || 0} className="h-2" />
            <p className="text-center text-sm text-slate-400 mt-2">
              {formData.completionPercent || 0}% Complete
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {STEPS[currentStep - 1].name}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {currentStep === 1 && "Tell us about yourself"}
              {currentStep === 2 && "Enter your government ID numbers"}
              {currentStep === 3 && "Upload required documents (done separately)"}
              {currentStep === 4 && "Upload your signature (done separately)"}
              {currentStep === 5 && "Who should we contact in case of emergency?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName || ""}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName" className="text-slate-300">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName || ""}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName || ""}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender" className="text-slate-300">Gender *</Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="civilStatus" className="text-slate-300">Civil Status *</Label>
                    <Select
                      value={formData.civilStatus || ""}
                      onValueChange={(value) => setFormData({ ...formData, civilStatus: value })}
                      disabled={formData.personalInfoStatus === "APPROVED"}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
                  <div>
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
                  <div>
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

                <div>
                  <Label htmlFor="email" className="text-slate-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.personalInfoStatus === "APPROVED"}
                  />
                </div>

                {formData.personalInfoStatus !== "APPROVED" && (
                  <Button
                    onClick={handlePersonalInfoSubmit}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {saving ? "Saving..." : "Save & Continue"}
                  </Button>
                )}
              </div>
            )}

            {/* Step 2: Government IDs */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sss" className="text-slate-300">SSS Number (XX-XXXXXXX-X)</Label>
                  <Input
                    id="sss"
                    value={formData.sss || ""}
                    onChange={(e) => setFormData({ ...formData, sss: e.target.value })}
                    placeholder="02-3731640-2"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.govIdStatus === "APPROVED"}
                  />
                </div>

                <div>
                  <Label htmlFor="tin" className="text-slate-300">TIN (XXX-XXX-XXX-XXX)</Label>
                  <Input
                    id="tin"
                    value={formData.tin || ""}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    placeholder="474-887-785-000"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.govIdStatus === "APPROVED"}
                  />
                </div>

                <div>
                  <Label htmlFor="philhealth" className="text-slate-300">PhilHealth No (XX-XXXXXXXXX-X)</Label>
                  <Input
                    id="philhealth"
                    value={formData.philhealthNo || ""}
                    onChange={(e) => setFormData({ ...formData, philhealthNo: e.target.value })}
                    placeholder="07-025676881-8"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.govIdStatus === "APPROVED"}
                  />
                </div>

                <div>
                  <Label htmlFor="pagibig" className="text-slate-300">Pag-IBIG No (XXXX-XXXX-XXXX)</Label>
                  <Input
                    id="pagibig"
                    value={formData.pagibigNo || ""}
                    onChange={(e) => setFormData({ ...formData, pagibigNo: e.target.value })}
                    placeholder="1211-5400-1513"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.govIdStatus === "APPROVED"}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  {formData.govIdStatus !== "APPROVED" && (
                    <Button
                      onClick={handleGovIdsSubmit}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      {saving ? "Saving..." : "Save & Continue"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert className="bg-blue-900/50 border-blue-700">
                  <Upload className="h-4 w-4" />
                  <AlertDescription className="text-blue-200">
                    Upload your documents below. Don't have them yet? No worries - you can skip and add them later!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300">Valid ID (National ID, Driver's License, etc.)</Label>
                    {formData.validIdUrl ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                          <a 
                            href={formData.validIdUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            View
                          </a>
                        </div>
                        {formData.documentsStatus !== "APPROVED" && (
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="bg-slate-700 border-slate-600 text-white"
                            disabled={uploading.validId}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(file, "validId")
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="bg-slate-700 border-slate-600 text-white"
                          disabled={formData.documentsStatus === "APPROVED" || uploading.validId}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, "validId")
                          }}
                        />
                        {uploading.validId && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Birth Certificate (PSA)</Label>
                    {formData.birthCertUrl ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                          <a href={formData.birthCertUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">View</a>
                        </div>
                        {formData.documentsStatus !== "APPROVED" && (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={uploading.birthCert}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "birthCert") }} />
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center mt-1">
                        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED" || uploading.birthCert}
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "birthCert") }} />
                        {uploading.birthCert && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-300">NBI Clearance</Label>
                    {formData.nbiClearanceUrl ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                          <a href={formData.nbiClearanceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">View</a>
                        </div>
                        {formData.documentsStatus !== "APPROVED" && (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={uploading.nbiClearance}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "nbiClearance") }} />
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center mt-1">
                        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED" || uploading.nbiClearance}
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "nbiClearance") }} />
                        {uploading.nbiClearance && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-300">Police Clearance</Label>
                    {formData.policeClearanceUrl ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                          <a href={formData.policeClearanceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">View</a>
                        </div>
                        {formData.documentsStatus !== "APPROVED" && (
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={uploading.policeClearance}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "policeClearance") }} />
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center mt-1">
                        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED" || uploading.policeClearance}
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "policeClearance") }} />
                        {uploading.policeClearance && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-300">ID Photo (2x2, white background)</Label>
                    {formData.idPhotoUrl ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-green-200 text-sm flex-1">Already uploaded</span>
                          <a href={formData.idPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">View</a>
                        </div>
                        <img src={formData.idPhotoUrl} alt="ID Photo" className="w-32 h-32 object-cover rounded border border-slate-600" />
                        {formData.documentsStatus !== "APPROVED" && (
                          <Input type="file" accept=".jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={uploading.idPhoto}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "idPhoto") }} />
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center mt-1">
                        <Input type="file" accept=".jpg,.jpeg,.png" className="bg-slate-700 border-slate-600 text-white" disabled={formData.documentsStatus === "APPROVED" || uploading.idPhoto}
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, "idPhoto") }} />
                        {uploading.idPhoto && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={async () => {
                      // Mark as submitted
                      try {
                        const response = await fetch("/api/onboarding/documents/submit", {
                          method: "POST"
                        })
                        if (response.ok) {
                          await fetchOnboardingData()
                        }
                      } catch (err) {
                        console.error("Failed to submit documents:", err)
                      }
                      setCurrentStep(4)
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {formData.documentsStatus === "APPROVED" ? "Next" : "Continue"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Signature */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <Alert className="bg-blue-900/50 border-blue-700">
                  <PenTool className="h-4 w-4" />
                  <AlertDescription className="text-blue-200">
                    Upload your signature image (white background recommended). You can also skip and add it later.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Signature Image (PNG or JPG)</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={formData.signatureStatus === "APPROVED" || uploading.signature}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleSignatureUpload(file)
                        }}
                      />
                      {uploading.signature && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                      {formData.signatureUrl && !uploading.signature && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Sign on white paper, take a photo, or use a drawing app
                    </p>
                  </div>

                  {/* Preview */}
                  {formData.signatureUrl ? (
                    <div className="border-2 border-slate-600 rounded-lg p-4 bg-white">
                      <img 
                        src={formData.signatureUrl} 
                        alt="Signature preview" 
                        className="max-h-32 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                      <PenTool className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                      <p className="text-slate-400 text-sm">Signature preview will appear here</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(3)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={async () => {
                      // Mark as submitted if not already
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
                      setCurrentStep(5)
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {formData.signatureStatus === "APPROVED" ? "Next" : "Continue"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Emergency Contact */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
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

                <div>
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

                <div>
                  <Label htmlFor="relationship" className="text-slate-300">Relationship *</Label>
                  <Input
                    id="relationship"
                    value={formData.emergencyRelationship || ""}
                    onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                    placeholder="Father"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={formData.emergencyContactStatus === "APPROVED"}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(4)}
                    variant="outline"
                    className="flex-1"
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
                
                {formData.emergencyContactStatus === "SUBMITTED" && (
                  <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                    <p className="text-green-200 text-sm">
                      🎉 <strong>Onboarding 100% Complete!</strong>
                      <br/>
                      Your documents will be reviewed and verified by admin.
                    </p>
                  </div>
                )}
                </div>

                {formData.completionPercent === 100 && (
                  <Button
                    onClick={() => router.push("/")}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return to Dashboard */}
        <div className="text-center mt-6">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

