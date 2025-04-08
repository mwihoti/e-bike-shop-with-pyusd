"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, Check, Wallet } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const { account, isConnected, connectWallet } = useWallet()
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wallets, setWallets] = useState<any[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load user profile data
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "")
      fetchWallets()
    }
  }, [user])

  // Fetch user's wallets
  const fetchWallets = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setWallets(data || [])
    } catch (err) {
      console.error("Error fetching wallets:", err)
    }
  }

  // Save wallet address
  const saveWalletAddress = async () => {
    if (!user || !account) return

    try {
      const supabase = createClient()
      // Check if wallet already exists
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("address", account)
        .single()

      if (existingWallet) {
        // Wallet already exists, no need to save
        return
      }

      // Save new wallet
      const { error } = await supabase.from("wallets").insert({
        user_id: user.id,
        address: account,
        is_primary: wallets.length === 0, // Make primary if first wallet
      })

      if (error) throw error

      // Refresh wallets list
      fetchWallets()
    } catch (err) {
      console.error("Error saving wallet:", err)
    }
  }

  // Set wallet as primary
  const setPrimaryWallet = async (walletId: string) => {
    if (!user) return

    try {
      const supabase = createClient()
      // First, set all wallets to non-primary
      await supabase.from("wallets").update({ is_primary: false }).eq("user_id", user.id)

      // Then set the selected wallet as primary
      const { error } = await supabase.from("wallets").update({ is_primary: true }).eq("id", walletId)

      if (error) throw error

      // Refresh wallets list
      fetchWallets()
    } catch (err) {
      console.error("Error setting primary wallet:", err)
    }
  }

  // Update profile
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setIsSaved(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })

      if (error) throw error

      // Also update the profile in the profiles table
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user?.id as string,
        full_name: fullName,
        email: user?.email as string,
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || "An error occurred while updating your profile")
    } finally {
      setIsLoading(false)
    }
  }

  // Connect wallet and save to database
  const handleConnectWallet = async () => {
    try {
      await connectWallet()
      // The wallet connection state will update, and the useEffect will trigger saveWalletAddress
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
    }
  }

  // Save wallet when connected
  useEffect(() => {
    if (isConnected && account && user) {
      saveWalletAddress()
    }
  }, [isConnected, account, user])

  if (!isMounted || authLoading) {
    return null
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || "User"} />
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <CardTitle>{user?.user_metadata?.full_name || user?.email}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium">
                    {user?.app_metadata?.provider === "email" ? "Email" : user?.app_metadata?.provider}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{new Date(user?.created_at || "").toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="wallets">Wallets</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={updateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled />
                      <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : isSaved ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallets" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Wallets</CardTitle>
                  <CardDescription>Manage your connected Ethereum wallets</CardDescription>
                </CardHeader>
                <CardContent>
                  {wallets.length === 0 ? (
                    <div className="text-center py-6">
                      <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No wallets connected yet</p>
                      <Button onClick={handleConnectWallet}>Connect Wallet</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-mono text-sm">
                              {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                            </div>
                            <div className="flex items-center mt-1">
                              {wallet.is_primary && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-800 border-green-200"
                                >
                                  Primary
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground ml-2">
                                Added on {new Date(wallet.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {!wallet.is_primary && (
                            <Button variant="outline" size="sm" onClick={() => setPrimaryWallet(wallet.id)}>
                              Set as Primary
                            </Button>
                          )}
                        </div>
                      ))}

                      <Separator className="my-4" />

                      <Button onClick={handleConnectWallet}>Connect Another Wallet</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

