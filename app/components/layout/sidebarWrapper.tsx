// Hide sidebar for : login, signup, forgot-password, and verification pages
"use client"

import { usePathname } from "next/navigation"
import Sidebar from "./sidebar"

export default function SidebarWrapper() {
  const pathname = usePathname()

  if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/verify") {
    return null 
  }

  return <Sidebar />
}


