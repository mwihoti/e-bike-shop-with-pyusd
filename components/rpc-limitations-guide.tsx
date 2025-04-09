"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Info } from "lucide-react"
import { checkTracingSupport } from "@/utils/advanced-rpc"

export function RpcLimitationsGuide() {
  const [tracingSupported, setTracingSupported] = useState<boolean | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Check if tracing is supported
    const checkSupport = async () => {
      const isSupported = await checkTracingSupport()
      setTracingSupported(isSupported)
    }

    checkSupport()
  }, [])

  if (!isMounted) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>RPC Provider Capabilities</CardTitle>
        <CardDescription>Understanding the limitations of your current RPC provider</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tracingSupported === false ? (
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <p className="font-medium">Limited RPC Functionality Detected</p>
              <p className="mt-1">
                Your current RPC provider doesn't support advanced tracing methods like trace_block and
                debug_traceTransaction.
              </p>
            </AlertDescription>
          </Alert>
        ) : tracingSupported === true ? (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <p className="font-medium">Full RPC Functionality Available</p>
              <p className="mt-1">
                Your RPC provider supports advanced tracing methods, enabling all explorer features.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex justify-center py-4">
            <p className="text-muted-foreground">Checking RPC capabilities...</p>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">What This Means For You</h3>

          <p className="text-sm text-muted-foreground mb-2">When using an RPC provider without tracing support:</p>

          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Basic transaction details will still be available</li>
            <li>Transaction hash lookups will work for confirmed transactions</li>
            <li>Wallet address searches will show basic transfer history</li>
            <li>Detailed execution traces will not be available</li>
            <li>Historical analysis will be limited to transfer events</li>
          </ul>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Recommended RPC Providers with Tracing Support</h3>

          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Alchemy (with Trace API enabled)</li>
            <li>Infura (with Archive + Trace add-on)</li>
            <li>QuickNode (with Trace API enabled)</li>
            <li>Self-hosted Geth/Erigon node with --tracing flag</li>
          </ul>

          <p className="text-sm text-muted-foreground mt-2">
            To use these providers, update the GCP_RPC_ENDPOINT in your environment variables.
          </p>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Troubleshooting Transaction Lookups</h3>

          <p className="text-sm text-muted-foreground mb-2">If you're having trouble finding transactions:</p>

          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Verify you're on the correct network (Mainnet, Sepolia, etc.)</li>
            <li>Check that the transaction has been confirmed (may take 30+ seconds)</li>
            <li>Ensure the transaction hash is correct (66 characters starting with 0x)</li>
            <li>For test transactions, confirm they were sent to the PYUSD contract</li>
            <li>Try using a block explorer like Etherscan to verify the transaction exists</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
