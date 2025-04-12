"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

// This is a simplified chart component
// In a production app, you would use a proper charting library like recharts, visx, or d3

export function RpcMetricsChart({
  data = [],
  xKey = "time",
  yKey = "value",
  xLabel = "Time",
  yLabel = "Value",
  lineChart = false,
}) {
  const canvasRef = useRef(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const isDarkTheme = theme === "dark"

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set colors based on theme
    const textColor = isDarkTheme ? "#e2e8f0" : "#334155"
    const gridColor = isDarkTheme ? "#334155" : "#e2e8f0"
    const barColor = isDarkTheme ? "#3b82f6" : "#3b82f6"
    const lineColor = isDarkTheme ? "#3b82f6" : "#3b82f6"

    // Set dimensions
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.stroke()

    // Find max value for scaling
    const maxValue = Math.max(...data.map((d) => d[yKey]))

    // Draw grid lines and labels
    ctx.textAlign = "right"
    ctx.fillStyle = textColor
    ctx.font = "10px sans-serif"

    // Y-axis grid lines and labels
    for (let i = 0; i <= 5; i++) {
      const y = padding + chartHeight - (i / 5) * chartHeight
      const value = ((maxValue * i) / 5).toFixed(0)

      ctx.beginPath()
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 0.5
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()

      ctx.fillText(value, padding - 5, y + 3)
    }

    // X-axis labels
    ctx.textAlign = "center"
    const step = Math.max(1, Math.floor(data.length / 6))
    for (let i = 0; i < data.length; i += step) {
      const x = padding + (i / (data.length - 1)) * chartWidth
      ctx.fillText(data[i][xKey].toString(), x, canvas.height - padding + 15)
    }

    // Axis labels
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(xLabel, canvas.width / 2, canvas.height - 5)

    ctx.save()
    ctx.translate(10, canvas.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(yLabel, 0, 0)
    ctx.restore()

    // Draw data
    if (lineChart) {
      // Line chart
      ctx.beginPath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 2

      data.forEach((d, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth
        const y = padding + chartHeight - (d[yKey] / maxValue) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw points
      data.forEach((d, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth
        const y = padding + chartHeight - (d[yKey] / maxValue) * chartHeight

        ctx.beginPath()
        ctx.fillStyle = lineColor
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    } else {
      // Bar chart
      const barWidth = (chartWidth / data.length) * 0.8
      const barSpacing = (chartWidth / data.length) * 0.2

      data.forEach((d, i) => {
        const x = padding + i * (barWidth + barSpacing)
        const barHeight = (d[yKey] / maxValue) * chartHeight
        const y = canvas.height - padding - barHeight

        ctx.fillStyle = barColor
        ctx.fillRect(x, y, barWidth, barHeight)
      })
    }
  }, [data, theme, xKey, yKey, xLabel, yLabel, lineChart])

  if (data.length === 0) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading chart data...</p>
        </div>
      </Card>
    )
  }

  return <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />
}
