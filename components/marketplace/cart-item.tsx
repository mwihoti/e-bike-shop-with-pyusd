'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ShoppingCart, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"

export function ProductCard({ product}) {
    const { addItem } = useCart()

    const handleAddToCart = (e) => {
        e.preventDefault() // Prevent navigation
        e.stopPropagation() // Stop event propagation

        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
        })
    }

    return (

        <Card className="over-flow-hidden transition-all hover:shadow-md">
            <Link href={`/marketplace/${product.id}`}>
            <div className="relative aspect-square">
                <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform hover:scale-105"/>
            </div>
            </Link>

            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <Link href={`/marketplace/${product.id}`} className="hover:underline">
                    <h3 className="font-semibold  text-lg line-clamp-1">{product.name}</h3>
                    </Link>
                    <Badge variant="secondary">{product.category}</Badge>
                </div>

                <p className="text-primary font-bold">{product.price.toFixed(2)} PYUSD</p>
                <p className="text-sm text-muted--foreground line-clamp-2 mt-2">{product.description}</p>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" className="w-full" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4"/>
                    Add to Cart
                </Button>
                <Link href={`/marketplace/${product.id}`} className="w-full">
                <Button variant="secondary" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                </Button>

                </Link>

            </CardFooter>
        </Card>
    )
}