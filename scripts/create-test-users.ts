// Create all test users for easy portal testing
// Run with: npx tsx scripts/create-test-users.ts

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createTestUsers() {
  console.log("🧪 Creating Test Users for All 3 Portals...\n")

  try {
    // 1. System Admin
    const adminEmail = "sysadmin@shoreagents.com"
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } })
    
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Shore Agents Admin",
          role: "ADMIN",
          passwordHash: await bcrypt.hash("admin123", 10),
        }
      })
      console.log("✅ System Admin created")
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "ADMIN" }
      })
      console.log("✅ System Admin updated")
    }

    // 2. Staff Member
    const staffEmail = "staff@shoreagents.com"
    let staff = await prisma.user.findUnique({ where: { email: staffEmail } })
    
    if (!staff) {
      staff = await prisma.user.create({
        data: {
          email: staffEmail,
          name: "Test Staff Member",
          role: "STAFF",
          passwordHash: await bcrypt.hash("staff123", 10),
        }
      })

      // Create profile
      await prisma.profile.create({
        data: {
          userId: staff.id,
          currentRole: "Customer Support Specialist",
          startDate: new Date(),
          daysEmployed: 0,
          salary: 8.5,
          employmentStatus: "PROBATION",
          totalLeave: 12,
          usedLeave: 0,
          vacationUsed: 0,
          sickUsed: 0,
          hmo: true,
        }
      })

      // Create gamification profile
      await prisma.gamification_profiles.create({
        data: {
          userId: staff.id,
          points: 0,
          level: 1,
          rank: null,
          streak: 0,
          tasksCompleted: 0,
          performanceScore: 0,
          reviewRating: null,
        }
      })

      console.log("✅ Staff Member created with profile")
    } else {
      console.log("✅ Staff Member already exists")
    }

    // 3. Client Organization (if not exists)
    let client = await prisma.client.findFirst({
      where: { companyName: "TechCorp Solutions" }
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          companyName: "TechCorp Solutions",
          industry: "Technology",
          location: "San Francisco, CA",
          billingEmail: "billing@techcorp.com",
        }
      })
      console.log("✅ Client Organization created")
    } else {
      console.log("✅ Client Organization already exists")
    }

    // 4. Client User
    const clientEmail = "client@techcorp.com"
    let clientUser = await prisma.client_users.findUnique({ 
      where: { email: clientEmail } 
    })
    
    if (!clientUser) {
      clientUser = await prisma.client_users.create({
        data: {
          email: clientEmail,
          name: "John Smith",
          role: "MANAGER",
          clientId: client.id,
          passwordHash: await bcrypt.hash("client123", 10),
        }
      })
      console.log("✅ Client User created")
    } else {
      console.log("✅ Client User already exists")
    }

    console.log("\n" + "=".repeat(70))
    console.log("🎉 ALL TEST USERS READY!")
    console.log("=".repeat(70))
    
    console.log("\n🔧 SYSTEM ADMIN (Shore Agents Management)")
    console.log("   Email:    sysadmin@shoreagents.com")
    console.log("   Password: admin123")
    console.log("   Portal:   http://localhost:3000/admin")
    
    console.log("\n👥 STAFF MEMBER (Offshore Staff)")
    console.log("   Email:    staff@shoreagents.com")
    console.log("   Password: staff123")
    console.log("   Portal:   http://localhost:3000/")
    
    console.log("\n🏢 CLIENT USER (TechCorp Manager)")
    console.log("   Email:    client@techcorp.com")
    console.log("   Password: client123")
    console.log("   Portal:   http://localhost:3000/client")
    
    console.log("\n" + "=".repeat(70))
    console.log("\n📝 See TESTING-LOGINS.md for detailed testing guide!")
    console.log("\n💡 Quick test:")
    console.log("   1. Logout if logged in")
    console.log("   2. Go to: http://localhost:3000/login")
    console.log("   3. Login with any of the above credentials")
    console.log("   4. Portal will auto-redirect based on role")
    console.log("=".repeat(70) + "\n")

  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()



