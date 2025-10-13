"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ActivityPage() {
  const activities = [
    {
      id: 1,
      type: "staff",
      action: "Sarah Chen clocked in",
      time: "2 minutes ago",
      icon: "👤",
      color: "text-blue-400",
    },
    {
      id: 2,
      type: "task",
      action: "Mike Johnson completed task #1247",
      time: "5 minutes ago",
      icon: "✓",
      color: "text-emerald-400",
    },
    {
      id: 3,
      type: "review",
      action: "Month 3 review scheduled for Emily Rodriguez",
      time: "12 minutes ago",
      icon: "📋",
      color: "text-purple-400",
    },
    {
      id: 4,
      type: "client",
      action: "New client organization added: TechStart Inc",
      time: "18 minutes ago",
      icon: "🏢",
      color: "text-indigo-400",
    },
    {
      id: 5,
      type: "ticket",
      action: "Support ticket #892 resolved",
      time: "23 minutes ago",
      icon: "🎫",
      color: "text-emerald-400",
    },
    {
      id: 6,
      type: "staff",
      action: "David Kim updated profile information",
      time: "31 minutes ago",
      icon: "👤",
      color: "text-blue-400",
    },
    {
      id: 7,
      type: "assignment",
      action: "Lisa Wang assigned to FinanceHub",
      time: "45 minutes ago",
      icon: "🔗",
      color: "text-orange-400",
    },
    {
      id: 8,
      type: "document",
      action: "New training document uploaded",
      time: "1 hour ago",
      icon: "📄",
      color: "text-gray-400",
    },
    {
      id: 9,
      type: "achievement",
      action: 'Sarah Chen earned "Perfect Week" badge',
      time: "1 hour ago",
      icon: "🏆",
      color: "text-yellow-400",
    },
    {
      id: 10,
      type: "review",
      action: "6-Month review completed for Mike Johnson",
      time: "2 hours ago",
      icon: "📋",
      color: "text-purple-400",
    },
  ]

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time system activity and events</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-950 border-white/20 p-4">
          <div className="flex gap-4">
            <select className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm">
              <option>All Activities</option>
              <option>Staff</option>
              <option>Tasks</option>
              <option>Reviews</option>
              <option>Clients</option>
              <option>Tickets</option>
            </select>
            <select className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm">
              <option>Last Hour</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-zinc-950 border-white/20">
          <div className="p-6">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-400 mt-1">{activity.time}</p>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-gray-400 flex-shrink-0">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    
  )
}
