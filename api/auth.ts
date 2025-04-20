import type { ObjectId } from "mongodb"

export interface UserData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  status: UserStatus
  isVerified: boolean
}

export type UserStatus = "pending" | "active" | "suspended"

export interface AuthResponse {
  success: boolean
  message?: string
  userId?: string
  user?: UserProfile
  requiresVerification?: boolean
  verificationCode?: string
  email?: string
}

export interface DbUser {
  _id?: ObjectId
  firstName: string
  lastName: string
  email: string
  password: string
  createdAt: Date
  isVerified: boolean
  status: UserStatus
  verificationCode?: string
  verificationCodeExpires?: Date
  resetCode?: string
  resetCodeExpires?: Date
  lastActive?: Date
  preferences?: {
    theme?: "light" | "dark" | "system"
    notifications?: boolean
  }
}

