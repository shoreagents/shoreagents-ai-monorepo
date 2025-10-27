"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function OffboardingExitForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [offboarding, setOffboarding] = useState<any>(null)
  const [formData, setFormData] = useState({
    reasonForLeaving: "",
    experienceRating: "",
    managerSupport: "",
    wouldRecommend: "",
    suggestions: "",
    laptopReturned: false,
    accessCardsReturned: false,
    documentsReturned: false,
    acknowledged: false
  })

  useEffect(() => {
    checkOffboardingStatus()
  }, [])

  async function checkOffboardingStatus() {
    try {
      const response = await fetch("/api/offboarding")
      const data = await response.json()

      if (!data.offboarding) {
        router.push("/")
        return
      }

      if (data.offboarding.exitInterviewCompleted) {
        router.push("/")
        return
      }

      setOffboarding(data.offboarding)
      setLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.acknowledged) {
      alert("Please acknowledge that you have reviewed the information")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/offboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error("Failed")

      router.push("/")
    } catch (error) {
      alert("Failed to submit exit form")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!offboarding) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Exit Interview & Offboarding</CardTitle>
          <CardDescription>
            Your last working day is {new Date(offboarding.lastWorkingDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Exit Interview</h3>

            <div>
              <Label>What is your primary reason for leaving?</Label>
              <Textarea
                value={formData.reasonForLeaving}
                onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>How would you rate your overall experience?</Label>
              <RadioGroup value={formData.experienceRating} onValueChange={(value) => setFormData({ ...formData, experienceRating: value })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id="excellent" />
                  <Label htmlFor="excellent">Excellent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="good" />
                  <Label htmlFor="good">Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fair" id="fair" />
                  <Label htmlFor="fair">Fair</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="poor" />
                  <Label htmlFor="poor">Poor</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Did your manager provide adequate support?</Label>
              <RadioGroup value={formData.managerSupport} onValueChange={(value) => setFormData({ ...formData, managerSupport: value })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Would you recommend ShoreAgents to others?</Label>
              <RadioGroup value={formData.wouldRecommend} onValueChange={(value) => setFormData({ ...formData, wouldRecommend: value })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="rec-yes" />
                  <Label htmlFor="rec-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="rec-no" />
                  <Label htmlFor="rec-no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Any suggestions for improvement?</Label>
              <Textarea
                value={formData.suggestions}
                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Equipment Return</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="laptop"
                  checked={formData.laptopReturned}
                  onCheckedChange={(checked) => setFormData({ ...formData, laptopReturned: checked as boolean })}
                />
                <Label htmlFor="laptop">Laptop/Computer Equipment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cards"
                  checked={formData.accessCardsReturned}
                  onCheckedChange={(checked) => setFormData({ ...formData, accessCardsReturned: checked as boolean })}
                />
                <Label htmlFor="cards">Access Cards/Keys</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="docs"
                  checked={formData.documentsReturned}
                  onCheckedChange={(checked) => setFormData({ ...formData, documentsReturned: checked as boolean })}
                />
                <Label htmlFor="docs">Company Documents</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledge"
                checked={formData.acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, acknowledged: checked as boolean })}
              />
              <Label htmlFor="acknowledge" className="leading-normal">
                I acknowledge that I have reviewed all information and confirm its accuracy.
              </Label>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!formData.acknowledged || submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit Exit Form</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
