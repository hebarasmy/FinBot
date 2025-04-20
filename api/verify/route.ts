import { NextResponse } from "next/server"
import { verifyEmail } from "@/actions/auth-actions"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 })
    }

    const result = await verifyEmail(email, code)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: result.message || "Verification failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

