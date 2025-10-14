import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientProfileHeader } from "@/components/client/client-profile-header"
import { Card } from "@/components/ui/card"

export default async function ClientProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login/client")
  }

  const clientUser = await prisma.clientUser.findUnique({
    where: { email: session.user.email },
    include: {
      company: true
    }
  })

  if (!clientUser) {
    redirect("/login/client")
  }

  return (
    <div className="space-y-6">
      <ClientProfileHeader user={clientUser} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>Name:</strong> {clientUser.name}</p>
            <p><strong>Email:</strong> {clientUser.email}</p>
            <p><strong>Role:</strong> {clientUser.role}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Company Details</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>Company:</strong> {clientUser.company.companyName}</p>
            <p><strong>Organization ID:</strong> {clientUser.company.organizationId}</p>
            <p><strong>Industry:</strong> {clientUser.company.industry || "N/A"}</p>
            <p><strong>Location:</strong> {clientUser.company.location || "N/A"}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>Status:</strong> Active</p>
            <p><strong>Member Since:</strong> {clientUser.createdAt.toLocaleDateString()}</p>
            <p><strong>Last Login:</strong> Just now</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

