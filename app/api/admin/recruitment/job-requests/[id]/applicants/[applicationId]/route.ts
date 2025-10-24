/**
 * Admin Application Status Update API
 * PATCH /api/admin/recruitment/job-requests/[id]/applicants/[applicationId]
 * 
 * Update application status with full enum support (all 13 statuses)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'

// BPOC Database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
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

    const { id, applicationId } = await params
    const jobId = parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    // Check if BPOC database is configured
    if (!process.env.BPOC_DATABASE_URL) {
      return NextResponse.json({ error: 'BPOC database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status - Admin has access to ALL 13 enum values
    const validStatuses = [
      'submitted',
      'qualified',
      'for verification',
      'verified',
      'initial interview',
      'final interview',
      'not qualified',
      'passed',
      'rejected',
      'withdrawn',
      'hired',
      'closed',
      'failed'
    ]
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status', 
        validStatuses 
      }, { status: 400 })
    }

    console.log(`🔄 [ADMIN] Updating application ${applicationId} to status: ${status}`)

    // Update application status
    const result = await bpocPool.query(
      `UPDATE applications 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND job_id = $3
       RETURNING *`,
      [status, applicationId, jobId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    console.log(`✅ [ADMIN] Application ${applicationId} updated to ${status}`)

    return NextResponse.json({
      success: true,
      application: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at
      }
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error updating application status:', error)
    return NextResponse.json(
      { error: 'Failed to update application status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

