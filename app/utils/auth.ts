"use client"

import { clientStorage } from "./client-storage"

// Check if user is authenticated
export function isAuthenticated() {
  const user = clientStorage.getItem("user")
  return !!user
}

// Get current user
export function getCurrentUser() {
  const user = clientStorage.getItem("user")

  if (!user) {
    return null
  }

  try {
    return JSON.parse(user)
  } catch (error) {
    console.error("Error parsing user data:", error)
    return null
  }
}

// Logout user
export function logout() {
  clientStorage.removeItem("user")

  // Only redirect on the client
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

