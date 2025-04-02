"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { useOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, Package, Clock, CheckCircle, Store, ArrowLeft, Star, Truck, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProductReviewForm } from "@/components/marketplace/product-review-form"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected, account } = useWallet()
  const { getOrder } = useOrders()
  const [order, setOrder] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Get order ID from URL
  const id = params.id

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch order data
  useEffect(() => {
    if (isMounted && id) {
      const orderData = getOrder(id)
      if (orderData) {
        setOrder(orderData)
      } else {
        // Order not found, redirect to orders page
        router.push("/marketplace/orders")
      }
    }
  }, [id, router, getOrder, isMounted])

  if (!isMounted || !order) {
    return null
  }

  // Check if this order belongs to the current user
  const isUserOrder = account && order.address.toLowerCase() === account.toLowerCase()

  if (!isConnected || !isUserOrder) {
    router.push("/marketplace/orders")
    return null
  }

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString()
  }

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <Package className="h-3 w-3 mr-1" />
            Shipped
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/marketplace/orders">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Order #{order.id.substring(6, 14)}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Placed on {formatDate(order.timestamp)}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  {order.isTestPurchase && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                      Test Purchase
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.id}`} className="flex items-start gap-4 p-3 rounded-md border">
                        <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/marketplace/${item.id}`} className="hover:underline">
                            <h4 className="font-medium">{item.name}</h4>
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {item.price.toFixed(2)} PYUSD
                          </p>
                          <p className="font-medium mt-1">{(item.quantity * item.price).toFixed(2)} PYUSD</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setSelectedProduct(item)}
                        >
                          <Star className="h-3 w-3" />
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p>PYUSD</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Hash</p>
                      <p className="font-mono text-sm break-all">{order.transactionHash}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Order Timeline</h3>
                  <div className="space-y-4">
                    {order.trackingInfo?.updates?.map((update, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {update.status === "Order Placed" ? (
                            <ShoppingBag className="h-5 w-5 text-blue-500" />
                          ) : update.status.includes("Shipped") ? (
                            <Truck className="h-5 w-5 text-amber-500" />
                          ) : update.status.includes("Delivered") ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">{update.status}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(update.timestamp)} at {formatTime(update.timestamp)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{order.total.toFixed(2)} PYUSD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span>Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{order.total.toFixed(2)} PYUSD</span>
                </div>
              </div>

              {order.trackingInfo && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Information</h3>
                    {order.trackingInfo.carrier && (
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Carrier:</span>
                        <span>{order.trackingInfo.carrier}</span>
                      </div>
                    )}
                    {order.trackingInfo.trackingNumber && (
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Tracking #:</span>
                        <span className="font-mono">{order.trackingInfo.trackingNumber}</span>
                      </div>
                    )}
                    {order.trackingInfo.estimatedDelivery && (
                      <div className="flex items-center gap-1 mt-2 p-2 bg-muted rounded-md">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Estimated delivery: <strong>{order.trackingInfo.estimatedDelivery}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Link href="/marketplace" className="w-full">
                <Button variant="outline" className="w-full">
                  <Store className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/marketplace/orders" className="w-full">
                <Button variant="secondary" className="w-full">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  View All Orders
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Product Review Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Review Product</CardTitle>
              <CardDescription>Share your experience with {selectedProduct.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductReviewForm product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

