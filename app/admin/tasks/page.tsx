"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ListTodo, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminTasksPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ListTodo className="h-8 w-8 text-purple-400" />
            Task Management
          </h1>
          <p className="text-slate-400">Manage and assign tasks to your team</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              Coming Soon
            </CardTitle>
            <CardDescription className="text-slate-300">
              Task management features are currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-400">
                The task management system will include:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Create and assign tasks to staff members
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Track task progress and completion
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Set priorities and deadlines
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Monitor team productivity
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Generate task reports and analytics
                </li>
              </ul>
              <div className="pt-4">
                <Badge className="bg-yellow-600">
                  <Clock className="h-3 w-3 mr-1" />
                  In Development
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

