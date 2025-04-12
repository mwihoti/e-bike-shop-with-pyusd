"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function ConnectWalletPage() {
 const router = useRouter()
 const { isConnected, connectWallet } = useWallet()
 const [isConnecting, setIsConnecting] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [isMounted, setIsMounted] = useState(false)

 // prevent hydration errors
 useEffect(() => {
    setIsMounted(true)
 }, [])

 // Redirect if already connected

 useEffect(() => {
    if (isMounted && isConnected) {
        router.push("/marketplace")
    }
 }, [isMounted, isConnected, router])

 if (!isMounted) {
    return null
 }

 
 const handleConnectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      await connectWallet()
      // redirect automatically
      router.push("/marketplace")
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
      console.error("Wallet connection error:", err)
    } finally {
      setIsConnecting(false)
    }
  }

return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate=50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <Wallet className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
                <CardDescription>Connect your Ethereum wallet to access the PYUSD marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}


                <div className="text-center py-4">
                    <p className="text-muted-foreground mb-6">
                        You need to connect your wallet to browse and purchase items using PYUSD. This allows you to make transactions directly from your wallet.
                    </p>

                    <div className="flex justify-center mb-6">
                        <Image
                            src="/placeholder.svg?height=120&width=120"
                            alt="Ethereum Wallet"
                            width={120}
                            height={120}
                            className="rounded-lg"
                            />
                    </div>

                    <Button size="lg" className="w-full" onClick={handleConnectWallet} disabled={isConnecting}>
                        {isConnecting ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                            </>
                        ) : (
                            <>
                            Connect Wallet
                            <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>

                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Don't have a wallet? You can{" "}
                    <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    >install MetaMask</a>
                </p>
            </CardFooter>
        </Card>
    </div>
)}