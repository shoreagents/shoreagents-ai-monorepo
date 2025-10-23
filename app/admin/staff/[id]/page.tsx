import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Building2, 
  Mail, 
  Calendar, 
  ArrowLeft, 
  User as UserIcon,
  Briefcase,
  Phone,
  MapPin,
  Clock,
  Hash
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getStaffUser(id: string) {
  try {
    const staffUser = await prisma.staffUser.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            tradingName: true,
            industry: true,
            location: true,
            logo: true,
            isActive: true,
          },
        },
        onboarding: {
          select: {
            isComplete: true,
            completionPercent: true,
          },
        },
        profile: {
          select: {
            phone: true,
            location: true,
            currentRole: true,
          },
        },
      },
    })

    return staffUser
  } catch (error) {
    console.error('Error fetching staff user:', error)
    return null
  }
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const staffUser = await getStaffUser(id)

  if (!staffUser) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/staff">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Staff Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage staff member details
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Profile Card */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 ring-2 ring-white/10">
                <AvatarImage src={staffUser.avatar || undefined} alt={staffUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-2xl">
                  {staffUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-foreground">{staffUser.name}</h2>
                <p className="text-muted-foreground">{staffUser.email}</p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    <UserIcon className="h-3 w-3 mr-1" /> Staff Member
                  </Badge>
                  {staffUser.role && (
                    <Badge variant="outline" className="text-xs">
                      {staffUser.role}
                    </Badge>
                  )}
                  {staffUser.onboarding?.isComplete && (
                    <Badge className="text-xs bg-emerald-500">
                      Onboarding Complete
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {staffUser.profile?.currentRole && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Current Role</div>
                    <div className="font-medium text-foreground">{staffUser.profile.currentRole}</div>
                  </div>
                </div>
              )}
              {staffUser.profile?.phone && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium text-foreground">{staffUser.profile.phone}</div>
                  </div>
                </div>
              )}
              {staffUser.profile?.location && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="font-medium text-foreground">{staffUser.profile.location}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                  <div className="font-medium text-foreground">
                    {new Date(staffUser.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Assignment */}
          {staffUser.company && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Company Assignment</h3>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                  {staffUser.company.logo ? (
                    <img 
                      src={staffUser.company.logo} 
                      alt={staffUser.company.companyName} 
                      className="h-full w-full rounded-lg object-cover" 
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">{staffUser.company.companyName}</h4>
                    <Badge variant={staffUser.company.isActive ? "default" : "secondary"} className="text-xs">
                      {staffUser.company.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {staffUser.company.tradingName && staffUser.company.tradingName !== staffUser.company.companyName && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Trading as: {staffUser.company.tradingName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {staffUser.company.industry && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{staffUser.company.industry}</span>
                      </div>
                    )}
                    {staffUser.company.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{staffUser.company.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link href={`/admin/clients/${staffUser.company.id}`}>
                      <Button variant="outline" size="sm">
                        View Company Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!staffUser.company && (
            <Card className="p-6 border-border bg-card text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Company Assigned</h3>
              <p className="text-sm text-muted-foreground">
                This staff member is not currently assigned to any client company
              </p>
            </Card>
          )}
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Account Status</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">User ID</div>
                <div className="flex items-center gap-2 text-sm font-mono text-foreground">
                  <Hash className="h-3 w-3" />
                  <span className="truncate">{staffUser.id.slice(0, 8)}...</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Onboarding Status</div>
                {staffUser.onboarding ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground">
                      {staffUser.onboarding.completionPercent}% Complete
                    </div>
                    {staffUser.onboarding.isComplete && (
                      <Badge className="text-xs bg-emerald-500">✓</Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Not started</div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Account Created</div>
                <div className="text-sm text-foreground">
                  {new Date(staffUser.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm text-foreground">
                  {new Date(staffUser.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/admin/onboarding/${staffUser.id}`} className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <UserIcon className="h-4 w-4 mr-2" />
                  View Onboarding
                </Button>
              </Link>
              {staffUser.company && (
                <Link href={`/admin/clients/${staffUser.company.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Building2 className="h-4 w-4 mr-2" />
                    View Company
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

