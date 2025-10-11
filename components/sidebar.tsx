"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Coffee,
  Activity,
  Star,
  Users,
  MessageSquare,
  FileText,
  Menu,
  X,
  Headphones,
  Trophy,
  LogOut,
  Clock,
} from "lucide-react"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile", icon: User, label: "My Profile" },
  { href: "/time-tracking", icon: Clock, label: "Time Tracking" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/breaks", icon: Coffee, label: "Breaks" },
  { href: "/performance", icon: Activity, label: "Performance" },
  { href: "/reviews", icon: Star, label: "Reviews" },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/ai-assistant", icon: MessageSquare, label: "AI Assistant" },
  { href: "/tickets", icon: Headphones, label: "Support Tickets" },
  { href: "/activity", icon: FileText, label: "Activity Log" },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass fixed left-4 top-4 z-50 rounded-xl p-3 text-white shadow-xl transition-transform hover:scale-105 lg:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`glass fixed left-0 top-0 z-40 h-screen w-64 transform space-y-6 overflow-y-auto p-6 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-2">
          <div className="gradient-purple-indigo flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white shadow-lg">
            SP
          </div>
          <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          <p className="text-sm text-white/60">Performance Dashboard</p>
        </div>

        <div className="glass space-y-3 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="gradient-purple-indigo flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg">
              MS
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Maria Santos</div>
              <div className="text-xs text-white/60">TechCorp Inc.</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-xs text-white/60">Level 12</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">98 pts</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-all ${
                  isActive ? "bg-white/10 text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="glass space-y-3 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Today's Activity</div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Active Time</span>
              <span className="text-sm font-semibold text-white">6h 32m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Tasks Done</span>
              <span className="text-sm font-semibold text-white">8/12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Breaks Taken</span>
              <span className="text-sm font-semibold text-white">3</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg bg-red-500/10 px-4 py-3 font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </aside>
    </>
  )
}
