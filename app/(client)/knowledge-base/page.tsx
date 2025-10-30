"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Plus, Search, FileText, FolderOpen, Clock, Edit, User, Building2, Upload, X, Users, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { useToast } from "@/hooks/use-toast"
import { DocumentSourceBadgeLight } from "@/components/ui/document-source-badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

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
  source: 'ADMIN' | 'STAFF' | 'CLIENT'
}

export default function KnowledgeBasePage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  
  interface DocumentToUpload {
    id: string
    title: string
    category: string
    file: File | null
    shareMode: 'all' | 'specific'
    sharedWith: string[]
  }
  
  const [documentsToUpload, setDocumentsToUpload] = useState<DocumentToUpload[]>([
    { id: crypto.randomUUID(), title: "", category: "procedure", file: null, shareMode: 'all', sharedWith: [] }
  ])

  interface StaffMember {
    id: string
    name: string
    email: string
    avatar: string | null
  }

  const [assignedStaff, setAssignedStaff] = useState<StaffMember[]>([])
  const [staffSearchQueries, setStaffSearchQueries] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categories = [
    { id: "all", name: "All Documents", count: documents.length },
    { id: "client", name: "Client Documents", count: documents.filter((d) => !d.isStaffUpload).length },
    { id: "procedure", name: "Procedures", count: documents.filter((d) => d.category === "procedure").length },
    { id: "training", name: "Training", count: documents.filter((d) => d.category === "training").length },
    { id: "culture", name: "Culture", count: documents.filter((d) => d.category === "culture").length },
  ]

  useEffect(() => {
    fetchDocuments()
    fetchAssignedStaff()
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

  const fetchAssignedStaff = async () => {
    try {
      const response = await fetch("/api/client/staff")
      if (response.ok) {
        const data = await response.json()
        setAssignedStaff(data.staff || [])
      }
    } catch (error) {
      console.error("Error fetching assigned staff:", error)
    }
  }

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/client/documents/${documentToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete document")
      }

      toast({
        title: "✅ Document Deleted",
        description: `"${documentToDelete.title}" has been permanently deleted.`,
      })

      // Refresh document list
      await fetchDocuments()
      
      // Close dialog
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error: any) {
      console.error("Error deleting document:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "There was an error deleting the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const addAnotherDocument = () => {
    setDocumentsToUpload([
      ...documentsToUpload,
      { id: crypto.randomUUID(), title: "", category: "procedure", file: null, shareMode: 'all', sharedWith: [] }
    ])
  }

  const removeDocument = (id: string) => {
    if (documentsToUpload.length === 1) {
      // Keep at least one form
      return
    }
    setDocumentsToUpload(documentsToUpload.filter(doc => doc.id !== id))
  }

  const updateDocument = (id: string, updates: Partial<DocumentToUpload>) => {
    setDocumentsToUpload(documentsToUpload.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ))
  }

  const resetUploadForm = () => {
    setDocumentsToUpload([
      { id: crypto.randomUUID(), title: "", category: "procedure", file: null, shareMode: 'all', sharedWith: [] }
    ])
    setUploadProgress({ current: 0, total: 0 })
  }

  const handleUpload = async () => {
    // Validate all documents
    const invalidDocs = documentsToUpload.filter(doc => !doc.title || !doc.file)
    if (invalidDocs.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and file for all documents.",
        variant: "destructive",
      })
      return
    }

    // Validate specific sharing - must select at least one staff member
    const invalidSharing = documentsToUpload.filter(doc => doc.shareMode === 'specific' && doc.sharedWith.length === 0)
    if (invalidSharing.length > 0) {
      toast({
        title: "Missing Sharing Selection",
        description: "Please select at least one staff member for documents with specific sharing.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress({ current: 0, total: documentsToUpload.length })

    let successCount = 0
    let failCount = 0
    const failedTitles: string[] = []

    // Upload each document sequentially
    for (let i = 0; i < documentsToUpload.length; i++) {
      const doc = documentsToUpload[i]
      setUploadProgress({ current: i + 1, total: documentsToUpload.length })

      try {
        const formData = new FormData()
        formData.append('file', doc.file!)
        formData.append('title', doc.title)
        formData.append('category', doc.category.toUpperCase())
        
        // For "all" mode, use sharedWithAll flag (company-scoped)
        // For "specific" mode, use sharedWith array
        if (doc.shareMode === 'all') {
          formData.append('sharedWithAll', 'true')
        } else {
          formData.append('sharedWithAll', 'false')
          formData.append('sharedWith', JSON.stringify(doc.sharedWith))
        }

        const response = await fetch("/api/client/documents", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || `Failed to upload document (${response.status})`
          console.error(`Upload error for "${doc.title}":`, errorMessage, errorData)
          throw new Error(errorMessage)
        }
        
        successCount++
      } catch (error: any) {
        console.error(`Error uploading document "${doc.title}":`, error)
        failCount++
        failedTitles.push(`${doc.title} (${error.message || 'Unknown error'})`)
      }
    }

    // Refetch documents
    await fetchDocuments()
    
    // Close dialog and reset form
    setShowUploadDialog(false)
    resetUploadForm()
    setUploading(false)
    
    // Show summary toast
    if (failCount === 0) {
      toast({
        title: `✅ ${successCount} Document${successCount > 1 ? 's' : ''} Uploaded Successfully!`,
        description: `Your documents have been shared with your offshore staff. They can now access them in their AI Assistant.`,
      })
    } else {
      toast({
        title: "Upload Complete with Errors",
        description: `${successCount} succeeded, ${failCount} failed: ${failedTitles.join(', ')}`,
        variant: "destructive",
      })
    }
  }

  const filteredDocuments = documents
    .filter((doc) => {
      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      // Sort: Client docs FIRST (isStaffUpload: false), then Staff docs (isStaffUpload: true)
      if (a.isStaffUpload === b.isStaffUpload) {
        // If same type, sort by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      // Client docs (false) come before Staff docs (true)
      return a.isStaffUpload ? 1 : -1
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
                        <div className={`p-3 rounded-lg ${
                          doc.source === 'ADMIN' ? 'bg-red-50' :
                          doc.source === 'STAFF' ? 'bg-purple-50' : 'bg-blue-50'
                        }`}>
                          <FileText className={`h-6 w-6 ${
                            doc.source === 'ADMIN' ? 'text-red-600' :
                            doc.source === 'STAFF' ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                            <DocumentSourceBadgeLight source={doc.source} />
                            {doc.source === 'ADMIN' && (
                              <span className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded border border-red-200">
                                Shared by Admin
                              </span>
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
                              {doc.source === 'ADMIN' ? (
                                <>
                                  <User className="h-4 w-4" />
                                  {doc.uploadedBy}
                                </>
                              ) : doc.source === 'STAFF' ? (
                                <>
                                  <User className="h-4 w-4" />
                                  {doc.uploadedByUser?.name || doc.uploadedBy}
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/client/knowledge-base/${doc.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FileText className="h-5 w-5" />
                        </Link>
                        {doc.source === 'CLIENT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(doc)
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
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
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open)
        if (!open) resetUploadForm()
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Share documents with your offshore staff. They will be able to view and reference these documents.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {documentsToUpload.map((doc, index) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                {documentsToUpload.length > 1 && (
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <h4 className="text-sm font-bold text-white">
                      Document {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`title-${doc.id}`}>Document Title *</Label>
                    <Input
                      id={`title-${doc.id}`}
                      placeholder="e.g., Customer Service Guidelines"
                      value={doc.title}
                      onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
                      disabled={uploading}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`category-${doc.id}`}>Category *</Label>
                    <Select 
                      value={doc.category} 
                      onValueChange={(value) => updateDocument(doc.id, { category: value })}
                      disabled={uploading}
                    >
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

                  <div className="grid gap-3">
                    <Label>Share With *</Label>
                    <RadioGroup 
                      value={doc.shareMode} 
                      onValueChange={(value: 'all' | 'specific') => updateDocument(doc.id, { shareMode: value })}
                      disabled={uploading}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
                        <RadioGroupItem value="all" id={`all-${doc.id}`} />
                        <Label htmlFor={`all-${doc.id}`} className="font-normal cursor-pointer flex-1">
                          <div className="font-medium text-white">All assigned staff</div>
                          <div className="text-xs text-gray-400 mt-0.5">Everyone can access this document</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
                        <RadioGroupItem value="specific" id={`specific-${doc.id}`} />
                        <Label htmlFor={`specific-${doc.id}`} className="font-normal cursor-pointer flex-1">
                          <div className="font-medium text-white">Specific staff members only</div>
                          <div className="text-xs text-gray-400 mt-0.5">Choose who can access this document</div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {doc.shareMode === 'specific' && (
                      <div>
                        {/* Staff Selection */}
                        <div className="border border-gray-200 rounded-lg">
                          {/* Selected Staff Display */}
                          {doc.sharedWith.length > 0 && (
                            <div className="px-3 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-white">
                                  {doc.sharedWith.length} selected
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateDocument(doc.id, { sharedWith: [] })}
                                  className="h-6 text-xs"
                                  disabled={uploading}
                                >
                                  Clear all
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {doc.sharedWith.map(staffId => {
                                  const staff = assignedStaff.find(s => s.id === staffId)
                                  if (!staff) return null
                                  return (
                                    <div
                                      key={staffId}
                                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                    >
                                      <span className="font-medium">{staff.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newSharedWith = doc.sharedWith.filter(id => id !== staffId)
                                          updateDocument(doc.id, { sharedWith: newSharedWith })
                                        }}
                                        className="ml-1 hover:text-blue-900"
                                        disabled={uploading}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Search Input */}
                          <div className="px-3 py-2 border-b border-gray-200">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Search staff by name or email..."
                                value={staffSearchQueries[doc.id] || ''}
                                onChange={(e) => setStaffSearchQueries({ ...staffSearchQueries, [doc.id]: e.target.value })}
                                className="pl-9"
                                disabled={uploading}
                              />
                            </div>
                          </div>

                          <div className="p-2 max-h-56 overflow-y-auto space-y-1">
                            {assignedStaff.length === 0 ? (
                              <div className="p-4 text-center">
                                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-white">No staff assigned to your company yet.</p>
                              </div>
                            ) : (
                              (() => {
                                const searchQuery = (staffSearchQueries[doc.id] || '').toLowerCase()
                                const filteredStaff = assignedStaff.filter(staff => 
                                  staff.name.toLowerCase().includes(searchQuery) ||
                                  staff.email.toLowerCase().includes(searchQuery)
                                )
                                
                                if (filteredStaff.length === 0) {
                                  return (
                                    <div className="p-4 text-center">
                                      <p className="text-sm text-white">No staff found matching "{staffSearchQueries[doc.id]}"</p>
                                    </div>
                                  )
                                }

                                return filteredStaff.map((staff) => (
                                  <div 
                                    key={staff.id} 
                                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors"
                                  >
                                    <Checkbox
                                      id={`staff-${doc.id}-${staff.id}`}
                                      checked={doc.sharedWith.includes(staff.id)}
                                      onCheckedChange={(checked) => {
                                        const newSharedWith = checked
                                          ? [...doc.sharedWith, staff.id]
                                          : doc.sharedWith.filter(id => id !== staff.id)
                                        updateDocument(doc.id, { sharedWith: newSharedWith })
                                      }}
                                      disabled={uploading}
                                    />
                                    <Label 
                                      htmlFor={`staff-${doc.id}-${staff.id}`}
                                      className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                      <div className="font-medium text-white">{staff.name}</div>
                                      <div className="text-xs text-gray-400">{staff.email}</div>
                                    </Label>
                                  </div>
                                ))
                              })()
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`file-${doc.id}`}>Document File *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <input
                        id={`file-${doc.id}`}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          updateDocument(doc.id, { file })
                          // Auto-fill title from filename if title is empty
                          if (file && !doc.title) {
                            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
                            updateDocument(doc.id, { title: fileNameWithoutExt })
                          }
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor={`file-${doc.id}`} className="cursor-pointer">
                        {doc.file ? (
                          <div className="space-y-2">
                            <FileText className="h-8 w-8 text-blue-600 mx-auto" />
                            <p className="text-sm font-medium text-white">{doc.file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(doc.file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                            <p className="text-sm font-medium text-white">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                              PDF, DOC, DOCX, TXT, or MD (Max 10MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                    {index === 0 && (
                      <p className="text-xs text-gray-500">
                        Text will be extracted automatically using CloudConvert and made searchable
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {uploading && uploadProgress.total > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Uploading documents...
                  </span>
                  <span className="text-sm text-blue-700">
                    {uploadProgress.current} of {uploadProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {!uploading && (
              <Button
                type="button"
                variant="outline"
                onClick={addAnotherDocument}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Document
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(false)} 
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading 
                ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` 
                : `Upload ${documentsToUpload.length > 1 ? `All (${documentsToUpload.length})` : 'Document'}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title}"? This will permanently delete the document and remove the file from storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
