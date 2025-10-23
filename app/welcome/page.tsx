"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader2, PartyPopper } from "lucide-react"

export default function WelcomeFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [prefillData, setPrefillData] = useState<any>({})

  useEffect(() => {
    fetchWelcomeFormStatus()
  }, [])

  async function fetchWelcomeFormStatus() {
    try {
      const response = await fetch('/api/welcome')
      const data = await response.json()
      
      if (data.completed) {
        router.push('/staff')
        return
      }
      
      setPrefillData(data.prefillData || {})
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.favoriteFastFood) {
      alert('Favorite fast food is required!')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/staff')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      alert('Failed to save form')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 p-6">
      <Card className="max-w-3xl mx-auto bg-slate-800/50 backdrop-blur border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <PartyPopper className="h-8 w-8 text-purple-400" />
            <div>
              <CardTitle className="text-2xl text-white">Welcome to ShoreAgents! 🥳</CardTitle>
              <CardDescription className="text-slate-300">
                We're happy to have you! Help us get to know you better.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input value={prefillData.name || ''} disabled className="bg-slate-700/50 text-white border-slate-600" />
            </div>
            <div>
              <Label className="text-slate-300">Client</Label>
              <Input value={prefillData.clientCompany || ''} disabled className="bg-slate-700/50 text-white border-slate-600" />
            </div>
          </div>
          
          <Separator className="bg-slate-600" />
          
          <div>
            <Label className="text-slate-300">What is your goal at ShoreAgents?</Label>
            <Textarea 
              placeholder="Share your professional goals..."
              value={formData.goalAtShoreAgents || ''}
              onChange={(e) => setFormData({ ...formData, goalAtShoreAgents: e.target.value })}
              className="bg-slate-700/50 text-white border-slate-600"
            />
          </div>

          <div>
            <Label className="text-slate-300">What is your favourite fast food? *</Label>
            <Input 
              placeholder="Jollibee? McDonald's? Required field"
              value={formData.favoriteFastFood || ''}
              onChange={(e) => setFormData({ ...formData, favoriteFastFood: e.target.value })}
              className="bg-slate-700/50 text-white border-slate-600"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Required field</p>
          </div>

          <div>
            <Label className="text-slate-300">What is your favorite movie?</Label>
            <Input 
              placeholder="That one movie you can watch over and over..."
              value={formData.favoriteMovie || ''}
              onChange={(e) => setFormData({ ...formData, favoriteMovie: e.target.value })}
              className="bg-slate-700/50 text-white border-slate-600"
            />
          </div>

          <div>
            <Label className="text-slate-300">Do you have any pets?</Label>
            <Input 
              placeholder="Tell us about your furry friends!"
              value={formData.pets || ''}
              onChange={(e) => setFormData({ ...formData, pets: e.target.value })}
              className="bg-slate-700/50 text-white border-slate-600"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!formData.favoriteFastFood || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Submit & Continue to Dashboard'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

