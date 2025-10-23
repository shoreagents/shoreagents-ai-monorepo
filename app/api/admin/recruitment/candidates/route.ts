/**
 * Admin Recruitment - Candidates API
 * GET /api/admin/recruitment/candidates
 * 
 * Fetch all candidates from BPOC database for admin view
 * NO ANONYMIZATION - Full access for management
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCandidates } from '@/lib/bpoc-db'

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

    console.log('🔍 [ADMIN] Fetching all candidates from BPOC database')

    // Fetch all candidates from BPOC database - NO FILTERS for admin
    const candidates = await getCandidates({})

    console.log(`✅ [ADMIN] Found ${candidates.length} candidates`)

    return NextResponse.json({
      success: true,
      candidates: candidates,
      count: candidates.length,
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

