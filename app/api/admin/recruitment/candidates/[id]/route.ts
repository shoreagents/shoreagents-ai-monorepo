/**
 * Admin Recruitment - Single Candidate API
 * GET /api/admin/recruitment/candidates/[id]
 * 
 * Fetch a single candidate from BPOC database by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCandidateById } from '@/lib/bpoc-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Await params (Next.js 15+)
    const { id } = await params

    console.log(`🔍 [ADMIN] Fetching candidate ${id} from BPOC database`)

    // Fetch candidate from BPOC database using existing helper
    const candidate = await getCandidateById(id)

    if (!candidate) {
      return NextResponse.json({ 
        success: false,
        error: 'Candidate not found' 
      }, { status: 404 })
    }

    // Extract contact info from resume_data if available
    const resumeData = candidate.resume_data || {}
    const email = resumeData.email || resumeData.contact?.email || ''
    const phone = resumeData.phone || resumeData.contact?.phone || resumeData.contact?.mobile || ''

    console.log(`✅ [ADMIN] Found candidate: ${candidate.first_name}`, { 
      hasEmail: !!email, 
      hasPhone: !!phone 
    })

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        first_name: candidate.first_name,
        email: email,
        phone: phone,
        position: candidate.position || '',
        location_city: candidate.location_city,
        location_country: candidate.location_country,
        bio: candidate.bio,
        avatar_url: candidate.avatar_url,
        resume_data: candidate.resume_data
      }
    })

  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching candidate:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to fetch candidate' 
    }, { status: 500 })
  }
}

