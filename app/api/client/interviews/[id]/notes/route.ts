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

    console.log(`📝 [CLIENT] Updating notes for interview ${id}`)

    // Update client notes
    const interview = await prisma.staff_interview_requests.update({
      where: { 
        id,
        clientUserId: session.user.id // Ensure client owns this interview request
      },
      data: {
        clientNotes: notes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [CLIENT] Notes updated: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error updating notes:', error)
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    )
  }
}



