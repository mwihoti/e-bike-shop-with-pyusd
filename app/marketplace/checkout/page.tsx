"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { WalletStatus } from "@/components/marketplace/wallet-status"
import { CheckoutSummary } from "@/components/marketplace/checkout-summary"
import { ConnectWalletPrompt } from "@/components/marketplace/connect-wallet-prompt"
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { ethers } from "ethers"

export default function CheckoutPage() {
  const router = useRouter()
  const { isConnected, balance, pyusdContract, account, addTransaction, isMockContract, useTestMode, toggleTestMode, getTestTokens } = useWallet()
  const { items, total, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Store address - this would typically be your company's wallet
  const STORE_ADDRESS = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Redirect if cart is empty
  useEffect(() => {
    if (isMounted && items.length === 0 && !success) {
      router.push("/marketplace")
    }
  }, [items, isMounted, router, success])

  if (!isMounted) {
    return null
  }

  // Check if user has enough balance
  const hasEnoughBalance = Number.parseFloat(balance) >= total

  const handleCheckout = async () => {
    if (!isConnected || !pyusdContract) {
      setError("Please connect your wallet first")
      return
    }

    if (!hasEnoughBalance && !useTestMode) {
      setError("Insufficient PYUSD balance")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      // Get token decimals
      const decimals = await pyusdContract.decimals()

      // Convert amount to token units
      const amountInWei = ethers.parseUnits(total.toString(), decimals)

      // Send transaction
      const tx = await pyusdContract.transfer(STORE_ADDRESS, amountInWei)

      // Add to transaction history
      addTransaction({
        hash: tx.hash,
        to: STORE_ADDRESS,
        amount: total.toString(),
        timestamp: Date.now(),
        status: "pending",
        isMock: isMockContract || useTestMode,
      })

      // Wait for transaction to be mined
      const receipt = await tx.wait()

      // Update transaction status
      addTransaction({
        hash: tx.hash,
        to: STORE_ADDRESS,
        amount: total.toString(),
        timestamp: Date.now(),
        status: "confirmed",
        isMock: isMockContract || useTestMode,
      })

      // Clear cart and show success
      clearCart()
      setSuccess(true)
    } catch (err) {
      console.error("Checkout error:", err)
      setError(err.message || "Transaction failed")
    } finally {
      setIsProcessing(false)
    }
  }

  // If checkout was successful
  if (success) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
              Order Confirmed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Your payment has been processed successfully. Thank you for your purchase!
                {(isMockContract || useTestMode) && (
                  <p className="mt-2 text-sm">
                    <strong>Note:</strong> This was a test transaction using simulated PYUSD tokens.
                  </p>
                )}
              </AlertDescription>
            </Alert>

            <div className="text-center mt-6">
              <Link href="/marketplace">
                <Button className="mx-auto">Continue Shopping</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/marketplace">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shopping
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your items before completing your purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <CheckoutSummary items={items} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Complete your purchase with PYUSD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <WalletStatus showBalance />

              {!isConnected ? (
                <ConnectWalletPrompt />
              ) : (
                <>
                  <Separator className="my-4" />
                  {/* Test Mode Toggle */}
                  <div className="flex  items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Test Mode</div>
                      <div className="text-sm text-muted-foreground">Use simulated PYUSD tokens for testing</div>
                    </div>
                    <switch
                      checked={useTestMode || isMockContract}
                      onCheckedChange={toggleTestMode}
                      disabled={isMockContract}
                      />

                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>{total.toFixed(2)} PYUSD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fees:</span>
                      <span>0.00 PYUSD</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{total.toFixed(2)} PYUSD</span>
                    </div>
                  </div>

                  {!hasEnoughBalance && !useTestMode && !isMockContract (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Insufficient Balance</AlertTitle>
                      <AlertDescription>
                        Your PYUSD balance ({Number.parseFloat(balance).toFixed(2)}) is less than the total amount (
                        {total.toFixed(2)}).
                        <p className="mt-2">Enable test mode to complete this purchase with simulated tokens.</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={!isConnected ||( !hasEnoughBalance && !useTestMode && !isMockContract) || isProcessing}
                onClick={handleCheckout}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${total.toFixed(2)} PYUSD${useTestMode || isMockContract ? " (Test)" : ""}`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

