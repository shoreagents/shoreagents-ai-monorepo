import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )
}

