import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Plus, Mail, Phone, Building2, Edit, Trash2, Eye } from "@/components/admin/icons"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getClientUsers() {
  try {
    // Direct database query (server-side)
    const clientUsers = await prisma.clientUser.findMany({
      include: {
        client: true,
        managedOffshoreStaff: {
          where: { isActive: true },
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return clientUsers
  } catch (error) {
    console.error('Error fetching client users:', error)
    return []
  }
}

const getRoleBadge = (role: string) => {
  const variants: Record<string, string> = {
    ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    MANAGER: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    VIEWER: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }
  return variants[role] || variants.VIEWER
}

export default async function ClientUsersPage() {
  const clientUsers = await getClientUsers()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Client Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage client portal access and permissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
          <Button className="gap-2 bg-primary">
            <Plus className="size-4" />
            Add Client User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, or company..." className="pl-9" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="active">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
              <SelectItem value="all">All Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Client Users Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Last Login
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Managed Staff
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No client users found.
                  </td>
                </tr>
              ) : (
                clientUsers.map((user: any) => {
                  const roleBadge = getRoleBadge(user.role)
                  return (
                    <tr key={user.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Building2 className="size-4 text-muted-foreground" />
                          {user.client?.companyName || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="size-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={roleBadge}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">
                          {user.managedOffshoreStaff?.length || 0} staff
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Eye className="size-3.5" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Edit className="size-3.5" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive">
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{clientUsers.length}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Active Users</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">
            {clientUsers.filter((u: any) => u.status === "ACTIVE").length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Managers</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">
            {clientUsers.filter((u: any) => u.role === "MANAGER").length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Admins</div>
          <div className="text-2xl font-semibold text-purple-500 mt-1">
            {clientUsers.filter((u: any) => u.role === "ADMIN").length}
          </div>
        </Card>
      </div>
    </div>
  )
}
