"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase"

// Order status types
export type OrderStatus = "processing" | "shipped" | "delivered" | "completed"

// Order item type
export type OrderItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

// Order type
export type Order = {
  id: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  timestamp: number
  address: string
  transactionHash: string
  isTestPurchase: boolean
  userId: string
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

// Context type
type OrdersContextType = {
  orders: Order[]
  addOrder: (order: Omit<Order, "id" | "userId">) => Promise<string>
  getOrder: (id: string) => Order | undefined
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>
  addReview: (productId: string, rating: number, comment: string) => Promise<void>
  getReviews: (productId: string) => ProductReview[]
  hasReviewed: (productId: string) => boolean
}

// Product review type
export type ProductReview = {
  id: string
  productId: string
  userAddress: string
  userId: string
  rating: number
  comment: string
  timestamp: number
}

// Create context
const OrdersContext = createContext<OrdersContextType>({
  orders: [],
  addOrder: async () => "",
  getOrder: () => undefined,
  updateOrderStatus: async () => {},
  addReview: async () => {},
  getReviews: () => [],
  hasReviewed: () => false,
})

// Provider component
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { account } = useWallet()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const supabase = createClient()

  // Fetch orders from Supabase on mount
  useEffect(() => {
    setIsMounted(true)

    const fetchOrders = async () => {
      if (!user) return

      try {
        // Fetch orders from Supabase
        const { data: ordersData, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching orders from Supabase:", error)
          return
        }

        if (ordersData) {
          // Format the orders
          const formattedOrders = ordersData.map((order) => ({
            id: order.id,
            items: JSON.parse(order.items),
            total: order.total,
            status: order.status as OrderStatus,
            timestamp: new Date(order.created_at).getTime(),
            address: order.wallet_address,
            transactionHash: order.transaction_hash,
            isTestPurchase: order.is_test_purchase,
            userId: order.user_id,
            trackingInfo: order.tracking_info ? JSON.parse(order.tracking_info) : undefined,
          }))

          setOrders(formattedOrders)
        }

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("product_reviews")
          .select("*")
          .order("created_at", { ascending: false })

        if (reviewsError) {
          console.error("Error fetching reviews from Supabase:", reviewsError)
          return
        }

        if (reviewsData) {
          // Format the reviews
          const formattedReviews = reviewsData.map((review) => ({
            id: review.id,
            productId: review.product_id,
            userAddress: review.wallet_address,
            userId: review.user_id,
            rating: review.rating,
            comment: review.comment,
            timestamp: new Date(review.created_at).getTime(),
          }))

          setReviews(formattedReviews)
        }
      } catch (err) {
        console.error("Error in order fetching:", err)
      }
    }

    if (isMounted && user) {
      fetchOrders()
    }
  }, [user, isMounted])

  // Add a new order
  const addOrder = async (order: Omit<Order, "id" | "userId">) => {
    if (!user) {
      throw new Error("User must be authenticated to create an order")
    }

    try {
      // Insert order into Supabase
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          items: JSON.stringify(order.items),
          total: order.total,
          status: order.status,
          wallet_address: order.address,
          transaction_hash: order.transactionHash,
          is_test_purchase: order.isTestPurchase,
          tracking_info: order.trackingInfo ? JSON.stringify(order.trackingInfo) : null,
        })
        .select()

      if (error) {
        console.error("Error creating order in Supabase:", error)
        throw error
      }

      const newOrderId = data[0].id

      // Add the order to the local state
      const newOrder = {
        ...order,
        id: newOrderId,
        userId: user.id,
      }

      setOrders((prevOrders) => [newOrder, ...prevOrders])

      return newOrderId
    } catch (err) {
      console.error("Error adding order:", err)
      throw err
    }
  }

  // Get an order by ID
  const getOrder = (id: string) => {
    return orders.find((order) => order.id === id)
  }

  // Update order status
  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      // Update order in Supabase
      const { error } = await supabase.from("orders").update({ status }).eq("id", id)

      if (error) {
        console.error("Error updating order status in Supabase:", error)
        throw error
      }

      // Update local state
      setOrders((prevOrders) => prevOrders.map((order) => (order.id === id ? { ...order, status } : order)))
    } catch (err) {
      console.error("Error updating order status:", err)
      throw err
    }
  }

  // Add a product review
  const addReview = async (productId: string, rating: number, comment: string) => {
    if (!user || !account) return

    try {
      // Insert review into Supabase
      const { data, error } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          wallet_address: account,
          rating,
          comment,
        })
        .select()

      if (error) {
        console.error("Error creating review in Supabase:", error)
        throw error
      }

      const reviewId = data[0].id

      // Add to local state
      const newReview: ProductReview = {
        id: reviewId,
        productId,
        userAddress: account,
        userId: user.id,
        rating,
        comment,
        timestamp: Date.now(),
      }

      setReviews((prevReviews) => [newReview, ...prevReviews])
    } catch (err) {
      console.error("Error adding review:", err)
      throw err
    }
  }

  // Get reviews for a product
  const getReviews = (productId: string) => {
    return reviews.filter((review) => review.productId === productId)
  }

  // Check if user has already reviewed a product
  const hasReviewed = (productId: string) => {
    if (!user) return false
    return reviews.some((review) => review.productId === productId && review.userId === user.id)
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

