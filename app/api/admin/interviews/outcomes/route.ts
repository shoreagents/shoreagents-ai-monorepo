/**
 * Admin Interview Outcomes API
 * GET /api/admin/interviews/outcomes
 * PATCH /api/admin/interviews/outcomes/[id] (update admin notes)
 * 
 * Get all interview outcomes with client feedback
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const decisionFilter = searchParams.get('decision') // hire | reject | needs_review

    console.log(`📊 Admin fetching interview outcomes`)

    // Fetch interview outcomes with all related data
    let query = `
      SELECT 
        io.*,
        si.scheduled_time,
        si.daily_co_room_url,
        cu.name as client_name,
        cu.email as client_email,
        cu.company as client_company
      FROM interview_outcomes io
      JOIN scheduled_interviews si ON io.scheduled_interview_id = si.id
      JOIN client_users cu ON io.client_user_id = cu.id
    `

    if (decisionFilter) {
      query += ` WHERE io.decision = $1`
    }

    query += ` ORDER BY io.created_at DESC`

    const outcomes = decisionFilter
      ? await prisma.$queryRawUnsafe<any[]>(query, decisionFilter)
      : await prisma.$queryRawUnsafe<any[]>(query)

    console.log(`✅ Found ${outcomes.length} interview outcomes`)

    // Calculate stats
    const stats = {
      total: outcomes.length,
      hired: outcomes.filter(o => o.decision === 'hire').length,
      rejected: outcomes.filter(o => o.decision === 'reject').length,
      needsReview: outcomes.filter(o => o.decision === 'needs_review').length,
    }

    return NextResponse.json({
      success: true,
      outcomes,
      stats,
    })
  } catch (error) {
    console.error('❌ Error fetching interview outcomes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview outcomes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { outcome_id, admin_notes } = body

    if (!outcome_id) {
      return NextResponse.json({ error: 'Outcome ID is required' }, { status: 400 })
    }

    console.log(`📝 Admin updating notes for outcome: ${outcome_id}`)

    // Update admin notes
    await prisma.$executeRaw`
      UPDATE interview_outcomes
      SET admin_notes = ${admin_notes || null},
          updated_at = NOW()
      WHERE id = ${outcome_id}::uuid
    `

    console.log(`✅ Admin notes updated`)

    return NextResponse.json({
      success: true,
      message: 'Admin notes updated successfully',
    })
  } catch (error) {
    console.error('❌ Error updating admin notes:', error)
    return NextResponse.json(
      { error: 'Failed to update admin notes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

