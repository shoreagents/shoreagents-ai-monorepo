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
    const { reason } = body

    console.log(`🚫 [CLIENT] Cancelling interview ${id}`)

    // Update interview status to CANCELLED and add cancellation reason to client notes
    const interview = await prisma.interview_requests.update({
      where: { 
        id,
        clientUserId: session.user.id // Ensure client owns this interview request
      },
      data: {
        status: 'CANCELLED',
        clientNotes: reason ? `${reason}\n\n(Cancelled by client)` : 'Cancelled by client',
        updatedAt: new Date()
      }
    })

    console.log(`✅ [CLIENT] Interview cancelled: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error cancelling interview:', error)
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    )
  }
}



