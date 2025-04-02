"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { TransactionHistory } from "@/components/transaction-history"
import { SendTransaction } from "@/components/send-transaction"
import { WalletInfo } from "@/components/wallet-info"
import { Wallet, ArrowLeftRight, History, AlertCircle, AlertTriangle } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"



export function WalletComponent() {
  const { isConnected, account, balance, isMockContract, useTestMode, networkName, chainId,
        connectWallet, disconnectWallet, toggleTestMode, getTestTokens, pyusdContract, addTransaction, updateBalance
           }  = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [transactions, setTransactions] = useState([])
 

  // Switch to Ethereum Mainnet
  const switchToMainnet = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }], // Ethereum Mainnet
      })
    } catch (err) {
      console.error("Failed to switch network:", err)
      setError("Failed to switch network. Please switch to Ethereum Mainnet manually.")
    }
  }
  // Handle connect wallet
  const handleConnectWallet = async () => {
    setIsConnecting(true)
    setError("")
    setWarning("")

    try {
      await connectWallet()
    } catch (err) {
      console.error("Connection error:", err)
      setError(err.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          PYUSD Wallet
          {(isMockContract  || useTestMode)&& (
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
              Test Mode
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Send and receive PYUSD using Ethereum</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {warning && (
          <Alert variant="warning" className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Warning</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{warning}</span>
              {chainId !== 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit border-amber-300 hover:bg-amber-100"
                  onClick={switchToMainnet}
                >
                  Switch to Ethereum Mainnet
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-4 text-center text-muted-foreground">
              Connect your Ethereum wallet to send and receive PYUSD
            </p>
            <Button onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        ) : (
          <>
          {/* Test mode Toggle */}
          <div className="flex items-center justify-center p-3 mb-4 bg-muted rounded-md">
            <div className="space-y-0.5">
              <div className="font-medium">Test Mode</div>
              <div className="text-sm text-muted-foreground">Use simulated PYUSD tokens for testing</div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={useTestMode || isMockContract}
                onCheckedChange={toggleTestMode}
                disabled={isMockContract} // disabled if already using mock contract
                />
              {(useTestMode || isMockContract) && (
                <Button variant='outline' size="sm" onClick={getTestTokens}>
                  Get Test Tokens
                </Button>
              )}

            </div>

          </div>
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="wallet">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="send">
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Send
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet">
              <WalletInfo
                account={account}
                balance={balance}
                networkName={networkName}
                isMockContract={isMockContract || useTestMode}
                onDisconnect={disconnectWallet}
              />
            </TabsContent>

            <TabsContent value="send">
              <SendTransaction
                signer={null}
                pyusdContract={pyusdContract}
                balance={balance}
                chainId={chainId}
                isMockContract={isMockContract || useTestMode}
                addTransaction={addTransaction}
                updateBalance={() => updateBalance(pyusdContract, account)}
              />
            </TabsContent>

            <TabsContent value="history">
              <TransactionHistory transactions={transactions} provider={null} isMockContract={isMockContract || useTestMode} />
            </TabsContent>
          </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}

