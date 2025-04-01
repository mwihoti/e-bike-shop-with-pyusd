"use client"

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Trash, MinusCircle, PlusCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function CartItem({ item }) {
  const { updateItemQuantity, removeItem } = useCart()

  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      updateItemQuantity(item.id, item.quantity - 1)
    } else {
      removeItem(item.id)
    }
  }

  const increaseQuantity = () => {
    updateItemQuantity(item.id, item.quantity + 1)
  }

  return (
    <div className="flex items-start space-x-4">
      <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/marketplace/${item.id}`} className="hover:underline">
          <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
        </Link>
        <p className="text-sm text-muted-foreground">{item.price.toFixed(2)} PYUSD</p>

        <div className="flex items-center mt-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={decreaseQuantity}>
            <MinusCircle className="h-4 w-4" />
          </Button>
          <span className="mx-2 text-sm">{item.quantity}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={increaseQuantity}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  )
}

