"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Github } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signInWithEmail } = useAuth()

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await signInWithEmail(email)

      if (error) {
        setError(error.message)
      } else {
        setMessage("Check your email for the registration link!")
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
        <h1 className="text-3xl font-bold">Register</h1>
        <p className="text-muted-foreground">Create an account to start using the marketplace</p>
      </div>

      {message && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{message}</div>}

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleEmailRegister} className="space-y-4">
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
          {isLoading ? "Sending link..." : "Register with Email"}
        </Button>
      </form>

      <Separator className="my-8" />

      <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={() => signIn("github")} disabled={isLoading}>
          <Github className="mr-2 h-4 w-4" />
          Register with GitHub
        </Button>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/marketplace/auth/login" className="font-medium underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}