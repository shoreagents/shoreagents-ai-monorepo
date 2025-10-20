"use client"

import { useState } from "react"
import { X, Upload, Trash2, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { getAllPriorities } from "@/lib/task-utils"

interface StaffUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

interface CreateTaskModalProps {
  isClient: boolean
  staffUsers?: StaffUser[]
  onClose: () => void
  onSuccess: () => void
}

export default function CreateTaskModal({
  isClient,
  staffUsers = [],
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    deadline: "",
  })
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const priorities = getAllPriorities()
  const isDark = !isClient // Staff and Management use dark theme

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (attachments.length + validFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 files allowed",
        variant: "destructive",
      })
      return
    }

    setAttachments([...attachments, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedStaffIds.length === staffUsers.length) {
      setSelectedStaffIds([])
    } else {
      setSelectedStaffIds(staffUsers.map((s) => s.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    if (isClient && selectedStaffIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one staff member",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Upload attachments first if any
      let attachmentUrls: string[] = []
      if (attachments.length > 0) {
        setUploading(true)
        const formDataUpload = new FormData()
        attachments.forEach((file) => {
          formDataUpload.append("files", file)
        })

        const uploadResponse = await fetch("/api/tasks/attachments", {
          method: "POST",
          body: formDataUpload,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          attachmentUrls = uploadData.urls || []
        }
        setUploading(false)
      }

      // Create task
      const endpoint = isClient ? "/api/client/tasks" : "/api/tasks"
      const body = isClient
        ? {
            ...formData,
            staffUserIds: selectedStaffIds,
            attachments: attachmentUrls,
          }
        : {
            ...formData,
            attachments: attachmentUrls,
          }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create task")
      }

      toast({
        title: "Success",
        description: isClient
          ? `Task assigned to ${selectedStaffIds.length} staff member${selectedStaffIds.length > 1 ? "s" : ""}`
          : "Task created successfully",
      })

      onSuccess()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const selectedStaff = staffUsers.filter((s) => selectedStaffIds.includes(s.id))

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isDark ? "bg-black/70 backdrop-blur-sm" : "bg-black/50 backdrop-blur-sm"
    } animate-in fade-in duration-300`}>
      <div className={`w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl animate-in slide-in-from-bottom duration-500 ${
        isDark 
          ? "bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-indigo-500/30" 
          : "bg-white border-2 border-slate-200"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl font-bold ${
            isDark 
              ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400" 
              : "text-slate-900"
          }`}>
            {isClient ? "📋 Create Task for Staff" : "✨ Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className={`rounded-xl p-2.5 transition-all hover:scale-110 ${
              isDark 
                ? "text-slate-400 hover:bg-slate-800 hover:text-white ring-1 ring-slate-700 hover:ring-red-500" 
                : "text-slate-600 hover:bg-red-50 hover:text-red-600 border-2 border-slate-300 hover:border-red-400"
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className={`mb-2 block text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full rounded-xl px-5 py-4 outline-none transition-all ${
                isDark
                  ? "bg-slate-800/50 backdrop-blur-xl text-white ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80"
                  : "bg-slate-50 text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:bg-white"
              }`}
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`mb-2 block text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full rounded-xl px-5 py-4 outline-none transition-all ${
                  isDark
                    ? "bg-slate-800/50 backdrop-blur-xl text-white ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80"
                    : "bg-slate-50 text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:bg-white"
                }`}
              >
                {priorities.map((priority) => {
                  const config = {
                    LOW: "💤 Low",
                    MEDIUM: "📋 Medium",
                    HIGH: "⚡ High",
                    URGENT: "🚨 Urgent",
                  }[priority]
                  return (
                    <option key={priority} value={priority}>
                      {config}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className={`mb-2 block text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className={`w-full rounded-xl px-5 py-4 outline-none transition-all ${
                  isDark
                    ? "bg-slate-800/50 backdrop-blur-xl text-white ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80"
                    : "bg-slate-50 text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:bg-white"
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`mb-2 block text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={`w-full rounded-xl px-5 py-4 outline-none transition-all ${
                isDark
                  ? "bg-slate-800/50 backdrop-blur-xl text-white ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 placeholder-slate-500"
                  : "bg-slate-50 text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:bg-white placeholder-slate-400"
              }`}
              placeholder="Add task details..."
            />
          </div>

          {/* Staff Selection (Client only) */}
          {isClient && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Assign to Staff <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`text-sm font-bold transition-colors ${
                    isDark ? "text-indigo-400 hover:text-indigo-300" : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {selectedStaffIds.length === staffUsers.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className={`rounded-xl p-4 max-h-60 overflow-y-auto ${
                isDark ? "bg-slate-800/50 ring-1 ring-white/10" : "bg-slate-50 border-2 border-slate-200"
              }`}>
                {staffUsers.length === 0 ? (
                  <p className={`text-center py-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    No staff members available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {staffUsers.map((staff) => {
                      const isSelected = selectedStaffIds.includes(staff.id)
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => toggleStaffSelection(staff.id)}
                          className={`w-full rounded-lg p-3 flex items-center gap-3 transition-all ${
                            isSelected
                              ? isDark
                                ? "bg-indigo-500/20 ring-2 ring-indigo-500"
                                : "bg-blue-100 ring-2 ring-blue-500"
                              : isDark
                              ? "bg-slate-700/30 hover:bg-slate-700/50 ring-1 ring-white/10"
                              : "bg-white hover:bg-slate-100 border border-slate-300"
                          }`}
                        >
                          <div className={`h-6 w-6 rounded-md flex items-center justify-center ${
                            isSelected
                              ? isDark ? "bg-indigo-500" : "bg-blue-500"
                              : isDark ? "bg-slate-600 ring-1 ring-white/20" : "bg-slate-200"
                          }`}>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                            <AvatarFallback className={isDark ? "bg-indigo-600 text-white" : "bg-blue-100 text-blue-700"}>
                              {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                              {staff.name}
                            </p>
                            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              {staff.email}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedStaffIds.length > 0 && (
                <div className={`mt-3 rounded-xl p-4 ${
                  isDark ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/30 backdrop-blur-xl" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300"
                }`}>
                  <p className={`text-xs font-bold mb-2 ${isDark ? "text-indigo-300" : "text-blue-700"}`}>
                    📋 Task Relationship:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isDark ? "bg-slate-800/50" : "bg-white"
                    }`}>
                      <span className="text-xl">👔</span>
                      <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>You</span>
                    </div>
                    <span className={`text-xl ${isDark ? "text-indigo-400" : "text-blue-500"}`}>→</span>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isDark ? "bg-slate-800/50" : "bg-white"
                    }`}>
                      <Users className="h-4 w-4" />
                      <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {selectedStaffIds.length} Staff{selectedStaffIds.length > 1 ? " Members" : ""}
                      </span>
                    </div>
                  </div>
                  {selectedStaff.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedStaff.slice(0, 3).map((staff) => (
                        <div key={staff.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                          isDark ? "bg-slate-700/50 text-slate-300" : "bg-slate-100 text-slate-700"
                        }`}>
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={staff.avatar || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{staff.name.split(" ")[0]}</span>
                        </div>
                      ))}
                      {selectedStaff.length > 3 && (
                        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          isDark ? "bg-slate-700/50 text-slate-300" : "bg-slate-100 text-slate-700"
                        }`}>
                          +{selectedStaff.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className={`mb-2 block text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              📎 Attachments (Optional)
            </label>
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold transition-all ${
              isDark
                ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-xl text-indigo-300 ring-1 ring-indigo-500/30 hover:from-indigo-600/30 hover:to-purple-600/30 hover:scale-105"
                : "bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200 hover:border-blue-500"
            }`}>
              <Upload className="h-5 w-5" />
              📁 Add Files (Max 5)
              <input
                type="file"
                accept="*/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={attachments.length >= 5}
              />
            </label>
            
            {/* Upload Progress */}
            {uploading && (
              <div className={`mt-3 p-3 rounded-lg ${
                isDark ? "bg-blue-500/20 ring-1 ring-blue-500/30" : "bg-blue-50 border border-blue-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="text-sm font-bold">📤 Uploading {attachments.length} file{attachments.length > 1 ? 's' : ''}...</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  isDark ? "bg-slate-700" : "bg-slate-200"
                }`}>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" style={{width: '75%'}} />
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                      isDark
                        ? "bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10 hover:ring-indigo-500/50"
                        : "bg-slate-50 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-2xl">📎</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className={`rounded-lg p-2 transition-all ${
                        isDark
                          ? "text-red-400 hover:bg-red-500/20"
                          : "text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={submitting || uploading}
              className={`flex-1 rounded-xl px-6 py-4 font-bold transition-all disabled:opacity-50 ${
                isDark
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl shadow-indigo-500/50 hover:scale-105"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:scale-105"
              }`}
            >
              {uploading ? (
                <>⏳ Uploading files...</>
              ) : submitting ? (
                <>📤 Creating task...</>
              ) : (
                <>🚀 Create Task</>
              )}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className={`rounded-xl px-6 py-4 font-bold ${
                isDark
                  ? "border-2 border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

