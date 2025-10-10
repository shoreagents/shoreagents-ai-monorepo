"use client"

import type React from "react"

import { 
  Send, Bot, User, Sparkles, BookOpen, FileText, Users, HelpCircle,
  FolderOpen, Search, Upload, Clock, Database, Building2, GraduationCap,
  Settings, Briefcase, TrendingUp, FileCheck, ChevronRight, X
} from "lucide-react"
import { useRef, useEffect, useState } from "react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[] // Referenced documents
}

type Document = {
  id: string
  title: string
  category: "client" | "training" | "procedure" | "culture" | "seo"
  uploadedBy: string
  uploadedDate: string
  size: string
  icon: any
}

const mockDocuments: Document[] = [
  // Client Documents
  { 
    id: "1", 
    title: "TechCorp - Listing Procedures Guide", 
    category: "client", 
    uploadedBy: "Management", 
    uploadedDate: "2024-12-01", 
    size: "2.4 MB",
    icon: Building2
  },
  { 
    id: "2", 
    title: "TechCorp - Brand Guidelines & Culture", 
    category: "culture", 
    uploadedBy: "John Manager", 
    uploadedDate: "2024-11-28", 
    size: "1.8 MB",
    icon: Users
  },
  { 
    id: "3", 
    title: "Client Communication Best Practices", 
    category: "client", 
    uploadedBy: "Management", 
    uploadedDate: "2024-11-25", 
    size: "890 KB",
    icon: Building2
  },
  
  // Training Materials
  { 
    id: "4", 
    title: "SEO Fundamentals for Client Success", 
    category: "seo", 
    uploadedBy: "Training Team", 
    uploadedDate: "2024-12-10", 
    size: "5.2 MB",
    icon: TrendingUp
  },
  { 
    id: "5", 
    title: "Advanced SEO Strategies & Techniques", 
    category: "seo", 
    uploadedBy: "Training Team", 
    uploadedDate: "2024-12-08", 
    size: "4.1 MB",
    icon: TrendingUp
  },
  { 
    id: "6", 
    title: "Customer Service Excellence Training", 
    category: "training", 
    uploadedBy: "HR Department", 
    uploadedDate: "2024-11-20", 
    size: "3.5 MB",
    icon: GraduationCap
  },
  { 
    id: "7", 
    title: "CRM System - Complete User Guide", 
    category: "training", 
    uploadedBy: "IT Department", 
    uploadedDate: "2024-11-15", 
    size: "2.1 MB",
    icon: GraduationCap
  },
  
  // Procedures
  { 
    id: "8", 
    title: "Issue Escalation Process", 
    category: "procedure", 
    uploadedBy: "Management", 
    uploadedDate: "2024-11-10", 
    size: "450 KB",
    icon: FileCheck
  },
  { 
    id: "9", 
    title: "Leave Application & Approval Process", 
    category: "procedure", 
    uploadedBy: "HR Department", 
    uploadedDate: "2024-11-05", 
    size: "320 KB",
    icon: FileCheck
  },
  { 
    id: "10", 
    title: "Break Time & Attendance Policy", 
    category: "procedure", 
    uploadedBy: "HR Department", 
    uploadedDate: "2024-10-28", 
    size: "280 KB",
    icon: FileCheck
  },
]

