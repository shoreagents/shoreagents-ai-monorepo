import { Skeleton } from "@/components/ui/skeleton"

export function TicketSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full bg-slate-700/50" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-700/50" />
            <Skeleton className="h-3 w-24 bg-slate-700/50" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full bg-slate-700/50" />
      </div>

      {/* Title skeleton */}
      <Skeleton className="h-5 w-3/4 bg-slate-700/50" />

      {/* Description skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-slate-700/50" />
        <Skeleton className="h-4 w-5/6 bg-slate-700/50" />
        <Skeleton className="h-4 w-4/6 bg-slate-700/50" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-12 rounded-full bg-slate-700/50" />
          <Skeleton className="h-5 w-16 rounded-full bg-slate-700/50" />
        </div>
        <Skeleton className="h-4 w-20 bg-slate-700/50" />
      </div>
    </div>
  )
}

export function TicketCardSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-900/30 backdrop-blur-xl p-6 ring-1 ring-white/5 shadow-lg">
      <TicketSkeleton />
    </div>
  )
}

export function TicketListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <TicketCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TicketStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="group rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-slate-700/50" />
              <Skeleton className="h-8 w-12 bg-slate-700/50" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full bg-slate-700/50" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TicketFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 bg-slate-700/50 rounded-lg" />
        <Skeleton className="h-10 w-32 bg-slate-700/50 rounded-lg" />
        <Skeleton className="h-10 w-32 bg-slate-700/50 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-48 bg-slate-700/50 rounded-lg" />
        <Skeleton className="h-10 w-24 bg-slate-700/50 rounded-lg" />
      </div>
    </div>
  )
}

export function TicketKanbanSkeleton({ count = 3 }: { count?: number }) {
  const columns = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
  
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {columns.map((column, idx) => {
        const gradients = [
          'from-blue-500/20 to-cyan-500/20',
          'from-amber-500/20 to-orange-500/20',
          'from-emerald-500/20 to-green-500/20',
          'from-slate-500/20 to-gray-500/20'
        ]
        const emojis = ['🆕', '⚡', '✅', '📦']
        const ringColors = [
          'ring-blue-500/50',
          'ring-amber-500/50', 
          'ring-emerald-500/50',
          'ring-slate-500/50'
        ]

        return (
          <div key={column} className="flex flex-col">
            {/* Column Header */}
            <div className={`mb-4 rounded-2xl bg-gradient-to-r ${gradients[idx]} backdrop-blur-xl p-4 ring-1 ${ringColors[idx]} shadow-lg`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emojis[idx]}</span>
                <Skeleton className="h-6 w-24 bg-slate-700/50" />
                <div className="ml-auto">
                  <Skeleton className="h-6 w-8 rounded-full bg-slate-700/50" />
                </div>
              </div>
            </div>

            {/* Tickets Column */}
            <div className={`min-h-[400px] space-y-3 rounded-2xl bg-slate-900/30 backdrop-blur-xl p-4 ring-1 ring-white/5 transition-all duration-300`}>
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-900/30 backdrop-blur-xl p-4 ring-1 ring-white/5 shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16 bg-slate-700/50" />
                      <Skeleton className="h-5 w-20 rounded-full bg-slate-700/50" />
                      <Skeleton className="h-5 w-16 rounded-full bg-slate-700/50" />
                    </div>
                    <Skeleton className="h-5 w-3/4 bg-slate-700/50" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-slate-700/50" />
                      <Skeleton className="h-4 w-5/6 bg-slate-700/50" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 bg-slate-700/50" />
                      <Skeleton className="h-6 w-16 rounded-full bg-slate-700/50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}