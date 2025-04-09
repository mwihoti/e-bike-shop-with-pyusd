"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { verifyRpcEndpoint } from "@/utils/rpc-monitor"
import { useWallet } from "@/hooks/use-wallet"
import { AlertCircle, CheckCircle, Loader2, Wallet } from "lucide-react"

export default function DiagnosticsPage() {
  const { isConnected, account, provider, chainId, networkName, connectWallet } = useWallet()
  const [isChecking, setIsChecking] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const checkRpcConnection = async () => {
    setIsChecking(true)
    setError(null)
    setResults(null)

    try {
      if (!provider) {
        throw new Error("Wallet not connected. Please connect your wallet first.")
      }

      // Basic provider info
      const connectionInfo = {
        chainId: chainId,
        networkName: networkName,
        isConnected: isConnected,
        account: account,
      }

      // Check block information
      const blockNumber = await provider.getBlockNumber()
      const block = await provider.getBlock(blockNumber)

      // Check gas price
      const gasPrice = await provider.getFeeData()

      // Verify RPC endpoint
      const isRpcValid = await verifyRpcEndpoint(provider)

      // Get node information if possible
      let nodeInfo = null
      try {
        const clientVersion = await provider.send("web3_clientVersion", [])
        nodeInfo = { clientVersion }
      } catch (e) {
        nodeInfo = { error: "Could not retrieve node information" }
      }

      // Compile results
      setResults({
        connectionInfo,
        blockInfo: {
          number: blockNumber,
          timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toLocaleString() : "Unknown",
          hash: block?.hash || "Unknown",
        },
        gasInfo: {
          gasPrice: gasPrice?.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, "gwei") + " Gwei" : "Unknown",
          maxFeePerGas: gasPrice?.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, "gwei") + " Gwei" : "N/A",
        },
        nodeInfo,
        isRpcValid,
      })
    } catch (err: any) {
      setError(err.message || "Failed to check RPC connection")
      console.error("RPC check error:", err)
    } finally {
      setIsChecking(false)
    }
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      await connectWallet()
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
      console.error("Wallet connection error:", err)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">RPC Connection Diagnostics</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Check RPC Connection</CardTitle>
          <CardDescription>Verify if your application is connecting to GCP's Blockchain RPC Service</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isConnected ? (
            <div className="space-y-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>You need to connect your wallet first to check the RPC connection.</AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button onClick={handleConnectWallet} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button onClick={checkRpcConnection} disabled={isChecking}>
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check RPC Connection"
                  )}
                </Button>
              </div>

              {results && (
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="font-semibold mb-2">Connection Info</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Chain ID:</div>
                      <div>{results.connectionInfo.chainId}</div>

                      <div className="text-sm text-muted-foreground">Network:</div>
                      <div>{results.connectionInfo.networkName}</div>

                      <div className="text-sm text-muted-foreground">Connected Account:</div>
                      <div className="font-mono text-sm">{results.connectionInfo.account}</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Block Info</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Latest Block:</div>
                      <div>{results.blockInfo.number}</div>

                      <div className="text-sm text-muted-foreground">Block Time:</div>
                      <div>{results.blockInfo.timestamp}</div>

                      <div className="text-sm text-muted-foreground">Block Hash:</div>
                      <div className="font-mono text-xs truncate">{results.blockInfo.hash}</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Gas Info</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Gas Price:</div>
                      <div>{results.gasInfo.gasPrice}</div>

                      <div className="text-sm text-muted-foreground">Max Fee Per Gas:</div>
                      <div>{results.gasInfo.maxFeePerGas}</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Node Info</h3>
                    {results.nodeInfo.clientVersion ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-muted-foreground">Client Version:</div>
                        <div className="font-mono text-xs">{results.nodeInfo.clientVersion}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{results.nodeInfo.error}</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center">
                    <Badge
                      variant={results.isRpcValid ? "outline" : "destructive"}
                      className={results.isRpcValid ? "bg-green-50 text-green-800 border-green-200" : ""}
                    >
                      {results.isRpcValid ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" /> RPC Connection Valid
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" /> RPC Connection Issues
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GCP Blockchain RPC Service Configuration</CardTitle>
          <CardDescription>How to configure your application to use GCP's Blockchain RPC Service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>To connect your PYUSD dApp to GCP's Blockchain RPC Service, you need to:</p>

            <ol className="list-decimal list-inside space-y-2">
              <li>Configure your provider to use the GCP RPC endpoint URL</li>
              <li>Update your wallet connection logic to use this provider</li>
              <li>Ensure your transactions are being routed through this provider</li>
            </ol>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
              <p className="font-mono text-sm mb-2">// Example configuration in hooks/use-wallet.tsx</p>
              <p className="font-mono text-sm">
                const provider = new ethers.JsonRpcProvider('https://YOUR_GCP_RPC_ENDPOINT');
              </p>
            </div>

            <p>
              You can find your GCP Blockchain RPC endpoint in your Google Cloud Console under Blockchain Node Engine or
              the service you've configured.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
