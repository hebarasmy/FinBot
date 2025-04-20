"use client"

import { useEffect } from "react"

const themeScript = `
  (function() {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const root = document.documentElement
    
    // Set data-theme attribute
    root.setAttribute('data-theme', systemTheme)
    
    // Add theme class
    root.classList.add(systemTheme)
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const newTheme = e.matches ? 'dark' : 'light'
      root.classList.remove('dark', 'light')
      root.classList.add(newTheme)
      root.setAttribute('data-theme', newTheme)
    })
  })()
`

export function ThemeManager() {
  useEffect(() => {
    const scriptElement = document.createElement("script")
    scriptElement.textContent = themeScript
    document.head.appendChild(scriptElement)

    return () => {
      document.head.removeChild(scriptElement)
    }
  }, [])

  return null
}

export { useTheme } from "@/app/components/theme-provider"