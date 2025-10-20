/**
 * Admin Interview Requests API
 * GET /api/admin/interviews/requests
 * 
 * Get all interview requests for admin review
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
    const statusFilter = searchParams.get('status') || 'pending'

    console.log(`📋 Admin fetching interview requests, status: ${statusFilter}`)

    // Fetch interview requests with client details
    let query = `
      SELECT 
        ir.*,
        cu.name as client_name,
        cu.email as client_email,
        cu.company as client_company
      FROM interview_requests ir
      JOIN client_users cu ON ir.client_user_id = cu.id
    `

    if (statusFilter !== 'all') {
      query += ` WHERE ir.status = $1`
    }

    query += ` ORDER BY ir.created_at DESC`

    const requests = statusFilter === 'all'
      ? await prisma.$queryRawUnsafe<any[]>(query)
      : await prisma.$queryRawUnsafe<any[]>(query, statusFilter)

    console.log(`✅ Found ${requests.length} interview requests`)

    return NextResponse.json({
      success: true,
      requests,
      count: requests.length,
    })
  } catch (error) {
    console.error('❌ Error fetching interview requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

