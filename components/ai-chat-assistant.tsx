"use client"

import type React from "react"

import { 
  Send, Bot, User, Sparkles, BookOpen, FileText, Users, HelpCircle,
  FolderOpen, Search, Upload, Clock, Database, Building2, GraduationCap,
  Settings, Briefcase, TrendingUp, FileCheck, ChevronRight, X, Trash2, Download, Loader2
} from "lucide-react"
import { useRef, useEffect, useState } from "react"
import ReactMarkdown from 'react-markdown'
import DocumentUpload from "./document-upload"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[] // Referenced documents
}

type Document = {
  id: string
  title: string
  category: "CLIENT" | "TRAINING" | "PROCEDURE" | "CULTURE" | "SEO"
  uploadedBy: string
  createdAt: string
  size: string
  fileUrl: string | null
}

const categoryConfig = {
  CLIENT: { label: "Client Docs", color: "bg-blue-500/20 text-blue-400 ring-blue-500/30", icon: Building2 },
  TRAINING: { label: "Training", color: "bg-purple-500/20 text-purple-400 ring-purple-500/30", icon: GraduationCap },
  PROCEDURE: { label: "Procedures", color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30", icon: FileCheck },
  CULTURE: { label: "Culture", color: "bg-pink-500/20 text-pink-400 ring-pink-500/30", icon: Users },
  SEO: { label: "SEO", color: "bg-amber-500/20 text-amber-400 ring-amber-500/30", icon: TrendingUp },
}

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")
  const [showDocs, setShowDocs] = useState(true)
  const [searchDocs, setSearchDocs] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionStartPos, setMentionStartPos] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle input changes and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    const cursorPos = e.target.selectionStart || 0
    
    // Check if user just typed @ or is in the middle of a mention
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Only show mentions if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true)
        setMentionQuery(textAfterAt.toLowerCase())
        setMentionStartPos(lastAtIndex)
        return
      }
    }
    
    // Hide mentions if no active @ mention
    setShowMentions(false)
    setMentionQuery("")
  }

  // Insert document mention
  const insertMention = (doc: Document) => {
    const beforeMention = input.substring(0, mentionStartPos)
    const afterMention = input.substring(inputRef.current?.selectionStart || input.length)
    const newValue = `${beforeMention}@${doc.title} ${afterMention}`
    setInput(newValue)
    setShowMentions(false)
    setMentionQuery("")
    inputRef.current?.focus()
  }

  // Filter documents based on mention query
  const mentionSuggestions = showMentions
    ? documents.filter(doc => 
        doc.title.toLowerCase().includes(mentionQuery) ||
        doc.category.toLowerCase().includes(mentionQuery)
      ).slice(0, 5)
    : []

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoadingDocs(true)
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setInput("")

    try {
      // Extract document references from @mentions (e.g., @SEO_Training or @doc:id)
      const documentIds: string[] = []
      const mentionPattern = /@(\S+)/g
      const mentions = text.match(mentionPattern)
      
      if (mentions) {
        mentions.forEach(mention => {
          const searchTerm = mention.slice(1).toLowerCase()
          // Find documents that match the mention
          const matchedDocs = documents.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm) ||
            doc.category.toLowerCase() === searchTerm
          )
          matchedDocs.forEach(doc => {
            if (!documentIds.includes(doc.id)) {
              documentIds.push(doc.id)
            }
          })
        })
      }

      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          documentIds: documentIds.length > 0 ? documentIds : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        sources: data.sources,
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please make sure the Claude API key is configured in your .env file.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput("")
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchDocs.toLowerCase())
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const docsByCategory = Object.entries(categoryConfig).map(([key, config]) => ({
    key,
    ...config,
    count: documents.filter(d => d.category === key).length
  }))

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col space-y-6">
          
        {/* Header */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-indigo-900/50 p-6 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
              <Bot className="h-7 w-7 text-indigo-300" />
            </div>
            <div>
                  <h1 className="text-2xl font-bold text-white">AI Training Assistant 🤖</h1>
                  <p className="text-slate-300">Ask me anything about clients, procedures, or training</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocs(!showDocs)}
                className="rounded-lg bg-slate-800/50 p-2 text-slate-400 ring-1 ring-white/10 transition-all hover:bg-slate-700/50 hover:text-white lg:hidden"
              >
                {showDocs ? <X className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Knowledge Base Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <div className="text-xl font-bold text-white">{loadingDocs ? '...' : documents.length}</div>
                <div className="text-xs text-slate-400">Documents</div>
              </div>
              <div className="rounded-xl bg-indigo-500/10 p-3 text-center ring-1 ring-indigo-500/30">
                <div className="text-xl font-bold text-indigo-400">
                  {loadingDocs ? '...' : documents.filter(d => d.category === "CLIENT").length}
                </div>
                <div className="text-xs text-indigo-300">Client Docs</div>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3 text-center ring-1 ring-purple-500/30">
                <div className="text-xl font-bold text-purple-400">
                  {loadingDocs ? '...' : documents.filter(d => d.category === "TRAINING" || d.category === "SEO").length}
                </div>
                <div className="text-xs text-purple-300">Training</div>
              </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-slate-900/50 p-6 ring-1 ring-white/10 backdrop-blur-sm">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
                  <Bot className="h-10 w-10 text-indigo-300" />
              </div>
              <div>
                  <h3 className="text-xl font-semibold text-white">Ready to help you learn! 📚</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {documents.length > 0 
                      ? `I have access to ${documents.length} document${documents.length !== 1 ? 's' : ''} in your library.`
                      : 'Upload your first training document to get started!'
                    }<br />
                    {documents.length > 0 && (
                      <>
                        💡 <strong>Tip:</strong> Use @mentions to reference specific documents (e.g., "What does @SEO say about keywords?")
                        <br />
                      </>
                    )}
                    Ask me anything about BPO work, training, or your documents!
                  </p>
                </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
                      <Bot className="h-5 w-5 text-indigo-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] space-y-2 rounded-xl p-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-white ring-1 ring-indigo-400/50"
                        : "bg-slate-800/50 text-white ring-1 ring-white/10"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-slate-100">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
                            ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-slate-100">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-slate-100">{children}</ol>,
                            li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                            h1: ({ children }) => <h1 className="mb-2 text-lg font-bold text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-2 text-base font-semibold text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold text-white">{children}</h3>,
                            code: ({ children }) => <code className="rounded bg-slate-700/50 px-1.5 py-0.5 text-xs text-indigo-300">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-400/50 pl-3 italic text-slate-300">{children}</blockquote>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 ring-1 ring-amber-400/50">
                      <User className="h-5 w-5 text-amber-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Referenced Documents */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="ml-11 mt-2">
                        <div className="rounded-lg bg-slate-800/30 p-3 ring-1 ring-white/5">
                          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                            <Database className="h-3 w-3" />
                            <span>Sources referenced:</span>
                          </div>
                          <div className="space-y-1">
                            {message.sources.map((source, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-indigo-400">
                                <ChevronRight className="h-3 w-3" />
                                <span>{source}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
                    <Bot className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-4 py-3 ring-1 ring-white/10">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      </div>
                      <span className="text-xs text-slate-400">Searching knowledge base...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/10 backdrop-blur-sm">
          {/* @ Mention Autocomplete Dropdown */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl bg-slate-800 p-2 shadow-xl ring-1 ring-white/20">
              <div className="mb-2 px-3 py-1 text-xs text-slate-400">
                Select document to mention:
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {mentionSuggestions.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => insertMention(doc)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-slate-700/50"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-medium text-white">
                        {doc.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {doc.category} • {doc.size}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about clients, procedures, training... Use @ to mention documents"
                disabled={isLoading}
                className="w-full rounded-lg bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500/30 to-purple-500/30 px-6 py-3 font-medium text-white ring-1 ring-indigo-400/50 transition-all hover:from-indigo-500/40 hover:to-purple-500/40 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span className="hidden md:inline">Send</span>
            </button>
          </div>
        </form>
        </div>

        {/* Document Library Sidebar */}
        <div className={`w-80 flex-shrink-0 space-y-4 ${showDocs ? "" : "hidden lg:block"}`}>
          
          {/* Knowledge Base Header */}
          <div className="rounded-2xl bg-slate-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Knowledge Base</h2>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchDocs}
                onChange={(e) => setSearchDocs(e.target.value)}
                placeholder="Search documents..."
                className="w-full rounded-lg bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-indigo-400/50"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                  selectedCategory === "all"
                    ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30"
                    : "text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>All Documents</span>
                  <span className="text-xs">{documents.length}</span>
                </div>
              </button>
              {docsByCategory.map(({ key, label, icon: Icon, color, count }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                    selectedCategory === key
                      ? color.replace("/20", "/10") + " ring-1"
                      : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                    <span className="text-xs">{count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Document List */}
          <div className="rounded-2xl bg-slate-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {selectedCategory === "all" ? "All Documents" : categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label}
              </h3>
              <span className="text-xs text-slate-400">{filteredDocs.length} docs</span>
            </div>
            
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {loadingDocs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400">
                        {searchDocs ? 'No documents match your search' : 'No documents yet. Upload your first one!'}
                      </p>
                    </div>
                  ) : (
                    filteredDocs.map((doc) => {
                      const config = categoryConfig[doc.category]
                      const Icon = config.icon
                      const isDeleting = deletingId === doc.id
                      
                      return (
                        <div
                          key={doc.id}
                          className="group rounded-lg bg-slate-800/30 p-3 ring-1 ring-white/5 transition-all hover:bg-slate-800/50 hover:ring-white/10"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 rounded-lg p-2 ring-1 ${config.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-indigo-400">
                                {doc.title}
                              </h4>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span className="truncate">{doc.uploadedBy}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-indigo-400"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={isDeleting}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-red-400 disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
          </div>

          {/* Upload Button */}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white ring-1 ring-indigo-500/50 transition-all hover:from-indigo-700 hover:to-purple-700 active:scale-95"
          >
            <Upload className="inline h-4 w-4 mr-2" />
            Upload Document
          </button>
        </div>

      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUpload
          onSuccess={fetchDocuments}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}
