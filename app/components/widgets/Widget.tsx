"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { X, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface WidgetProps {
  type: string
  label: string
  icon: React.ReactNode
  onRemove: () => void
}

const Widget: React.FC<WidgetProps> = ({ type, label, icon, onRemove }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tradingViewRef = useRef<HTMLDivElement | null>(null)
  const marketOverviewRef = useRef<HTMLDivElement | null>(null)
  const cryptoScreenerRef = useRef<HTMLDivElement | null>(null)
  const widgetMounted = useRef(true)

  useEffect(() => {
    widgetMounted.current = true

    setError(null)
    setLoading(false)

    return () => {
      widgetMounted.current = false
    }
  }, [type])

  useEffect(() => {
    const currentTradingViewRef = tradingViewRef.current
    const currentMarketOverviewRef = marketOverviewRef.current
    const currentCryptoScreenerRef = cryptoScreenerRef.current

    if (type === "STOCK_PRICES" && currentTradingViewRef) {
      try {
        setLoading(true)
        const script = document.createElement("script")
        script.type = "text/javascript"
        script.async = true
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js"
        script.innerHTML = JSON.stringify({
          colorTheme: "light",
          dateRange: "12M",
          exchange: "US",
          showChart: true,
          locale: "en",
          largeChartUrl: "",
          isTransparent: false,
          showSymbolLogo: false,
          showFloatingTooltip: false,
          width: "100%",
          height: "600",
          plotLineColorGrowing: "rgba(41, 98, 255, 1)",
          plotLineColorFalling: "rgba(255, 0, 0, 1)",
          gridLineColor: "rgba(240, 243, 250, 0)",
          scaleFontColor: "rgba(15, 15, 15, 1)",
          belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
          belowLineFillColorFalling: "rgba(255, 0, 0, 0.12)",
          belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
          belowLineFillColorFallingBottom: "rgba(255, 0, 0, 0)",
          symbolActiveColor: "rgba(41, 98, 255, 0.12)",
        })

        currentTradingViewRef.innerHTML = "" 
        currentTradingViewRef.appendChild(script)
        setLoading(false)
      } catch (err) {
        console.error("Error loading Stock Prices widget:", err)
        if (widgetMounted.current) {
          setError("Failed to load Stock Prices widget")
          setLoading(false)
        }
      }
    }

    // Market Overview Widget
    if (type === "MARKET_OVERVIEW" && currentMarketOverviewRef) {
      try {
        setLoading(true)
        const script = document.createElement("script")
        script.type = "text/javascript"
        script.async = true
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
        script.innerHTML = JSON.stringify({
          colorTheme: "dark",
          dateRange: "12M",
          showChart: true,
          locale: "en",
          largeChartUrl: "",
          isTransparent: false,
          showSymbolLogo: true,
          showFloatingTooltip: false,
          width: "100%",
          height: "550",
          plotLineColorGrowing: "rgba(152, 0, 255, 1)",
          plotLineColorFalling: "rgba(32, 18, 77, 1)",
          gridLineColor: "rgba(42, 46, 57, 0)",
          scaleFontColor: "rgba(219, 219, 219, 1)",
          belowLineFillColorGrowing: "rgba(60, 120, 216, 0.73)",
          belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
          belowLineFillColorGrowingBottom: "rgba(0, 0, 0, 0)",
          belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
          symbolActiveColor: "rgba(166, 77, 121, 1)",
          tabs: [
            {
              title: "Indices",
              symbols: [
                {
                  s: "FOREXCOM:SPXUSD",
                  d: "S&P 500 Index",
                },
                {
                  s: "FOREXCOM:NSXUSD",
                  d: "US 100 Cash CFD",
                },
                {
                  s: "FOREXCOM:DJI",
                  d: "Dow Jones Industrial Average Index",
                },
                {
                  s: "INDEX:NKY",
                  d: "Japan 225",
                },
                {
                  s: "INDEX:DEU40",
                  d: "DAX Index",
                },
                {
                  s: "FOREXCOM:UKXGBP",
                  d: "FTSE 100 Index",
                },
              ],
              originalTitle: "Indices",
            },
            {
              title: "Futures",
              symbols: [
                {
                  s: "CME_MINI:ES1!",
                  d: "S&P 500",
                },
                {
                  s: "CME:6E1!",
                  d: "Euro",
                },
                {
                  s: "COMEX:GC1!",
                  d: "Gold",
                },
                {
                  s: "NYMEX:CL1!",
                  d: "WTI Crude Oil",
                },
                {
                  s: "NYMEX:NG1!",
                  d: "Gas",
                },
                {
                  s: "CBOT:ZC1!",
                  d: "Corn",
                },
              ],
              originalTitle: "Futures",
            },
            {
              title: "Bonds",
              symbols: [
                {
                  s: "CBOT:ZB1!",
                  d: "T-Bond",
                },
                {
                  s: "CBOT:UB1!",
                  d: "Ultra T-Bond",
                },
                {
                  s: "EUREX:FGBL1!",
                  d: "Euro Bund",
                },
                {
                  s: "EUREX:FBTP1!",
                  d: "Euro BTP",
                },
                {
                  s: "EUREX:FGBM1!",
                  d: "Euro BOBL",
                },
              ],
              originalTitle: "Bonds",
            },
            {
              title: "Forex",
              symbols: [
                {
                  s: "FX:EURUSD",
                  d: "EUR to USD",
                },
                {
                  s: "FX:GBPUSD",
                  d: "GBP to USD",
                },
                {
                  s: "FX:USDJPY",
                  d: "USD to JPY",
                },
                {
                  s: "FX:USDCHF",
                  d: "USD to CHF",
                },
                {
                  s: "FX:AUDUSD",
                  d: "AUD to USD",
                },
                {
                  s: "FX:USDCAD",
                  d: "USD to CAD",
                },
              ],
              originalTitle: "Forex",
            },
          ],
        })

        currentMarketOverviewRef.innerHTML = "" 
        currentMarketOverviewRef.appendChild(script)
        setLoading(false)
      } catch (err) {
        console.error("Error loading Market Overview widget:", err)
        if (widgetMounted.current) {
          setError("Failed to load Market Overview widget")
          setLoading(false)
        }
      }
    }

    // Cryptocurrency Widget
    if (type === "CRYPTOCURRENCY" && currentCryptoScreenerRef) {
      try {
        setLoading(true)
        const script = document.createElement("script")
        script.type = "text/javascript"
        script.async = true
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js"
        script.innerHTML = JSON.stringify({
          width: "100%",
          height: 550,
          defaultColumn: "overview",
          screener_type: "crypto_mkt",
          displayCurrency: "USD",
          colorTheme: "dark",
          locale: "en",
        })

        currentCryptoScreenerRef.innerHTML = "" 
        currentCryptoScreenerRef.appendChild(script)
        setLoading(false)
      } catch (err) {
        console.error("Error loading Cryptocurrency widget:", err)
        if (widgetMounted.current) {
          setError("Failed to load Cryptocurrency widget")
          setLoading(false)
        }
      }
    }

    return () => {
      if (currentTradingViewRef) {
        currentTradingViewRef.innerHTML = ""
      }
      if (currentMarketOverviewRef) {
        currentMarketOverviewRef.innerHTML = ""
      }
      if (currentCryptoScreenerRef) {
        currentCryptoScreenerRef.innerHTML = ""
      }
    }
  }, [type])

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-500">Loading data...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          <span className="text-red-600">{error}</span>
        </div>
      )
    }

    if (type === "STOCK_PRICES") {
      return (
        <div className="tradingview-widget-container" ref={tradingViewRef}>
          <div className="tradingview-widget-container__widget" style={{ height: "350px", overflowY: "auto" }}></div>
          <div className="tradingview-widget-copyright text-xs text-gray-500 mt-2 text-center">
            <a
              href="https://www.tradingview.com/"
              rel="noreferrer noopener nofollow"
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              Track all markets on TradingView
            </a>
          </div>
        </div>
      )
    }

    if (type === "MARKET_OVERVIEW") {
      return (
        <div className="tradingview-widget-container" ref={marketOverviewRef}>
          <div className="tradingview-widget-container__widget" style={{ height: "550px" }}></div>
          <div className="tradingview-widget-copyright text-xs text-gray-500 mt-2 text-center">
            <a
              href="https://www.tradingview.com/"
              rel="noreferrer noopener nofollow"
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              <span className="blue-text">Track all markets on TradingView</span>
            </a>
          </div>
        </div>
      )
    }

    if (type === "CRYPTOCURRENCY") {
      return (
        <div className="tradingview-widget-container" ref={cryptoScreenerRef}>
          <div className="tradingview-widget-container__widget" style={{ height: "550px" }}></div>
          <div className="tradingview-widget-copyright text-xs text-gray-500 mt-2 text-center">
            <a
              href="https://www.tradingview.com/"
              rel="noreferrer noopener nofollow"
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              <span className="blue-text">Track all markets on TradingView</span>
            </a>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <span className="text-gray-500">No data available</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`w-full rounded-xl shadow-sm border border-gray-200 overflow-hidden ${["MARKET_OVERVIEW", "CRYPTOCURRENCY"].includes(type) ? "bg-[#131722]" : "bg-white"}`}
      >
        <CardHeader
          className={`flex flex-row items-center justify-between py-3 px-4 ${["MARKET_OVERVIEW", "CRYPTOCURRENCY"].includes(type) ? "bg-[#131722] border-b border-gray-700" : "bg-gray-50 border-b"}`}
        >
          <CardTitle
            className={`text-base font-medium flex items-center ${["MARKET_OVERVIEW", "CRYPTOCURRENCY"].includes(type) ? "text-white" : "text-gray-800"}`}
          >
            {icon}
            {label}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 rounded-full ${["MARKET_OVERVIEW", "CRYPTOCURRENCY"].includes(type) ? "text-gray-300 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"}`}
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove widget</span>
          </Button>
        </CardHeader>
        <CardContent className={`p-4 ${["MARKET_OVERVIEW", "CRYPTOCURRENCY"].includes(type) ? "bg-[#131722]" : ""}`}>
          {renderChart()}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default Widget
