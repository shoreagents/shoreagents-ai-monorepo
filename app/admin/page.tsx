import { auth } from "@/lib/auth"
import { Card } from "@/components/ui/card"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login/admin")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Shore Agents Management Portal
        </p>
      </div>

      {/* User Info Card */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-semibold mb-4">Logged In As:</h2>
        <div className="space-y-2">
          <p className="text-foreground">
            <span className="font-medium">Name:</span> {session?.user?.name || "N/A"}
          </p>
          <p className="text-foreground">
            <span className="font-medium">Email:</span> {session?.user?.email || "N/A"}
          </p>
          <p className="text-foreground">
            <span className="font-medium">Role:</span> <span className="text-xl font-bold text-green-500">{session?.user?.role || "N/A"}</span>
          </p>
          <p className="text-foreground">
            <span className="font-medium">User ID:</span> {session?.user?.id || "N/A"}
          </p>
        </div>
      </Card>

      {/* Status Card */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-foreground">✅ Authentication: Working</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-foreground">✅ Supabase Auth: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-foreground">✅ Management User: Created</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-foreground">🚧 Features: In Development</span>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
        <ul className="space-y-2 text-foreground">
          <li>• Set up Staff Users (BPO Workers) authentication</li>
          <li>• Set up Client Users authentication</li>
          <li>• Build Staff Management features</li>
          <li>• Build Client Management features</li>
          <li>• Integrate time tracking, tasks, reviews, etc.</li>
        </ul>
      </Card>
    </div>
  )
}
