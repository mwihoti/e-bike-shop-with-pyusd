"use client"

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CartItem } from "@/components/marketplace/cart-item"
import { ShoppingBag, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"


export function CartSummary() {
    const {items, total, itemCount, clearCart} = useCart()
    const [isMounted, setIsMounted] = useState(false)


    // prevent hydration errors
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between py-4">
                    <h2 className="text-lg font-semibold flex items-center">

                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Your Cart
                    </h2>
                </div>
                <Separator />
                <div className="flex-1 py-8 flex items-center justify-center">
                    <p>Loading cart...</p>
                </div>
            </div>
        )
    }
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-4">
                <h2 className="text-lg font-semibold flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5"/>
                    YourCart
                </h2>
                {itemCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                        Clear Cart
                    </Button>
                )}
            </div>

            <Separator />
            {itemCount === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground mb-4">Your cart is empty</p>
                    <Link href="/marketplace">
                    <Button>Browse products</Button>
                    </Link>

                    </div>

            ) : (
                <>
                <ScrollArea className="flex-1 py-4">
                    <div className="space-y-4">
                        {items.map((item) => (
                            <CartItem key={item.id} item={item} />
                        ))}
                    </div>
                </ScrollArea>

                <div className="pt-4">
                    <Separator className="mb-4" />

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-medium">Subtotal:</span>
                            <span>{total.toFixed(2)} PYUSD</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Shipping:</span>
                            <span>Free</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>{total.toFixed(2)} PYUSD</span>
                        </div>
                    </div>

                    <Link href="/marketplace/checkout">
                    <Button className="w-full mt-4">Checkout</Button>
                    </Link>
                </div>
                </>
            )}
        </div>
    )
}