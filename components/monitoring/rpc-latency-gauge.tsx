"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/components/theme-provider"

export function RpcLatencyGauge({ value = 0 }) {
  const canvasRef = useRef(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const isDarkTheme = theme === "dark"

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set colors based on theme
    const textColor = isDarkTheme ? "#e2e8f0" : "#334155"
    const arcBackgroundColor = isDarkTheme ? "#334155" : "#e2e8f0"

    // Determine color based on latency value
    let arcForegroundColor
    if (value < 100) {
      arcForegroundColor = "#10b981" // green
    } else if (value < 300) {
      arcForegroundColor = "#f59e0b" // amber
    } else {
      arcForegroundColor = "#ef4444" // red
    }

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Draw background arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false)
    ctx.lineWidth = 20
    ctx.strokeStyle = arcBackgroundColor
    ctx.stroke()

    // Map value to angle (0-1000ms maps to 0-180 degrees)
    const maxValue = 1000
    const normalizedValue = Math.min(value, maxValue) / maxValue
    const angle = Math.PI + normalizedValue * Math.PI

    // Draw value arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, angle, false)
    ctx.lineWidth = 20
    ctx.strokeStyle = arcForegroundColor
    ctx.stroke()

    // Draw center text
    ctx.fillStyle = textColor
    ctx.font = "bold 24px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${value.toFixed(0)} ms`, centerX, centerY)

    // Draw min/max labels
    ctx.font = "12px sans-serif"
    ctx.fillText("0 ms", centerX - radius + 10, centerY + 30)
    ctx.fillText("1000+ ms", centerX + radius - 10, centerY + 30)
  }, [value, theme])

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={200} height={120} className="w-full h-auto" />
      <div className="text-sm text-muted-foreground mt-2">Average response time</div>
    </div>
  )
}
