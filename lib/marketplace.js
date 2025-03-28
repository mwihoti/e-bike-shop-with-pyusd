// Mock product data
const products = [
    {
        id: "1",
        name: "Premium Headphones",
        description: "High-quality wireless headphones with noise cancellation and premium sound quality.",
        price: 249.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "electronics",
        inStock: true,
        details: [
            "Active noise cancellation",
            "40-hour battery life",
            "Bluetooth 5.0",
            "premium sound quality",
            "comfortable over-ear design"
        ]
    },
    {
        id: "2",
        name: "Smart Watch",
        description: "Track your fitness, receive notifications, and more with this sleek smartwatch.",
        price: 199.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "electronics",
        inStock: true,
        details: [
            "Heart rate monitoring",
            "GPS tracking",
            "Water resistant",
            "7-day battery life",
            "Compatible with iOS and Android",
        ],
    },
    {
        id: "3",
        name: "Leather Wallet",
        description: "Handcrafted genuine leather wallet with RFID protection and multiple card slots.",
        price: 59.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "accessories",
        inStock: true,
        details: ["Genuine leather", "RFID protection", "8 card slots", "2 bill compartments", "Slim design"],
      },
      {
        id: "4",
        name: "Wireless Earbuds",
        description: "Compact wireless earbuds with crystal clear sound and long battery life.",
        price: 129.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "electronics",
        inStock: true,
        details: [
          "True wireless design",
          "24-hour battery with case",
          "Water and sweat resistant",
          "Touch controls",
          "Built-in microphone",
        ],
      },
      {
        id: "5",
        name: "Designer Sunglasses",
        description: "Stylish sunglasses with UV protection and polarized lenses.",
        price: 149.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "accessories",
        inStock: true,
        details: [
          "100% UV protection",
          "Polarized lenses",
          "Durable metal frame",
          "Includes case and cleaning cloth",
          "Unisex design",
        ],
      },
      {
        id: "6",
        name: "Portable Bluetooth Speaker",
        description: "Powerful portable speaker with 360° sound and waterproof design.",
        price: 89.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "electronics",
        inStock: true,
        details: ["360° sound", "Waterproof (IPX7)", "12-hour battery life", "Built-in microphone", "Compact and portable"],
      },
      {
        id: "7",
        name: "Premium Coffee Subscription",
        description: "Monthly delivery of freshly roasted specialty coffee beans from around the world.",
        price: 24.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "subscription",
        inStock: true,
        details: [
          "Freshly roasted beans",
          "Different origin each month",
          "250g bag",
          "Tasting notes included",
          "Free shipping",
        ],
      },
      {
        id: "8",
        name: "Fitness Tracker",
        description: "Track your steps, heart rate, sleep, and more with this advanced fitness band.",
        price: 79.99,
        image: "/placeholder.svg?height=400&width=400",
        category: "electronics",
        inStock: false,
        details: ["Step counting", "Heart rate monitoring", "Sleep tracking", "Water resistant", "7-day battery life"],
      },

]

// Get all products
export function getProducts() {
    return products
}

// Get product by ID
export function getProductById() {
    return products.find((product) => product.id === id)
}

// Get products by category
export function getProductsByCategory(category) {
    if (category === "all") {
        return products
    }
    return products.filter((product) => product.category === category)
}

// Search products
export function searchProducts(query) {
    const searchTerm = query.toLowerCase()
    return products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm) || product.description.toLowerCase().includes(searchTerm),
     )
}