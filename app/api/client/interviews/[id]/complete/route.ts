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

    // Update interview status to COMPLETED and add feedback to client notes
    const updateData: any = {
      status: 'COMPLETED',
      updatedAt: new Date()
    }

    // If client provided feedback, append it to client notes
    if (notes && notes.trim()) {
      const existing = await prisma.staff_interview_requests.findUnique({
        where: { id }
      })
      const timestamp = new Date().toLocaleString()
      const feedbackNote = `\n\n[${timestamp}] FEEDBACK: ${notes}`
      updateData.clientNotes = (existing?.clientNotes || '') + feedbackNote
    }

    const interview = await prisma.staff_interview_requests.update({
      where: { 
        id,
        clientUserId: session.user.id // Ensure client owns this interview request
      },
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



