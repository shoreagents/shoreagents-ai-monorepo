import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staffUser = await prisma.staffUser.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    const contract = await prisma.employmentContract.findUnique({
      where: { staffUserId: staffUser.id },
      include: {
        company: {
          select: { companyName: true }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: "No contract found" }, { status: 404 });
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
