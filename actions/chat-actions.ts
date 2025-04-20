"use server"

import { MongoClient, ObjectId } from "mongodb"
import { getCookie } from "@/lib/cookies"

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system" | "file" | "analysis"
  content: string
  source?: string
  timestamp: Date
  model?: string
  region?: string
}

export interface Chat {
  _id?: string
  id?: string
  userId: string
  title: string
  messages: ChatMessage[]
  model: string
  region?: string
  createdAt: string
  updatedAt: string
}

export interface GetUserChatsResult {
  success: boolean
  chats?: Chat[]
  error?: string
}

export interface SaveChatResult {
  success: boolean
  chatId?: string
  error?: string
}

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

async function getCurrentUserId() {
  try {
    const cookie = await getCookie("user-session")
    const sessionId = cookie?.value

    if (!sessionId) {
      return null
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI!)

    try {
      const db = client.db("finbot")
      const sessionsCollection = db.collection("sessions")

      const session = await sessionsCollection.findOne({
        _id: new ObjectId(sessionId),
      })

      if (!session) {
        return null
      }

      return session.userId.toString()
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

export async function getUserChats(): Promise<GetUserChatsResult> {
  let client
  try {
    const userId = await getCurrentUserId()
    console.log("Current user ID:", userId)

    if (!userId) {
      console.log("User not authenticated")
      return { success: false, error: "User not authenticated" }
    }

    client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db("finbot")
    const chatsCollection = db.collection("chats")

    const chats = await chatsCollection.find({ userId: userId }).sort({ updatedAt: -1 }).toArray()
    console.log(`Found ${chats.length} chats for user`)

    const serializedChats = serializeDocument(chats) as Chat[]

    return { success: true, chats: serializedChats }
  } catch (error) {
    console.error("Error getting user chats:", error)
    return { success: false, error: "Failed to get user chats" }
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}

export async function saveChat(chat: Chat): Promise<SaveChatResult> {
  let client
  try {
    let userId = chat.userId

    if (!userId || userId === "anonymous") {
      const currentUserId = await getCurrentUserId()
      if (currentUserId) {
        userId = currentUserId
      }
    }

    console.log("Saving chat for user:", userId)

    client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db("finbot")
    const chatsCollection = db.collection("chats")

    const now = new Date()
    const chatDoc = {
      userId: userId,
      title: chat.title,
      messages: chat.messages,
      model: chat.model,
      region: chat.region || "Global",
      createdAt: chat.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    }

    console.log("Prepared chat document:", chatDoc)

    let result
    if (chat.id && ObjectId.isValid(chat.id)) {
      result = await chatsCollection.updateOne(
        { _id: new ObjectId(chat.id) },
        { $set: { ...chatDoc, updatedAt: now.toISOString() } },
      )

      console.log("Update result:", result)

      if (result.matchedCount === 0) {
        result = await chatsCollection.insertOne(chatDoc)
        console.log("Inserted new chat:", result.insertedId)
        return { success: true, chatId: result.insertedId.toString() }
      }

      return { success: true, chatId: chat.id }
    } else {
      result = await chatsCollection.insertOne(chatDoc)
      console.log("Inserted new chat:", result.insertedId)
      return { success: true, chatId: result.insertedId.toString() }
    }
  } catch (error) {
    console.error("Error saving chat:", error)
    return { success: false, error: `Failed to save chat: ${error}` }
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}

export async function getChatById(chatId: string) {
  let client
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db("finbot")
    const chatsCollection = db.collection("chats")

    let chat

    if (ObjectId.isValid(chatId)) {
      chat = await chatsCollection.findOne({
        _id: new ObjectId(chatId),
        userId: userId,
      })
    }

    if (!chat) {
      chat = await chatsCollection.findOne({
        id: chatId,
        userId: userId,
      })
    }

    if (!chat) {
      return { success: false, error: "Chat not found" }
    }

    if (!chat.id) {
      chat.id = chat._id.toString()
    }

    const serializedChat = serializeDocument(chat)

    return { success: true, chat: serializedChat }
  } catch (error) {
    console.error("Error getting chat by ID:", error)
    return { success: false, error: "Failed to get chat" }
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}

export async function deleteChat(chatId: string) {
  let client
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db("finbot")
    const chatsCollection = db.collection("chats")

    let result

    if (ObjectId.isValid(chatId)) {
      result = await chatsCollection.deleteOne({
        _id: new ObjectId(chatId),
        userId: userId,
      })
    }

    if (!result || result.deletedCount === 0) {
      result = await chatsCollection.deleteOne({
        id: chatId,
        userId: userId,
      })
    }

    if (result.deletedCount === 0) {
      return { success: false, error: "Chat not found or not authorized to delete" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting chat:", error)
    return { success: false, error: "Failed to delete chat" }
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}


export async function getFrequentQueries(limit = 4): Promise<{ success: boolean; queries?: string[]; error?: string }> {
  let client
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db("finbot")
    const chatsCollection = db.collection("chats")

    // Find all chats for the user
    const chats = await chatsCollection.find({ userId: userId }).toArray()

    // Define a type for the MongoDB message structure
    interface MongoDBMessage {
      role: string
      content: string
      id: string
      timestamp: string | Date
      [key: string]: unknown
    }

    // Extract all user messages from the chats
    const userMessages: string[] = []
    chats.forEach((chat) => {
      const messages = chat.messages as MongoDBMessage[]
      if (Array.isArray(messages)) {
        messages.forEach((message) => {
          if (message.role === "user" && message.content) {
            userMessages.push(message.content)
          }
        })
      }
    })

    const queryCounts: Record<string, number> = {}
    userMessages.forEach((message) => {
      queryCounts[message] = (queryCounts[message] || 0) + 1
    })

    const sortedQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])

    const uniqueQueries = Array.from(new Set(sortedQueries)).slice(0, limit)

    return { success: true, queries: uniqueQueries }
  } catch (error) {
    console.error("Error getting frequent queries:", error)
    return { success: false, error: "Failed to get frequent queries" }
  } finally {
    if (client) {
      await client.close()
    }
  }
}


export async function getPersonalizedSuggestions(
  limit = 4,
): Promise<{ success: boolean; suggestions?: string[]; error?: string }> {
  let client
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db("finbot")
    const chatsCollection = db.collection("chats")

    const chats = await chatsCollection.find({ userId: userId }).sort({ updatedAt: -1 }).toArray()

    const userMessages: string[] = []
    const topics = new Set<string>()

    chats.forEach((chat) => {
      const messages = chat.messages as { role: string; content: string }[]
      if (Array.isArray(messages)) {
        messages.forEach((message) => {
          if (message.role === "user" && message.content) {
            userMessages.push(message.content)

            const words = message.content.toLowerCase().split(/\s+/)
            const financialTerms = [
              "stock",
              "market",
              "invest",
              "portfolio",
              "dividend",
              "bond",
              "etf",
              "fund",
              "crypto",
              "inflation",
              "recession",
              "interest rate",
              "nasdaq",
              "dow",
              "s&p",
              "forex",
              "currency",
              "earnings",
              "sector",
            ]

            words.forEach((word) => {
              if (financialTerms.some((term) => word.includes(term))) {
                topics.add(word)
              }
            })
          }
        })
      }
    })

    const suggestions: string[] = []

    if (userMessages.length > 0) {
      const lastQuery = userMessages[0]
      if (lastQuery.toLowerCase().includes("stock")) {
        suggestions.push(`What's the outlook for the stocks I asked about recently?`)
      } else if (lastQuery.toLowerCase().includes("market")) {
        suggestions.push(`How have markets changed since my last search?`)
      }
    }

    const topicArray = Array.from(topics).slice(0, 3)
    if (topicArray.length > 0) {
      const randomTopic = topicArray[Math.floor(Math.random() * topicArray.length)]
      suggestions.push(`Latest news about ${randomTopic}`)
      suggestions.push(`How to analyze ${randomTopic} performance`)
    }

    // 3. Add some contextual suggestions based on search patterns to be used in search engine
    const hasAskedAboutStocks = userMessages.some(
      (msg) => msg.toLowerCase().includes("stock") || msg.toLowerCase().includes("share"),
    )

    const hasAskedAboutCrypto = userMessages.some(
      (msg) => msg.toLowerCase().includes("crypto") || msg.toLowerCase().includes("bitcoin"),
    )

    const hasAskedAboutInflation = userMessages.some(
      (msg) => msg.toLowerCase().includes("inflation") || msg.toLowerCase().includes("interest rate"),
    )

    if (hasAskedAboutStocks) {
      suggestions.push(`What stocks should I watch this week?`)
    }

    if (hasAskedAboutCrypto) {
      suggestions.push(`Latest cryptocurrency market analysis`)
    }

    if (hasAskedAboutInflation) {
      suggestions.push(`How is inflation affecting investment strategies?`)
    }

    // 4. Add general follow-up suggestions if we don't have enough
    const generalSuggestions = [
      "Portfolio diversification strategies",
      "Best performing sectors this quarter",
      "How to hedge against market volatility",
      "Investment opportunities in emerging markets",
      "Long-term vs short-term investment strategies",
      "How to start investing in stocks"
    ]

    while (suggestions.length < limit) {
      const randomIndex = Math.floor(Math.random() * generalSuggestions.length)
      const suggestion = generalSuggestions[randomIndex]
      if (!suggestions.includes(suggestion)) {
        suggestions.push(suggestion)
      }

      // Avoid infinite loop if run out of suggestions
      if (suggestions.length >= generalSuggestions.length) break
    }

    // Return unique suggestions up to the limit
    return { success: true, suggestions: suggestions.slice(0, limit) }
  } catch (error) {
    console.error("Error getting personalized suggestions:", error)
    return { success: false, error: "Failed to get personalized suggestions" }
  } finally {
    if (client) {
      await client.close()
    }
  }
}
