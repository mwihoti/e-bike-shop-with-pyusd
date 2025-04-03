"use client"
import type React from "react"

import { createContext, useContext, useEffect, useState} from 'react'
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname, redirect } from "next/navigation"
import { Session, User} from "@supabase/supabase-js"

type AuthContextType = {
    user: User | null
    session: Session | null
    isLoading: boolean
    signIn: (email: string) => Promise<{error: any}>
    signInWithGoogle: () => Promise<void>
    signInWithGithub: () => Promise<void>
    signOut: () => Promise<void>
    setWalletAddress: (address: string) => Promise<void>
    getWalletAddress: () => string | null
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    signIn: async () => ({ error: null}),
    signInWithGoogle: async () => {},
    signInWithGithub: async () => {},
    signOut: async () => {},
    getWalletAddress: async () => {},
    getWalletAddress: () => null
})


export const AuthProvider = ({ children}: {children: React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const setData = async () => {

            const { data: { session }, error} = await supabase.auth.getSession()

            if (error) {
                console.error(error)
                setIsLoading(false)
                return
            }

            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)

        }

        const { data: {subscription},} = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
        })

        setData()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    // redirect to login if not authenitcated and on protected route
    useEffect(() => {
        if (!isLoading && !user) {
            const protectedRoutes = ["/marketplace", "marketplace/orders", "/marketplace/checkout"]

            // Check if current path is protected
            const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

            if (isProtectedRoute) {
                router.push("/auth/login")
            }
        }
    }, [user, isLoading, pathname, router])


    const signIn = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        return { error }
    }

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            },
        })
    }
    const signInWithGithub = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            },
        })
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push("/auth/login")
    }

    const setWalletAddress = async (address: string) => {
        if (!user) return

        // store wallet address in user metadata
        await supabase.auth.updateUser({
            data: { wallet_address: address},
        })
    }

    const getWalletAddress = (): string | null => {
        if (!user || !user.user_metadata) return null
        return (user.user_metadata.wallet_address as string) || null
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                signIn,
                signInWithGithub,
                signInWithGoogle,
                signOut,
                setWalletAddress,
                getWalletAddress
            }}
            > {children} </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)