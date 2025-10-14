import { Users, TrendingUp, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function ClientDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login/client")
  }

  const clientUser = await prisma.clientUser.findUnique({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!clientUser) {
    redirect("/login/client")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to {clientUser.company.companyName} Portal</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">1</h3>
            <p className="text-sm text-gray-600">Assigned Staff</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-sm text-gray-600">Tasks Completed</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-sm text-gray-600">Hours This Week</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">95%</h3>
            <p className="text-sm text-gray-600">Performance</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/client/staff">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View Staff
              </Button>
            </Link>
            <Link href="/client/knowledge-base">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Knowledge Base
              </Button>
            </Link>
            <Link href="/client/tasks">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Manage Tasks
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-12">
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500 mt-2">Activity from your staff will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}



