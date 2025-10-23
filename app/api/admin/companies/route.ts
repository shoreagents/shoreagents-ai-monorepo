/**
 * Admin Companies API
 * GET /api/admin/companies
 * 
 * Fetches all companies for admin dropdowns
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
    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    // Fetch all active companies
    const companies = await prisma.company.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        companyName: true
      },
      orderBy: {
        companyName: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      companies
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
