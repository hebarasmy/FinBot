"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ArrowLeft, Trash2, Calendar, Clock, Bot } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Badge } from "@/app/components/ui/badge"
import { deleteChat, getUserChats, type Chat as ChatHistory } from "@/actions/chat-actions"

export default function SearchHistory() {
  const [history, setHistory] = useState<ChatHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getUserChats()

      if (result.success && result.chats && Array.isArray(result.chats)) {
        // Sort by most recent first
        const sortedChats = [...result.chats].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        setHistory(sortedChats)
      } else {
        setError(result.error || "Failed to load history")
      }
    } catch (e) {
      console.error("Error fetching history:", e)
      setError(e instanceof Error ? e.message : "Failed to load history")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation()

    try {
      if (!confirm("Are you sure you want to delete this conversation?")) {
        return
      }

      setIsDeleting(id)
      const result = await deleteChat(id)

      if (result.success) {
        setHistory((prev) => prev.filter((chat) => chat.id !== id && chat._id !== id))
      } else {
        setError(result.error || "Failed to delete chat")
      }
    } catch (e) {
      console.error("Error deleting chat:", e)
      setError(e instanceof Error ? e.message : "Failed to delete chat")
    } finally {
      setIsDeleting(null)
    }
  }

  const openChat = (chat: ChatHistory) => {
    const chatId = chat.id || chat._id
    if (chatId) {
      router.push(`/search?chatId=${chatId}`)
    } else {
      setError("Cannot open chat: Missing chat ID")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getFirstUserMessage = (chat: ChatHistory) => {
    return chat.messages.find((m) => m.role === "user")?.content || "Untitled conversation"
  }

  const filtered = history.filter((chat) => {
    const title = chat.title?.toLowerCase() || ""
    const firstMessage = getFirstUserMessage(chat).toLowerCase()
    const searchLower = searchTerm.toLowerCase()

    // Search in title or first message
    return title.includes(searchLower) || firstMessage.includes(searchLower)
  })

  return (
    <div className="flex-1 bg-gradient-to-b from-purple-50 to-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <Link href="/search">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-800 to-indigo-600 bg-clip-text text-transparent">
            Search History
          </h1>
        </div>

        <Card className="mb-6 border shadow-sm">
          <div className="relative p-4 bg-white rounded-lg">
            <Input
              type="text"
              placeholder="Search your history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
            <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
        </Card>

        {error && <Card className="mb-6 bg-red-50 border-red-200 text-red-700 p-4">{error}</Card>}

        <div className="max-h-[calc(100vh-240px)] overflow-y-auto pr-1 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex justify-between">
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <Clock className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-700 mb-2">
                  {searchTerm ? "No matches found" : "No conversation history yet"}
                </h3>
                <p className="text-slate-500 mb-6 max-w-md">
                  {searchTerm
                    ? "Try searching with different keywords or clear your search"
                    : "Start a new conversation to see your history here"}
                </p>
                <Button asChild>
                  <Link href="/search">Start a New Conversation</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((chat) => (
                <Card
                  key={chat.id || chat._id}
                  className="border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openChat(chat)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-lg">{getFirstUserMessage(chat)}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500"
                        onClick={(e) => handleDeleteChat(chat.id || (chat._id as string), e)}
                        disabled={isDeleting === chat.id}
                      >
                        {isDeleting === chat.id ? (
                          <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center text-xs text-slate-500 mt-2">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{formatDate(chat.updatedAt)}</span>
                      <span className="mx-1.5">•</span>
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>{formatTime(chat.updatedAt)}</span>
                      <span className="mx-1.5">•</span>
                      <Bot className="h-3.5 w-3.5 mr-1" />
                      <span className="capitalize">{chat.model || "chatgpt"}</span>
                      <span className="mx-1.5">•</span>
                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                        {chat.region || "Global"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
