"use client"
import { useState } from "react"
import { ProductCard } from "@/components/marketplace/product-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProducts } from "@/lib/marketplace"
import { Search } from "lucide-react"

export function ProductGrid() {
    const products = getProducts()
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [sortOption, setSortOption] = useState("featured")

    // Get unique categories
    const categories = ["all", ...new Set(products.map((product) => product.category))]

    // Filter products
    const filteredProducts = products.filter((product) => {
        // search filter
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase())

        // Category filter
        const matchesCategory = categoryFilter === "all" || product.category === categoryFilter

        return matchesSearch && matchesCategory
    })

    // sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortOption) {
            case "price-low":
                return a.price - b.price
            case "price-high":
                return b.price - a.price
            case "name":
                return a.name.localeCompare(b.name)
            default:
                return 0

        }
    })
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-forground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} />

                </div>
                <div className="flex gap-4">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
                </div>
            </div>
            {sortedProducts.length === 0 ? (
                <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground">No products found</p>
                    </div>
            ): (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grod-cols-3 lg:grid-cols-4 gap-6">
                    {sortedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    </div>
            )}
        </div>
    )
}