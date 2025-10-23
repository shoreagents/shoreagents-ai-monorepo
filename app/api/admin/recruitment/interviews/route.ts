/**
 * Admin Recruitment - Interview Requests API
 * GET /api/admin/recruitment/interviews
 * 
 * Fetch all interview requests from database for admin view
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin/manager
    const userRole = session.user.role?.toUpperCase()
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    console.log('🔍 [ADMIN] Fetching all interview requests')

    // Fetch ALL interview requests with client user info
    const interviews = await prisma.$queryRaw<any[]>`
      SELECT 
        ir.*,
        cu.name as client_name,
        cu.email as client_email,
        c.company_name as company_name
      FROM interview_requests ir
      LEFT JOIN client_users cu ON ir.client_user_id = cu.id
      LEFT JOIN companies c ON cu.company_id = c.id
      ORDER BY ir.created_at DESC
    `

    console.log(`✅ [ADMIN] Found ${interviews.length} interview requests`)

    return NextResponse.json({
      success: true,
      interviews: interviews,
      count: interviews.length,
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching interview requests:', error)
    
    // If table doesn't exist, return empty array
    if (error instanceof Error && error.message.includes('relation "interview_requests" does not exist')) {
      console.log('⚠️ [ADMIN] interview_requests table does not exist, returning empty array')
      return NextResponse.json({
        success: true,
        interviews: [],
        count: 0,
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch interview requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

