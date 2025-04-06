"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { useAuth } from "@/hooks/use-auth"
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

// Create context
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
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { account } = useWallet()
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // Load orders from localStorage or Supabase on mount
  useEffect(() => {
    setIsMounted(true)

    if (typeof window !== "undefined") {
      // If not authenticated, load from localStorage
      if (!isAuthenticated) {
        // Load orders
        const storedOrders = localStorage.getItem("pyusd-orders")
        if (storedOrders) {
          try {
            setOrders(JSON.parse(storedOrders))
          } catch (error) {
            console.error("Failed to parse orders from localStorage:", error)
          }
        }

        // Load reviews
        const storedReviews = localStorage.getItem("pyusd-reviews")
        if (storedReviews) {
          try {
            setReviews(JSON.parse(storedReviews))
          } catch (error) {
            console.error("Failed to parse reviews from localStorage:", error)
          }
        }
      } else {
        // If authenticated, load from Supabase
        fetchOrdersFromSupabase()
        fetchReviewsFromSupabase()
      }
    }
  }, [isAuthenticated, user])

  // Fetch orders from Supabase
  const fetchOrdersFromSupabase = async () => {
    if (!user) return

    try {
      // First, check if the orders table exists
      const { error: checkError } = await createClient().from("orders").select("id").limit(1)

      if (checkError) {
        if (checkError.code === "42P01") {
          console.warn("Orders table does not exist yet. This is normal if you haven't created it.")
          return // Exit gracefully
        }
      }

      // Fetch orders without the nested query first
      const { data: ordersData, error: ordersError } = await createClient()
        .from("orders")
        .select(`
          id,
          total,
          status,
          created_at,
          transaction_hash,
          is_test_purchase,
          tracking_info
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (ordersError) {
        throw ordersError
      }

      // Now fetch order items separately
      const orderIds = ordersData.map((order) => order.id)
      let orderItems = []

      if (orderIds.length > 0) {
        try {
          const { data: itemsData, error: itemsError } = await createClient()
            .from("order_items")
            .select("*")
            .in("order_id", orderIds)

          if (!itemsError) {
            orderItems = itemsData || []
          }
        } catch (error) {
          console.warn("Error fetching order items:", error)
        }
      }

      // Transform data to match our Order type
      const transformedOrders = ordersData.map((order) => ({
        id: order.id,
        total: order.total,
        status: order.status as OrderStatus,
        timestamp: new Date(order.created_at).getTime(),
        address: user.id, // Use user ID as address
        transactionHash: order.transaction_hash,
        isTestPurchase: order.is_test_purchase,
        trackingInfo: order.tracking_info,
        items:
          orderItems
            .filter((item) => item.order_id === order.id)
            .map((item) => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })) || [],
      }))

      setOrders(transformedOrders)
    } catch (error) {
      console.error("Error fetching orders from Supabase:", error)
    }
  }

  // Fetch reviews from Supabase
  const fetchReviewsFromSupabase = async () => {
    if (!user) return

    try {
      // First, check if the reviews table exists
      const { error: checkError } = await createClient().from("reviews").select("id").limit(1)

      if (checkError) {
        if (checkError.code === "42P01" || checkError.status === 404) {
          console.warn("Reviews table does not exist yet. This is normal if you haven't created it.")
          return // Exit gracefully
        }
      }

      const { data: reviewsData, error: reviewsError } = await createClient()
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })

      if (reviewsError) {
        throw reviewsError
      }

      // Transform data to match our ProductReview type
      const transformedReviews = reviewsData.map((review) => ({
        id: review.id,
        productId: review.product_id,
        userAddress: review.user_id,
        rating: review.rating,
        comment: review.comment,
        timestamp: new Date(review.created_at).getTime(),
      }))

      setReviews(transformedReviews)
    } catch (error) {
      console.error("Error fetching reviews from Supabase:", error)
    }
  }

  // Save orders to localStorage when they change
  useEffect(() => {
    if (isMounted && typeof window !== "undefined" && !isAuthenticated) {
      localStorage.setItem("pyusd-orders", JSON.stringify(orders))
    }
  }, [orders, isMounted, isAuthenticated])

  // Save reviews to localStorage when they change
  useEffect(() => {
    if (isMounted && typeof window !== "undefined" && !isAuthenticated) {
      localStorage.setItem("pyusd-reviews", JSON.stringify(reviews))
    }
  }, [reviews, isMounted, isAuthenticated])

  // Add a new order
  const addOrder = (order: Omit<Order, "id">) => {
    const id = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newOrder = { ...order, id }

    // Add to state
    setOrders((prevOrders) => [newOrder, ...prevOrders])

    // If authenticated, save to Supabase
    if (isAuthenticated && user) {
      saveOrderToSupabase(newOrder)
    }

    return id
  }

  // Save order to Supabase
  const saveOrderToSupabase = async (order: Order) => {
    if (!user) return

    try {
      // First, check if the orders table exists
      const { error: checkError } = await createClient().from("orders").select("id").limit(1)

      if (checkError) {
        if (checkError.code === "42P01" || checkError.status === 404) {
          console.warn("Orders table does not exist yet. Using local storage instead.")
          return // Exit gracefully and use localStorage
        }
      }

      // Insert order
      const { error: orderError } = await createClient()
        .from("orders")
        .insert({
          id: order.id,
          user_id: user.id,
          total: order.total,
          status: order.status,
          created_at: new Date(order.timestamp).toISOString(),
          transaction_hash: order.transactionHash,
          is_test_purchase: order.isTestPurchase,
          tracking_info: order.trackingInfo,
        })

      if (orderError) throw orderError

      // Check if order_items table exists
      const { error: checkItemsError } = await createClient().from("order_items").select("id").limit(1)

      if (checkItemsError) {
        if (checkItemsError.code === "42P01" || checkItemsError.status === 404) {
          console.warn("Order_items table does not exist yet. Using local storage for items.")
          return // Exit gracefully for items
        }
      }

      // Insert order items
      const orderItems = order.items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
      }))

      const { error: itemsError } = await createClient().from("order_items").insert(orderItems)

      if (itemsError) throw itemsError
    } catch (error) {
      console.error("Error saving order to Supabase:", error)
    }
  }

  // Get an order by ID
  const getOrder = (id: string) => {
    return orders.find((order) => order.id === id)
  }

  // Update order status
  const updateOrderStatus = (id: string, status: OrderStatus) => {
    // Update in state
    setOrders((prevOrders) => prevOrders.map((order) => (order.id === id ? { ...order, status } : order)))

    // If authenticated, update in Supabase
    if (isAuthenticated && user) {
      updateOrderStatusInSupabase(id, status)
    }
  }

  // Update order status in Supabase
  const updateOrderStatusInSupabase = async (id: string, status: OrderStatus) => {
    try {
      // First, check if the orders table exists
      const { error: checkError } = await createClient().from("orders").select("id").limit(1)

      if (checkError) {
        if (checkError.code === "42P01" || checkError.status === 404) {
          console.warn("Orders table does not exist yet. Using local storage instead.")
          return // Exit gracefully
        }
      }

      const { error } = await createClient().from("orders").update({ status }).eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error updating order status in Supabase:", error)
    }
  }

  // Add a product review
  const addReview = (productId: string, rating: number, comment: string) => {
    if (!account && !user) return

    const userAddress = user?.id || account

    const newReview: ProductReview = {
      id: `review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      productId,
      userAddress,
      rating,
      comment,
      timestamp: Date.now(),
    }

    // Add to state
    setReviews((prevReviews) => [newReview, ...prevReviews])

    // If authenticated, save to Supabase
    if (isAuthenticated && user) {
      saveReviewToSupabase(newReview)
    }
  }

  // Save review to Supabase
  const saveReviewToSupabase = async (review: ProductReview) => {
    if (!user) return

    try {
      // First, check if the reviews table exists
      const { error: checkError } = await createClient().from("reviews").select("id").limit(1)

      if (checkError) {
        if (checkError.code === "42P01" || checkError.status === 404) {
          console.warn("Reviews table does not exist yet. Using local storage instead.")
          return // Exit gracefully
        }
      }

      const { error } = await createClient()
        .from("reviews")
        .insert({
          id: review.id,
          user_id: user.id,
          product_id: review.productId,
          rating: review.rating,
          comment: review.comment,
          created_at: new Date(review.timestamp).toISOString(),
        })

      if (error) throw error
    } catch (error) {
      console.error("Error saving review to Supabase:", error)
    }
  }

  // Get reviews for a product
  const getReviews = (productId: string) => {
    return reviews.filter((review) => review.productId === productId)
  }

  // Check if user has already reviewed a product
  const hasReviewed = (productId: string) => {
    if (!account && !user) return false

    const userAddress = user?.id || account
    return reviews.some((review) => review.productId === productId && review.userAddress === userAddress)
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

