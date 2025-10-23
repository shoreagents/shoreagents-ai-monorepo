"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle, AlertCircle, Pen } from "lucide-react"
import { Label } from "@/components/ui/label"

interface ContractData {
  id: string
  employeeName: string
  position: string
  assignedClient: string
  startDate: string
  workSchedule: string
  basicSalary: number
  deMinimis: number
  totalMonthlyGross: number
  hmoOffer: string
  paidLeave: string
  probationaryPeriod: string
  signed: boolean
}

export default function ContractSigningPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sectionsChecked, setSectionsChecked] = useState<boolean[]>([false, false, false, false, false])
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const sections = [
    { title: "Employment Details", key: "employment" },
    { title: "Compensation & Benefits", key: "compensation" },
    { title: "Work Schedule & Duration", key: "schedule" },
    { title: "Leave & Time Off", key: "leave" },
    { title: "Terms & Conditions", key: "terms" }
  ]

  useEffect(() => {
    fetchContract()
  }, [])

  async function fetchContract() {
    try {
      const response = await fetch('/api/contract')
      const data = await response.json()

      if (data.error) {
        // No contract needed or already signed - redirect to onboarding
        if (data.error === 'No contract found' || data.error === 'Contract already signed') {
          router.push('/onboarding')
        } else {
          setError(data.error)
        }
        return
      }

      setContract(data.contract)
    } catch (error) {
      console.error('Error fetching contract:', error)
      setError('Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (index: number) => {
    const newChecked = [...sectionsChecked]
    newChecked[index] = !newChecked[index]
    setSectionsChecked(newChecked)
  }

  const allSectionsChecked = sectionsChecked.every(checked => checked)
  const checkedCount = sectionsChecked.filter(c => c).length
  const progress = (checkedCount / sections.length) * 100

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()

    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSubmitSignature = async () => {
    if (!hasSignature) {
      setError("Please provide your signature")
      return
    }

    setSigning(true)
    setError("")

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not found")

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png')
      })

      // Create form data
      const formData = new FormData()
      formData.append('signature', blob, 'signature.png')

      const response = await fetch('/api/contract/sign', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit signature')
      }

      // Success - redirect to onboarding
      router.push('/onboarding')
    } catch (err: any) {
      console.error('Error submitting signature:', err)
      setError(err.message || 'Failed to submit signature')
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900">
        <div className="text-white text-lg">Loading your employment contract...</div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 p-4">
        <Card className="max-w-md p-6 bg-slate-800/50 backdrop-blur border-slate-700">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center mb-2">Error Loading Contract</h2>
          <p className="text-slate-300 text-center mb-4">{error}</p>
          <Button onClick={() => router.push('/staff')} className="w-full">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (!contract) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Employment Contract</h1>
              <p className="text-slate-300">Please review and sign your employment contract</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">
                Progress: {checkedCount} of {sections.length} sections reviewed
              </span>
              <span className="text-sm text-slate-300">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>

        {/* Contract Content */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
          <div className="max-h-[60vh] overflow-y-auto space-y-8 pr-2">
            {/* Section 1: Employment Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-600 pb-2">
                Section 1: Employment Details
              </h3>
              <div className="grid gap-4 text-slate-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Employee Name</Label>
                    <p className="text-white font-medium">{contract.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Position</Label>
                    <p className="text-white font-medium">{contract.position}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Assigned Client</Label>
                    <p className="text-white font-medium">{contract.assignedClient}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Start Date</Label>
                    <p className="text-white font-medium">
                      {new Date(contract.startDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Contract Type</Label>
                  <p className="text-white font-medium">Project Employment Contract</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="section-0" 
                  checked={sectionsChecked[0]}
                  onCheckedChange={() => toggleSection(0)}
                />
                <Label 
                  htmlFor="section-0" 
                  className="text-slate-300 cursor-pointer"
                >
                  I have read and understood Section 1: Employment Details
                </Label>
              </div>
            </div>

            {/* Section 2: Compensation & Benefits */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-600 pb-2">
                Section 2: Compensation & Benefits
              </h3>
              <div className="grid gap-4 text-slate-300">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400">Basic Salary</Label>
                    <p className="text-white font-medium">PHP {contract.basicSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">De Minimis</Label>
                    <p className="text-white font-medium">PHP {contract.deMinimis.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Total Monthly Gross</Label>
                    <p className="text-white font-medium text-green-400">
                      PHP {contract.totalMonthlyGross.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">HMO Coverage</Label>
                  <p className="text-white">{contract.hmoOffer}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="section-1" 
                  checked={sectionsChecked[1]}
                  onCheckedChange={() => toggleSection(1)}
                />
                <Label 
                  htmlFor="section-1" 
                  className="text-slate-300 cursor-pointer"
                >
                  I have read and understood Section 2: Compensation & Benefits
                </Label>
              </div>
            </div>

            {/* Section 3: Work Schedule & Duration */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-600 pb-2">
                Section 3: Work Schedule & Duration
              </h3>
              <div className="grid gap-4 text-slate-300">
                <div>
                  <Label className="text-slate-400">Work Schedule</Label>
                  <p className="text-white font-medium">{contract.workSchedule}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Probationary Period</Label>
                  <p className="text-white">{contract.probationaryPeriod}</p>
                </div>
                <Alert className="bg-blue-900/30 border-blue-600">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-100">
                    During the probationary period, your performance will be evaluated. 
                    Successful completion leads to regular employment status.
                  </AlertDescription>
                </Alert>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="section-2" 
                  checked={sectionsChecked[2]}
                  onCheckedChange={() => toggleSection(2)}
                />
                <Label 
                  htmlFor="section-2" 
                  className="text-slate-300 cursor-pointer"
                >
                  I have read and understood Section 3: Work Schedule & Duration
                </Label>
              </div>
            </div>

            {/* Section 4: Leave & Time Off */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-600 pb-2">
                Section 4: Leave & Time Off
              </h3>
              <div className="grid gap-4 text-slate-300">
                <div>
                  <Label className="text-slate-400">Paid Leave Policy</Label>
                  <p className="text-white">{contract.paidLeave}</p>
                </div>
                <Alert className="bg-green-900/30 border-green-600">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-100">
                    Leave credits are earned monthly and can be used for vacation, sick leave, 
                    or personal matters. Please coordinate with your manager for leave requests.
                  </AlertDescription>
                </Alert>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="section-3" 
                  checked={sectionsChecked[3]}
                  onCheckedChange={() => toggleSection(3)}
                />
                <Label 
                  htmlFor="section-3" 
                  className="text-slate-300 cursor-pointer"
                >
                  I have read and understood Section 4: Leave & Time Off
                </Label>
              </div>
            </div>

            {/* Section 5: Terms & Conditions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-600 pb-2">
                Section 5: Terms & Conditions
              </h3>
              <div className="space-y-3 text-slate-300">
                <p>
                  By signing this contract, you acknowledge and agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Comply with all company policies and procedures</li>
                  <li>Maintain confidentiality of company and client information</li>
                  <li>Perform your duties to the best of your ability</li>
                  <li>Report to your designated supervisor/manager</li>
                  <li>Follow the work schedule and attendance requirements</li>
                  <li>Comply with Philippine labor laws and regulations</li>
                </ul>
                <Alert className="bg-yellow-900/30 border-yellow-600 mt-4">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-100">
                    This contract is governed by Philippine labor laws. Any disputes shall be 
                    resolved in accordance with applicable laws and regulations.
                  </AlertDescription>
                </Alert>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="section-4" 
                  checked={sectionsChecked[4]}
                  onCheckedChange={() => toggleSection(4)}
                />
                <Label 
                  htmlFor="section-4" 
                  className="text-slate-300 cursor-pointer"
                >
                  I have read and understood Section 5: Terms & Conditions
                </Label>
              </div>
            </div>
          </div>
        </Card>

        {/* Signature Section */}
        {allSectionsChecked && (
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Pen className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="text-xl font-semibold text-white">Your Signature</h3>
                  <p className="text-slate-300 text-sm">Draw your signature in the box below</p>
                </div>
              </div>

              <div className="border-2 border-slate-600 rounded-lg bg-white">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full h-[200px] cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>

              {error && (
                <Alert className="bg-red-900/30 border-red-600">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-100">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  disabled={signing}
                  className="flex-1"
                >
                  Clear Signature
                </Button>
                <Button
                  onClick={handleSubmitSignature}
                  disabled={!hasSignature || signing}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {signing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Sign Contract & Continue
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                By signing this contract, you confirm that you have read, understood, and agree 
                to all terms and conditions outlined above.
              </p>
            </div>
          </Card>
        )}

        {!allSectionsChecked && (
          <Card className="p-4 bg-blue-900/30 border-blue-600">
            <Alert>
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                Please review and check all {sections.length} sections before you can sign the contract.
              </AlertDescription>
            </Alert>
          </Card>
        )}
      </div>
    </div>
  )
}

