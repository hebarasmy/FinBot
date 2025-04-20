"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { DollarSign, Settings, Lightbulb, Zap, Sparkles, CheckCircle, AlertCircle } from "lucide-react"
import { loginUser } from "@/actions/auth-actions"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified")
  const error = searchParams.get("error")
  const errorMessage = searchParams.get("message")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [eyeColor, setEyeColor] = useState("#00f2fe") 
  const [isHovering, setIsHovering] = useState(false)
  const [isWaving, setIsWaving] = useState(false)
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(!!verified)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [verificationError, setVerificationError] = useState("")

  useEffect(() => {
    const colors = ["#6366f1", "#00f2fe"] 
    const interval = setInterval(() => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      setEyeColor(randomColor)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true)
      setTimeout(() => setIsWaving(false), 1500)
    }, 7000)

    return () => clearInterval(waveInterval)
  }, [])

  // Hide verification message after 5 seconds
  useEffect(() => {
    if (showVerificationSuccess) {
      const timer = setTimeout(() => {
        setShowVerificationSuccess(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [showVerificationSuccess])

  // Handle verification errors from URL params
  useEffect(() => {
    if (error === "verification-failed") {
      setVerificationError(errorMessage || "Verification failed. Please try again.")
    } else if (error === "invalid-token") {
      setVerificationError("Invalid verification token. Please request a new verification email.")
    }
  }, [error, errorMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setLoginError("")

    try {
      const result = await loginUser({
        email,
        password,
      })

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(result.user))
        } else {
          sessionStorage.setItem("user", JSON.stringify(result.user))
        }

        // Redirect to the main page
        router.push("/")
      } else {
        setLoginError(result.message || "Invalid email or password")
      }
    } catch (error) {
      console.error("Error during login:", error)
      setLoginError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const animationStyles = document.createElement("style")
    animationStyles.innerHTML = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(0.95);
        }
      }
      
      @keyframes float {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-15px);
        }
      }
      
      @keyframes float-slow {
        0%, 100% {
          transform: translateY(0) rotate(0deg);
        }
        50% {
          transform: translateY(-10px) rotate(10deg);
        }
      }
      
      @keyframes blink {
        0%, 95%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        97% {
          transform: scale(0.1);
          opacity: 0.1;
        }
      }
      
      @keyframes wave {
        0%, 100% {
          transform: rotate(0deg) translateY(-50%);
        }
        50% {
          transform: rotate(-20deg) translateY(-50%);
        }
      }

      @keyframes spin-slow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes orbit {
        0% {
          transform: rotate(0deg) translateX(180px) rotate(0deg);
        }
        100% {
          transform: rotate(360deg) translateX(180px) rotate(-360deg);
        }
      }

      @keyframes orbit-reverse {
        0% {
          transform: rotate(0deg) translateX(180px) rotate(0deg);
        }
        100% {
          transform: rotate(-360deg) translateX(180px) rotate(360deg);
        }
      }
      
      .robot-container {
        animation: float 6s ease-in-out infinite;
      }
      
      .animate-float-slow {
        animation: float-slow 4s ease-in-out infinite;
      }

      .orbit {
        position: absolute;
        left: 50%;
        top: 50%;
        transform-origin: 0 0;
      }

      .orbit-1 {
        animation: orbit 15s linear infinite;
      }

      .orbit-2 {
        animation: orbit 20s linear infinite;
      }

      .orbit-3 {
        animation: orbit-reverse 18s linear infinite;
      }

      .orbit-4 {
        animation: orbit-reverse 25s linear infinite;
      }
    `
    document.head.appendChild(animationStyles)

    return () => {
      document.head.removeChild(animationStyles)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Verification Success Message */}
      {showVerificationSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center shadow-lg">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>Email verified successfully! You can now log in.</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-[50vh] z-0">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/20 rounded-t-[100%] transform translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/30 rounded-t-[100%] transform translate-y-1/3"></div>
      </div>

      <div className="flex-1 flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#0e2046]">WELCOME TO FIN-BOT!</h1>
              <p className="mt-2 text-[#8184a3]">Welcome back! Please enter your details.</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              {loginError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{loginError}</span>
                </div>
              )}
              {verificationError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{verificationError}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-[#0e2046] text-lg">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1679c5]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-[#0e2046] text-lg">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1679c5]"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-[#1679c5] focus:ring-[#1679c5]"
                    />
                    <label htmlFor="remember" className="text-sm text-[#0e2046]">
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-[#1679c5] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1679c5] hover:bg-[#1679c5]/90 text-white py-3 rounded-md transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>

                <div className="text-center text-sm text-[#0e2046]">
                  Dont have an account?{" "}
                  <Link href="/signup" className="text-[#1679c5] hover:underline">
                    Sign up for free!
                  </Link>
                </div>
              </form>
            </div>
          </div>

          <div className="hidden md:flex md:w-1/2 pl-12 items-center justify-center">
            <div
              className="relative robot-container"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div
                className="absolute inset-0 rounded-full bg-indigo-800/10 blur-xl"
                style={{
                  transform: "scale(1.2)",
                  animation: "pulse 4s infinite ease-in-out",
                }}
              ></div>

              <div className="relative w-64 h-64 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 shadow-xl flex items-center justify-center border-4 border-slate-200 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-2 rounded-full border-2 border-slate-300/50"></div>
                <div className="absolute inset-6 rounded-full border border-slate-300/30"></div>

                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-6 h-14 bg-slate-300 rounded-l-full border-l border-t border-b border-slate-400 flex items-center">
                  <div className="w-2 h-8 bg-slate-400/30 rounded-l-full ml-1"></div>
                </div>
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-6 h-14 bg-slate-300 rounded-r-full border-r border-t border-b border-slate-400 flex items-center justify-end">
                  <div className="w-2 h-8 bg-slate-400/30 rounded-r-full mr-1"></div>
                </div>

                <div className="absolute inset-4 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center">
                  <div className="flex space-x-10 mb-4 mt-4">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{
                            backgroundColor: eyeColor,
                            boxShadow: `0 0 10px ${eyeColor}, 0 0 20px ${eyeColor}`,
                            animation: "blink 4s infinite ease-in-out",
                          }}
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{
                            backgroundColor: eyeColor,
                            boxShadow: `0 0 10px ${eyeColor}, 0 0 20px ${eyeColor}`,
                            animation: "blink 4s infinite ease-in-out 0.5s",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div
                      className="w-16 h-1 rounded-full"
                      style={{
                        backgroundColor: eyeColor,
                        boxShadow: `0 0 8px ${eyeColor}`,
                        opacity: isHovering ? 0.9 : 0.7,
                        transform: `scale(${isHovering ? 1.2 : 1})`,
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>

                  {isHovering && (
                    <div className="absolute top-14 left-8 animate-pulse">
                      <Sparkles
                        size={18}
                        className="text-indigo-400"
                        style={{
                          filter: "drop-shadow(0 0 5px #818cf8)",
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="w-3 h-14 bg-gradient-to-t from-slate-500 to-slate-400 rounded-full"></div>
                    <div
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                      style={{
                        animation: "pulse 2s infinite ease-in-out",
                        boxShadow: `0 0 15px ${eyeColor}`,
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className="absolute -left-16 top-1/3 transform -translate-y-1/2"
                  style={{
                    animation: isWaving ? "wave 0.5s ease-in-out 3" : "none",
                    transformOrigin: "right center",
                  }}
                >
                  <div className="w-20 h-5 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full shadow-md"></div>
                </div>
                <div className="absolute -right-16 top-1/3 transform -translate-y-1/2">
                  <div className="w-20 h-5 bg-gradient-to-r from-slate-500 to-slate-400 rounded-full shadow-md"></div>
                </div>
              </div>

              <div className="orbit orbit-1">
                <div className="p-2.5 bg-indigo-900/20 rounded-full">
                  <Settings size={24} className="text-indigo-700" style={{ filter: "drop-shadow(0 0 3px #4338ca)" }} />
                </div>
              </div>

              <div className="orbit orbit-2">
                <div className="p-2.5 bg-blue-900/20 rounded-full">
                  <Lightbulb size={24} className="text-blue-800" style={{ filter: "drop-shadow(0 0 3px #1e40af)" }} />
                </div>
              </div>

              <div className="orbit orbit-3">
                <div className="p-2 bg-indigo-900/20 rounded-full">
                  <Zap size={24} className="text-indigo-800" style={{ filter: "drop-shadow(0 0 3px #3730a3)" }} />
                </div>
              </div>

              <div className="orbit orbit-4">
                <div className="p-2 bg-blue-900/20 rounded-full">
                  <DollarSign size={24} className="text-blue-700" style={{ filter: "drop-shadow(0 0 3px #1d4ed8)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
