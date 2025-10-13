"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Plus, Search, FileText, FolderOpen, Clock, Edit, User, Building2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Document {
  id: string
  title: string
  category: string
  description: string
  uploadedBy: string
  uploadedByUser: {
    name: string
    avatar?: string
  }
  size: string
  fileUrl?: string
  lastUpdated: string
  views: number
  isStaffUpload: boolean
}

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: "procedure",
  })

  const categories = [
    { id: "all", name: "All Documents", count: documents.length },
    { id: "client", name: "Client Documents", count: documents.filter((d) => !d.isStaffUpload).length },
    { id: "procedure", name: "Procedures", count: documents.filter((d) => d.category === "procedure").length },
    { id: "training", name: "Training", count: documents.filter((d) => d.category === "training").length },
    { id: "culture", name: "Culture", count: documents.filter((d) => d.category === "culture").length },
  ]

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/client/documents")
      if (!response.ok) throw new Error("Failed to fetch documents")
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!newDoc.title || !selectedFile) {
      alert("Please fill in all required fields and select a file")
      return
    }

    setUploading(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', newDoc.title)
      formData.append('category', newDoc.category.toUpperCase())

      const response = await fetch("/api/client/documents", {
        method: "POST",
        body: formData, // Send FormData instead of JSON
      })

      if (!response.ok) throw new Error("Failed to upload document")

      await fetchDocuments()
      setShowUploadDialog(false)
      setNewDoc({
        title: "",
        category: "procedure",
      })
      setSelectedFile(null)
      alert("Document uploaded successfully! Your staff can now access it.")
    } catch (error) {
      console.error("Error uploading document:", error)
      alert("Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-gray-600 mt-2">
              Shared documents between TechCorp and assigned staff (Maria Santos)
            </p>
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === category.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FolderOpen
                  className={`h-5 w-5 ${selectedCategory === category.id ? "text-blue-600" : "text-gray-400"}`}
                />
                <span className={`font-semibold ${selectedCategory === category.id ? "text-blue-600" : "text-gray-900"}`}>
                  {category.count}
                </span>
              </div>
              <p className={`text-sm ${selectedCategory === category.id ? "text-blue-600" : "text-gray-600"}`}>
                {category.name}
              </p>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading documents...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="block p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${doc.isStaffUpload ? "bg-purple-50" : "bg-blue-50"}`}>
                          <FileText className={`h-6 w-6 ${doc.isStaffUpload ? "text-purple-600" : "text-blue-600"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                            {doc.isStaffUpload ? (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                                <User className="h-3 w-3 mr-1" />
                                Staff Upload
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                <Building2 className="h-3 w-3 mr-1" />
                                Company Doc
                              </Badge>
                            )}
                            <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                              {doc.category.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Updated {doc.lastUpdated}
                            </span>
                            <span className="flex items-center gap-1">
                              {doc.isStaffUpload ? (
                                <>
                                  <User className="h-4 w-4" />
                                  {doc.uploadedByUser.name}
                                </>
                              ) : (
                                <>
                                  <Building2 className="h-4 w-4" />
                                  {doc.uploadedBy}
                                </>
                              )}
                            </span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/client/knowledge-base/${doc.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No documents found</p>
                <p className="text-sm text-gray-500">
                  {searchQuery ? "Try adjusting your search terms" : "Upload a document to get started"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Share documents with your offshore staff. They will be able to view and reference these documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Customer Service Guidelines"
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={newDoc.category} onValueChange={(value) => setNewDoc({ ...newDoc, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Resources</SelectItem>
                  <SelectItem value="procedure">Procedures & SOPs</SelectItem>
                  <SelectItem value="training">Training Materials</SelectItem>
                  <SelectItem value="culture">Company Culture</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Document File *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedFile(null)
                        }}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, TXT, or MD (Max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Text will be extracted automatically using CloudConvert and made searchable
              </p>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
