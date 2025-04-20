"use client"

export const clientStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null

    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch (e) {
      console.error("Error accessing storage:", e)
      return null
    }
  },

  setItem: (key: string, value: string, persistent = false): void => {
    if (typeof window === "undefined") return

    try {
      if (persistent) {
        localStorage.setItem(key, value)
      } else {
        sessionStorage.setItem(key, value)
      }
    } catch (e) {
      console.error("Error setting storage:", e)
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (e) {
      console.error("Error removing from storage:", e)
    }
  },
}