import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createTestUsers() {
  console.log("🧪 Creating Test Users for All 3 Portals...\n")

  try {
    // 1. System Admin
    const adminEmail = "sysadmin@shoreagents.com"
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } })
    
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Shore Agents Admin",
          role: "ADMIN",
          passwordHash: await bcrypt.hash("admin123", 10),
        }
      })
      console.log("✅ System Admin created")
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "ADMIN" }
      })
      console.log("✅ System Admin updated")
    }

    // 2. Staff Member
    const staffEmail = "staff@shoreagents.com"
    let staff = await prisma.user.findUnique({ where: { email: staffEmail } })
    
    if (!staff) {
      staff = await prisma.user.create({
        data: {
          email: staffEmail,
          name: "Test Staff Member",
          role: "STAFF",
          passwordHash: await bcrypt.hash("staff123", 10),
        }
      })

      // Create profile
      await prisma.profile.create({
        data: {
          userId: staff.id,
          currentRole: "Customer Support Specialist",
          startDate: new Date(),
          daysEmployed: 0,
          salary: 8.5,
          employmentStatus: "PROBATION",
          totalLeave: 12,
          usedLeave: 0,
          vacationUsed: 0,
          sickUsed: 0,
          hmo: true,
        }
      })

      // Create gamification profile
      await prisma.gamification_profiles.create({
        data: {
          userId: staff.id,
          points: 0,
          level: 1,
          rank: null,
          streak: 0,
          tasksCompleted: 0,
          performanceScore: 0,
          reviewRating: null,
        }
      })

      console.log("✅ Staff Member created with profile")
    } else {
      console.log("✅ Staff Member already exists")
    }

    // 3. Client Organization (if not exists)
    let client = await prisma.client.findFirst({
      where: { companyName: "TechCorp Solutions" }
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          companyName: "TechCorp Solutions",
          industry: "Technology",
          location: "San Francisco, CA",
          billingEmail: "billing@techcorp.com",
        }
      })
      console.log("✅ Client Organization created")
    } else {
      console.log("✅ Client Organization already exists")
    }

    // 4. Client User
    const clientEmail = "client@techcorp.com"
    let clientUser = await prisma.client_users.findUnique({ 
      where: { email: clientEmail } 
    })
    
    if (!clientUser) {
      clientUser = await prisma.client_users.create({
        data: {
          email: clientEmail,
          name: "John Smith",
          role: "MANAGER",
          clientId: client.id,
          passwordHash: await bcrypt.hash("client123", 10),
        }
      })
      console.log("✅ Client User created")
    } else {
      console.log("✅ Client User already exists")
    }

    console.log("\n" + "=".repeat(70))
    console.log("🎉 ALL TEST USERS READY!")
    console.log("=".repeat(70))
    
    console.log("\n🔧 SYSTEM ADMIN (Shore Agents Management)")
    console.log("   Email:    sysadmin@shoreagents.com")
    console.log("   Password: admin123")
    console.log("   Portal:   http://localhost:3000/admin")
    
    console.log("\n👥 STAFF MEMBER (Offshore Staff)")
    console.log("   Email:    staff@shoreagents.com")
    console.log("   Password: staff123")
    console.log("   Portal:   http://localhost:3000/")
    
    console.log("\n🏢 CLIENT USER (TechCorp Manager)")
    console.log("   Email:    client@techcorp.com")
    console.log("   Password: client123")
    console.log("   Portal:   http://localhost:3000/client")
    
    console.log("\n" + "=".repeat(70))
    console.log("\n📝 See TESTING-LOGINS.md for detailed testing guide!")
    console.log("\n💡 Quick test:")
    console.log("   1. Logout if logged in")
    console.log("   2. Go to: http://localhost:3000/login")
    console.log("   3. Login with any of the above credentials")
    console.log("   4. Portal will auto-redirect based on role")
    console.log("=".repeat(70) + "\n")

  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
