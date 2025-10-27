import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        job_acceptances: {
          include: {
            company: true,
            interview_requests: true
          }
        },
        company: true
      }
    });

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    let contract = await prisma.employment_contracts.findUnique({
      where: { staffUserId: staffUser.id },
      include: {
        company: {
          select: { companyName: true }
        }
      }
    });

    // Auto-create contract if none exists and staff has job acceptance
    if (!contract && staffUser.job_acceptances && staffUser.companyId) {
      console.log('📄 [CONTRACT] Auto-creating contract from job acceptance for:', staffUser.name);
      
      const jobAcceptance = staffUser.job_acceptances;
      const company = staffUser.company || jobAcceptance.company;
      
      // Default contract values (can be customized by admin later)
      contract = await prisma.employment_contracts.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staffUser.id,
          companyId: staffUser.companyId,
          jobAcceptanceId: jobAcceptance.id,
          employeeName: staffUser.name,
          employeeAddress: "To be provided",
          contactType: "FULL_TIME",
          position: jobAcceptance.position || "Staff Member",
          assignedClient: company?.companyName || "To be assigned",
          startDate: jobAcceptance.interview_requests?.finalStartDate || new Date(),
          workSchedule: "Monday-Friday, 9:00 AM - 5:00 PM",
          basicSalary: 25000, // Default PHP 25,000
          deMinimis: 3000, // Default PHP 3,000
          totalMonthlyGross: 28000,
          hmoOffer: "HMO coverage after probation",
          paidLeave: "12 days annual leave after probation",
          probationaryPeriod: "6 months",
          signed: false,
          fullyInitialed: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          company: {
            select: { companyName: true }
          }
        }
      });
      
      console.log('✅ [CONTRACT] Contract auto-created:', contract.id);
    }

    if (!contract) {
      return NextResponse.json({ error: "No contract found and no job acceptance to create from" }, { status: 404 });
    }

    if (contract.signed) {
      return NextResponse.json({ 
        success: true, 
        contract, 
        message: "Contract already signed" 
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, contract }, { status: 200 });
  } catch (error) {
    console.error("Error fetching employment contract:", error);
    return NextResponse.json({ error: "Failed to fetch employment contract" }, { status: 500 });
  }
}
