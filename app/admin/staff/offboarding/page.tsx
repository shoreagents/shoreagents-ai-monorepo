"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function AdminOffboardingDashboard() {
  const [loading, setLoading] = useState(true)
  const [offboardings, setOffboardings] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOffboardings()
  }, [filter])

  async function fetchOffboardings() {
    try {
      const response = await fetch(`/api/admin/staff/offboarding?filter=${filter}`)
      const data = await response.json()
      setOffboardings(data.offboardings || [])
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
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
        <h1 className="text-3xl font-bold">Staff Offboarding</h1>
      </div>
      
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={filter} className="space-y-4 mt-6">
          {offboardings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No offboarding records found
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
                      <Link href={`/admin/staff/offboarding/${offboarding.staffUserId}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
