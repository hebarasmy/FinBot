import { cookies } from "next/headers"

interface CookieOptions {
  name: string
  value: string
  httpOnly?: boolean
  secure?: boolean
  maxAge?: number
  expires?: Date
  path?: string
  sameSite?: "strict" | "lax" | "none"
}

interface Cookie {
  name: string
  value: string
}

export async function setCookie(options: CookieOptions): Promise<void> {
  const { name, value, ...cookieOptions } = options

  try {
    const cookieStore = await cookies() 
    cookieStore.set(name, value, cookieOptions) 
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error)
  }
}

export async function getCookie(name: string): Promise<Cookie | undefined> {
  const cookieStore = await cookies() 
  const cookie = cookieStore.get(name) 

  if (!cookie) return undefined

  return {
    name: cookie.name,
    value: cookie.value,
  }
}

export async function deleteCookie(name: string): Promise<void> {
  try {
    const cookieStore = await cookies() 
    cookieStore.delete(name) 
  } catch (error) {
    console.error(`Error deleting cookie ${name}:`, error)
  }
}

export async function getAllCookies(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies() 
    const allCookies = cookieStore.getAll() 

    return allCookies.reduce<Record<string, string>>((acc, cookie) => {
      acc[cookie.name] = cookie.value
      return acc
    }, {})
  } catch (error) {
    console.error("Error getting all cookies:", error)
    return {}
  }
}
