"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, TrendingUp, LogOut, History, User } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import MiniRobot from "@/robot/mini-robot"

interface UserData {
  firstName: string
  lastName: string
  email: string
}

const Sidebar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true"
    setIsAuthenticated(authStatus)

    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isAuthenticated")
    document.cookie = "email_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
  }

  return (
    <div className="w-64 bg-white border-r flex flex-col min-h-screen">
      <div className="p-6">
        <Link href="/" className="flex items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#211e58] to-blue-700 bg-clip-text text-transparent from-text-indigo-950 to-text-indigo-8000">
            Fin-B
            <MiniRobot /> t
          </h1>
        </Link>

        <nav className="space-y-2">
          <Button
            variant={pathname === "/search" || pathname === "/" ? "default" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Search Engine
            </Link>
          </Button>

          <Button
            variant={pathname === "/search/history" ? "default" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/search/history">
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
          </Button>

          <Button variant={pathname === "/trending" ? "default" : "ghost"} className="w-full justify-start" asChild>
            <Link href="/trending">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </Link>
          </Button>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t">
        {user && (
          <div className="mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <span className="text-sm font-medium">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </span>
            </div>
            <span className="font-medium">
              {user.firstName} {user.lastName}
            </span>
          </div>
        )}

        {isAuthenticated ? (
          <>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default Sidebar
