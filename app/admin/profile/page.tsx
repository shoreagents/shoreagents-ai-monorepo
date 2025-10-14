import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileHeader } from "@/components/admin/profile-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login/admin")
  }

  // Fetch full management user profile
  const user = await prisma.managementUser.findUnique({
    where: { authUserId: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      coverPhoto: true,
      role: true,
      department: true,
      phone: true,
      createdAt: true,
    }
  })

  if (!user) {
    redirect("/login/admin")
  }

  return (
    <div className="space-y-6">
      {/* Profile Header with Cover & Avatar */}
      <ProfileHeader user={user} />

      {/* Profile Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Full Name</label>
              <p className="text-foreground font-medium">{user.name}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Phone</label>
              <p className="text-foreground font-medium">{user.phone || "Not provided"}</p>
            </div>
          </div>
        </Card>

        {/* Role & Department */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Role & Department</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <div className="mt-1">
                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  {user.role}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <p className="text-foreground font-medium">{user.department}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Member Since</label>
              <p className="text-foreground font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

