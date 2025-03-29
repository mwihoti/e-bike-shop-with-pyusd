import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Define types for cart items
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// Define the cart context type
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (id: string) => CartItem | undefined;
  total: number;
  itemCount: number;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateItemQuantity: () => {},
  clearCart: () => {},
  getItem: () => undefined,
  total: 0,
  itemCount: 0
});

interface CartProviderProps {
  children: ReactNode;
}

// Cart provider
export function CartProvider({ children }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isMounted, setIsMounted] = useState(false);

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
    const addItem = (item: CartItem) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id)

            if (existingItem) {
                return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity}: i))
            } else {
                // add new item
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
    const removeItem = (id: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== id))
    }

    // update item quantity
    const updateItemQuantity = (id: string, quantity: number) => {
        setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity}: item)))
    }

    // clear cart
    const clearCart = () => {
        setItems([])
    }

    // Get item from cart
    const getItem = (id: string): CartItem | undefined => {
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