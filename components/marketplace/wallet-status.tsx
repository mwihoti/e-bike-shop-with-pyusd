"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConnectWalletPrompt } from "@/components/marketplace/connect-wallet-prompt"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Wallet } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

export function WalletStatus({ showBalance = false }) {
  const { isConnected, account, balance, isMockContract, useTestMode, connectWallet } = useWallet()

  const truncateAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (!isConnected) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </SheetTrigger>
        <SheetContent>
          <ConnectWalletPrompt />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {showBalance && (
        <div className="hidden md:flex items-center mr-2">
          <span className="font-medium mr-1">Balance:</span>
          <span className="font-bold">{Number.parseFloat(balance).toFixed(2)} PYUSD</span>
          {(isMockContract || useTestMode) && (
            <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200">
              Test
            </Badge>
          )}
        </div>
      )}

      <Badge variant="outline" className="flex items-center gap-1">
        <Wallet className="h-3 w-3 mr-1" />
        {truncateAddress(account)}
      </Badge>
    </div>
  )
}

