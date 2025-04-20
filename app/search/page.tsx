"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Upload, FileText, File, X, SearchIcon, ChevronDown, User2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import Link from "next/link"
import { Avatar } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { Progress } from "@/app/components/ui/progress"
import { cn } from "@/lib/utils"
import { saveChat, getChatById, type ChatMessage, type Chat, getPersonalizedSuggestions } from "@/actions/chat-actions"
import ReactMarkdown from "react-markdown"

const generateId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface ApiResponse {
  response?: string
  source?: string
  error?: string
  filename?: string
  analysis?: string
  chatId?: string
  gridfs_id?: string
  textLength?: number
}

interface SearchRequestBody {
  model: string
  prompt: string
  region?: string
  isDocumentFollowUp?: boolean
  documentName?: string
  isMetaQuery?: boolean
}

const detectMetaQuery = (query: string): boolean => {
  // Keywords that might indicate a meta-query about the system itself
  const metaKeywords = [
    "search engine",
    "system",
    "how does this work",
    "functionality",
    "feature",
    "capabilities",
    "limitations",
    "improve the search",
    "enhance the search",
    "fix the search",
    "bug in the search",
    "issue with the search",
    "problem with the search",
    "error in the search",
    "search performance",
  ]

  // Document-specific keywords that should NOT trigger meta-query detection
  const documentKeywords = [
    "document",
    "pdf",
    "file",
    "report",
    "analysis",
    "financial",
    "weakness",
    "weaknesses",
    "strengths",
    "issues",
    "problems",
    "summarize",
    "analyze",
  ]

  const queryLower = query.toLowerCase()

  // If the query explicitly mentions the search engine AND doesn't contain document keywords
  const containsMetaKeyword = metaKeywords.some((keyword) => queryLower.includes(keyword))
  const containsDocumentKeyword = documentKeywords.some((keyword) => queryLower.includes(keyword))

  return (
    (containsMetaKeyword && !containsDocumentKeyword) ||
    queryLower.includes("improve the system") ||
    queryLower.includes("fix the system")
  )
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("pageQuery") || ""
  const chatIdParam = searchParams.get("chatId")

  const [searchQuery, setSearchQuery] = useState<string>(initialQuery)
  const [selectedModel, setSelectedModel] = useState<string>("chatgpt")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatId, setChatId] = useState<string>(chatIdParam || generateId())
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0)
  const [eyeColor, setEyeColor] = useState("#00f2fe")
  const [selectedRegion, setSelectedRegion] = useState<string>("Global")
  const regionDropdownRef = useRef<HTMLDivElement | null>(null)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [frequentQueries, setFrequentQueries] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFileInfo, setShowFileInfo] = useState<boolean>(false)
  const [lastDocumentName, setLastDocumentName] = useState<string | null>(null)
  const [isDocumentUploaded, setIsDocumentUploaded] = useState<boolean>(false)
  const [pendingQuery, setPendingQuery] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const modelDropdownRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const API_BASE_URL = "http://localhost:5001"

  const checkNeedsClarification = useCallback(
    (query: string): boolean => {
      if (isDocumentUploaded) {
        const ambiguousReferences = ["it", "this"]

        const documentReferences = [
          "the document",
          "the pdf",
          "the file",
          "analyze",
          "weakness",
          "weaknesses",
          "strengths",
          "issues",
          "problems",
          "summarize",
          "analyze",
        ]

        const queryLower = query.toLowerCase()

        const containsAmbiguousReference = ambiguousReferences.some((ref) =>
          new RegExp(`\\b${ref}\\b`, "i").test(queryLower),
        )

        const containsDocumentReference = documentReferences.some((ref) => queryLower.includes(ref))

        if (containsDocumentReference) {
          return false
        }

        if (containsAmbiguousReference && detectMetaQuery(query)) {
          return true
        }
      }

      return false
    },
    [isDocumentUploaded],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [searchQuery])

  useEffect(() => {
    const loadChat = async () => {
      if (!chatIdParam) return

      try {
        setIsLoading(true)
        setError(null)
        console.log("Loading chat with ID:", chatIdParam)

        const result = await getChatById(chatIdParam)
        console.log("Chat load result:", result)

        if (result.success && result.chat) {
          const chat = result.chat as Chat
          setChatId(chat.id || chat._id?.toString() || chatIdParam)

          const processedMessages = chat.messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
          }))

          setMessages(processedMessages)
          setSelectedModel(chat.model || "chatgpt")
          if (chat.region) setSelectedRegion(chat.region)

          const fileMessage = processedMessages.find((msg) => msg.role === "file")
          if (fileMessage) {
            setLastDocumentName(fileMessage.content)
          }
        } else {
          setError("Failed to load chat: " + (result.error || "Chat not found"))
        }
      } catch (error) {
        console.error("Error loading chat:", error)
        setError(`Failed to load chat: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (chatIdParam) {
      loadChat()
    }
  }, [chatIdParam])

  useEffect(() => {
    async function loadPersonalizedSuggestions() {
      try {
        const result = await getPersonalizedSuggestions(4)
        if (result.success && result.suggestions) {
          setFrequentQueries(result.suggestions)
        }
      } catch (error) {
        console.error("Error loading personalized suggestions:", error)
      }
    }

    loadPersonalizedSuggestions()
  }, [])

  // Auto-save chat when messages change
  useEffect(() => {
    const saveCurrentChat = async () => {
      const shouldSaveChat =
        messages.length > 0 &&
        !isTyping &&
        messages.length > lastSavedMessageCount &&
        messages[messages.length - 1].role === "assistant"

      if (shouldSaveChat) {
        try {
          console.log("Auto-saving chat...")

          const firstUserMessage = messages.find((m) => m.role === "user")
          const title = firstUserMessage
            ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
            : "New conversation"

          const now = new Date().toISOString()

          const chatToSave = {
            id: chatId,
            userId: "",
            title,
            messages,
            model: selectedModel,
            region: selectedRegion,
            createdAt: now,
            updatedAt: now,
          }

          console.log("Saving chat:", chatToSave)

          const result = await saveChat(chatToSave)

          if (result.success) {
            console.log("Chat saved successfully:", result)
            setLastSavedMessageCount(messages.length)
            // Update chatId if a new chat was created
            if (result.chatId && chatId !== result.chatId) {
              setChatId(result.chatId)
            }
          } else {
            console.error("Failed to save chat:", result.error)
          }
        } catch (error) {
          console.error("Error auto-saving chat:", error)
        }
      }
    }

    saveCurrentChat()
  }, [messages, isTyping, chatId, selectedModel, lastSavedMessageCount, selectedRegion])

  useEffect(() => {
    const colors = ["#6366f1", "#00f2fe"]
    const interval = setInterval(() => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      setEyeColor(randomColor)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fileMessages = messages.filter((msg) => msg.role === "file")
    if (fileMessages.length > 0) {
      const lastFileMessage = fileMessages[fileMessages.length - 1]
      setLastDocumentName(lastFileMessage.content)
    }
  }, [messages])

  // Add this useEffect to save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      // Save current chat state to localStorage
      localStorage.setItem(
        `chat-${chatId}`,
        JSON.stringify({
          messages,
          selectedModel,
          selectedRegion,
          lastDocumentName,
          isDocumentUploaded,
        }),
      )
    }
  }, [messages, chatId, selectedModel, selectedRegion, lastDocumentName, isDocumentUploaded])

  // Add this useEffect to load messages from localStorage on initial render
  useEffect(() => {
    // Only try to restore if we're not loading a specific chat from URL
    if (!chatIdParam && !initialQuery) {
      const savedChat = localStorage.getItem(`chat-${chatId}`)
      if (savedChat) {
        try {
          const parsedChat = JSON.parse(savedChat)
          setMessages(parsedChat.messages)
          setSelectedModel(parsedChat.selectedModel || "chatgpt")
          setSelectedRegion(parsedChat.selectedRegion || "Global")
          if (parsedChat.lastDocumentName) {
            setLastDocumentName(parsedChat.lastDocumentName)
          }
          if (parsedChat.isDocumentUploaded) {
            setIsDocumentUploaded(parsedChat.isDocumentUploaded)
          }
          console.log("Restored chat from localStorage")
        } catch (error) {
          console.error("Failed to parse saved chat:", error)
        }
      }
    }
  }, [chatId, chatIdParam, initialQuery])

  const handleSearch = useCallback(
    async (query?: string) => {
      const searchText = query || searchQuery
      if (!searchText.trim() || isTyping) return

      setIsTyping(true)
      setError(null)

      // Check if this is a response to a clarification request
      const isResponseToClarification = pendingQuery !== null

      const isPotentialMetaQuery = detectMetaQuery(searchText)

      const needsClarification = !isResponseToClarification && checkNeedsClarification(searchText)

      if (needsClarification) {
        // Store the original query for later use
        setPendingQuery(searchText)

        // Add user query to messages
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content: searchText,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])

        // Add clarification request
        const clarificationMessage: ChatMessage = {
          id: `clarification-${Date.now()}`,
          role: "assistant",
          content: `I notice your question might be about either the document content or about the search engine itself. Could you please clarify:
                   
                    1. Are you asking about the content of the document "${lastDocumentName}"?
                    2. Or are you asking about the search engine's functionality/performance?

                    Please specify so I can provide the most relevant response.`,
          timestamp: new Date(),
          model: selectedModel,
        }

        setMessages((prev) => [...prev, clarificationMessage])
        setIsTyping(false)
        setSearchQuery("")
        return
      }

      // Ensure user query is added to messages with correct type
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: searchText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      // Reset input field after setting messages
      if (!query) setSearchQuery("")

      try {
        // Add a temporary "thinking" message to indicate RAG process is in progress
        const thinkingId = `thinking-${Date.now()}`
        const isRegularQuery = !isPotentialMetaQuery && !isResponseToClarification && !lastDocumentName

        if (isRegularQuery) {
          // Only show the RAG indicator for regular queries (not meta or document queries)
          const thinkingMessage: ChatMessage = {
            id: thinkingId,
            role: "assistant",
            content: "Searching knowledge base for relevant financial information...",
            timestamp: new Date(),
            model: selectedModel,
          }
          setMessages((prev) => [...prev, thinkingMessage])
        }

        console.log(`🔍 Searching with model: ${selectedModel}, region: ${selectedRegion}`)

        let actualQuery = searchText
        let actualIntent = null

        if (isResponseToClarification) {
          // Check if the response indicates document content
          const isAboutDocument =
            searchText.toLowerCase().includes("document") ||
            searchText.toLowerCase().includes("pdf") ||
            searchText.toLowerCase().includes("content") ||
            searchText.toLowerCase() === "1" ||
            searchText.toLowerCase() === "the pdf please" ||
            searchText.toLowerCase() === "the document please"

          if (isAboutDocument) {
            actualQuery = pendingQuery || searchText
            actualIntent = "document"
            console.log(`📄 Using original query with document context: ${actualQuery}`)
          } else {
            actualIntent = "meta"
            console.log(`🔍 Query is about the search engine itself`)
          }

          setPendingQuery(null)
        }

        const isDocumentFollowUp =
          !!lastDocumentName && (actualIntent === "document" || (!isPotentialMetaQuery && !isResponseToClarification))

        const requestBody: SearchRequestBody = {
          model: selectedModel,
          prompt: actualQuery,
          region: selectedRegion !== "Global" ? selectedRegion : undefined,
        }

        if (isDocumentFollowUp) {
          requestBody.isDocumentFollowUp = true
          requestBody.documentName = lastDocumentName

          if (actualIntent === "document") {
            if (
              actualQuery.toLowerCase().includes("weakness") ||
              actualQuery.toLowerCase().includes("problem") ||
              actualQuery.toLowerCase().includes("issue")
            ) {
              requestBody.prompt = `Please specifically identify the weaknesses, problems, or concerning aspects in the document "${lastDocumentName}". Focus only on negative or concerning elements, not strengths. Original query: ${actualQuery}`
            } else if (
              actualQuery.toLowerCase().includes("strength") ||
              actualQuery.toLowerCase().includes("positive")
            ) {
              requestBody.prompt = `Please specifically identify the strengths or positive aspects in the document "${lastDocumentName}". Focus only on positive elements, not weaknesses. Original query: ${actualQuery}`
            } else if (
              actualQuery.toLowerCase().includes("summarize") ||
              actualQuery.toLowerCase().includes("summary")
            ) {
              requestBody.prompt = `Please provide a concise summary of the key points in the document "${lastDocumentName}". Original query: ${actualQuery}`
            }
          }

          console.log(`📄 This is a follow-up question about document: ${lastDocumentName}`)
        }

        if (isPotentialMetaQuery || actualIntent === "meta") {
          requestBody.isMetaQuery = true
          console.log(`🔍 This appears to be a meta-query about the search engine itself`)
        }

        const response = await fetch(`${API_BASE_URL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }

        const data: ApiResponse = await response.json()
        console.log("✅ API Response:", data)

        if (isRegularQuery) {
          setMessages((prev) => prev.filter((msg) => msg.id !== thinkingId))
        }

        if (data.response) {
          const botMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
            model: selectedModel,
          }

          setMessages((prev) => [...prev, botMessage])
        } else {
          throw new Error("Unexpected response format")
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Unknown error")

        setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("thinking-")))
      } finally {
        setIsTyping(false)
      }
    },
    [
      selectedModel,
      searchQuery,
      isTyping,
      API_BASE_URL,
      selectedRegion,
      lastDocumentName,
      checkNeedsClarification,
      pendingQuery,
    ],
  )

  useEffect(() => {
    if (initialQuery.trim() && messages.length === 0) {
      handleSearch(initialQuery)
    }
  }, [initialQuery, handleSearch, messages.length])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowDropdown(false)
      setShowModelDropdown(false)
      setShowRegionDropdown(false)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["txt", "pdf", "docx"]

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Please upload a PDF, DOCX, or TXT file.`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Check file size
    if (file.size === 0) {
      setError("The file appears to be empty. Please upload a file with content.")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Check if file is too large
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum file size is 10MB.`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setUploadedFile(file)
    setShowDropdown(false)
    setShowFileInfo(true)

    if (textareaRef.current) {
      textareaRef.current.placeholder = `Add instructions or questions about ${file.name}...`
    }

    setSearchQuery("")

    // search input
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleFileUpload = async () => {
    if (!uploadedFile) return

    // Check if file has content
    if (uploadedFile.size === 0) {
      setError("The file appears to be empty. Please upload a file with content.")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append("file", uploadedFile)

    const userId = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user") || "{}").email || "anonymous"
      : "anonymous"
    formData.append("user_id", userId)

    // Add document comment if provided
    if (searchQuery.trim()) {
      formData.append("comment", searchQuery)
    }

    try {
      console.log("📂 Uploading file:", uploadedFile.name, "Size:", uploadedFile.size, "bytes")
      if (searchQuery) {
        console.log("📝 With comment:", searchQuery)
      }

      // XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)

          if (progress === 100) {
            setIsProcessing(true)
          }
        }
      })

      // handle the XHR request
      const uploadPromise = new Promise<ApiResponse>((resolve, reject) => {
        xhr.open("POST", `${API_BASE_URL}/upload`)

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (parseError) {
              console.error("Failed to parse response:", parseError, "Raw response:", xhr.responseText)
              reject(
                new Error(
                  `Invalid response format: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`,
                ),
              )
            }
          } else {
            console.error("Upload error response:", xhr.responseText)
            console.error("Status code:", xhr.status, "Status text:", xhr.statusText)

            try {
              const errorResponse = JSON.parse(xhr.responseText)
              reject(new Error(errorResponse.error || `Server error: ${xhr.status} ${xhr.statusText}`))
            } catch {
              reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`))
            }
          }
        }

        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"))
        }

        xhr.ontimeout = () => {
          reject(new Error("Upload request timed out"))
        }

        console.log("Attempting to upload and extract text from:", uploadedFile.name)
        xhr.send(formData)
      })

      // imeout to the upload process
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Upload timed out after 60 seconds")), 60000)
      })

      const data = await Promise.race([uploadPromise, timeoutPromise])
      console.log("✅ File Upload Response:", data)

      if (data.error) {
        throw new Error(data.error)
      } else {
        // document uploaded flag to true
        setIsDocumentUploaded(true)

        // file upload message
        setMessages((prev) => [
          ...prev,
          {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: "file",
            content: data.filename || uploadedFile.name,
            timestamp: new Date(),
          },
        ])

        setLastDocumentName(data.filename || uploadedFile.name)

        if (searchQuery.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              role: "user",
              content: searchQuery,
              timestamp: new Date(),
            },
          ])
        }

        if (data.analysis) {
          setMessages((prev) => [
            ...prev,
            {
              id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              role: "analysis",
              content: data.analysis || "",
              timestamp: new Date(),
            },
          ])
        }

        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    } catch (error) {
      console.error("❌ Upload Error:", error)
      setError(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
      setUploadProgress(0)
      setUploadedFile(null)
      setSearchQuery("")
      setShowFileInfo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      if (textareaRef.current) {
        textareaRef.current.placeholder =
          selectedRegion !== "Global"
            ? `Ask about ${selectedRegion} financial markets, stocks, economic trends...`
            : "Ask about financial markets, stocks, economic trends..."
      }
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setShowFileInfo(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (textareaRef.current) {
      textareaRef.current.placeholder =
        selectedRegion !== "Global"
          ? `Ask about ${selectedRegion} financial markets, stocks, economic trends...`
          : "Ask about financial markets, stocks, economic trends..."
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (uploadedFile) {
        handleFileUpload()
      } else {
        handleSearch()
      }
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "docx":
      case "doc":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "txt":
        return <File className="h-5 w-5 text-gray-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (date: Date) => {
    return date
      .toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(" ", " ")
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-purple-50 to-slate-100 h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-700 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-700">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-purple-50 to-slate-100 h-screen overflow-auto custom-scrollbar relative">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col h-full">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="relative mr-3">
              <div className="w-10 h-10 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 border border-slate-200 flex items-center justify-center">
                  <div className="absolute inset-0.5 rounded-full border-0.5 border-slate-300/50"></div>
                  <div className="absolute inset-1 rounded-full border-0.5 border-slate-300/30"></div>

                  <div className="absolute inset-1 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center">
                    <div className="flex space-x-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex items-center justify-center">
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: eyeColor,
                            boxShadow: `0 0 2px ${eyeColor}`,
                          }}
                        />
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex items-center justify-center">
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: eyeColor,
                            boxShadow: `0 0 2px ${eyeColor}`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-1">
                      <div
                        className="w-3 h-0.5 rounded-full"
                        style={{
                          backgroundColor: eyeColor,
                          boxShadow: `0 0 2px ${eyeColor}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-800 to-indigo-600 bg-clip-text text-transparent">
                Financial Insights
              </h1>
              <p className="text-slate-500 text-sm">Powered by advanced AI models</p>
            </div>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-slate-300 hover:bg-slate-100"
                    onClick={() => {
                      // Create a new chat
                      const newChatId = generateId()
                      // Save current chat if there are messages
                      if (messages.length > 0) {
                        const firstUserMessage = messages.find((m) => m.role === "user")
                        const title = firstUserMessage
                          ? firstUserMessage.content.substring(0, 50) +
                            (firstUserMessage.content.length > 50 ? "..." : "")
                          : "New conversation"

                        const now = new Date().toISOString()

                        const chatToSave = {
                          id: chatId,
                          userId: "",
                          title,
                          messages,
                          model: selectedModel,
                          region: selectedRegion,
                          createdAt: now,
                          updatedAt: now,
                        }

                        // Save the current chat
                        saveChat(chatToSave).then((result) => {
                          console.log("Chat saved before creating new chat:", result)
                        })
                      }

                      // Reset state for new chat
                      setChatId(newChatId)
                      setMessages([])
                      setLastSavedMessageCount(0)
                      setLastDocumentName(null)
                      setIsDocumentUploaded(false)
                      setPendingQuery(null)
                      setError(null)

                      // Clear the localStorage for the old chat to avoid confusion
                      localStorage.removeItem(`chat-${chatId}`)

                      // Update URL without reloading the page
                      const url = new URL(window.location.href)
                      url.searchParams.delete("chatId")
                      url.searchParams.delete("pageQuery")
                      window.history.pushState({}, "", url)
                    }}
                  >
                    <span>New Chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start a new chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/search/history">
                    <Button variant="outline" className="flex items-center gap-2 border-slate-300 hover:bg-slate-100">
                      <span>History</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>View search history</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Card className="mb-6 border border-gray-200 shadow-sm relative rounded-lg">
          <div className="relative p-5 bg-white rounded-lg">
            <div className="flex flex-col gap-4">
              {showFileInfo && uploadedFile && (
                <div className="flex items-center p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-2">
                  <div className="flex items-center flex-1">
                    {getFileIcon(uploadedFile.name)}
                    <span className="ml-2 font-medium text-slate-700">{uploadedFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="relative flex gap-3 w-full items-center">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={
                      uploadedFile
                        ? `Add instructions or questions about ${uploadedFile.name}...`
                        : selectedRegion !== "Global"
                          ? `Ask about ${selectedRegion} financial markets, stocks, economic trends...`
                          : "Ask about financial markets, stocks, economic trends..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 pl-10 pr-3 rounded-lg border border-slate-300 text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative" ref={modelDropdownRef}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => !uploadedFile && setShowModelDropdown(!showModelDropdown)}
                      className={cn(
                        "flex items-center gap-2 bg-white border-gray-200",
                        uploadedFile && "opacity-60 cursor-not-allowed",
                      )}
                      disabled={!!uploadedFile}
                    >
                      <span>Model: {selectedModel === "chatgpt" ? "ChatGPT" : selectedModel}</span>
                      {!uploadedFile && <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {showModelDropdown && !uploadedFile && (
                      <div className="absolute top-full mt-1 w-48 rounded-md bg-white shadow-lg border border-gray-200 py-1 z-[9999]">
                        {["chatgpt", "LLama", "DeepSeek"].map((model) => (
                          <button
                            key={model}
                            className={cn(
                              "w-full px-4 py-2 text-left text-sm hover:bg-gray-100",
                              selectedModel === model && "bg-indigo-50 text-indigo-800",
                            )}
                            onClick={() => {
                              setSelectedModel(model)
                              setShowModelDropdown(false)
                            }}
                          >
                            {model === "chatgpt" ? "ChatGPT" : model}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={regionDropdownRef}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => !uploadedFile && setShowRegionDropdown(!showRegionDropdown)}
                      className={cn(
                        "flex items-center gap-2 bg-white border-gray-200",
                        uploadedFile && "opacity-60 cursor-not-allowed",
                      )}
                      disabled={!!uploadedFile}
                    >
                      <span>Region: {selectedRegion}</span>
                      {!uploadedFile && <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {showRegionDropdown && !uploadedFile && (
                      <div className="absolute top-full mt-1 w-48 rounded-md bg-white shadow-lg border border-gray-200 py-1 z-[9999]">
                        {[
                          "Global",
                          "North America",
                          "Europe",
                          "Asia Pacific",
                          "Middle East",
                          "Africa",
                          "Latin America",
                        ].map((region) => (
                          <button
                            key={region}
                            className={cn(
                              "w-full px-4 py-2 text-left text-sm hover:bg-gray-100",
                              selectedRegion === region && "bg-indigo-50 text-indigo-800",
                            )}
                            onClick={() => {
                              setSelectedRegion(region)
                              setShowRegionDropdown(false)
                            }}
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!uploadedFile ? (
                    <div className="relative" ref={dropdownRef}>
                      <Button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-800"
                        disabled={isUploading || isProcessing}
                      >
                        {isUploading || isProcessing ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : null}
                        <span>{isUploading ? "Uploading..." : isProcessing ? "Processing..." : "Upload"}</span>
                      </Button>

                      {showDropdown && (
                        <div className="absolute top-full right-0 mt-1 w-64 rounded-md bg-white shadow-lg border border-gray-200 z-[9999]">
                          <div className="p-2 border-b">
                            <p className="text-sm font-medium">Upload Financial Document</p>
                            <p className="text-xs text-gray-500">Upload financial reports for detailed analysis</p>
                          </div>
                          <div className="p-2">
                            <label className="block p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".txt,.pdf,.docx"
                                onChange={handleFileSelect}
                              />
                              <div className="flex items-center">
                                <Upload className="h-4 w-4 mr-2 text-indigo-800" />
                                <div>
                                  <p className="text-sm font-medium">Upload from Computer</p>
                                  <p className="text-xs text-gray-500">PDF, DOCX, TXT (Max 10MB)</p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={handleFileUpload}
                      className="bg-indigo-600 text-white hover:bg-indigo-800"
                      disabled={isUploading || isProcessing}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                          Uploading...
                        </>
                      ) : isProcessing ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                          Processing...
                        </>
                      ) : (
                        <>Upload & Analyze</>
                      )}
                    </Button>
                  )}

                  {!uploadedFile && (
                    <Button
                      size="icon"
                      onClick={() => handleSearch()}
                      className="rounded-lg bg-indigo-800 p-2 text-white hover:bg-indigo-800"
                      disabled={isTyping || !searchQuery.trim()}
                    >
                      {isTyping ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {(isUploading || isProcessing) && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-purple-200 p-2 rounded-md mr-2">
                        <Upload className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-slate-700">
                        {isUploading ? `Uploading ${uploadedFile?.name}` : "Processing document..."}
                      </span>
                    </div>
                    <span className="text-sm text-purple-600 font-medium">
                      {isUploading ? `${uploadProgress}%` : ""}
                    </span>
                  </div>
                  <Progress
                    value={isUploading ? uploadProgress : isProcessing ? 100 : 0}
                    className="h-2 bg-purple-100"
                    indicatorClassName="bg-purple-600"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {isUploading ? "Uploading document..." : "Analyzing document and generating insights..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Error</h3>
                <div className="mt-1 text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4 rounded-lg custom-scrollbar min-h-[50vh]">
          <div className="space-y-6 min-h-full">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="animate-fadeIn">
                  {message.role === "user" && (
                    <div className="flex items-start gap-3 mb-6">
                      <Avatar className="h-8 w-8 bg-purple-100 text-purple-600 flex-shrink-0">
                        <User2 className="h-4 w-4" />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm border border-slate-200 max-w-full overflow-hidden">
                          <div className="text-slate-800 whitespace-pre-wrap break-words">{message.content}</div>
                        </div>
                        <div className="mt-1.5 text-xs text-slate-500 ml-2">{formatTime(message.timestamp)}</div>
                      </div>
                    </div>
                  )}

                  {message.role === "assistant" && (
                    <div className="flex items-start gap-3 mb-6">
                      <Avatar className="h-8 w-8 flex-shrink-0 flex items-center justify-center">
                        <div className="w-7 h-7 relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 border border-slate-200 flex items-center justify-center">
                            <div className="absolute inset-0.5 rounded-full border-0.5 border-slate-300/50"></div>
                            <div className="absolute inset-1 rounded-full border-0.5 border-slate-300/30"></div>

                            <div className="absolute inset-1 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center">
                              <div className="flex space-x-0.5 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-slate-900 flex items-center justify-center">
                                  <div
                                    className="w-0.5 h-0.5 rounded-full"
                                    style={{
                                      backgroundColor: eyeColor,
                                      boxShadow: `0 0 1px ${eyeColor}`,
                                    }}
                                  />
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-900 flex items-center justify-center">
                                  <div
                                    className="w-0.5 h-0.5 rounded-full"
                                    style={{
                                      backgroundColor: eyeColor,
                                      boxShadow: `0 0 1px ${eyeColor}`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-0.5">
                                <div
                                  className="w-1.5 h-0.25 rounded-full"
                                  style={{
                                    backgroundColor: eyeColor,
                                    boxShadow: `0 0 1px ${eyeColor}`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "rounded-lg rounded-tl-none p-4 shadow-sm border max-w-full overflow-hidden",
                            message.id.startsWith("thinking-")
                              ? "bg-blue-50 border-blue-100 animate-pulse"
                              : "bg-gradient-to-r from-indigo-50 to-violet-50 border-purple-100",
                          )}
                        >
                          {message.id.startsWith("thinking-") && (
                            <div className="flex items-center gap-2 text-blue-700">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              <span>{message.content}</span>
                            </div>
                          )}
                          {!message.id.startsWith("thinking-") && (
                            <div className="text-slate-800 whitespace-pre-wrap break-words prose prose-sm max-w-none">
                              <div className="markdown-content">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => {
                                      if (children === null || (Array.isArray(children) && children.length === 0)) {
                                        return null
                                      }
                                      return <p>{children}</p>
                                    },
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          {message.source && (
                            <div className="mt-2 text-xs text-indigo-800 font-medium">{message.source}</div>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <span>{formatTime(message.timestamp)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">
                            {message.model === "chatgpt" || (!message.model && selectedModel === "chatgpt")
                              ? "GPT-4o mini"
                              : message.model || selectedModel}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">{message.region || selectedRegion || "Global"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.role === "file" && (
                    <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg mb-4 mx-2">
                      <div className="bg-white p-2 rounded-md mr-3 shadow-sm">{getFileIcon(message.content)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-700 truncate">{message.content}</div>
                        <div className="text-sm text-slate-600">Document uploaded successfully</div>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">Processed</Badge>
                    </div>
                  )}

                  {message.role === "analysis" && (
                    <div className="flex items-start gap-3 mb-6">
                      <Avatar className="h-8 w-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg rounded-tl-none p-4 shadow-sm border border-amber-100 max-w-full overflow-hidden">
                          <div className="flex items-center mb-2">
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Document Analysis</Badge>
                          </div>
                          <div className="text-slate-800 whitespace-pre-wrap break-words prose prose-sm max-w-none">
                            <div className="markdown-content">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => {
                                    if (children === null || (Array.isArray(children) && children.length === 0)) {
                                      return null
                                    }
                                    return <p>{children}</p>
                                  },
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <span>{formatTime(message.timestamp)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">Financial Analysis</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-4 relative">
                  <div className="w-12 h-12 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 border border-slate-200 flex items-center justify-center">
                      <div className="absolute inset-0.5 rounded-full border-0.5 border-slate-300/50"></div>
                      <div className="absolute inset-1 rounded-full border-0.5 border-slate-300/30"></div>

                      <div className="absolute inset-1 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center">
                        <div className="flex space-x-1.5 mt-1">
                          <div className="w-2 h-2 rounded-full bg-slate-900 flex items-center justify-center">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: eyeColor,
                                boxShadow: `0 0 2px ${eyeColor}`,
                              }}
                            />
                          </div>
                          <div className="w-2 h-2 rounded-full bg-slate-900 flex items-center justify-center">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: eyeColor,
                                boxShadow: `0 0 2px ${eyeColor}`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-1.5">
                          <div
                            className="w-4 h-0.5 rounded-full"
                            style={{
                              backgroundColor: eyeColor,
                              boxShadow: `0 0 2px ${eyeColor}`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">Financial Insights Assistant</h3>
                <p className="text-slate-500 text-center max-w-md mb-6">
                  Ask questions about financial markets, upload documents for analysis, or get insights on economic
                  trends.
                </p>
                {frequentQueries.length > 0 ? (
                  <h4 className="text-sm font-medium text-indigo-600 mb-3">Suggested for you:</h4>
                ) : (
                  <h4 className="text-sm font-medium text-indigo-600 mb-3">Suggested searches:</h4>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {frequentQueries.length > 0 ? (
                    <>
                      {frequentQueries.map((query) => (
                        <button
                          key={query}
                          className="text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm transition-colors"
                          onClick={() => {
                            setSearchQuery(query)
                            if (textareaRef.current) {
                              textareaRef.current.focus()
                            }
                          }}
                        >
                          {query}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        selectedRegion === "Middle East"
                          ? "What are the best performing stocks in the Middle East?"
                          : "What are the current market trends?",
                        selectedRegion === "Middle East"
                          ? "Analyze Saudi Arabia's market performance"
                          : "Analyze the tech sector performance",
                        selectedRegion === "Middle East"
                          ? "Explain inflation's impact on Middle Eastern investments"
                          : "Explain inflation's impact on investments",
                        selectedRegion === "Middle East"
                          ? "How to diversify my portfolio in the MENA region?"
                          : "How to diversify my portfolio?",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          className="text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm transition-colors"
                          onClick={() => {
                            setSearchQuery(suggestion)
                            if (textareaRef.current) {
                              textareaRef.current.focus()
                            }
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 py-4 border-t border-slate-200 bg-white/50 mt-8">
          Financial Insights Assistant • Powered by advanced AI models • © 2025 FinBot Inc.
        </div>
      </div>
    </div>
  )
}
