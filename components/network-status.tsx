"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createAdvancedProvider } from "@/utils/advanced-rpc"
import { Loader2, Wifi, WifiOff } from "lucide-react"

export function NetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getNetworkInfo = async () => {
      try {
        const provider = createAdvancedProvider()
        const network = await provider.getNetwork()
        const blockNumber = await provider.getBlockNumber()

        setNetworkInfo({
          name: network.name === "homestead" ? "Ethereum Mainnet" : network.name,
          chainId: network.chainId,
          blockNumber,
          isConnected: true,
        })
      } catch (err: any) {
        console.error("Error getting network info:", err)
        setError(err.message || "Failed to connect to network")
      } finally {
        setIsLoading(false)
      }
    }

    getNetworkInfo()

    // Refresh every 30 seconds
    const interval = setInterval(getNetworkInfo, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-800">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Connecting...
      </Badge>
    )
  }

  if (error || !networkInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive">
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error || "Failed to connect to network"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            {networkInfo.name} #{networkInfo.blockNumber.toLocaleString()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Connected to {networkInfo.name}</p>
          <p>Chain ID: {networkInfo.chainId.toString()}</p>
          <p>Latest Block: {networkInfo.blockNumber.toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
