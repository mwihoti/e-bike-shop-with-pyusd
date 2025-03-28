"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "@/components/marketplace/product-grid"
import { CartSummary } from "@/components/marketplace/cart-summary"
import { WalletStatus } from "@/components/marketplace/wallet-status"
import { useWallet } from "@/hooks/use-wallet"
//import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"


export default function MarketPlacePage() {
    const { isConnected, balance} = useWallet()
    ///const { items, itemCount} = useCart()
    const [isMounted, setIsMounted] = useState(false)

    // prevent hydration errors
    useEffect(() => {
        setIsMounted(true)
    }, [])
    if (!isMounted) {
        return null
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-6">
                {/*header*/}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <div className="flex items-center mb-4 md:mb-0">
                        <Store className="h-6 w-6 mr-2 text-primary" />
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">PYUSD Marketplace</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <WalletStatus />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="relative">
                                    <ShoppingCart className="h-5 w-5 mr-2"/>
                                    Cart
                                    {itemCount > 0 && <Badge className="absolute -top-2 right-2 px-2 py-1 text-xs">{itemCount}</Badge>}
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <CartSummary />
                            </SheetContent>
                        </Sheet>
                        <Link href="/">
                        <Button variant="ghost">Home</Button></Link>
                    </div>
                </div>
                {/* Main content */}
                <ProductGrid />
            </div>
        </main>
    )
}