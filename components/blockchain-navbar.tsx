"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Store, FileSearch, BarChart2, Wallet, ShoppingBag, Settings, Sun, Moon, Database, Shield, Menu, X,   ShoppingCart, User, LogOut, Activity, Import } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WalletStatus } from "./marketplace/wallet-status"
import { CartSummary } from "@/components/marketplace/cart-summary"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "./theme-provider"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"

const navItems = [
  { id: "home", name: "Home", href: "/", icon: Home },
  { id: "marketplace", name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { id: "wallet", name: "Wallet", href: "/", icon: Wallet },
  { id: "explorer", name: "Explorer", href: "/explorer", icon: FileSearch },
  { id: "analytics", name: "Analytics", href: "/analytics", icon: BarChart2 },
  {id: "monitoring", name: "Monitoring", href: "/monitoring", icon: Activity},
  { id: "diagnostics", name: "Diagnostics", href: "/diagnostics", icon: Settings },
]

export function BlockchainNavbar() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
    const { itemCount } = useCart()
      const { user, signOut } = useAuth()
      const {theme, setTheme} = useTheme()
    


  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null
  const isDarkMode = theme === "dark"
  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
          <Image 
              src="/retailer.png" 
              alt="PYUSD Logo" 
              width={24} 
              height={24}
              className="h-10 w-10 ml-10"
            />
            <span className="font-bold">PYUSD dApp</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Mobile navigation */}
        {isOpen && (
          <div className="fixed inset-0 top-14 z-50 grid h-[calc(100vh-3.5rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-top md:hidden bg-background">
            <div className="relative z-20 grid gap-6 p-4 rounded-md">
              <nav className="grid grid-flow-row auto-rows-max text-sm">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center p-2 rounded-md hover:bg-accent",
                        isActive ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
                   {/* Theme toggle in mobile menu */}
                   <div className="flex items-center p-2 rounded-md hover:bg-accent">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      {isDarkMode ? <Moon className="h-5 w-5 mr-3" /> : <Sun className="h-5 w-5 mr-3" />}
                      <span>Theme</span>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      aria-label="Toggle theme"
                    />
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}

<div className="flex items-center gap-4">
            <WalletStatus />
          
          
        

        </div>
        <div className="ml-auto flex items-center space-x-4">
          {/* Theme toggle for desktop */}
          <div className="hidden md:flex items-center space-x-2 mr-2">
            <div className="flex items-center space-x-2">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Toggle theme"
              />
            </div>
          </div>

        <div className="ml-auto flex items-center space-x-4">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Shield className="h-4 w-4 mr-2" />
            <span>Secured by GCP</span>
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}