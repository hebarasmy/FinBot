"use server"
import { MongoClient, ObjectId } from "mongodb"
import type { DbUser } from "../app/types/auth"
import { getCookie } from "@/lib/cookies"

function serializeDocument<T>(doc: T): unknown {
  if (doc === null || doc === undefined) {
    return doc
  }

  if (Array.isArray(doc)) {
    return doc.map(serializeDocument)
  }

  if (doc instanceof ObjectId) {
    return doc.toString()
  }

  if (doc instanceof Date) {
    return doc.toISOString()
  }

  if (typeof doc === "object") {
    const serialized: Record<string, unknown> = {}
    for (const key in doc as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(doc, key)) {
        serialized[key] = serializeDocument((doc as Record<string, unknown>)[key])
      }
    }
    return serialized
  }

  return doc
}

export async function getCurrentUserProfile() {
  const cookieResult = await getCookie("user-session")
  const sessionId = cookieResult?.value

  if (!sessionId) {
    return { success: false, message: "No session found" }
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const sessionsCollection = db.collection("sessions")
    const usersCollection = db.collection<DbUser>("users")

    const session = await sessionsCollection.findOne({
      _id: new ObjectId(sessionId),
    })

    if (!session) {
      return { success: false, message: "Invalid session" }
    }

    const user = await usersCollection.findOne({
      _id: new ObjectId(session.userId),
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    const serializedUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString(),
      preferences: user.preferences || {},
    }

    return {
      success: true,
      userData: serializedUser,
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return { success: false, message: "Error fetching user profile" }
  } finally {
    await client.close()
  }
}

export async function updateUserProfile(updates: Partial<DbUser>) {
  const cookieResult = await getCookie("user-session")
  const sessionId = cookieResult?.value

  if (!sessionId) {
    return { success: false, message: "No session found" }
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!)

  try {
    const db = client.db("finbot")
    const sessionsCollection = db.collection("sessions")
    const usersCollection = db.collection<DbUser>("users")

    const session = await sessionsCollection.findOne({
      _id: new ObjectId(sessionId),
    })

    if (!session) {
      return { success: false, message: "Invalid session" }
    }

    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      { $set: { ...updates, lastActive: new Date() } },
    )

    if (updateResult.modifiedCount === 0) {
      return { success: false, message: "No changes made" }
    }

    const updatedUser = await usersCollection.findOne({
      _id: new ObjectId(session.userId),
    })

    if (!updatedUser) {
      return { success: false, message: "Failed to retrieve updated user" }
    }

    const serializedUser = serializeDocument(updatedUser)

    return {
      success: true,
      message: "Profile updated successfully",
      userData: serializedUser,
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, message: "Error updating user profile" }
  } finally {
    await client.close()
  }
}

