"use client"

import { useState } from "react"
import { Upload, X, FileText, Loader2 } from "lucide-react"

type DocumentCategory = "CLIENT" | "TRAINING" | "PROCEDURE" | "CULTURE" | "SEO"

interface DocumentUploadProps {
  onSuccess: () => void
  onClose: () => void
}

export default function DocumentUpload({ onSuccess, onClose }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<DocumentCategory>("TRAINING")
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const allowedExtensions = ['.pdf', '.txt', '.md', '.doc', '.docx']
      
      const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExt)) {
        setError('Invalid file type. Only PDF, TXT, MD, DOC, and DOCX files are allowed.')
        return
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit')
        return
      }

      setFile(selectedFile)
      setTitle(selectedFile.name)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('category', category)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      // Success - show success message
      setShowSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 p-6 shadow-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Upload Training Document</h2>
            <p className="text-sm text-indigo-400 mt-1">📤 Documents are shared with your client</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 p-8 transition-all hover:border-indigo-500 hover:bg-slate-800">
              <Upload className="mb-3 h-12 w-12 text-slate-400" />
              <p className="mb-1 text-sm font-medium text-white">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400">PDF, TXT, MD, DOC, or DOCX (max 10MB)</p>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full rounded-lg bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full rounded-lg bg-slate-800/50 px-4 py-2 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
            >
              <option value="CLIENT">Client Docs</option>
              <option value="TRAINING">Training</option>
              <option value="PROCEDURE">Procedures</option>
              <option value="CULTURE">Culture</option>
              <option value="SEO">SEO</option>
            </select>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-400">
                {progress < 90 ? 'Uploading...' : 'Extracting text for AI...'} {progress}%
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 ring-1 ring-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Extract
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Modal Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/95 backdrop-blur-sm">
            <div className="max-w-md text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 ring-2 ring-green-400/50">
                  <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Document Ready!</h3>
              <p className="mb-6 text-sm text-slate-300">
                Your document has been uploaded and the text content has been extracted successfully. 
                <br /><br />
                <span className="font-semibold text-indigo-400">Your AI assistant now has full access to this document!</span>
                <br />
                <span className="font-semibold text-blue-400">🔄 This document is also visible to your client</span>
                <br /><br />
                Use <code className="rounded bg-slate-800 px-2 py-1 text-xs text-indigo-300">@{title || file?.name}</code> in your chat to reference it.
              </p>
              <button
                onClick={onClose}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all hover:from-indigo-700 hover:to-purple-700"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}





