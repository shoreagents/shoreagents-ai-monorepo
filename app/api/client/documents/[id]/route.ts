import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Fetch single document by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const documentId = id

    // Get document with staffUser relation
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log(`📄 [CLIENT] Fetched document ${documentId}`)

    return NextResponse.json(document, { status: 200 })
  } catch (error: any) {
    console.error('❌ [CLIENT] Error fetching document:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
