"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Cart context
const CartContext = createContext({})

// Cart provider
export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isMounted, setIsMounted] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCart = localStorage.getItem("pyusd-cart")
      if (storedCart) {
        try {
          setItems(JSON.parse(storedCart))
        } catch (error) {
          console.error("Failed to parse cart from localStorage:", error)
          setItems([])
        }
      }
      setIsMounted(true)
    }
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem("pyusd-cart", JSON.stringify(items))
    }
  }, [items, isMounted])

  // Add item to cart
  const addItem = (item) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity } : i))
      } else {
        // Add new item
        return [...prevItems, item]
      }
    })

    // Force update localStorage
    if (typeof window !== "undefined" && isMounted) {
      setTimeout(() => {
        const currentItems = [...items, item]
        localStorage.setItem("pyusd-cart", JSON.stringify(currentItems))
      }, 0)
    }
  }

  // Remove item from cart
  const removeItem = (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  // Update item quantity
  const updateItemQuantity = (id, quantity) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  // Clear cart
  const clearCart = () => {
    setItems([])
  }

  // Get item from cart
  const getItem = (id) => {
    return items.find((item) => item.id === id)
  }

  // Calculate total price
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Count total items
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        getItem,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook to use cart context
export function useCart() {
  return useContext(CartContext)
}

