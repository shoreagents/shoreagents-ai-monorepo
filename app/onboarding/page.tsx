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

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
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
    
    try {
      const response = await fetch("/api/onboarding/emergency-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyContactName: formData.emergencyContactName,
          emergencyContactNo: formData.emergencyContactNo,
          emergencyRelationship: formData.emergencyRelationship
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save")
      }
      
      setSuccess("Emergency contact saved! You can now go back to the dashboard.")
      await fetchOnboardingData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === "APPROVED") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === "REJECTED") return <AlertCircle className="h-4 w-4 text-red-500" />
    if (status === "SUBMITTED") return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
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
                    Document uploads will be added in the next phase. For now, click Continue to proceed.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    Continue
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
                    Signature upload will be added in the next phase. For now, click Continue to proceed.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(3)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(5)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    Continue
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
                      {saving ? "Saving..." : "Save & Finish"}
                    </Button>
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

