// Create Shore Agents System Admin (not client admin)
// Run with: npx tsx scripts/create-system-admin.ts

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createSystemAdmin() {
  const email = "sysadmin@shoreagents.com"
  const password = "admin123" // Change after first login!
  const name = "Shore Agents Admin"

  console.log("🔧 Creating Shore Agents System Admin...")
  console.log("This is different from client organization admins!")

  try {
    // Check if already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.log(`\n✅ User ${email} already exists!`)
      
      if (existing.role === "ADMIN") {
        console.log("Already has ADMIN role - you're good to go!")
      } else {
        console.log(`Current role: ${existing.role}`)
        console.log("Updating to ADMIN role...")
        
        await prisma.user.update({
          where: { email },
          data: { role: "ADMIN" }
        })
        
        console.log("✅ Updated to ADMIN role!")
      }
    } else {
      // Create new system admin
      const passwordHash = await bcrypt.hash(password, 10)
      
      const admin = await prisma.user.create({
        data: {
          email,
          name,
          role: "ADMIN", // This is the key - System Admin role
          passwordHash,
        }
      })
      
      console.log("✅ Shore Agents System Admin created!")
    }

    console.log("\n" + "=".repeat(50))
    console.log("🎯 SHORE AGENTS SYSTEM ADMIN LOGIN:")
    console.log("=".repeat(50))
    console.log(`Email:    ${email}`)
    console.log(`Password: ${password}`)
    console.log("\n📍 Steps:")
    console.log("1. Go to: http://localhost:3000/login")
    console.log("2. Login with above credentials")
    console.log("3. You'll be redirected to: http://localhost:3000/admin")
    console.log("\n✨ You can now access:")
    console.log("  • Dashboard")
    console.log("  • Staff Management")
    console.log("  • Client Organizations")
    console.log("  • Assignments")
    console.log("  • Reviews")
    console.log("=".repeat(50))

  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createSystemAdmin()

