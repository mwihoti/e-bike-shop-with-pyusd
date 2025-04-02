"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect} from "react"
import { useWallet } from "./use-wallet"

// Order status types

export type OrderStatus = "processing" | "shipped" | "delivered" | "completed"

// order item type
export type OrderItem = {
    id: string
    name: string
    price: number
    quantity: number 
    image: string
}

// order type
export type Order = {
    id: string
    items: OrderItem[]
    total: number
    status: OrderStatus
    timeStamp: number
    address: string
    transactionHash: string
    isTestPurchase: boolean
    trackingInfo?: {
        carrier?: string
        trackingNumber?: string
        estimatedDelivery?: string
        updates?: {
            status: string
            timestamp: number
            message: string
        }[]
    }
}

// context type
type OrdersContextType = {
    orders: Order[]
    addOrder: (order: Omit<Order, "id">) => string
    getOrder: (id: string) => Order | undefined
    updateOrderStatus: (id: string, status: OrderStatus) => void
    addReview: (productId: string, rating: number, comment: string) => void
    getReviews: (productId: string) => ProductReview[]
    hasReviewed: (productId: string) => boolean
}

// Product review type

export type ProductReview = {
    id: string
    productId: string
    userAddress: string
    rating: number
    comment: string
    timestamp: number
}

// create context
const OrdersContext = createContext<OrdersContextType>({
    orders: [],
    addOrder: () => "",
    getOrder: () => undefined,
    updateOrderStatus: () => {},
    addReview: () => {},
    getReviews: () => [],
    hasReviewed: () => false,
})

// Provider component
export function OrdersProvider({ children }: { children: React.ReactNode} ) {
    const { account } = useWallet()
    const [orders, setOrders] = useState<Order[]>([])
    const [reviews, setReviews] = useState<ProductReview[]>([])
    const [isMounted, setIsMounted] = useState(false)

    // load orders from localStorage on mount
    useEffect(() => {
        setIsMounted(true)
        
        if (typeof window !== "undefined") {
            // load orders
            const storedOrders = localStorage.getItem("pyusd-orders")
            if (storedOrders) {
                try {
                    setOrders(JSON.parse(storedOrders))
                } catch (error) {
                    console.error("Failed to parse orders from localStorage:", error)
                }
            }

            // load reviews
            const storedReviews = localStorage.getItem("pyusd-reviews")
            if (storedReviews) {
                try {
                    setReviews(JSON.parse(storedReviews))
                } catch (error) {
                    console.error("Failed to parse storedReviews from localStorage:", error)
                }
            }
        }
    }, [])

    // save orders to localStorage when they change
    useEffect(() => {
        if (isMounted && typeof window !== "undefined") {
            localStorage.setItem("pyusd-orders", JSON.stringify(orders))
        }
    }, [orders, isMounted])


    // save reviews to localStorage when they change
    useEffect(() => {
        if (isMounted && typeof window !== "undefined") {
            localStorage.setItem("pyusd-reviews", JSON.stringify(reviews))
        }
    }, [reviews, isMounted])

    // Add a new order
    const addOrder = (order: Omit<Order, "id">) => {
        const id = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newOrder = { ...order, id}

        setOrders((prevOrders) => [newOrder, ...prevOrders])
        return id
    }

    // Get an order by id
    const getOrder = ( id: string) => {
        return orders.find((order) => order.id === id)
    }

    // update order status
    const updateOrderStatus = (id: string, status: OrderStatus) => {
        setOrders((prevOrders) => prevOrders.map((order) => (order.id === id ? {
            ...order, status } : order)))
    }

    // Add a product review
    const addReview = (productId: string, rating: number, comment: string) => {
        if (!account) return

        const newReview: ProductReview = {
            id: `review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            productId,
            userAddress: account,
            rating,
            comment,
            timestamp: Date.now()
        }
        setReviews((prevReviews) => [newReview, ...prevReviews])
    }

    // Get reviews for a product
    const getReviews = (productId: string) => {
        return reviews.filter((review) => review.productId === productId )
    }

    // check if user has already reviewed the product
    const hasReviewed = (productId: string) => {
        if (!account) return false
        return reviews.some((review) => review.productId === productId && review.userAddress === account)
    }

    return (
        <OrdersContext.Provider
            value={{
                orders,
                addOrder,
                getOrder,
                updateOrderStatus,
                addReview,
                getReviews,
                hasReviewed,
            }}
            >
                {children}
            </OrdersContext.Provider>
    )
}


// Hook to use orders context
export function useOrders() {
    return useContext(OrdersContext)
}
