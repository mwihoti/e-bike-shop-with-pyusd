"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, FileSearch, BarChart2, Wallet, ShoppingBag, Settings, Database, Shield, Menu, X } from "lucide-react"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Wallet", href: "/", icon: Wallet },
  { name: "Explorer", href: "/explorer", icon: FileSearch },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Diagnostics", href: "/diagnostics", icon: Settings },
]

export function BlockchainNavbar() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
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
                key={item.href}
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
                      key={item.href}
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
              </nav>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center space-x-4">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Shield className="h-4 w-4 mr-2" />
            <span>Secured by GCP</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
