/**
 * Client Job Applicants API
 * GET /api/client/job-requests/[id]/applicants
 * 
 * Fetch applicants for a specific job request from BPOC database
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'

// BPOC Database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const jobId = parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    // Check if BPOC database is configured
    if (!process.env.BPOC_DATABASE_URL) {
      return NextResponse.json({ error: 'BPOC database not configured' }, { status: 503 })
    }

    console.log(`🔍 Fetching applicants for job ID: ${jobId}`)

    // Fetch applicants with candidate details
    const result = await bpocPool.query(
      `SELECT 
        a.id as application_id,
        a.user_id,
        a.status,
        a.created_at as applied_at,
        u.first_name,
        u.avatar_url,
        u.position,
        u.location_city,
        u.location_country,
        re.resume_data
      FROM applications a
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN resumes_extracted re ON a.user_id = re.user_id
      WHERE a.job_id = $1
      ORDER BY a.created_at DESC`,
      [jobId]
    )

    // Process and anonymize applicants
    const applicants = result.rows.map(row => {
      const skills = row.resume_data?.skills || []
      
      return {
        applicationId: row.application_id,
        userId: row.user_id,
        status: row.status,
        appliedAt: row.applied_at,
        candidate: {
          firstName: row.first_name,
          avatar: row.avatar_url,
          position: row.position || 'Professional',
          location: formatLocation(row.location_city, row.location_country),
          skills: Array.isArray(skills) ? skills.slice(0, 5) : []
        }
      }
    })

    console.log(`✅ Found ${applicants.length} applicants for job ${jobId}`)

    return NextResponse.json({
      success: true,
      applicants,
      count: applicants.length
    })
  } catch (error) {
    console.error('❌ Error fetching applicants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applicants', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function formatLocation(city: string | null, country: string | null): string {
  const parts = []
  if (city) parts.push(city)
  if (country) parts.push(country)
  return parts.join(', ') || 'Location not specified'
}

