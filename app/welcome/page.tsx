"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, Heart, Coffee, Music, Gamepad2, BookOpen, Camera, Plane, Utensils, Palette, GamepadIcon, Star, Users, Home } from "lucide-react"

interface WelcomeFormData {
  // Auto-filled fields
  name: string
  client: string
  startDate: string
  
  // Required field
  favoriteFastFood: string
  
  // Optional fields
  favoriteColor?: string
  favoriteMusic?: string
  favoriteMovie?: string
  favoriteBook?: string
  hobby?: string
  dreamDestination?: string
  favoriteSeason?: string
  petName?: string
  favoriteSport?: string
  favoriteGame?: string
  favoriteQuote?: string
  funFact?: string
  additionalInfo?: string
}

export default function WelcomePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<WelcomeFormData>({
    name: "",
    client: "",
    startDate: "",
    favoriteFastFood: "",
    favoriteColor: "",
    favoriteMusic: "",
    favoriteMovie: "",
    favoriteBook: "",
    hobby: "",
    dreamDestination: "",
    favoriteSeason: "",
    petName: "",
    favoriteSport: "",
    favoriteGame: "",
    favoriteQuote: "",
    funFact: "",
    additionalInfo: ""
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  // Load staff profile data on mount
  useEffect(() => {
    const loadStaffProfile = async () => {
      try {
        const response = await fetch('/api/welcome')
        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({
            ...prev,
            name: data.name || "",
            client: data.client || "",
            startDate: data.startDate || ""
          }))
        }
      } catch (error) {
        console.error('Failed to load staff profile:', error)
      }
    }
    
    loadStaffProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.favoriteFastFood.trim()) {
      setError("Please tell us your favorite fast food!")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setError(data.error || 'Failed to submit welcome form')
      }
    } catch (error) {
      setError('Failed to submit welcome form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof WelcomeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Team! 🎉</h2>
            <p className="text-slate-300 mb-4">
              Thanks for sharing a bit about yourself! We're excited to have you on board.
            </p>
            <p className="text-slate-400 text-sm">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to ShoreAgents! <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            Let's get to know you better
          </p>
          <p className="text-slate-400">
            Help us create a more personalized experience by sharing some fun facts about yourself
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Auto-filled Information */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Information
              </CardTitle>
              <CardDescription className="text-slate-300">
                This information is pre-filled from your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm">Full Name</Label>
                  <Input
                    value={formData.name}
                    disabled
                    className="bg-slate-800/50 border-slate-600 text-slate-300"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Client</Label>
                  <Input
                    value={formData.client}
                    disabled
                    className="bg-slate-800/50 border-slate-600 text-slate-300"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Start Date</Label>
                  <Input
                    value={formData.startDate}
                    disabled
                    className="bg-slate-800/50 border-slate-600 text-slate-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Field */}
          <Card className="bg-linear-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Quick Question <span className="text-orange-400">*</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                This one is required - we need to know your go-to fast food! 🍔
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="favoriteFastFood" className="text-slate-300 text-sm">
                  What's your favorite fast food?
                </Label>
                <Input
                  id="favoriteFastFood"
                  value={formData.favoriteFastFood}
                  onChange={(e) => handleInputChange('favoriteFastFood', e.target.value)}
                  placeholder="e.g., McDonald's, Jollibee, KFC..."
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Optional Fields */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Tell Us About Yourself
              </CardTitle>
              <CardDescription className="text-slate-300">
                All of these are optional - share as much or as little as you'd like!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Row 1 */}
                <div>
                  <Label htmlFor="favoriteColor" className="text-slate-300 text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Favorite Color
                  </Label>
                  <Input
                    id="favoriteColor"
                    value={formData.favoriteColor}
                    onChange={(e) => handleInputChange('favoriteColor', e.target.value)}
                    placeholder="e.g., Ocean Blue, Forest Green..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="favoriteMusic" className="text-slate-300 text-sm flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Favorite Music Genre
                  </Label>
                  <Input
                    id="favoriteMusic"
                    value={formData.favoriteMusic}
                    onChange={(e) => handleInputChange('favoriteMusic', e.target.value)}
                    placeholder="e.g., Pop, Rock, Jazz, K-Pop..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <Label htmlFor="favoriteMovie" className="text-slate-300 text-sm flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Favorite Movie
                  </Label>
                  <Input
                    id="favoriteMovie"
                    value={formData.favoriteMovie}
                    onChange={(e) => handleInputChange('favoriteMovie', e.target.value)}
                    placeholder="e.g., The Matrix, Inception..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="favoriteBook" className="text-slate-300 text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Favorite Book
                  </Label>
                  <Input
                    id="favoriteBook"
                    value={formData.favoriteBook}
                    onChange={(e) => handleInputChange('favoriteBook', e.target.value)}
                    placeholder="e.g., Harry Potter, The Great Gatsby..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Row 3 */}
                <div>
                  <Label htmlFor="hobby" className="text-slate-300 text-sm flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Hobby
                  </Label>
                  <Input
                    id="hobby"
                    value={formData.hobby}
                    onChange={(e) => handleInputChange('hobby', e.target.value)}
                    placeholder="e.g., Photography, Cooking, Gaming..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="dreamDestination" className="text-slate-300 text-sm flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Dream Destination
                  </Label>
                  <Input
                    id="dreamDestination"
                    value={formData.dreamDestination}
                    onChange={(e) => handleInputChange('dreamDestination', e.target.value)}
                    placeholder="e.g., Japan, Iceland, New Zealand..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Row 4 */}
                <div>
                  <Label htmlFor="favoriteSeason" className="text-slate-300 text-sm">
                    Favorite Season
                  </Label>
                  <Select value={formData.favoriteSeason} onValueChange={(value) => handleInputChange('favoriteSeason', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select a season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">🌸 Spring</SelectItem>
                      <SelectItem value="summer">☀️ Summer</SelectItem>
                      <SelectItem value="autumn">🍂 Autumn</SelectItem>
                      <SelectItem value="winter">❄️ Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="petName" className="text-slate-300 text-sm">
                    Pet Name (if you have one)
                  </Label>
                  <Input
                    id="petName"
                    value={formData.petName}
                    onChange={(e) => handleInputChange('petName', e.target.value)}
                    placeholder="e.g., Buddy, Luna, Max..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Row 5 */}
                <div>
                  <Label htmlFor="favoriteSport" className="text-slate-300 text-sm">
                    Favorite Sport
                  </Label>
                  <Input
                    id="favoriteSport"
                    value={formData.favoriteSport}
                    onChange={(e) => handleInputChange('favoriteSport', e.target.value)}
                    placeholder="e.g., Basketball, Soccer, Tennis..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="favoriteGame" className="text-slate-300 text-sm flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Favorite Game
                  </Label>
                  <Input
                    id="favoriteGame"
                    value={formData.favoriteGame}
                    onChange={(e) => handleInputChange('favoriteGame', e.target.value)}
                    placeholder="e.g., Minecraft, Valorant, Chess..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Text Areas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="favoriteQuote" className="text-slate-300 text-sm">
                    Favorite Quote or Motto
                  </Label>
                  <Textarea
                    id="favoriteQuote"
                    value={formData.favoriteQuote}
                    onChange={(e) => handleInputChange('favoriteQuote', e.target.value)}
                    placeholder="Share a quote that inspires you..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="funFact" className="text-slate-300 text-sm">
                    Fun Fact About Yourself
                  </Label>
                  <Textarea
                    id="funFact"
                    value={formData.funFact}
                    onChange={(e) => handleInputChange('funFact', e.target.value)}
                    placeholder="Tell us something interesting about yourself..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalInfo" className="text-slate-300 text-sm">
                    Anything Else You'd Like to Share?
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Any other information you'd like your team to know about you..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.favoriteFastFood.trim()}
              className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-2" />
                  Submit Welcome Form
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
