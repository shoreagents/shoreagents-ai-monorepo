import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import ElectronProvider from "@/components/electron-provider"

export const metadata: Metadata = {
  title: "Staff Monitor - Performance Tracking",
  description: "Desktop performance tracking and staff monitoring",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ElectronProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Sidebar />
          </Suspense>
          <main className="lg:pl-64">{children}</main>
          <Analytics />
        </ElectronProvider>
      </body>
    </html>
  )
}
