import { NextResponse } from "next/server"
import { registerUser } from "@/actions/auth-actions"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/db"
import type { DbUser } from "@/app/types/auth"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (data.firstName && data.lastName) {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      return NextResponse.json(
        {
          message: "User registered successfully",
          user: result.user,
        },
        { status: 201 },
      )
    } else {
      const { email, password } = data

      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
      }

      try {
        // Connect to database 
        const { db } = await connectToDatabase()
        const usersCollection = db.collection<DbUser>("users")

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email })
        if (existingUser) {
          return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create a simplified user record
        const newUser: DbUser = {
          email,
          password: hashedPassword,
          firstName: email.split("@")[0], 
          lastName: "",
          createdAt: new Date(),
          isVerified: true, 
          status: "pending", 
        }

        const result = await usersCollection.insertOne(newUser)

        return NextResponse.json(
          {
            message: "User registered successfully",
            userId: result.insertedId.toString(),
          },
          { status: 201 },
        )
      } catch (error) {
        console.error("Error in simplified signup:", error)
        return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

