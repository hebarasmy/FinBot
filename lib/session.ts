import { MongoClient, ObjectId } from "mongodb"

export async function createSession(userId: string): Promise<string> {
  const client = await MongoClient.connect(process.env.MONGODB_URI!)
  try {
    const db = client.db("finbot")
    const sessionsCollection = db.collection("sessions")

    const session = {
      userId: new ObjectId(userId),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }

    const result = await sessionsCollection.insertOne(session)
    return result.insertedId.toString()
  } finally {
    await client.close()
  }
}

export async function getSession(sessionId: string) {
  const client = await MongoClient.connect(process.env.MONGODB_URI!)
  try {
    const db = client.db("finbot")
    const sessionsCollection = db.collection("sessions")

    return await sessionsCollection.findOne({
      _id: new ObjectId(sessionId),
      expiresAt: { $gt: new Date() },
    })
  } finally {
    await client.close()
  }
}

export async function clearSession(sessionId: string): Promise<void> {
  const client = await MongoClient.connect(process.env.MONGODB_URI!)
  try {
    const db = client.db("finbot")
    const sessionsCollection = db.collection("sessions")

    await sessionsCollection.deleteOne({
      _id: new ObjectId(sessionId),
    })
  } finally {
    await client.close()
  }
}

