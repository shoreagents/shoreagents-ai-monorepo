import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
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

    console.log(`✅ [CLIENT] Marking interview ${id} as completed`)

    // Fetch existing interview
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Fetch the client user who created the interview and the current session user
    const [interviewCreator, sessionClientUser] = await Promise.all([
      prisma.client_users.findUnique({
        where: { id: existing.clientUserId },
        select: { companyId: true }
      }),
      prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { companyId: true }
      })
    ])

    if (!interviewCreator || !sessionClientUser) {
      console.log(`❌ Client user not found`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure client belongs to the same company as the interview creator
    if (interviewCreator.companyId !== sessionClientUser.companyId) {
      console.log(`❌ Authorization failed: Different companies`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update interview status to COMPLETED and add feedback to client notes
    const updateData: any = {
      status: 'COMPLETED',
      updatedAt: new Date()
    }

    // If client provided feedback, append it to client notes
    if (notes && notes.trim()) {
      const timestamp = new Date().toLocaleString()
      const trimmedNotes = notes.trim()
      const existingNotes = existing.clientNotes?.trim() || ''
      const feedbackNote = existingNotes ? `\n\n[${timestamp}] FEEDBACK: ${trimmedNotes}` : `[${timestamp}] FEEDBACK: ${trimmedNotes}`
      updateData.clientNotes = existingNotes + feedbackNote
    }

    const interview = await prisma.interview_requests.update({
      where: { id },
      data: updateData
    })

    console.log(`✅ [CLIENT] Interview marked as completed: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error marking interview as completed:', error)
    return NextResponse.json(
      { error: 'Failed to mark interview as completed' },
      { status: 500 }
    )
  }
}



