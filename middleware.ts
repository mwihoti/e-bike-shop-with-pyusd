import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client using the new ssr package
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  // Refresh session if expired
  await supabase.auth.getSession()

  // Store the current URL in a cookie for redirects after auth
  const url = request.nextUrl.clone()
  response.cookies.set("next-url", url.pathname)

  // Check if the user is authenticated for protected routes
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the path is an auth path
  const isAuthPath =
    url.pathname.startsWith("/marketplace/auth") ||
    url.pathname === "/marketplace/auth/login" ||
    url.pathname === "/marketplace/auth/register" ||
    url.pathname === "/marketplace/auth/callback"

  // If the user is not authenticated and trying to access a protected route
  if (!session && url.pathname.startsWith("/marketplace") && !isAuthPath) {
    const redirectUrl = new URL("/marketplace/auth/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

