import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { getSession } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function MarketplaceLayout({
  children,
}: {
  children: ReactNode
}) {
  // Get the user's session using the server client
  const session = await getSession()

  // Check if the path is an auth path
  const cookieStore = await cookies()
  const isAuthPath = cookieStore.get("next-url")?.value?.includes("/marketplace/auth") || false

  // If the user is not authenticated and not on an auth path, redirect to login
  if (!session && !isAuthPath) {
    redirect("/marketplace/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {session && <MarketplaceHeader />}
      {children}
    </div>
  )
}

