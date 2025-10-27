import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import GamifiedDashboard from "@/components/gamified-dashboard"

export default async function Home() {
  const session = await auth()

  // Must be logged in
  if (!session?.user?.email) {
    redirect("/login")
  }

  // Verify user exists in StaffUser table
  const staffUser = await prisma.staff_users.findUnique({
    where: { email: session.user.email }
  })

  if (!staffUser) {
    // Check if they're a management user
    const managementUser = await prisma.management_users.findUnique({
      where: { email: session.user.email }
    })

    if (managementUser) {
      // Redirect management users to admin portal
      redirect("/admin")
    }

    // Check if they're a client user
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email }
    })

    if (clientUser) {
      // Redirect client users to client portal
      redirect("/client")
    }

    // Not a valid user - redirect to staff login
    redirect("/login/staff")
  }

  // Check if staff user is inactive (revoked access after offboarding)
  // @ts-ignore - active field exists but not in generated types yet
  if ((staffUser as any).active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-4 p-8 max-w-md">
          <h1 className="text-3xl font-bold text-white">Account Deactivated</h1>
          <p className="text-slate-300">
            Your account has been deactivated. If you believe this is an error, please contact your administrator.
          </p>
          <form action="/api/auth/signout" method="POST">
            <button 
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <GamifiedDashboard offboardingData={staffUser?.offboarding} />
}
