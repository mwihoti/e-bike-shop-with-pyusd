"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, FileSearch, Wallet, AlertCircle, Loader2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { checkTracingSupport } from "@/utils/advanced-rpc"

export default function ExplorerPage() {
  const router = useRouter()
  const { isConnected, connectWallet } = useWallet()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("tx")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [tracingSupported, setTracingSupported] = useState<boolean | null>(null)

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

  const handleSearch = async () => {
    if (!searchQuery) return

    setIsSearching(true)
    setError(null)

    try {
      if (searchType === "tx") {
        // Try to validate the transaction hash first
        if (!searchQuery.startsWith("0x") || searchQuery.length !== 66) {
          throw new Error("Invalid transaction hash format. It should start with '0x' and be 66 characters long.")
        }

        router.push(`/explorer/tx/${searchQuery}`)
      } else if (searchType === "address") {
        // Try to validate the address first
        if (!searchQuery.startsWith("0x") || searchQuery.length !== 42) {
          throw new Error("Invalid Ethereum address format. It should start with '0x' and be 42 characters long.")
        }

        router.push(`/explorer/address/${searchQuery}`)
      }
    } catch (err: any) {
      setError(err.message || "Invalid search query")
    } finally {
      setIsSearching(false)
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
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">PYUSD Block Explorer</h1>

      {tracingSupported === false && (
        <Alert className="mb-8 bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <p className="font-medium">Limited Explorer Functionality</p>
            <p className="mt-1">
              Your RPC provider doesn't support advanced tracing methods like trace_block and debug_traceTransaction.
              Basic transaction information will still be available, but detailed execution traces will not.
            </p>
            <p className="mt-1">
              For full explorer functionality, consider using an RPC provider that supports tracing, such as Alchemy,
              Infura (with tracing add-on), or a custom Geth node with tracing enabled.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your wallet to access all explorer features and view your transaction history.
              </AlertDescription>
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
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search PYUSD Transactions</CardTitle>
          <CardDescription>
            Explore PYUSD transactions with detailed execution traces using GCP's advanced RPC methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Tabs value={searchType} onValueChange={setSearchType} className="w-40">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="tx">
                  <FileSearch className="h-4 w-4 mr-2" />
                  Tx
                </TabsTrigger>
                <TabsTrigger value="address">
                  <Wallet className="h-4 w-4 mr-2" />
                  Address
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-1 gap-2">
              <Input
                placeholder={searchType === "tx" ? "Enter transaction hash" : "Enter Ethereum address"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {searchType === "tx"
                ? "Enter a transaction hash to view detailed information about a specific transaction."
                : "Enter an Ethereum address to view all PYUSD transactions associated with that address."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchType === "tx"
                ? "Example: 0x1234...abcd (66 characters starting with 0x)"
                : "Example: 0x1234...abcd (42 characters starting with 0x)"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Transaction Tracing</CardTitle>
            <CardDescription>Analyze PYUSD transactions with detailed execution traces</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our explorer leverages GCP's debug_traceTransaction to provide detailed insights into PYUSD transactions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Step-by-step execution trace of transactions</li>
              <li>Gas usage analysis at each execution step</li>
              <li>Memory and storage state changes</li>
              <li>Detailed error information for failed transactions</li>
            </ul>
            <Button className="mt-6 w-full" onClick={() => router.push("/explorer/features")}>
              Learn More
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historical Analysis</CardTitle>
            <CardDescription>Analyze historical PYUSD transaction patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our explorer uses GCP's trace_block to analyze historical PYUSD transactions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Track PYUSD flow across thousands of blocks</li>
              <li>Identify transaction patterns and trends</li>
              <li>Analyze counterparty relationships</li>
              <li>Visualize transaction volume over time</li>
            </ul>
            <Button className="mt-6 w-full" onClick={() => router.push("/explorer/analytics")}>
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
