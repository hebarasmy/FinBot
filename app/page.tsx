"use client"

import Link from "next/link"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, User } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { useRouter } from "next/navigation"
import WidgetManager from "@/app/components/widgets/WidgetManager"

// This interface is used for type checking API responses when processing search results
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ApiResponse {
  response?: string
  error?: string
}

interface UserData {
  firstName: string
  lastName: string
  email: string
}

interface NewsArticle {
  title: string
  summary?: string
  description?: string
  content?: string 
  source: { name: string }
  url: string
}

export default function Home() {
  // const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("chatgpt")
  // const [messages, setMessages = useState<string[]>([])
  const [messages] = useState<{ id: string; role: string; content: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  // const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState<UserData | null>(null)
  const [trendingArticles, setTrendingArticles] = useState<NewsArticle[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  // const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          "https://newsapi.org/v2/top-headlines?category=business&apiKey=025d1e9c77374f8093ef9b5883894fea",
        )

        if (!response.ok) throw new Error(`News error: ${response.status}`)

        const data = await response.json()
        console.log("🔍 API Full Response:", data)

        if (!data.articles || !Array.isArray(data.articles) || data.articles.length === 0) {
          console.warn("⚠️ No articles found, using fallback data...")
          setTrendingArticles([
            {
              title: "Stock Markets Rally Despite Economic Concerns",
              summary: "Major indices showed strong performance despite ongoing inflation worries.",
              source: { name: "Financial Times" },
              url: "https://example.com/markets",
            },
            {
              title: "Bitcoin Surges Past $60,000 Mark",
              summary: "The cryptocurrency reached new heights as institutional adoption continues to grow.",
              source: { name: "Crypto News" },
              url: "https://example.com/bitcoin",
            },
            {
              title: "Fed Signals Potential Rate Hikes",
              summary: "Federal Reserve minutes indicate possible interest rate increases in the coming months.",
              source: { name: "Wall Street Journal" },
              url: "https://example.com/fed",
            },
          ])
          return
        }

        const primaryKeywords = [
          "stock market",
          "stocks",
          "market overview",
          "market update",
          "S&P 500",
          "Dow Jones",
          "NASDAQ",
          "Bitcoin",
          "Ethereum",
          "crypto",
          "cryptocurrency",
        ]

        const secondaryKeywords = [
          "equities",
          "investing",
          "trading",
          "market trends",
          "financial markets",
          "blockchain",
          "DeFi",
          "NFTs",
          "altcoins",
          "crypto trading",
          "crypto market",
          "stablecoins",
          "bull market",
          "bear market",
          "market cap",
          "IPO",
          "earnings report",
        ]

        const financeKeywords = [
          "finance",
          "economy",
          "economic",
          "inflation",
          "interest rates",
          "federal reserve",
          "fed",
          "treasury",
          "banking",
          "investment",
          "financial",
          "wall street",
          "hedge fund",
          "portfolio",
          "assets",
          "bonds",
          "commodities",
        ]

        // First try to find primary stock/crypto/market overview articles, if not found then general finance related news is displayed
        let filteredArticles = data.articles
          .filter((article: NewsArticle) => {
            if (!article || !article.title) return false

            const textToSearch = `${article.title} ${article.description || ""} ${article.content || ""}`.toLowerCase()

            return primaryKeywords.some((keyword) => textToSearch.includes(keyword.toLowerCase()))
          })
          .slice(0, 5)

        // If not enough primary articles, try secondary articles
        if (filteredArticles.length < 3) {
          console.log("Not enough primary stock/crypto articles, adding secondary matches...")

          const secondaryArticles = data.articles
            .filter((article: NewsArticle) => {
              if (!article || !article.title) return false

              // Skip articles already included
              if (filteredArticles.some((a: NewsArticle) => a.title === article.title)) return false

              const textToSearch =
                `${article.title} ${article.description || ""} ${article.content || ""}`.toLowerCase()

              return secondaryKeywords.some((keyword) => textToSearch.includes(keyword.toLowerCase()))
            })
            .slice(0, 5 - filteredArticles.length)

          filteredArticles = [...filteredArticles, ...secondaryArticles]
        }

        // If still not enough, add general finance articles
        if (filteredArticles.length < 3) {
          console.log("Not enough stock/crypto/market articles, adding finance articles...")

          const financeArticles = data.articles
            .filter((article: NewsArticle) => {
              if (!article || !article.title) return false

              // Skip articles already included
              if (filteredArticles.some((a: NewsArticle) => a.title === article.title)) return false

              const textToSearch =
                `${article.title} ${article.description || ""} ${article.content || ""}`.toLowerCase()

              return financeKeywords.some((keyword) => textToSearch.includes(keyword.toLowerCase()))
            })
            .slice(0, 5 - filteredArticles.length)

          filteredArticles = [...filteredArticles, ...financeArticles]
        }

        // If still not enough, use general business news
        if (filteredArticles.length < 3) {
          console.warn("⚠️ Not enough finance-specific articles. Adding general business news.")

          const remainingArticles = data.articles
            .filter((article: NewsArticle) => {
              if (!article || !article.title) return false

              // Skip articles already included
              return !filteredArticles.some((a: NewsArticle) => a.title === article.title)
            })
            .slice(0, 5 - filteredArticles.length)

          filteredArticles = [...filteredArticles, ...remainingArticles]
        }

        if (filteredArticles.length === 0) {
          console.warn("⚠️ No relevant articles found at all. Using fallback data.")
          setTrendingArticles([
            {
              title: "Stock Markets Rally Despite Economic Concerns",
              summary: "Major indices showed strong performance despite ongoing inflation worries.",
              source: { name: "Financial Times" },
              url: "https://example.com/markets",
            },
            {
              title: "Bitcoin Surges Past $60,000 Mark",
              summary: "The cryptocurrency reached new heights as institutional adoption continues to grow.",
              source: { name: "Crypto News" },
              url: "https://example.com/bitcoin",
            },
            {
              title: "Fed Signals Potential Rate Hikes",
              summary: "Federal Reserve minutes indicate possible interest rate increases in the coming months.",
              source: { name: "Wall Street Journal" },
              url: "https://example.com/fed",
            },
          ])
        } else {
          // Mapping the articles to ensure they have the correct structure
          const validArticles = filteredArticles.map((article: NewsArticle) => ({
            title: article.title || "Untitled Article",
            summary: article.description || "No description available.",
            source: { name: article.source?.name || "Unknown Source" },
            url: article.url || "#",
          }))

          setTrendingArticles(validArticles)
        }
      } catch (error) {
        console.error("❌ Fetch News Error:", error)
        // Provide fallback data when API fails
        setTrendingArticles([
          {
            title: "Stock Markets Rally Despite Economic Concerns",
            summary: "Major indices showed strong performance despite ongoing inflation worries.",
            source: { name: "Financial Times" },
            url: "https://example.com/markets",
          },
          {
            title: "Bitcoin Surges Past $60,000 Mark",
            summary: "The cryptocurrency reached new heights as institutional adoption continues to grow.",
            source: { name: "Crypto News" },
            url: "https://example.com/bitcoin",
          },
          {
            title: "Fed Signals Potential Rate Hikes",
            summary: "Federal Reserve minutes indicate possible interest rate increases in the coming months.",
            source: { name: "Wall Street Journal" },
            url: "https://example.com/fed",
          },
        ])
      }
    }

    fetchNews()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return

    setIsSearching(true)

    try {
      router.replace(`/search?pageQuery=${encodeURIComponent(searchQuery)}`)
    } catch (error) {
      console.error("Error during search:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSearching(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    document.cookie = "email_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <nav className="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Financial Insights Bot</h1>
        <div className="relative mr-[1cm]">
          {" "}
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <User className="h-5 w-5 text-gray-600" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </Button>
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <Link
                href="/profile"
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                Profile
              </Link>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl w-full mx-auto px-6 py-8 h-screen overflow-y-auto">
          {/* Header */}
          <h1 className="text-4xl font-bold text-center mb-8">Financial Insights</h1>

          {/* Search Bar */}
          <Card className="mb-6 border border-gray-200 shadow-sm relative rounded-lg max-w-4xl mx-auto">
            <div className="relative p-5 bg-white rounded-lg">
              <div className="flex flex-col gap-4">
                <div className="relative flex gap-3 w-full items-center">
                  <div className="relative flex-1">
                    <textarea
                      rows={1}
                      placeholder="Ask about financial markets, stocks, economic trends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 pl-10 pr-3 rounded-lg border border-slate-300 text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3 top-3 h-5 w-5 text-slate-400"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsModelDropdownOpen(!isModelDropdownOpen)
                        }}
                        className="flex items-center gap-2 bg-white border-gray-200"
                      >
                        <span>Model: {selectedModel}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </Button>

                      {isModelDropdownOpen && (
                        <div className="absolute top-full mt-1 w-48 rounded-md bg-white shadow-lg border border-gray-200 py-1 z-[9999]">
                          {["ChatGpt", "LLama", "DeepSeek"].map((model) => (
                            <button
                              key={model}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                selectedModel === model ? "bg-indigo-50 text-indigo-800" : ""
                              }`}
                              onClick={() => {
                                setSelectedModel(model)
                                setIsModelDropdownOpen(false)
                              }}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      size="icon"
                      onClick={handleSearch}
                      className="rounded-lg bg-indigo-800 p-2 text-white hover:bg-indigo-800"
                      disabled={!searchQuery.trim() || isSearching}
                    >
                      {isSearching ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Chat Messages with Custom Scrollbar */}
          <div className="flex flex-col space-y-4 overflow-y-auto custom-scrollbar max-h-[300px] mb-8 p-2">
            {messages.map((msg, index) => (
              <Card key={index} className="p-4 bg-white rounded-xl shadow">
                <div className="text-lg">(msg)</div>
              </Card>
            ))}
            <div ref={chatEndRef} />
          </div>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Trending Insights */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white rounded-xl shadow-sm h-[600px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Top Trending Insights of the day</h2>
                  <span className="text-sm text-gray-500"></span>
                </div>
                {trendingArticles === null ? (
                  <div className="text-gray-500 p-4 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
                    Loading latest news...
                  </div>
                ) : trendingArticles.length === 0 ? (
                  <div className="text-gray-500 p-4 border border-gray-200 rounded-lg">
                    No financial news articles available at this time.
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {trendingArticles.map((article, index) => (
                      <a key={index} href={article.url} target="_blank" rel="noopener noreferrer" className="block">
                        <Card className="p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                          <h3 className="font-semibold mb-2 text-lg">{article.title}</h3>
                          <p className="text-gray-600 mb-2 line-clamp-3">
                            {article.summary || "No description available."}
                          </p>
                          <div className="text-sm text-gray-500">Source: {article.source?.name || "Unknown"}</div>
                        </Card>
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Widgets */}
            <div className="lg:col-span-1">
              <div className="h-[600px] overflow-y-auto custom-scrollbar pr-2">
                <WidgetManager />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        
        /* Prevent scrolling beyond content */
        html, body {
          overflow: hidden;
          height: 100%;
        }
      `}</style>
    </div>
  )
}

