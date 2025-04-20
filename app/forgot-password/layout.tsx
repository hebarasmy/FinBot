import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password - Fin-Bot",
  description: "Reset your Fin-Bot account password",
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="forgot-password-layout">{children}</div>
}

