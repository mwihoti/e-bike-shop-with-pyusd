"use client"

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function RpcStatusIndicator({ status }) {
  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
        <div className="text-lg font-semibold">Unknown Status</div>
        <p className="text-sm text-muted-foreground text-center mt-1">Connection status information is not available</p>
      </div>
    )
  }

  if (!status.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <XCircle className="h-12 w-12 text-red-500 mb-2" />
        <div className="text-lg font-semibold">Disconnected</div>
        <p className="text-sm text-muted-foreground text-center mt-1">Not connected to GCP RPC service</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
      <div className="text-lg font-semibold">Connected</div>
      <p className="text-sm text-muted-foreground text-center mt-1">
        Connected to {status.network || "Ethereum"} (Chain ID: {status.chainId || "Unknown"})
      </p>
    </div>
  )
}
