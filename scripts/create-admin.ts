// Quick script to create an admin user
// Run with: npx tsx scripts/create-admin.ts

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAdmin() {
  const email = "admin@shoreagents.com"
  const password = "admin123" // Change this!
  const name = "Admin User"

  console.log("Creating admin user...")

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.log(`User ${email} already exists!`)
      console.log("Updating to ADMIN role...")
      
      // Update to ADMIN
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" }
      })
      
      console.log("✅ User updated to ADMIN role!")
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(password, 10)
      
      await prisma.user.create({
        data: {
          email,
          name,
          role: "ADMIN",
          passwordHash,
        }
      })
      
      console.log("✅ Admin user created!")
    }

    console.log("\nLogin credentials:")
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log("\n👉 Go to: http://localhost:3000/login")
    console.log("Then navigate to: http://localhost:3000/admin")

  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

