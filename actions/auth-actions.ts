"use server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import type { UserData, LoginCredentials, AuthResponse, DbUser } from "../app/types/auth"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"
import { setCookie, getCookie } from "@/lib/cookies"
import { createSession, clearSession } from "@/lib/session"

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function registerUser(userData: UserData): Promise<AuthResponse> {
  const { firstName, lastName, email, password } = userData

  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const usersCollection = db.collection<DbUser>("users")

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return { success: false, message: "Email already registered" }
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const verificationCodeExpires = new Date()
    verificationCodeExpires.setMinutes(verificationCodeExpires.getMinutes() + 15)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser: DbUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isVerified: false,
      status: "pending",
      verificationCode,
      verificationCodeExpires,
    }

    const result = await usersCollection.insertOne(newUser)

    // Send verification email
    await sendVerificationEmail(email, firstName, verificationCode)

    return {
      success: true,
      userId: result.insertedId.toString(),
      requiresVerification: true,
      email,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, message: "Registration failed" }
  } finally {
    await client.close()
  }
}

export async function verifyEmail(email: string, code: string): Promise<AuthResponse> {
  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const usersCollection = db.collection<DbUser>("users")

    const user = await usersCollection.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() },
    })

    if (!user) {
      return { success: false, message: "Invalid or expired verification code" }
    }

    // Update user status
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          status: "active",
        },
        $unset: {
          verificationCode: "",
          verificationCodeExpires: "",
        },
      },
    )

    return {
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: "active",
        isVerified: true,
      },
    }
  } catch (error) {
    console.error("Verification error:", error)
    return { success: false, message: "Verification failed" }
  } finally {
    await client.close()
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const { email, password } = credentials
  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const usersCollection = db.collection<DbUser>("users")

    const user = await usersCollection.findOne({ email })

    if (!user) {
      return { success: false, message: "Invalid credentials" }
    }

    if (!user.isVerified) {
      return { success: false, message: "Please verify your email first" }
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return { success: false, message: "Invalid credentials" }
    }

    // Create session
    const sessionId = await createSession(user._id.toString())

    // Set session cookie
    await setCookie({
      name: "user-session",
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, 
    })

    return {
      success: true,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        isVerified: user.isVerified,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "Login failed" }
  } finally {
    await client.close()
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const cookie = await getCookie("user-session")
    if (cookie?.value) {
      await clearSession(cookie.value)
    }

    await setCookie({
      name: "user-session",
      value: "",
      expires: new Date(0),
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false }
  }
}

export async function resendVerificationCode(email: string): Promise<AuthResponse> {
  if (!email) {
    return { success: false, message: "Email is required" }
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const usersCollection = db.collection<DbUser>("users")

    // Find user by email
    const user = await usersCollection.findOne({ email })

    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return { success: true, message: "If your email exists, a new verification code has been sent" }
    }

    if (user.isVerified) {
      return { success: false, message: "Email is already verified" }
    }

    const verificationCode = generateVerificationCode()
    const verificationCodeExpires = new Date()
    verificationCodeExpires.setHours(verificationCodeExpires.getHours() + 24) 

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationCode,
          verificationCodeExpires,
        },
      },
    )

    // Send verification email
    await sendVerificationEmail(email, user.firstName, verificationCode)

    return {
      success: true,
      message: "A new verification code has been sent to your email",
    }
  } catch (error) {
    console.error("Error resending verification code:", error)
    return { success: false, message: "Error resending verification code" }
  } finally {
    await client.close()
  }
}

export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  if (!email) {
    return { success: false, message: "Email is required" }
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const usersCollection = db.collection<DbUser>("users")

    const user = await usersCollection.findOne({ email })

    if (!user) {
      return { success: true, message: "If your email exists in our system, you will receive a reset code" }
    }

    const resetCode = generateVerificationCode()
    const resetCodeExpires = new Date()
    resetCodeExpires.setMinutes(resetCodeExpires.getMinutes() + 15) 

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetCode,
          resetCodeExpires,
        },
      },
    )

    // Send password reset email
    await sendPasswordResetEmail(email, user.firstName, resetCode)

    return {
      success: true,
      message: "Reset code sent to your email",
    }
  } catch (error) {
    console.error("Error requesting password reset:", error)
    return { success: false, message: "Error requesting password reset" }
  } finally {
    await client.close()
  }
}

export async function verifyResetCode(email: string, resetCode: string): Promise<AuthResponse> {
  if (!email || !resetCode) {
    return { success: false, message: "Email and reset code are required" }
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const usersCollection = db.collection<DbUser>("users")

    const user = await usersCollection.findOne({
      email,
      resetCode,
      resetCodeExpires: { $gt: new Date() }, 
    })

    if (!user) {
      return { success: false, message: "Invalid or expired reset code" }
    }

    return {
      success: true,
      message: "Reset code verified",
    }
  } catch (error) {
    console.error("Error verifying reset code:", error)
    return { success: false, message: "Error verifying reset code" }
  } finally {
    await client.close()
  }
}

export async function resetPassword(email: string, resetCode: string, newPassword: string): Promise<AuthResponse> {
  if (!email || !resetCode || !newPassword) {
    return { success: false, message: "Email, reset code, and new password are required" }
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const usersCollection = db.collection<DbUser>("users")

    const user = await usersCollection.findOne({
      email,
      resetCode,
      resetCodeExpires: { $gt: new Date() },
    })

    if (!user) {
      return { success: false, message: "Invalid or expired reset code" }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          isVerified: true, 
          status: "active",
        },
        $unset: {
          resetCode: "",
          resetCodeExpires: "",
        },
      },
    )

    return {
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, message: "Error resetting password" }
  } finally {
    await client.close()
  }
}