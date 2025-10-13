import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import ElectronProvider from "@/components/electron-provider"
import { Providers } from "@/components/providers"
import { MainWrapper } from "@/components/main-wrapper"

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
        <Providers>
          <ElectronProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Sidebar />
            </Suspense>
            <MainWrapper>
              {children}
            </MainWrapper>
            <Analytics />
          </ElectronProvider>
        </Providers>
      </body>
    </html>
  )
}
