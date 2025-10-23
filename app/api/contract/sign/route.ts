/**
 * Contract Sign API
 * POST /api/contract/sign
 * 
 * Save contract signature and mark as signed
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify staff is authenticated
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find staff user with contract
    const staffUser = await prisma.staffUser.findUnique({
      where: { email: session.user.email },
      include: {
        employmentContract: true,
        jobAcceptance: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    if (!staffUser.employmentContract) {
      return NextResponse.json({ error: 'No contract found' }, { status: 404 })
    }

    if (staffUser.employmentContract.signed) {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 })
    }

    // Get signature from form data
    const formData = await request.formData()
    const signatureFile = formData.get('signature') as File

    if (!signatureFile) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
    }

    // Upload signature to Supabase Storage
    const fileName = `${staffUser.id}/signature.png`
    const fileBuffer = await signatureFile.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('staff')
      .upload(`employment_contracts/${fileName}`, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload signature' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('staff')
      .getPublicUrl(`employment_contracts/${fileName}`)

    const signatureUrl = urlData.publicUrl

    // Update contract with signature
    await prisma.employmentContract.update({
      where: { id: staffUser.employmentContract.id },
      data: {
        finalSignatureUrl: signatureUrl,
        signed: true,
        signedAt: new Date(),
        fullyInitialed: true // All sections checked
      }
    })

    // Update job acceptance
    if (staffUser.jobAcceptance) {
      await prisma.jobAcceptance.update({
        where: { id: staffUser.jobAcceptance.id },
        data: {
          contractSigned: true,
          contractSignedAt: new Date()
        }
      })
    }

    console.log(`✅ [CONTRACT] Contract signed by staff: ${staffUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      signatureUrl
    })
  } catch (error) {
    console.error('❌ Error signing contract:', error)
    return NextResponse.json(
      { error: 'Failed to sign contract', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