const categoryConfig = {
  client: { label: "Client Docs", color: "bg-blue-500/20 text-blue-400 ring-blue-500/30", icon: Building2 },
  training: { label: "Training", color: "bg-purple-500/20 text-purple-400 ring-purple-500/30", icon: GraduationCap },
  procedure: { label: "Procedures", color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30", icon: FileCheck },
  culture: { label: "Culture", color: "bg-pink-500/20 text-pink-400 ring-pink-500/30", icon: Users },
  seo: { label: "SEO", color: "bg-amber-500/20 text-amber-400 ring-amber-500/30", icon: TrendingUp },
}

const suggestedQuestions = [
  { 
    category: "client", 
    icon: Building2, 
    text: "TechCorp listing process?", 
    query: "Can you explain the TechCorp listing procedures and best practices?" 
  },
  { 
    category: "seo", 
    icon: TrendingUp, 
    text: "How do I improve SEO?", 
    query: "What are the key SEO strategies I should use for our clients?" 
  },
  { 
    category: "culture", 
    icon: Users, 
    text: "TechCorp company culture?", 
    query: "Tell me about TechCorp's company culture and brand guidelines" 
  },
  { 
    category: "procedure", 
    icon: FileCheck, 
    text: "How to escalate issues?", 
    query: "What's the process for escalating customer issues?" 
  },
  { 
    category: "training", 
    icon: GraduationCap, 
    text: "CRM system training?", 
    query: "How do I use the CRM system effectively?" 
  },
  { 
    category: "procedure", 
    icon: HelpCircle, 
    text: "Leave policy?", 
    query: "What's the leave application and approval process?" 
  },
]

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")
  const [showDocs, setShowDocs] = useState(true)
  const [searchDocs, setSearchDocs] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response with document references
    setTimeout(() => {
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getMockResponse(text),
        sources: getRelevantDocs(text)
      }
      setMessages((prev) => [...prev, mockResponse])
      setIsLoading(false)
    }, 1500)
  }

  const getMockResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes("seo")) {
      return "Based on our SEO training materials, here are the key strategies:\n\n1. **Keyword Research**: Identify relevant keywords with good search volume\n2. **On-Page Optimization**: Optimize titles, meta descriptions, and headers\n3. **Quality Content**: Create valuable, engaging content for your audience\n4. **Link Building**: Build authoritative backlinks from reputable sites\n5. **Technical SEO**: Ensure fast loading, mobile-friendly, proper site structure\n\nI'm referencing our 'SEO Fundamentals' and 'Advanced SEO Strategies' documents for this answer. Would you like me to dive deeper into any specific area?"
    }
    
    if (lowerQuery.includes("listing") || lowerQuery.includes("techcorp")) {
      return "According to TechCorp's Listing Procedures Guide:\n\n**Key Steps:**\n1. Initial client consultation to understand requirements\n2. Gather all necessary documentation and media assets\n3. Create listing draft following brand guidelines\n4. Submit for client review and approval\n5. Make revisions based on feedback\n6. Final publication and monitoring\n\n**Important**: Always follow TechCorp's brand guidelines and communication standards. Turnaround time is typically 2-3 business days.\n\nWould you like more details on any specific step?"
    }
    
    if (lowerQuery.includes("culture")) {
      return "TechCorp's Company Culture emphasizes:\n\n✨ **Core Values:**\n- Innovation and creativity\n- Customer-first mindset\n- Collaboration and teamwork\n- Continuous learning and growth\n- Work-life balance\n\n🎯 **Brand Personality:**\n- Professional yet approachable\n- Data-driven but human-centered\n- Forward-thinking and adaptable\n\nThey encourage open communication, value diverse perspectives, and celebrate team wins. The culture document also includes detailed brand voice guidelines for client communications."
    }
    
    if (lowerQuery.includes("escalate") || lowerQuery.includes("escalation")) {
      return "**Issue Escalation Process:**\n\n🔴 **Level 1 - Immediate Action:**\n- Try to resolve the issue yourself first\n- Document all details in CRM\n- Timeframe: Within 2 hours\n\n🟡 **Level 2 - Team Lead:**\n- If unresolved, escalate to your Team Lead\n- Provide full context and attempted solutions\n- Timeframe: Within 4 hours\n\n🟠 **Level 3 - Management:**\n- For critical/urgent client issues\n- Team Lead will escalate if needed\n- Immediate notification required\n\n✅ **Always include:**\n- Client name and account ID\n- Issue description and impact\n- Steps taken so far\n- Urgency level"
    }
    
    if (lowerQuery.includes("leave") || lowerQuery.includes("vacation")) {
      return "**Leave Application Process:**\n\n📝 **Steps:**\n1. Submit leave request through the staff portal (My Profile → Leave Credits)\n2. Request must be submitted at least 3 days in advance (except emergencies)\n3. Your Team Lead will review and approve/deny\n4. You'll receive notification via email\n5. Approved leave will be reflected in your schedule\n\n📊 **Leave Credits:**\n- Total: 12 days per year (combined sick + vacation)\n- Can be used flexibly for either sick or vacation\n- Unused credits don't roll over\n\n⚠️ **Emergency Leave:**\nFor same-day sick leave, notify your Team Lead immediately via Slack/phone."
    }
    
    if (lowerQuery.includes("crm")) {
      return "**CRM System Guide - Key Features:**\n\n📋 **Dashboard:**\n- View all assigned tickets and tasks\n- Track customer interactions\n- Monitor response times\n\n✍️ **Creating Tickets:**\n1. Click 'New Ticket' button\n2. Fill in customer details\n3. Select category and priority\n4. Assign to team member (or self)\n5. Add notes and attachments\n\n🔍 **Searching:**\n- Use the global search bar\n- Filter by status, date, priority\n- Save custom filters\n\n💬 **Customer Communication:**\n- All messages logged automatically\n- Use templates for common responses\n- Track conversation history\n\nNeed help with a specific CRM feature?"
    }
    
    return "I'm here to help! I have access to all company documents including:\n\n📁 Client documentation (TechCorp procedures, guidelines)\n📚 Training materials (SEO, customer service, CRM)\n📋 Company procedures (escalation, leave, attendance)\n🎯 Culture guides and best practices\n\nWhat would you like to learn about? You can ask me anything about our clients, procedures, or training topics!"
  }

  const getRelevantDocs = (query: string): string[] => {
    const lowerQuery = query.toLowerCase()
    const sources: string[] = []
    
    if (lowerQuery.includes("seo")) {
      sources.push("SEO Fundamentals for Client Success", "Advanced SEO Strategies & Techniques")
    }
    if (lowerQuery.includes("listing") || lowerQuery.includes("techcorp")) {
      sources.push("TechCorp - Listing Procedures Guide", "Client Communication Best Practices")
    }
    if (lowerQuery.includes("culture")) {
      sources.push("TechCorp - Brand Guidelines & Culture")
    }
    if (lowerQuery.includes("escalate")) {
      sources.push("Issue Escalation Process")
    }
    if (lowerQuery.includes("leave")) {
      sources.push("Leave Application & Approval Process")
    }
    if (lowerQuery.includes("crm")) {
      sources.push("CRM System - Complete User Guide")
    }
    
    return sources
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput("")
  }

  const handleQuickQuestion = (query: string) => {
    sendMessage(query)
    inputRef.current?.focus()
  }

  const filteredDocs = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchDocs.toLowerCase())
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const docsByCategory = Object.entries(categoryConfig).map(([key, config]) => ({
    key,
    ...config,
    count: mockDocuments.filter(d => d.category === key).length
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
                <div className="text-xl font-bold text-white">{mockDocuments.length}</div>
                <div className="text-xs text-slate-400">Documents</div>
              </div>
              <div className="rounded-xl bg-indigo-500/10 p-3 text-center ring-1 ring-indigo-500/30">
                <div className="text-xl font-bold text-indigo-400">
                  {mockDocuments.filter(d => d.category === "client").length}
                </div>
                <div className="text-xs text-indigo-300">Client Docs</div>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3 text-center ring-1 ring-purple-500/30">
                <div className="text-xl font-bold text-purple-400">
                  {mockDocuments.filter(d => d.category === "training" || d.category === "seo").length}
                </div>
                <div className="text-xs text-purple-300">Training</div>
              </div>
          </div>
        </div>

          {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="space-y-4 rounded-2xl bg-slate-900/50 p-6 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
                <h2 className="font-semibold text-white">Popular Questions</h2>
            </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {suggestedQuestions.map((question, idx) => {
                const Icon = question.icon
                  const config = categoryConfig[question.category as keyof typeof categoryConfig]
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question.query)}
                      className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 text-left ring-1 ring-white/10 transition-all hover:bg-slate-800 hover:ring-white/20 hover:scale-[1.02]"
                  >
                      <div className={`rounded-lg p-2 ring-1 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    <span className="text-sm font-medium text-white">{question.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
                    I have access to {mockDocuments.length} documents covering client procedures,<br />
                    training materials, company policies, and more.
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
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
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
        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about clients, procedures, training, SEO..."
              disabled={isLoading}
              className="flex-1 rounded-lg bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50 disabled:opacity-50"
            />
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
                  <span className="text-xs">{mockDocuments.length}</span>
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
              {filteredDocs.map((doc) => {
                const Icon = doc.icon
                const config = categoryConfig[doc.category]
                return (
                  <div
                    key={doc.id}
                    className="group cursor-pointer rounded-lg bg-slate-800/30 p-3 ring-1 ring-white/5 transition-all hover:bg-slate-800/50 hover:ring-white/10"
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
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upload Button (for future) */}
          <button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white ring-1 ring-indigo-500/50 transition-all hover:from-indigo-700 hover:to-purple-700">
            <Upload className="inline h-4 w-4 mr-2" />
            Upload Document
          </button>
        </div>

      </div>
    </div>
  )
}
