"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Eye, CheckCircle2, Clock, AlertCircle, FileText, Circle, CircleDot, PlayCircle, PauseCircle, Play, FileCheck } from "lucide-react"

interface StaffOnboarding {
  id: string
  name: string
  email: string
  onboarding: {
    completionPercent: number
    isComplete: boolean
    personalInfoStatus: string
    govIdStatus: string
    documentsStatus: string
    signatureStatus: string
    emergencyContactStatus: string
    updatedAt: string
  } | null
  contractStatus: string
}

export default function AdminOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState<StaffOnboarding[]>([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchStaffList()
  }, [filter])

  const fetchStaffList = async () => {
    try {
      const response = await fetch(`/api/admin/staff/onboarding?filter=${filter}`)
      if (!response.ok) throw new Error("Failed to fetch staff list")
      
      const data = await response.json()
      setStaffList(data.staff)
    } catch (err) {
      console.error("Failed to load staff list:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (percent: number, isComplete: boolean) => {
    if (isComplete) {
      return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Verified & Complete</Badge>
    } else if (percent === 100) {
      return <Badge className="bg-blue-600"><FileText className="h-3 w-3 mr-1" />Ready for Verification</Badge>
    } else if (percent >= 80) {
      return <Badge className="bg-blue-500"><CircleDot className="h-3 w-3 mr-1" />Almost Complete</Badge>
    } else if (percent >= 60) {
      return <Badge className="bg-green-500"><PlayCircle className="h-3 w-3 mr-1" />In Progress</Badge>
    } else if (percent >= 40) {
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Halfway</Badge>
    } else if (percent >= 20) {
      return <Badge className="bg-orange-500"><PauseCircle className="h-3 w-3 mr-1" />Started</Badge>
    } else {
      return <Badge className="bg-red-500"><Play className="h-3 w-3 mr-1" />Just Started</Badge>
    }
  }

  const getContractBadge = (status: string) => {
    switch(status) {
      case "Approved":
        return <Badge className="bg-green-600"><FileCheck className="h-3 w-3 mr-1" />Approved</Badge>
      case "Signed":
        return <Badge className="bg-blue-500"><FileText className="h-3 w-3 mr-1" />Signed</Badge>
      case "Pending":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400"><AlertCircle className="h-3 w-3 mr-1" />No Contract</Badge>
    }
  }

  const getPendingSections = (onboarding: StaffOnboarding["onboarding"]) => {
    if (!onboarding) return 0
    let count = 0
    if (onboarding.personalInfoStatus === "SUBMITTED") count++
    if (onboarding.govIdStatus === "SUBMITTED") count++
    if (onboarding.documentsStatus === "SUBMITTED") count++
    if (onboarding.signatureStatus === "SUBMITTED") count++
    if (onboarding.emergencyContactStatus === "SUBMITTED") count++
    return count
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">
            Staff Onboarding Management
          </h1>
          <p className="text-slate-400">
            Review and verify staff onboarding submissions
          </p>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="all">All Staff</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Staff List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Staff Members</CardTitle>
            <CardDescription className="text-slate-400">
              {staffList.length} staff member{staffList.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staffList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No staff members found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Progress</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Contract Status</TableHead>
                    <TableHead className="text-slate-300">Pending Review</TableHead>
                    <TableHead className="text-slate-300">Last Updated</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => {
                    const pending = getPendingSections(staff.onboarding)
                    return (
                      <TableRow key={staff.id} className="border-slate-700">
                        <TableCell className="text-white font-medium">
                          {staff.name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {staff.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${staff.onboarding?.completionPercent || 0}%` }}
                              />
                            </div>
                            <span className="text-slate-300 text-sm">
                              {staff.onboarding?.completionPercent || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            staff.onboarding?.completionPercent || 0,
                            staff.onboarding?.isComplete || false
                          )}
                        </TableCell>
                        <TableCell>
                          {getContractBadge(staff.contractStatus)}
                        </TableCell>
                        <TableCell>
                          {pending > 0 ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {pending} section{pending !== 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {staff.onboarding?.updatedAt
                            ? new Date(staff.onboarding.updatedAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => router.push(`/admin/staff/onboarding/${staff.id}`)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

