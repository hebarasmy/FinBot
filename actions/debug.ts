import { NextResponse } from "next/server"
import { sendPasswordResetEmail } from "@/app/utils/email"

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
  }

  try {
    const result = await sendPasswordResetEmail(email, "Test User", "123456")

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error in debug-email route:", error)
    return NextResponse.json({ error: "Failed to send test email", details: error }, { status: 500 })
  }
}

