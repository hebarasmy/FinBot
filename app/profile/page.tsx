"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Settings, Shield, LogOut, ChevronRight, Edit, ChevronUp } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { getCurrentUserProfile, updateUserProfile } from "@/actions/profile-actions"
import { logoutUser } from "@/actions/auth-actions"
import { cn } from "@/lib/utils"

interface UserPreferences {
  notifications?: boolean
}

interface UserData {
  firstName: string
  lastName: string
  email: string
  createdAt: Date | string
  lastActive: Date | string
  preferences?: UserPreferences
}

export default function ProfilePage() {
  const router = useRouter()
  const mainContentRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState({
    firstName: false,
    lastName: false,
    email: false,
  })
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await getCurrentUserProfile()

        if (result.success && result.userData) {
          const userData = result.userData
          setUser({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            createdAt: userData.createdAt,
            lastActive: userData.lastActive || new Date(),
            preferences: userData.preferences,
          })

          setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
          })
        } else {
          console.error("Failed to fetch user profile:", result.message)
          router.push("/login")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get("tab")
    if (tabParam && ["overview", "security", "settings"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [])

  const toggleEdit = (field: "firstName" | "lastName" | "email") => {
    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdate = async (field: "firstName" | "lastName") => {
    try {
      const updates = {
        [field]: formData[field],
      }

      const result = await updateUserProfile(updates)

      if (result.success) {
        setUser((prev) => {
          if (!prev) return null
          return {
            ...prev,
            [field]: formData[field],
          }
        })
        toggleEdit(field)
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1679c5]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">User not found</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-background">
        <div className="container flex h-14 items-center justify-between">
          <h1 className="text-xl font-semibold">Profile</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:space-x-8">
          <aside className="md:w-1/4">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Profile Avatar */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#1679c5] to-[#1679c5]/80 flex items-center justify-center text-white text-3xl font-bold">
                      {user.firstName.charAt(0)}
                      {user.lastName.charAt(0)}
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <nav className="space-y-1">
                  <Button
                    variant={activeTab === "overview" ? "secondary" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setActiveTab("overview")}
                  >
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Overview
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={activeTab === "security" ? "secondary" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setActiveTab("security")}
                  >
                    <span className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Security
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={activeTab === "settings" ? "secondary" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setActiveTab("settings")}
                  >
                    <span className="flex items-center">
                      <Settings className="mr-2  h-4 w-4" />
                      Settings
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 mt-6 md:mt-0" ref={mainContentRef}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className={cn(
                    "relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none",
                    "data-[state=active]:border-b-[#1679c5] data-[state=active]:text-foreground data-[state=active]:shadow-none",
                  )}
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className={cn(
                    "relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none",
                    "data-[state=active]:border-b-[#1679c5] data-[state=active]:text-foreground data-[state=active]:shadow-none",
                  )}
                >
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className={cn(
                    "relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none",
                    "data-[state=active]:border-b-[#1679c5] data-[state=active]:text-foreground data-[state=active]:shadow-none",
                  )}
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm text-muted-foreground">First Name</label>
                        <div className="mt-1 flex items-center justify-between">
                          {isEditing.firstName ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="flex-1 p-2 border rounded bg-background"
                              />
                              <Button size="sm" onClick={() => handleUpdate("firstName")}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => toggleEdit("firstName")}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="font-medium">{user.firstName}</span>
                              <Button variant="ghost" size="sm" onClick={() => toggleEdit("firstName")}>
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Last Name</label>
                        <div className="mt-1 flex items-center justify-between">
                          {isEditing.lastName ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="flex-1 p-2 border rounded bg-background"
                              />
                              <Button size="sm" onClick={() => handleUpdate("lastName")}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => toggleEdit("lastName")}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="font-medium">{user.lastName}</span>
                              <Button variant="ghost" size="sm" onClick={() => toggleEdit("lastName")}>
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Email Address</label>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-medium">{user.email}</span>
                          <Button variant="ghost" size="sm" disabled>
                            Edit
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium">Password</h3>
                            <p className="text-sm text-muted-foreground"></p>
                          </div>

                          <Button onClick={() => router.push("/forgot-password")}>Change Password</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          We recommend changing your password every 90 days.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Display Preferences</h3>
                        <div className="space-y-4">
                          <div className="mt-4"></div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Language</label>
                            <Select defaultValue="en-US">
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en-US">English (US)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-medium mb-4">Data & Privacy</h3>
                        <div className="space-y-4">
                          <Button
                            variant="link"
                            className="text-blue-600 hover:text-blue-800 font-medium text-base underline p-0 h-auto"
                            onClick={() => router.push("/privacy")}
                          >
                            View privacy policy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {showScrollTop && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
