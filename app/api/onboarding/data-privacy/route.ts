/**
 * Data Privacy Consent & Bank Details API
 * POST /api/onboarding/data-privacy
 * 
 * Save data privacy consent and bank account details
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify staff is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { staffOnboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    if (!staffUser.staffOnboarding) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 })
    }

    // Get data from request body
    const body = await request.json()
    const { dataPrivacyConsent, bankName, accountName, accountNumber } = body

    // Validate required fields
    if (!dataPrivacyConsent) {
      return NextResponse.json({ error: 'Data privacy consent is required' }, { status: 400 })
    }

    if (!bankName || !accountName || !accountNumber) {
      return NextResponse.json({ error: 'All bank account details are required' }, { status: 400 })
    }

    // Prepare bank account details as JSON
    const bankAccountDetails = JSON.stringify({
      bankName,
      accountName,
      accountNumber,
      consentedAt: new Date().toISOString()
    })

    // Update onboarding record
    await prisma.staffOnboarding.update({
      where: { staffUserId: staffUser.id },
      data: {
        dataPrivacyConsentUrl: `consent-${staffUser.id}-${Date.now()}`, // Placeholder - could generate PDF
        bankAccountDetails: bankAccountDetails,
        dataPrivacyStatus: 'IN_REVIEW',
        bankDetailsStatus: 'IN_REVIEW'
      }
    })

    console.log(`✅ [ONBOARDING] Data privacy consent & bank details saved for staff: ${staffUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'Data privacy consent and bank details saved successfully'
    })
  } catch (error) {
    console.error('❌ Error saving data privacy consent:', error)
    return NextResponse.json(
      { error: 'Failed to save data privacy consent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

