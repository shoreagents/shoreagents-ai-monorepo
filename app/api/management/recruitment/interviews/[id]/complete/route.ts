import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    console.log(`✅ Marking interview ${id} as completed`)

    // Update interview status to COMPLETED
    const interview = await prisma.staff_interview_requests.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    })

    console.log(`✅ Interview marked as completed: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ Error marking interview as completed:', error)
    return NextResponse.json(
      { error: 'Failed to mark interview as completed' },
      { status: 500 }
    )
  }
}



