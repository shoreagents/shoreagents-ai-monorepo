"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        toast.success("Login successful!")
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
          <p className="mt-2 text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="maria.santos@example.com"
                className="mt-1 bg-slate-800/50 text-white placeholder-slate-500 ring-1 ring-white/10 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1 bg-slate-800/50 text-white placeholder-slate-500 ring-1 ring-white/10 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 text-white hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-400">
          <p>Demo Account:</p>
          <p className="font-mono">maria.santos@techcorp.com / password123</p>
        </div>
      </div>
    </div>
  )
}

