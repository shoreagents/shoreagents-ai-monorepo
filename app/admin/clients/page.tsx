import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Mail, Phone, MapPin, ExternalLink } from "lucide-react"
import Link from "next/link"

async function getCompanies() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        clientUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        staffUsers: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        accountManager: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return companies
  } catch (error) {
    console.error('Error fetching companies:', error)
    return []
  }
}

export default async function AdminClientsPage() {
  const companies = await getCompanies()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Client Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client companies and their relationships
          </p>
        </div>
        <Button className="gap-2">
          <Building2 className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Companies</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{companies.length}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Active Clients</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">
            {companies.filter(c => c.isActive).length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Staff Assigned</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">
            {companies.reduce((acc, c) => acc + c.staffUsers.length, 0)}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Client Users</div>
          <div className="text-2xl font-semibold text-purple-500 mt-1">
            {companies.reduce((acc, c) => acc + c.clientUsers.length, 0)}
          </div>
        </Card>
      </div>

      {/* Companies List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Company Logo/Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                    {company.logo ? (
                      <img src={company.logo} alt={company.companyName} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <Building2 className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{company.companyName}</h3>
                    {company.tradingName && company.tradingName !== company.companyName && (
                      <p className="text-xs text-muted-foreground">{company.tradingName}</p>
                    )}
                  </div>
                </div>

                {/* Company Status */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={company.isActive ? "default" : "secondary"} className="text-xs">
                    {company.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {company.industry && (
                    <Badge variant="outline" className="text-xs">
                      {company.industry}
                    </Badge>
                  )}
                </div>

                {/* Company Details */}
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {company.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{company.location}</span>
                    </div>
                  )}
                  {company.billingEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span className="text-xs truncate">{company.billingEmail}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs">{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-lg bg-muted/30 p-2 text-center">
                    <div className="text-xs text-muted-foreground">Staff</div>
                    <div className="text-lg font-semibold text-foreground">{company.staffUsers.length}</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2 text-center">
                    <div className="text-xs text-muted-foreground">Users</div>
                    <div className="text-lg font-semibold text-foreground">{company.clientUsers.length}</div>
                  </div>
                </div>

                {/* Account Manager */}
                {company.accountManager && (
                  <div className="rounded-lg bg-muted/30 p-3 mb-4">
                    <div className="text-xs text-muted-foreground mb-1">Account Manager</div>
                    <div className="font-medium text-sm text-foreground">{company.accountManager.name}</div>
                    <div className="text-xs text-muted-foreground">{company.accountManager.department}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/admin/clients/${company.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <Card className="p-12 border-border bg-card text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Companies Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding your first client organization
          </p>
          <Button>
            <Building2 className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Card>
      )}
    </div>
  )
}

