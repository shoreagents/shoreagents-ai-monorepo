"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  Monitor,
  FileText,
  Briefcase,
  UserSearch,
  BookOpen,
  User,
  Trophy,
  Bell,
  Activity,
  Coffee,
  ClipboardList,
  Clock,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ClientSidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Don't render sidebar if not authenticated
  if (status === "unauthenticated" || !session) {
    return null
  }

  const navItems = [
    { href: "/client", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/profile", label: "Profile", icon: User },
    { href: "/client/staff", label: "Staff", icon: Users },
    { href: "/client/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/client/news-feed", label: "News Feed", icon: Bell },
    { href: "/client/activity", label: "Activity", icon: Activity },
    { href: "/client/breaks", label: "Breaks", icon: Coffee },
    { href: "/client/time-tracking", label: "Time Tracking", icon: Clock },
    { href: "/client/tasks", label: "Tasks", icon: ClipboardList },
    { href: "/client/monitoring", label: "Monitoring", icon: Monitor },
    { href: "/client/reviews", label: "Reviews", icon: FileText },
    { href: "/client/recruitment", label: "Recruitment", icon: Briefcase },
    { href: "/client/talent-pool", label: "Talent Pool", icon: UserSearch },
    { href: "/client/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">TechCorp Inc.</h2>
        <p className="text-sm text-gray-600 mt-1">Client Portal</p>
      </div>

      <ScrollArea className="h-[calc(100vh-88px)]">
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Portal Switcher - Dev Only */}
        <div className="p-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Staff Portal
          </Link>
        </div>
      </ScrollArea>
    </aside>
  )
}











