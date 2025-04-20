"use client"

import { useState, useEffect } from "react"

export default function MiniRobot() {
  const [eyeColor, setEyeColor] = useState("#00f2fe")

  // Robot changing its eye color
  useEffect(() => {
    const colors = ["#6366f1", "#00f2fe"] // purple & light blue
    const interval = setInterval(() => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      setEyeColor(randomColor)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="inline-flex items-center justify-center"
      style={{
        width: "36px",
        height: "36px",
        verticalAlign: "middle",
        position: "relative",
        marginBottom: "-2px",
      }}
    >
      {/* Robot Body with proper borders  */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 border border-slate-200 flex items-center justify-center">
        {/* Circular lines */}
        <div className="absolute inset-0.5 rounded-full border-0.5 border-slate-300/50"></div>
        <div className="absolute inset-1 rounded-full border-0.5 border-slate-300/30"></div>

        {/* Robot Face - Inner part */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center">
          {/* Robot Eyes */}
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
          {/* Glowing  Mouth */}
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
  )
}

