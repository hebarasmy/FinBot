 "use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, LineChart, BarChart, Bitcoin } from "lucide-react"
import Widget from "./Widget"
import { Card } from "@/app/components/ui/card"

export const WidgetTypes = {
  STOCK_PRICES: {
    label: "Stock Prices",
    icon: <LineChart className="h-4 w-4 mr-2 text-blue-600" />,
  },
  MARKET_OVERVIEW: {
    label: "Market Overview",
    icon: <BarChart className="h-4 w-4 mr-2 text-green-600" />,
  },
  CRYPTOCURRENCY: {
    label: "Cryptocurrency",
    icon: <Bitcoin className="h-4 w-4 mr-2 text-yellow-600" />,
  },
} as const

type WidgetType = keyof typeof WidgetTypes

// Default widgets that will be shown when the dashboard loads
const DEFAULT_WIDGETS: WidgetType[] = ["MARKET_OVERVIEW", "CRYPTOCURRENCY", "STOCK_PRICES"]

const WidgetSelect: React.FC<{ onAddWidget: (type: WidgetType) => void }> = ({ onAddWidget }) => (
  <div className="relative w-full mb-4">
    <select
      key="widget-select"
      className="w-full p-2 pl-3 pr-8 bg-white rounded-lg border border-gray-200 text-gray-600 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
      onChange={(e) => onAddWidget(e.target.value as WidgetType)}
      defaultValue=""
    >
      <option value="" disabled>
        Select Widget to Add...
      </option>
      {Object.entries(WidgetTypes).map(([key, type]) => (
        <option key={key} value={key}>
          {type.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
)

const WidgetManager: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetType[]>([])

  useEffect(() => {
    // Check if saved widgets in localStorage
    const savedWidgets = localStorage.getItem("dashboard_widgets")

    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets) as WidgetType[]
        const validWidgets = parsedWidgets.filter((widget) => Object.keys(WidgetTypes).includes(widget))
        setWidgets(validWidgets.length > 0 ? validWidgets : DEFAULT_WIDGETS)
      } catch (error) {
        console.error("Error parsing saved widgets:", error)
        setWidgets(DEFAULT_WIDGETS)
      }
    } else {
      // Use default widgets if nothing is saved
      setWidgets(DEFAULT_WIDGETS)
    }
  }, [])

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem("dashboard_widgets", JSON.stringify(widgets))
    }
  }, [widgets])

  const addWidget = (widgetType: WidgetType) => {
    setWidgets((prevWidgets) => {
      if (prevWidgets.includes(widgetType)) {
        return prevWidgets
      }
      return [...prevWidgets, widgetType]
    })
  }

  const removeWidget = (index: number) => {
    setWidgets((prevWidgets) => {
      const updatedWidgets = prevWidgets.filter((_, i) => i !== index)
      localStorage.setItem("dashboard_widgets", JSON.stringify(updatedWidgets))
      return updatedWidgets
    })
  }

  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="bg-indigo-800 text-white px-6 py-4">
        <h2 className="text-lg font-medium">Financial Dashboard</h2>
      </div>
      <div className="p-6">
        <WidgetSelect onAddWidget={addWidget} />

        {widgets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="text-gray-500 mb-2">No widgets added yet</div>
            <div className="text-sm text-gray-400">Select a widget from the dropdown above to get started</div>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {widgets.map((widget, index) => (
                <motion.div
                  key={`${widget}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Widget
                    type={widget}
                    label={WidgetTypes[widget].label}
                    icon={WidgetTypes[widget].icon}
                    onRemove={() => removeWidget(index)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </Card>
  )
}

export default WidgetManager
