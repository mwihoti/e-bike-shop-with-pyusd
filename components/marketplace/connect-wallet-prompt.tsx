"use client"
import { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, AlertTriangle } from "lucide-react"
import { Button } from "../ui/button"

export function ConnectWalletPrompt() {
  const { connectWallet } = useWallet()
  const [ isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)

    try {
      await connectWallet()

    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center mb-6">
        <Wallet className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">Connect your wallet to browse and purchase items using PYUSD</p>
      </div>

      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <AlertDescription>
          You need to connect your wallet to complete your purchase. Your PYUSD balance will be used for payment.
        </AlertDescription>
      </Alert>

      <Alert className="bg-amber-50 text-amber-800 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          Don't have PYUSD? After connecting, you can enable test mode to use simulated tokens for testing.
        </AlertDescription>
      </Alert>
      <Button className="w-full" onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

    </div>
  )
}

