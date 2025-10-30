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

    console.log(`🚫 Cancelling interview ${id}`)

    // Update interview status to CANCELLED
    const interview = await prisma.staff_interview_requests.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    console.log(`✅ Interview cancelled: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ Error cancelling interview:', error)
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    )
  }
}



