"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "@/components/marketplace/product-grid"
import { CartSummary } from "@/components/marketplace/cart-summary"
import { WalletStatus } from "@/components/marketplace/wallet-status"
import { useWallet } from "@/hooks/use-wallet"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function MarketplacePage() {
  const { isConnected, balance } = useWallet()
  const { items, itemCount } = useCart()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        

        {/* Main content */}
        <ProductGrid />
      </div>
    </main>
  )
}

