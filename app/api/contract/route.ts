/**
 * Contract API
 * GET /api/contract
 * 
 * Fetch employment contract for authenticated staff
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify staff is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        employmentContract: true,
        jobAcceptance: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    // Check if they have a contract
    if (!staffUser.employmentContract) {
      return NextResponse.json({ error: 'No contract found' }, { status: 404 })
    }

    // Check if already signed
    if (staffUser.employmentContract.signed) {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 })
    }

    // Return contract data
    return NextResponse.json({
      success: true,
      contract: {
        id: staffUser.employmentContract.id,
        employeeName: staffUser.employmentContract.employeeName,
        position: staffUser.employmentContract.position,
        assignedClient: staffUser.employmentContract.assignedClient,
        startDate: staffUser.employmentContract.startDate,
        workSchedule: staffUser.employmentContract.workSchedule,
        basicSalary: Number(staffUser.employmentContract.basicSalary),
        deMinimis: Number(staffUser.employmentContract.deMinimis),
        totalMonthlyGross: Number(staffUser.employmentContract.totalMonthlyGross),
        hmoOffer: staffUser.employmentContract.hmoOffer,
        paidLeave: staffUser.employmentContract.paidLeave,
        probationaryPeriod: staffUser.employmentContract.probationaryPeriod,
        signed: staffUser.employmentContract.signed
      }
    })
  } catch (error) {
    console.error('❌ Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

