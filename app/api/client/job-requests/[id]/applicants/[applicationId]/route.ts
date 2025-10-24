/**
 * Client Application Status Update API
 * PATCH /api/client/job-requests/[id]/applicants/[applicationId]
 * 
 * Update application status (reject)
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
    // Verify client is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
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

    // Validate status
    const validStatuses = ['rejected', 'passed', 'pending']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be: rejected, passed, or pending' }, { status: 400 })
    }

    console.log(`🔄 Updating application ${applicationId} to status: ${status}`)

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

    console.log(`✅ Application ${applicationId} updated to ${status}`)

    return NextResponse.json({
      success: true,
      application: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at
      }
    })
  } catch (error) {
    console.error('❌ Error updating application status:', error)
    return NextResponse.json(
      { error: 'Failed to update application status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

