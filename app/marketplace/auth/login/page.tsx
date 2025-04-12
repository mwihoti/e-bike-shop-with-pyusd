"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Github } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signInWithEmail } = useAuth()
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await signInWithEmail(email)

      if (error) {
        setError(error.message)
      } else {
        setMessage("Check your email for the login link!")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-muted-foreground">Enter your email to login to your account</p>
      </div>

      {message && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{message}</div>}

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending link..." : "Send Magic Link"}
        </Button>
      </form>

      <Separator className="my-8" />

      <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={() => signIn("github")} disabled={isLoading}>
          <Github className="mr-2 h-4 w-4" />
          Login with GitHub
        </Button>

        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/marketplace/auth/register" className="font-medium underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}