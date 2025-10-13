"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Eye } from "@/components/admin/icons"

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [employmentFilter, setEmploymentFilter] = useState("all")

  useEffect(() => {
    fetchStaff()
  }, [employmentFilter])

  async function fetchStaff() {
    try {
      setLoading(true)
      const url = employmentFilter !== "all" 
        ? `/api/admin/staff?employmentStatus=${employmentFilter.toUpperCase()}`
        : `/api/admin/staff`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setStaff(data.staff || [])
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage offshore staff members and profiles</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search staff..." className="pl-10" />
            </div>
          </div>
          <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="probation">Probation</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Staff Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Assignments</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Days Employed</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading staff...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{member.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">{member.profile?.currentRole || "N/A"}</div>
                      <Badge variant="outline" size="sm">{member.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.profile?.employmentStatus === "REGULAR" ? "default" : "secondary"}>
                        {member.profile?.employmentStatus || "N/A"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">{member.activeAssignments || 0} active</div>
                      {member.assignments?.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {member.assignments[0].client.companyName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {member.profile?.daysEmployed || 0} days
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">Level {member.level || 1}</div>
                      <div className="text-xs text-muted-foreground">{member.xp || 0} XP</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                          <Eye className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                          <Edit className="size-3.5" />
                        </Button>
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
