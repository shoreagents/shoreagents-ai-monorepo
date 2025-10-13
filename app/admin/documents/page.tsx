import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Plus, FileText, Eye, Trash2 } from "@/components/admin/icons"
import { prisma } from "@/lib/prisma"

async function getDocuments() {
  try {
    const documents = await prisma.document.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })
    return documents
  } catch (error) {
    console.error('Error fetching documents:', error)
    return []
  }
}

const getTypeBadge = (type: string) => {
  const variants: Record<string, string> = {
    CONTRACT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    INVOICE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    REPORT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    OTHER: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }
  return variants[type] || variants.OTHER
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "Unknown"
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default async function DocumentsPage() {
  const documents = await getDocuments()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Document Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage contracts, invoices, and reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export List
          </Button>
          <Button className="gap-2 bg-primary">
            <Plus className="size-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-9" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="recent">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Document Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Staff / Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Uploaded By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Upload Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc: any) => {
                  const typeBadge = getTypeBadge(doc.type)

                  return (
                    <tr key={doc.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">{doc.fileName}</div>
                            <div className="text-xs text-muted-foreground">{doc.filePath}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={typeBadge}>
                          {doc.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm text-foreground">N/A</div>
                          <div className="text-xs text-muted-foreground">N/A</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage src={doc.user?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{doc.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">{doc.user?.name || "System"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Download className="size-3.5" />
                            Download
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Eye className="size-3.5" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive">
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
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
          <div className="text-sm text-muted-foreground">Total Documents</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{documents.length}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Contracts</div>
          <div className="text-2xl font-semibold text-purple-500 mt-1">
            {documents.filter(d => d.type === 'CONTRACT').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Invoices</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">
            {documents.filter(d => d.type === 'INVOICE').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Reports</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">
            {documents.filter(d => d.type === 'REPORT').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Size</div>
          <div className="text-2xl font-semibold text-orange-500 mt-1">
            {formatFileSize(documents.reduce((acc, d) => acc + (d.fileSize || 0), 0))}
          </div>
        </Card>
      </div>
    </div>
  )
}
