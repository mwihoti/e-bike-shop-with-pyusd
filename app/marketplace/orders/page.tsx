"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { useOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectWalletPrompt } from "@/components/marketplace/connect-wallet-prompt"
import { ShoppingBag, Package, Clock, CheckCircle, Store, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { timeStamp } from "console"


export default function OrdersPage() {
    const { isConnected, account } = useWallet()
    const { orders } = useOrders()
    const [isMounted, setIsMounted] = useState(false)
    const [activeTab, setActiveTab] = useState("all")

    // prevent hydration errors
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return null
    }

    // filter orders by account
    const userOrders = account ? orders.filter((order) => order.address.toLowerCase() === account.toLowerCase()) : []

    // filter orders by status
    const filteredOrders = activeTab === "all" ? userOrders : userOrders.filter((order) => order.status === activeTab)

    // format date
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString()
    }

    // get status badge
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
                    <Badge variant='outline' className="bg-blue-50 text-green-800 border-green-200">
                        <Package className="h-3 w-3 mr-1" />
                        Shipped
                    </Badge>
                )
            case "delivered":
                return (
                    <Badge variant="outline" className="bg-blue-50 text-purple-800 border-purple-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Delivered
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My Orders</h1>

                <Link href="/marketplace">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Back to shop
                    </Button>

                </Link>
            </div>

            {!isConnected ? (
                <Card>
                    <CardContent className="py-8">
                        <ConnectWalletPrompt />
                    </CardContent>
                </Card>
            ) : userOrders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 flex-col items-center justify-center">
                        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
                        <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
                        <Link href="/marketplace">
                            <Button>Start shopping</Button>
                        </Link>
                    </CardContent>

                </Card>
            ) : (
                <>
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
                        <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="processing">Processing</TabsTrigger>
                            <TabsTrigger value="shipped">Shipped</TabsTrigger>
                            <TabsTrigger value="delivered">Delivered</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-6">
                        {filteredOrders.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <p className="text-muted-foreground">No orders found in this category.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredOrders.map((order) => (
                                <Card key={order.id} className="overflow-hiddden">
                                    <CardHeader className="pb-2">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                            <div>
                                                <CardTitle className="text-lg" >Order #{order.id.substring(6, 14)}</CardTitle>
                                                <CardDescription>Placed on {formatDate(order.timeStamp)}</CardDescription>
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
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <div className="flex flex-col gap-4">
                                                    {order.items.slice(0, 3).map((item) => (
                                                        <div key={`${order.id}-${item.id}`} className="flex items-center gap-3">
                                                            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                                                <Image
                                                                    src={item.image || "/placeholder.svg"}
                                                                    alt={item.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {item.quantity} * {item.price.toFixed(2)} PYUSD
                                                                </p>
                                                                </div>
                                                        </div>
                                                    ))}

                                                    {order.items.length > 3 && (
                                                        <p className="text-sm text-muted-foreground">+{order.items.length -3} more items</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-between">
                                                <div>
                                                    <p className="font-medium">Total</p>
                                                    <p className="text-xl font-bold">{order.total.toFixed(2)} PYUSD</p>
                                                </div>
                                                <Link href={`/marketplace/orders/${order.id}`}>
                                                <Button className="w-full mt-4">
                                                    View Order Details
                                                    <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    )
}