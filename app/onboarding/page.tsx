"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ClipboardCheck, CheckCircle, Lock, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import ContractSigningPage from "@/app/contract/page"
import OnboardingForm from "./onboarding-form"

export default function OnboardingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("contract")
  const [contractSigned, setContractSigned] = useState(false)
  const [allOnboardingSectionsSubmitted, setAllOnboardingSectionsSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkContractStatus()
  }, [])

  useEffect(() => {
    // Check onboarding status when activeTab changes to onboarding
    if (activeTab === "onboarding" && contractSigned) {
      checkOnboardingStatus()
    }
  }, [activeTab, contractSigned])

  async function checkContractStatus() {
    try {
      const response = await fetch('/api/contract')
      const data = await response.json()

      if (data.contract?.signed) {
        setContractSigned(true)
        setActiveTab("onboarding") // Auto-switch to onboarding if contract is signed
        
        // Also check if all onboarding sections are submitted
        await checkOnboardingStatus()
      }
    } catch (error) {
      console.error('Error checking contract status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkOnboardingStatus() {
    try {
      const response = await fetch('/api/onboarding')
      const data = await response.json()
      
      if (data.onboarding) {
        const { 
          personalInfoStatus, 
          resumeStatus, 
          govIdStatus, 
          educationStatus, 
          medicalStatus, 
          dataPrivacyStatus, 
          signatureStatus, 
          emergencyContactStatus 
        } = data.onboarding

        // Check if all sections are SUBMITTED or APPROVED
        const allSectionsSubmitted = 
          (personalInfoStatus === 'SUBMITTED' || personalInfoStatus === 'APPROVED') &&
          (resumeStatus === 'SUBMITTED' || resumeStatus === 'APPROVED') &&
          (govIdStatus === 'SUBMITTED' || govIdStatus === 'APPROVED') &&
          (educationStatus === 'SUBMITTED' || educationStatus === 'APPROVED') &&
          (medicalStatus === 'SUBMITTED' || medicalStatus === 'APPROVED') &&
          (dataPrivacyStatus === 'SUBMITTED' || dataPrivacyStatus === 'APPROVED') &&
          (signatureStatus === 'SUBMITTED' || signatureStatus === 'APPROVED') &&
          (emergencyContactStatus === 'SUBMITTED' || emergencyContactStatus === 'APPROVED')

        setAllOnboardingSectionsSubmitted(allSectionsSubmitted)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }

  const handleContractSigned = () => {
    setContractSigned(true)
    setActiveTab("onboarding")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pt-20 md:p-8 lg:pt-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center mb-8 mt-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to ShoreAgents! <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h1>
          <p className="text-slate-300 mb-4">
            Complete your onboarding process to begin your journey with us
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-800 border border-slate-700 h-10 p-0">
            <TabsTrigger 
              value="contract" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 data-[state=active]:shadow-lg h-10 flex items-center justify-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              1. Contract
              {contractSigned && <CheckCircle className="h-4 w-4 ml-2 text-green-400" />}
            </TabsTrigger>
            <TabsTrigger 
              value="onboarding"
              disabled={!contractSigned}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:shadow-lg h-10 flex items-center justify-center"
            >
              {contractSigned ? (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  2. Onboarding
                  {allOnboardingSectionsSubmitted && <CheckCircle className="h-4 w-4 ml-2 text-green-400" />}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  2. Onboarding
                </>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Contract Tab */}
          <TabsContent value="contract" className="mt-6">
            {!contractSigned && (
              <Alert className="mb-6 bg-blue-900/30 border-blue-700 text-blue-200">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Step 1 of 2:</strong> Please review and sign your employment contract below. 
                  Once signed, you'll be able to proceed to the onboarding form.
                </AlertDescription>
              </Alert>
            )}
            <ContractSigningPage onContractSigned={handleContractSigned} />
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="mt-6">
            {contractSigned ? (
              <OnboardingForm />
            ) : (
              <Alert className="bg-slate-800 border-slate-700 text-slate-300">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Complete the contract signing first to unlock the onboarding form.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Return to Dashboard Button - Bottom */}
        <div className="flex justify-center mt-8">
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
    </div>
  )
}

