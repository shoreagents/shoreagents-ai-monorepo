"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function StaffSignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!name || !email || !password) {
      setError("Name, email, and password are required")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed")
      }

      // Success - redirect to login
      router.push("/login/staff?registered=true")
    } catch (err: any) {
      setError(err.message || "Sign up failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4">
      <Card className="w-full max-w-2xl p-8 bg-slate-800/50 backdrop-blur border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 mb-4">
            <span className="text-2xl font-bold text-white">SP</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
          <p className="text-slate-400">Join as BPO Worker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <Label className="text-slate-300">Full Name *</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-slate-300">Email Address *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label className="text-slate-300">Password *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-slate-300">Confirm Password *</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <Label className="text-slate-300">Phone (Optional)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-12 text-base"
          >
            {loading ? "Creating Account..." : "Create Staff Account"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login/staff"
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-xs text-purple-400 font-semibold mb-1">
            🏢 For BPO Workers Only
          </p>
          <p className="text-xs text-purple-300">
            This portal is for offshore staff members. Your account will be linked to a company by management after registration.
          </p>
        </div>
      </Card>
    </div>
  )
}

