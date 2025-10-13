import { Card } from "@/components/ui/card"

import { Coffee, Clock, Calendar } from "lucide-react"

export default function BreaksPage() {
  const breaks = [
    {
      id: 1,
      staff: "Maria Santos",
      date: "Today",
      breaks: [
        { type: "Morning Break", start: "10:00 AM", end: "10:15 AM", duration: "15 min" },
        { type: "Lunch Break", start: "12:00 PM", end: "1:00 PM", duration: "60 min" },
        { type: "Afternoon Break", start: "3:00 PM", end: "3:15 PM", duration: "15 min" },
      ],
      totalBreakTime: "90 min",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Break Schedule</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor your team's break times</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {breaks.map((record) => (
            <Card key={record.id} className="p-6 bg-white border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{record.staff}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {record.date}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Break Time</p>
                  <p className="text-xl font-semibold text-blue-600">{record.totalBreakTime}</p>
                </div>
              </div>

              <div className="space-y-3">
                {record.breaks.map((breakItem, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Coffee className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{breakItem.type}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {breakItem.start} - {breakItem.end}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{breakItem.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

