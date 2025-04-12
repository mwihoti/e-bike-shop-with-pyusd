"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Github, AlertCircle } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const { signIn, signInWithGoogle, signInWithGithub} = useAuth()


    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const { error } = await signIn(email)

            if (error) {
                setError(error.message)
            } else {
                setSuccessMessage(`Magic link sent to ${email}. Please check your inbox to complete registration.`)
                setEmail("")
            }
        } catch (err: any) {
            setError(err.message || "Failed to send registration link")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900  dark:to-slate-800 p-4">
             <div className="text-center mb-8">
                      <div className="flex justify-center mb-4">
                        <Image
                          src="/retailer.png"
                          alt="PYUSD Marketplace"
                          width={80}
                          height={80}
                          className="rounded-full"
                        />
                      </div>
                      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">PYUSD Marketplace</h1>
                      <p className="text-slate-600 dark:text-slate-300 mt-2">Login to access the marketplace</p>
                    </div>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                    <CardDescription className="text-center">Register to access the PYUSD Marketplace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert className="bg-green-50 text-green-800 border-green-200">
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleEmailRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending link...
                                </>
                            ) : (
                                <>
                                <Mail className="mr-2 h-4 w-4" />
                                Continue with Email
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Button variant="outline" onClick={() => signInWithGoogle()} type="button">
                            <FcGoogle className="mr-2 h-5 w-5" />
                            Google
                        </Button>
                        <Button vsriant="outline" onClick={() => signInWithGithub()} type="button">
                            <Github className="mr-2 h-5 w-5"/>
                            Github
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/marketplace/auth/login" className="text-primary font-medium">
                    Log in </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}