"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { useRouter } from "next/navigation"
import { Check, AlertCircle, Loader2, Mail, Lock, KeyRound } from "lucide-react"
import { requestPasswordReset, verifyResetCode, resetPassword } from "@/actions/auth-actions"

enum ResetStep {
  EMAIL_INPUT = 0,
  CODE_VERIFICATION = 1,
  NEW_PASSWORD = 2,
  SUCCESS = 3,
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentStep, setCurrentStep] = useState<ResetStep>(ResetStep.EMAIL_INPUT)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()

  // Password validation 
  const [passwordValidation, setPasswordValidation] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false,
  })

  // resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Validate password 
  useEffect(() => {
    setPasswordValidation({
      hasLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
      passwordsMatch: newPassword === confirmPassword && newPassword !== "",
    })
  }, [newPassword, confirmPassword])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await requestPasswordReset(email)
      if (result.success) {
        setCurrentStep(ResetStep.CODE_VERIFICATION)
        setResendCooldown(60) 
      } else {
        setError(result.message || "Failed to send reset code")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await verifyResetCode(email, resetCode)
      if (result.success) {
        setCurrentStep(ResetStep.NEW_PASSWORD)
      } else {
        setError(result.message || "Invalid or expired code")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPassword(email, resetCode, newPassword)
      if (result.success) {
        setCurrentStep(ResetStep.SUCCESS)
      } else {
        setError(result.message || "Failed to reset password")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await requestPasswordReset(email)
      if (result.success) {
        setError(null)
        setResendCooldown(60) 
      } else {
        setError(result.message || "Failed to resend code")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (currentStep === ResetStep.EMAIL_INPUT) {
      router.push("/login")
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] z-0">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/20 rounded-t-[100%] transform translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/30 rounded-t-[100%] transform translate-y-1/3"></div>
      </div>

      <div className="flex-1 flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
        <Card className="w-[450px] shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={goBack} className="mr-2 text-[#1679c5]">
                {/* <ArrowLeft className="h-4 w-4" /> */}
              </Button>
              <CardTitle className="text-[#0e2046]">Reset Password</CardTitle>
            </div>
            <CardDescription>
              {currentStep === ResetStep.EMAIL_INPUT && "Enter your email to receive a reset code"}
              {currentStep === ResetStep.CODE_VERIFICATION && "Enter the code sent to your email"}
              {currentStep === ResetStep.NEW_PASSWORD && "Create a new password"}
              {currentStep === ResetStep.SUCCESS && "Password reset successful"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 0 ? "bg-[#1679c5] text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-xs mt-1">Email</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${currentStep > 0 ? "bg-[#1679c5]" : "bg-gray-200"}`}></div>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 1 ? "bg-[#1679c5] text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-xs mt-1">Verify</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? "bg-[#1679c5]" : "bg-gray-200"}`}></div>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 2 ? "bg-[#1679c5] text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-xs mt-1">Reset</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-100 p-3 text-sm text-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {currentStep === ResetStep.EMAIL_INPUT && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#1679c5]/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-[#1679c5]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-gray-300 focus:border-[#1679c5] focus:ring-[#1679c5]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#1679c5] hover:bg-[#1679c5]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>
            )}

            {currentStep === ResetStep.CODE_VERIFICATION && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#1679c5]/10 flex items-center justify-center">
                    <KeyRound className="h-8 w-8 text-[#1679c5]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest border-gray-300 focus:border-[#1679c5] focus:ring-[#1679c5]"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-sm text-[#8184a3] text-center">
                    Weve sent a 6-digit code to <span className="font-semibold">{email}</span>
                  </p>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="link"
                      className="text-[#1679c5]"
                      onClick={handleResendCode}
                      disabled={isLoading || resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive a code? Resend"}
                    </Button>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-[#1679c5] text-[#1679c5] hover:bg-[#1679c5]/10"
                    onClick={goBack}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#1679c5] hover:bg-[#1679c5]/90 text-white"
                    disabled={isLoading || resetCode.length !== 6}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {currentStep === ResetStep.NEW_PASSWORD && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#1679c5]/10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-[#1679c5]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-gray-300 focus:border-[#1679c5] focus:ring-[#1679c5]"
                  />

                  {/* Password requirements */}
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-4 h-4 rounded-full ${passwordValidation.hasLength ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={passwordValidation.hasLength ? "text-green-600" : "text-gray-600"}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-4 h-4 rounded-full ${passwordValidation.hasUpperCase ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={passwordValidation.hasUpperCase ? "text-green-600" : "text-gray-600"}>
                        At least one uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-4 h-4 rounded-full ${passwordValidation.hasNumber ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={passwordValidation.hasNumber ? "text-green-600" : "text-gray-600"}>
                        At least one number
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-4 h-4 rounded-full ${passwordValidation.hasSpecial ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={passwordValidation.hasSpecial ? "text-green-600" : "text-gray-600"}>
                        At least one special character
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-gray-300 focus:border-[#1679c5] focus:ring-[#1679c5]"
                  />

                  {/* Password match indicator */}
                  {confirmPassword && (
                    <div className="flex items-center space-x-1 mt-1 text-xs">
                      <div
                        className={`w-4 h-4 rounded-full ${passwordValidation.passwordsMatch ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      <span className={passwordValidation.passwordsMatch ? "text-green-600" : "text-red-500"}>
                        {passwordValidation.passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-[#1679c5] text-[#1679c5] hover:bg-[#1679c5]/10"
                    onClick={goBack}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#1679c5] hover:bg-[#1679c5]/90 text-white"
                    disabled={isLoading || !passwordValidation.passwordsMatch || !passwordValidation.hasLength}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {currentStep === ResetStep.SUCCESS && (
              <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-[#0e2046] mb-2">Password Reset Successful</h3>
                <p className="mt-2 text-sm text-[#8184a3] mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button
                  onClick={() => router.push("/login?reset=true")}
                  className="w-full bg-[#1679c5] hover:bg-[#1679c5]/90 text-white"
                >
                  Return to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center z-10 pb-8">
        <div className="inline-flex items-center justify-center">
          <span
            className="text-[#7C3AED] text-2xl font-bold"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            Fin-Bot
          </span>
        </div>
        <p className="mt-2 text-sm text-[#8184a3]">Your Financial Assistant</p>
      </div>
    </div>
  )
}


