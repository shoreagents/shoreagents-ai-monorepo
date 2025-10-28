/**
 * Client Job Requests API
 * POST /api/client/job-requests - Create job request
 * GET /api/client/job-requests - Fetch company's job requests
 * 
 * Company Mapping Strategy:
 * - Uses company.organizationId (or company.id as fallback) as the company_id in BPOC
 * - Auto-creates company record in BPOC if it doesn't exist (on first job post)
 * - Ensures complete isolation: Each company only sees their own job requests
 * - Respects BPOC's foreign key constraint: job_requests.company_id → companies.id
 */

import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// BPOC Database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL
})

// Check if BPOC database URL is configured
if (!process.env.BPOC_DATABASE_URL) {
  console.error("❌ BPOC_DATABASE_URL environment variable is not set")
}

/**
 * Map frontend experience level values to BPOC enum values
 * BPOC uses: 'entry-level', 'mid-level', 'senior-level'
 */
function mapExperienceLevel(level: string): string {
  const mapping: Record<string, string> = {
    'entry-level': 'entry-level',
    'mid-level': 'mid-level',
    'senior': 'senior-level',  // Frontend sends 'senior', BPOC expects 'senior-level'
    'Senior': 'senior-level',
    'senior-level': 'senior-level'
  }
  return mapping[level] || level
}

/**
 * Ensure company exists in BPOC database
 * Creates company record if it doesn't exist
 * Returns the company ID to use for job_requests
 */
async function ensureBPOCCompany(company: { id: string; organizationId: string; companyName: string }) {
  const bpocCompanyId = company.organizationId || company.id
  
  try {
    // Check if company already exists in BPOC members table
    const existingCompany = await bpocPool.query(
      'SELECT company_id FROM members WHERE company_id = $1 LIMIT 1',
      [bpocCompanyId]
    )
    
    if (existingCompany.rows.length > 0) {
      console.log(`✅ Company already exists in BPOC members: ${company.companyName} (${bpocCompanyId})`)
      return bpocCompanyId
    }
    
    // Company doesn't exist, create it in members table
    console.log(`📋 Creating company in BPOC members table: ${company.companyName} (${bpocCompanyId})`)
    
    // Insert into members table with required fields: company_id and company
    const result = await bpocPool.query(
      'INSERT INTO members (company_id, company, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING company_id',
      [bpocCompanyId, company.companyName]
    )
    
    console.log(`✅ Company created in BPOC members: ${company.companyName} (${result.rows[0].company_id})`)
    return result.rows[0].company_id
    
  } catch (error) {
    console.error('❌ Error ensuring BPOC company in members table:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Check if BPOC database is configured
    if (!process.env.BPOC_DATABASE_URL) {
      return NextResponse.json(
        { error: "BPOC database not configured. Please contact administrator." },
        { status: 503 }
      )
    }

    // Get client's company with organizationId (unique identifier)
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    const body = await request.json()

    // Ensure company exists in BPOC database (creates if needed)
    let bpocCompanyId;
    try {
      bpocCompanyId = await ensureBPOCCompany({
        id: clientUser.company.id,
        organizationId: clientUser.company.organizationId,
        companyName: clientUser.company.companyName
      })
      console.log(`✅ Company ensured in BPOC: ${bpocCompanyId}`)
    } catch (companyError) {
      console.error('❌ Failed to ensure company in BPOC:', companyError)
      return NextResponse.json(
        { 
          error: 'Failed to create/verify company in BPOC',
          details: companyError instanceof Error ? companyError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
    
    // Check valid enum values for experience_level (for debugging)
    try {
      const enumCheck = await bpocPool.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'experience_level_enum'
        )
      `)
      console.log('📊 Valid experience_level enum values:', enumCheck.rows.map(r => r.enumlabel))
    } catch (enumError) {
      console.log('⚠️ Could not check enum values:', enumError)
    }
    
    console.log(`📋 Creating job request for company: ${clientUser.company.companyName} (ID: ${bpocCompanyId})`)
    console.log(`📋 Experience level: ${body.experience_level} → ${mapExperienceLevel(body.experience_level)}`)

    // Insert into BPOC database
    const result = await bpocPool.query(
      `INSERT INTO job_requests (
        company_id,
        job_title,
        job_description,
        work_type,
        work_arrangement,
        experience_level,
        salary_min,
        salary_max,
        currency,
        salary_type,
        department,
        industry,
        shift,
        priority,
        application_deadline,
        requirements,
        responsibilities,
        benefits,
        skills,
        status,
        views,
        applicants,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        'active', 0, 0, NOW(), NOW()
      )
      RETURNING *`,
      [
        bpocCompanyId, // Use the verified company ID
        body.job_title,
        body.job_description,
        body.work_type,
        body.work_arrangement,
        mapExperienceLevel(body.experience_level), // Map to BPOC enum format
        body.salary_min,
        body.salary_max,
        body.currency,
        body.salary_type,
        body.department,
        body.industry,
        body.shift,
        body.priority,
        body.application_deadline,
        body.requirements,
        body.responsibilities,
        body.benefits,
        body.skills
      ]
    )

    console.log("✅ Job request created in BPOC:", result.rows[0].id)

    return NextResponse.json({
      success: true,
      jobRequest: result.rows[0]
    })
  } catch (error) {
    console.error("❌ Error creating job request:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("❌ Error details:", errorMessage)
    return NextResponse.json(
      { 
        error: "Failed to create job request",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Check if BPOC database is configured
    if (!process.env.BPOC_DATABASE_URL) {
      console.log("⚠️ BPOC database not configured, returning empty array")
      return NextResponse.json([])
    }

    // Get client's company with organizationId (unique identifier)
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    // Use company.id as the company identifier in BPOC (fallback to organizationId if needed)
    const bpocCompanyId = clientUser.company.organizationId || clientUser.company.id
    
    console.log(`🔍 Fetching job requests for company: ${clientUser.company.companyName} (ID: ${bpocCompanyId})`)

    // Fetch ONLY this company's job requests from BPOC database
    const result = await bpocPool.query(
      `SELECT * FROM job_requests 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [bpocCompanyId]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching job requests:", error)
    // Return empty array instead of error to allow form to show
    return NextResponse.json([])
  }
}
