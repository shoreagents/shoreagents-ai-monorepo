"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Eye, Users } from "@/components/admin/icons"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/clients')
      const data = await res.json()
      if (data.success) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Client Organizations</h1>
          <p className="text-sm text-muted-foreground">Manage client companies and their staff assignments</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-10" />
        </div>
      </Card>

      {/* Clients Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Offshore Staff</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Managers</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">{client.companyName}</div>
                      <div className="text-xs text-muted-foreground">{client.billingEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{client.industry}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{client.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {client.offshoreStaffCount || 0}
                        </span>
                      </div>
                      {client.offshoreStaff?.length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {client.offshoreStaff.slice(0, 2).map((assignment: any) => assignment.staff?.name).join(", ")}
                          {client.offshoreStaff.length > 2 && ` +${client.offshoreStaff.length - 2} more`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">{client.managers?.length || 0} users</div>
                      {client.managers?.length > 0 && (
                        <div className="text-xs text-muted-foreground">{client.managers[0].name}</div>
                      )}
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
