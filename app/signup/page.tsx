"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DollarSign, Settings, Lightbulb, Zap, Sparkles, X, Check, Info } from "lucide-react"
import { registerUser } from "@/actions/auth-actions"

export default function SignupPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [eyeColor, setEyeColor] = useState("#00f2fe") 
  const [isHovering, setIsHovering] = useState(false)
  const [isWaving, setIsWaving] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
  })

  // Password validation 
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  const isLongEnough = password.length >= 8
  const passwordsMatch = password === confirmPassword

  // Email validation
  const isEmailValid = /\S+@\S+\.\S+/.test(email)
//animated robot
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

  const validateForm = () => {
    const newErrors = {
      firstName: firstName ? "" : "First name is required",
      lastName: lastName ? "" : "Last name is required",
      email: isEmailValid ? "" : "Please enter a valid email address",
      password:
        hasUpperCase && hasNumber && hasSpecialChar && isLongEnough
          ? ""
          : "Password must contain at least 8 characters, one uppercase letter, one number, and one special character",
      confirmPassword: passwordsMatch ? "" : "Passwords do not match",
      terms: agreedToTerms ? "" : "You must agree to the terms",
    }

    setErrors(newErrors)

    return !Object.values(newErrors).some((error) => error !== "")
  }

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)
      setServerError("")

      try {
        const result = await registerUser({
          firstName,
          lastName,
          email,
          password,
        })

        if (result.success) {
          // Set a cookie to indicate pending verification 
          document.cookie = "pending_verification=true; path=/"

          // Redirect to verification page with email
          router.push(`/verify?email=${encodeURIComponent(email)}`)
        } else {
          setServerError(result.message || "Error creating account. Please try again.")
        }
      } catch (error) {
        console.error("Error during signup:", error)
        setServerError("An unexpected error occurred. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
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
      
      @keyframes progress {
        0%, 100% {
          width: 0%;
        }
        100% {
          width: 100%;
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
      
      .animate-progress {
        animation: progress 3s linear forwards;
      }
      
      .robot-container {
        animation: float 6s ease-in-out infinite;
      }
      
      .animate-float-slow {
        animation: float-slow 4s ease-in-out infinite;
      }

      .delay-1000 {
        animation-delay: 1s;
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
      
      /* Custom scrollbar styling */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #c5c5c5;
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `
    document.head.appendChild(animationStyles)

    return () => {
      document.head.removeChild(animationStyles)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Wave background */}
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] z-0">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/20 rounded-t-[100%] transform translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 right-0 h-full bg-[#8184a3]/30 rounded-t-[100%] transform translate-y-1/3"></div>
      </div>

      <div className="flex-1 flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center">
          {/* Signup Form */}
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-[#0e2046]">JOIN FIN-BOT!</h1>
              <p className="mt-2 text-[#8184a3]">Create your account to get started.</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {serverError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{serverError}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-[#0e2046] text-sm font-medium">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full p-2 rounded-md border ${errors.firstName ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-[#1679c5]`}
                        required
                      />
                      {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-[#0e2046] text-sm font-medium">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`w-full p-2 rounded-md border ${errors.lastName ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-[#1679c5]`}
                        required
                      />
                      {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-[#0e2046] text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full p-2 rounded-md border ${errors.email ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-[#1679c5]`}
                      required
                    />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-[#0e2046] text-sm font-medium">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full p-2 rounded-md border ${errors.password ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-[#1679c5]`}
                      required
                    />
                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}

                    {/* Password requirements */}
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center space-x-1">
                        {hasUpperCase ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <X size={12} className="text-red-500" />
                        )}
                        <span className={hasUpperCase ? "text-green-600" : "text-gray-600"}>
                          At least one uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {hasNumber ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <X size={12} className="text-red-500" />
                        )}
                        <span className={hasNumber ? "text-green-600" : "text-gray-600"}>At least one number</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {hasSpecialChar ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <X size={12} className="text-red-500" />
                        )}
                        <span className={hasSpecialChar ? "text-green-600" : "text-gray-600"}>
                          At least one special character
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {isLongEnough ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <X size={12} className="text-red-500" />
                        )}
                        <span className={isLongEnough ? "text-green-600" : "text-gray-600"}>
                          At least 8 characters long
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-[#0e2046] text-sm font-medium">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full p-2 rounded-md border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-[#1679c5]`}
                      required
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}

                    {/* Password match indicator */}
                    {confirmPassword && (
                      <div className="flex items-center space-x-1 mt-1 text-xs">
                        {passwordsMatch ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <X size={12} className="text-red-500" />
                        )}
                        <span className={passwordsMatch ? "text-green-600" : "text-red-500"}>
                          {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="rounded border-gray-300 text-[#1679c5] focus:ring-[#1679c5]"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="text-[#0e2046]">
                          By signing up, you agree to our{" "}
                          <button
                            type="button"
                            onClick={() => setShowTerms(true)}
                            className="text-[#1679c5] hover:underline"
                          >
                            Terms, Privacy Policy and Cookies Policy
                          </button>
                          .
                        </label>
                        {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1679c5] hover:bg-[#1679c5]/90 text-white py-3 rounded-md transition-colors mt-4 disabled:opacity-70"
                  >
                    {isSubmitting ? "Creating account..." : "Sign up"}
                  </button>

                  <div className="text-center text-sm text-[#0e2046] mt-4">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#1679c5] hover:underline">
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Improved Fintech Robot */}
          <div className="hidden md:flex md:w-1/2 pl-12 items-center justify-center">
            <div
              className="relative robot-container"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Outer glow effect - using indigo */}
              <div
                className="absolute inset-0 rounded-full bg-indigo-800/10 blur-xl"
                style={{
                  transform: "scale(1.2)",
                  animation: "pulse 4s infinite ease-in-out",
                }}
              ></div>

              {/* Robot Body - Futuristic design */}
              <div className="relative w-64 h-64 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 shadow-xl flex items-center justify-center border-4 border-slate-200 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105">
                {/* Circular accent lines */}
                <div className="absolute inset-2 rounded-full border-2 border-slate-300/50"></div>
                <div className="absolute inset-6 rounded-full border border-slate-300/30"></div>

                {/* Robot Ears */}
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-6 h-14 bg-slate-300 rounded-l-full border-l border-t border-b border-slate-400 flex items-center">
                  <div className="w-2 h-8 bg-slate-400/30 rounded-l-full ml-1"></div>
                </div>
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-6 h-14 bg-slate-300 rounded-r-full border-r border-t border-b border-slate-400 flex items-center justify-end">
                  <div className="w-2 h-8 bg-slate-400/30 rounded-r-full mr-1"></div>
                </div>

                {/* Robot Face - Improved with better gradients */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center">
                  {/* Robot Eyes Container - Improved with better glow */}
                  <div className="flex space-x-10 mb-4 mt-4">
                    {/* Left Eye */}
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
                    {/* Right Eye */}
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

                  {/* Simple Glowing Line Mouth */}
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

                  {/* Sparkles that appear when hovering */}
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

                {/* Improved Robot Antenna with better glow */}
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

                {/* Improved Robot Arms with better animation */}
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

              {/* Orbiting Icons - using different icons and darker colors */}
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

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#0e2046]">Terms, Privacy Policy and Cookies Policy</h3>
                <button onClick={() => setShowTerms(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-[#0e2046] mb-2">Terms of Service</h4>
                  <p className="text-sm text-gray-600">
                    By accessing or using the Fin-Bot service, you agree to be bound by these Terms. If you disagree
                    with any part of the terms, you may not access the service.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    We reserve the right to modify or replace these Terms at any time. If a revision is material, we
                    will try to provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-[#0e2046] mb-2">Privacy Policy</h4>
                  <p className="text-sm text-gray-600">
                    Your privacy is important to us. It is Fin-Bots policy to respect your privacy regarding any
                    information we may collect from you across our website and other sites we own and operate.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    We only ask for personal information when we truly need it to provide a service to you. We collect
                    it by fair and lawful means, with your knowledge and consent.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-[#0e2046] mb-2">Cookies Policy</h4>
                  <p className="text-sm text-gray-600">
                    We use cookies to store information about your preferences and to track your usage of our website.
                    This helps us customize and improve your experience with us.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    You can choose to disable cookies through your browser options, but this may prevent you from taking
                    full advantage of the website.
                  </p>
                </div>

                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Info size={20} className="text-blue-500 mr-2" />
                  <p className="text-sm text-blue-700">
                    By clicking I agree or continuing to use our service, you acknowledge that you have read and
                    understood these policies.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setAgreedToTerms(true)
                    setShowTerms(false)
                  }}
                  className="bg-[#1679c5] text-white px-4 py-2 rounded-md hover:bg-[#1679c5]/90 transition-colors"
                >
                  I agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
