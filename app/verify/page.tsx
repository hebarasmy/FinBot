"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { verifyEmail, resendVerificationCode } from "@/actions/auth-actions"
import { CheckCircle, AlertCircle, Mail, RefreshCw } from "lucide-react"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  if (!email) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
        {/* Wave background */}
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] z-0">
          <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/20 rounded-t-[100%] transform translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/30 rounded-t-[100%] transform translate-y-1/3"></div>
        </div>

        <div className="flex-1 flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
          <Card className="w-[400px] shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-[#0e2046]">Invalid Verification Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <p className="text-center text-[#8184a3] mb-6">Please use the verification link sent to your email.</p>
              <Button
                className="w-full bg-[#1679c5] hover:bg-[#1679c5]/90 text-white"
                onClick={() => (window.location.href = "/login")}
              >
                Return to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setMessage(null)

    try {
      const result = await verifyEmail(email, code)
      if (result.success) {
        setMessage({ type: "success", text: "Email verified successfully! You can now log in to your account." })
        // Redirect to login page after successful verification
        setTimeout(() => {
          window.location.href = "/login"
        }, 2000)
      } else {
        setMessage({ type: "error", text: result.message || "Please check your code and try again." })
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred during verification." })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setMessage(null)

    try {
      const result = await resendVerificationCode(email)
      if (result.success) {
        setMessage({ type: "success", text: "A new verification code has been sent to your email." })
        setResendCooldown(60) 
      } else {
        setMessage({ type: "error", text: result.message || "Failed to resend code. Please try again later." })
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while resending the code." })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Wave background */}
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] z-0">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/20 rounded-t-[100%] transform translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/30 rounded-t-[100%] transform translate-y-1/3"></div>
      </div>

      <div className="flex-1 flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
        <Card className="w-[400px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-[#0e2046]">Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#1679c5]/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-[#1679c5]" />
              </div>
            </div>

            <p className="text-center text-[#8184a3] mb-6">
              Weve sent a verification code to <span className="font-semibold">{email}</span>. Please enter the code
              below to verify your email address.
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest border-gray-300 focus:border-[#1679c5] focus:ring-[#1679c5]"
                  disabled={isVerifying}
                />
                <div className="text-xs text-center text-[#8184a3]">The code will expire in 15 minutes</div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-md text-sm flex items-center ${
                    message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full bg-[#1679c5] hover:bg-[#1679c5]/90 text-white"
                  disabled={isVerifying || code.length !== 6}
                >
                  {isVerifying ? "Verifying..." : "Verify Email"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#1679c5] text-[#1679c5] hover:bg-[#1679c5]/10"
                  onClick={handleResendCode}
                  disabled={isResending || resendCooldown > 0}
                >
                  {isResending ? (
                    "Sending..."
                  ) : resendCooldown > 0 ? (
                    <span className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-[#1679c5] hover:text-[#1679c5]/80"
                onClick={() => (window.location.href = "/login")}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


