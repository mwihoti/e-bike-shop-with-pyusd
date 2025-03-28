import { createContext, useContext, useState, useEffect } from "react"


// cart context
const CartContext = createContext({})

// cart provider
export function CartProvider({ children }) {
    const [items, setItems] = useState([])
    const [isMounted, setIsMounted] = useState(false)

    // Load cart from local storage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedCart = localStorage.getItem("pyusd-cart")
            if (storedCart) {
                try {
                    setItems(JSON.parse(storedCart))
                } catch (error) {
                    console.error("Failed to parse cart from localstorage:", error)
                    setItems([])
                }
            }
            setIsMounted(true)
        }
    }, [])

    // save cart to local storage when it changes
    useEffect(() => {
        if (isMounted && typeof window !== "undefined") {
            localStorage.setItem("pyusd-cart", JSON.stringify(items))

        }
    }, [items, isMounted])

    // Add items to cart
    const addItem = (item) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id)

            if (existingItem) {
                return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity}: i))
            } else {
                // add new item
                return  [...prevItems, item]
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

    // update item quantity
    const updateItemQuantity = (id, quantity) => {
        setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity} : item)))
    }

    // clear cart
    const clearCart = () => {

        setItems([])
    }

    // Get item from cart
    const getItem = (id) => {
        return items.find((item) => item.id === id)
    }

    // calculate total price
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // count total items
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
                itemCount
            }}>
                {children}
            </CartContext.Provider>
    )
}

// Hook to use cart context

export function useCart() {
    return useContext(CartContext)
}