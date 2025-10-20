import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// BPOC Database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL
})

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

    // Get client's company_id
    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    const body = await request.json()

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
        'pending', 0, 0, NOW(), NOW()
      )
      RETURNING *`,
      [
        clientUser.company.id, // company_id from our Supabase
        body.job_title,
        body.job_description,
        body.work_type,
        body.work_arrangement,
        body.experience_level,
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
    console.error("Error creating job request:", error)
    return NextResponse.json(
      { error: "Failed to create job request" },
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

    // Get client's company_id
    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    // Fetch job requests from BPOC database
    const result = await bpocPool.query(
      `SELECT * FROM job_requests 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [clientUser.company.id]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching job requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch job requests" },
      { status: 500 }
    )
  }
}

