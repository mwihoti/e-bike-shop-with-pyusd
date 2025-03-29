"use client"
import { WalletComponent } from "@/components/wallet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet } from "lucide-react"

export function ConnectWalletPrompt() {
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

      <WalletComponent />
    </div>
  )
}

