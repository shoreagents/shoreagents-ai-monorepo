import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { notes } = body

    console.log(`📅 [CLIENT] Reschedule request for interview ${id}`)

    // Fetch existing interview
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Append reschedule request to admin notes
    const timestamp = new Date().toLocaleString()
    const rescheduleNote = `\n\n[${timestamp}] CLIENT RESCHEDULE REQUEST: ${notes}`
    const updatedAdminNotes = (existing.adminNotes || '') + rescheduleNote

    // Update interview with reschedule request in admin notes
    const interview = await prisma.interview_requests.update({
      where: { 
        id,
        clientUserId: session.user.id // Ensure client owns this interview request
      },
      data: {
        adminNotes: updatedAdminNotes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [CLIENT] Reschedule request sent: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error sending reschedule request:', error)
    return NextResponse.json(
      { error: 'Failed to send reschedule request' },
      { status: 500 }
    )
  }
}



