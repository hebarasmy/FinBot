import crypto from "crypto"

// Generate a random token for email verification 
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Generate a 6-digit numeric verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
