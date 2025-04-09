"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { TransactionTraceViewer } from "@/components/transaction-trace-viewer"
import { HistoricalAnalysisTool } from "@/components/historical-analysis-tool"
import { TransactionSimulator } from "@/components/transaction-simulator"
import { PrivacyFeatures } from "@/components/privacy-features"
import { FileSearch, History, PlayCircle, Lock, AlertCircle, Wallet, Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("trace")
  const { isConnected, connectWallet } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

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
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">PYUSD Advanced Analytics</h1>

      {!isConnected && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your wallet to access all analytics features and analyze your transactions.
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto">
          <TabsTrigger value="trace">
            <FileSearch className="h-4 w-4 mr-2" />
            Transaction Tracing
          </TabsTrigger>
          <TabsTrigger value="historical">
            <History className="h-4 w-4 mr-2" />
            Historical Analysis
          </TabsTrigger>
          <TabsTrigger value="simulator">
            <PlayCircle className="h-4 w-4 mr-2" />
            Transaction Simulator
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="h-4 w-4 mr-2" />
            Privacy Features
          </TabsTrigger>
        </TabsList>
      

      <TabsContent value="trace" className="mt-0">
        <TransactionTraceViewer />
      </TabsContent>

      <TabsContent value="historical" className="mt-0">
        <HistoricalAnalysisTool />
      </TabsContent>

      <TabsContent value="simulator" className="mt-0">
        <TransactionSimulator />
      </TabsContent>

      <TabsContent value="privacy" className="mt-0">
        <PrivacyFeatures />
      </TabsContent>
    </Tabs>
    </div>
  )
}
