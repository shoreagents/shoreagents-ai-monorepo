import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Clock, Calendar } from "@/components/admin/icons"
import { prisma } from "@/lib/prisma"

async function getTimeEntries() {
  try {
    const entries = await prisma.timeEntry.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        clockIn: 'desc'
      },
      take: 100
    })
    return entries
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return []
  }
}

function calculateDuration(clockIn: Date, clockOut: Date | null) {
  if (!clockOut) {
    const now = new Date()
    const diff = now.getTime() - new Date(clockIn).getTime()
    return Math.floor(diff / (1000 * 60)) // minutes
  }
  const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime()
  return Math.floor(diff / (1000 * 60)) // minutes
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default async function TimeTrackingPage() {
  const entries = await getTimeEntries()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Time Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor staff time entries and productivity</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by staff name..." className="pl-9" />
          </div>
          <Select defaultValue="today">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Time Entries Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Clock In
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Clock Out
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Break Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No time entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry: any) => {
                  const duration = calculateDuration(entry.clockIn, entry.clockOut)
                  const isActive = !entry.clockOut

                  return (
                    <tr key={entry.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={entry.user?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{entry.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{entry.user?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{entry.user?.profile?.currentRole || "Staff"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        N/A
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">
                          {new Date(entry.clockIn).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">
                          {entry.clockOut ? new Date(entry.clockOut).toLocaleString() : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">
                          {formatDuration(duration)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {entry.breakDuration ? `${entry.breakDuration}m` : "0m"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                          {isActive ? (
                            <><Clock className="size-3 mr-1 inline" /> Active</>
                          ) : (
                            "Completed"
                          )}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Entries</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{entries.length}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Active Now</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">
            {entries.filter(e => !e.clockOut).length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Hours</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">
            {formatDuration(entries.reduce((acc, e) => acc + calculateDuration(e.clockIn, e.clockOut), 0))}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Avg Per Day</div>
          <div className="text-2xl font-semibold text-purple-500 mt-1">
            {entries.length > 0 ? formatDuration(Math.floor(entries.reduce((acc, e) => acc + calculateDuration(e.clockIn, e.clockOut), 0) / entries.length)) : "0h 0m"}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Break Time</div>
          <div className="text-2xl font-semibold text-orange-500 mt-1">
            {entries.reduce((acc, e) => acc + (e.breakDuration || 0), 0)}m
          </div>
        </Card>
      </div>
    </div>
  )
}

                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Entries</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{entries.length}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Active Now</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">
            {entries.filter(e => !e.clockOut).length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Hours</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">
            {formatDuration(entries.reduce((acc, e) => acc + calculateDuration(e.clockIn, e.clockOut), 0))}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Avg Per Day</div>
          <div className="text-2xl font-semibold text-purple-500 mt-1">
            {entries.length > 0 ? formatDuration(Math.floor(entries.reduce((acc, e) => acc + calculateDuration(e.clockIn, e.clockOut), 0) / entries.length)) : "0h 0m"}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Break Time</div>
          <div className="text-2xl font-semibold text-orange-500 mt-1">
            {entries.reduce((acc, e) => acc + (e.breakDuration || 0), 0)}m
          </div>
        </Card>
      </div>
    </div>
  )
}