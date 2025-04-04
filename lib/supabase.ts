import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Create a browswer client for client components
export const createClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

