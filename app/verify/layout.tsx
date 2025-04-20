import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verify Email - Fin-Bot",
  description: "Verify your email address to complete registration",
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="verify-layout">{children}</div>
}

