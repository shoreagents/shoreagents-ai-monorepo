"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Eye, Calendar } from "@/components/admin/icons"
import { formatDate, formatReviewType } from "@/lib/review-schedule"

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("active")

  useEffect(() => {
    fetchAssignments()
  }, [filter])

  async function fetchAssignments() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/assignments?status=${filter}`)
      const data = await res.json()
      if (data.success) {
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReviewTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      MONTH_1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      MONTH_3: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      MONTH_5: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      RECURRING_6M: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    }
    return variants[type] || variants.MONTH_1
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      NOT_SENT: "bg-gray-500/20 text-gray-400",
      DUE_SOON: "bg-yellow-500/20 text-yellow-400",
      OVERDUE: "bg-red-500/20 text-red-400",
      COMPLETED: "bg-emerald-500/20 text-emerald-400",
    }
    return variants[status] || "bg-gray-500/20 text-gray-400"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Assignments</h1>
          <p className="text-sm text-muted-foreground">Manage staff-client assignments and review schedules</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          New Assignment
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Assignments Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Next Review</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No assignments found
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={assignment.staff?.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{assignment.staff?.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{assignment.staff?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">{assignment.client?.companyName || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">{assignment.manager?.name || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{assignment.role}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {assignment.startDate ? formatDate(new Date(assignment.startDate)) : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{assignment.daysEmployed || 0} days</td>
                    <td className="px-4 py-3">
                      {assignment.nextReview ? (
                        <div>
                          <Badge variant="outline" className={getReviewTypeBadge(assignment.nextReview.type)}>
                            {formatReviewType(assignment.nextReview.type)}
                          </Badge>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDate(new Date(assignment.nextReview.dueDate))}
                          </div>
                          <Badge variant="outline" className={getStatusBadge(assignment.nextReview.status)} size="sm">
                            {assignment.nextReview.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">All up to date</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={assignment.isActive ? "default" : "secondary"}>
                        {assignment.isActive ? "Active" : "Ended"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                          <Eye className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                          <Edit className="size-3.5" />
                        </Button>
                        {assignment.isActive && (
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive">
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
