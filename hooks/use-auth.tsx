"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (provider: "google" | "github") => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signOut: async () => {},
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Redirect unauthenticated users from protected routes
  useEffect(() => {
    if (!isLoading && !user) {
      const isProtectedRoute =
        pathname?.startsWith("/marketplace") &&
        !pathname?.startsWith("/marketplace/auth") &&
        pathname !== "/marketplace/auth/login" &&
        pathname !== "/marketplace/auth/register"

      if (isProtectedRoute) {
        router.push("/marketplace/auth/login")
      }
    }
  }, [user, isLoading, pathname, router])

  // Sign in with OAuth provider
  // Update the signIn function to use the current origin
const signIn = async (provider: "google" | "github") => {
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/marketplace/auth/callback`,
    },
  })
}

// Update the signInWithEmail function to use the current origin
const signInWithEmail = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/marketplace/auth/callback`,
    },
  })

  return { error }
}

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/marketplace/auth/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signInWithEmail,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

