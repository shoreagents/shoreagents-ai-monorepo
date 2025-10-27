"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle2, UserMinus } from "lucide-react"
import Link from "next/link"

export default function ClientOffboardingPage() {
  const [loading, setLoading] = useState(true)
  const [offboardings, setOffboardings] = useState<any[]>([])

  useEffect(() => {
    fetchOffboardings()
  }, [])

  async function fetchOffboardings() {
    try {
      const response = await fetch("/api/client/offboarding")
      const data = await response.json()
      setOffboardings(data.offboardings || [])
      setLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      INITIATED: { variant: "secondary", label: "Initiated" },
      PENDING_EXIT: { variant: "warning", label: "Pending Exit Form" },
      PROCESSING: { variant: "default", label: "Processing" },
      COMPLETED: { variant: "success", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" }
    }
    const config = variants[status] || variants.INITIATED
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Offboarding</h1>
          <p className="text-muted-foreground">View offboarding processes for your company staff</p>
        </div>
      </div>

      {offboardings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserMinus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Offboarding Records</h3>
            <p className="text-muted-foreground">
              No staff members are currently in the offboarding process
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {offboardings.map((offboarding) => (
            <Card key={offboarding.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {offboarding.staffUser.name}
                      </h3>
                      {getStatusBadge(offboarding.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Reason: {offboarding.reason.replace('_', ' ')}</p>
                      <p>Last Working Day: {new Date(offboarding.lastWorkingDate).toLocaleDateString()}</p>
                      <p>Exit Form: {offboarding.exitInterviewCompleted ? '✅ Completed' : '⏳ Pending'}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {offboarding.equipmentReturned && (
                        <Badge variant="outline">Equipment Returned</Badge>
                      )}
                      {offboarding.accessRevoked && (
                        <Badge variant="outline">Access Revoked</Badge>
                      )}
                      {offboarding.finalPaymentProcessed && (
                        <Badge variant="outline">Payment Processed</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Initiated: {new Date(offboarding.createdAt).toLocaleDateString()}</p>
                    {offboarding.completedAt && (
                      <p>Completed: {new Date(offboarding.completedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
