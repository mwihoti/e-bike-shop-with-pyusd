"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { getProductById } from "@/lib/marketplace"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { WalletStatus } from "@/components/marketplace/wallet-status"
import { ArrowLeft, Check, MinusCircle, PlusCircle, ShoppingCart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem, updateItemQuantity, getItem } = useCart()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Get product ID from URL
  const id = params.id

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch product data
  useEffect(() => {
    if (id) {
      const productData = getProductById(id)
      if (productData) {
        setProduct(productData)

        // Check if product is already in cart
        const cartItem = getItem(id)
        if (cartItem) {
          setQuantity(cartItem.quantity)
          setIsAdded(true)
        }
      } else {
        // Product not found, redirect to marketplace
        router.push("/marketplace")
      }
    }
  }, [id, router, getItem])

  if (!isMounted || !product) {
    return null
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
      if (isAdded) {
        updateItemQuantity(id, quantity - 1)
      }
    }
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
    if (isAdded) {
      updateItemQuantity(id, quantity + 1)
    }
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    })
    setIsAdded(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/marketplace">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>
        <WalletStatus />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-lg">
          <div className="relative aspect-square">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">{product.name}</h1>

          <div className="flex items-center mb-4">
            <Badge variant="secondary" className="mr-2">
              {product.category}
            </Badge>
            {product.inStock ? (
              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                In Stock
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                Out of Stock
              </Badge>
            )}
          </div>

          <p className="text-2xl font-bold mb-4 text-primary">{product.price.toFixed(2)} PYUSD</p>

          <p className="text-slate-600 dark:text-slate-300 mb-6">{product.description}</p>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div className="flex items-center">
              <span className="mr-4 font-medium">Quantity:</span>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decreaseQuantity} disabled={quantity <= 1}>
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="mx-4 font-medium">{quantity}</span>
                <Button variant="outline" size="icon" onClick={increaseQuantity}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center">
              <span className="mr-4 font-medium">Total:</span>
              <span className="text-lg font-bold">{(product.price * quantity).toFixed(2)} PYUSD</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1" onClick={handleAddToCart} disabled={!product.inStock || isAdded}>
                {isAdded ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </Button>

              {isAdded && (
                <Link href="/marketplace/checkout" className="flex-1">
                  <Button className="w-full">Proceed to Checkout</Button>
                </Link>
              )}
            </div>
          </div>

          <Card className="mt-8">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Product Details</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {product.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

