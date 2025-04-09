"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle, Lock, Shield, Eye, EyeOff } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

export function PrivacyFeatures() {
  const { account } = useWallet()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proof, setProof] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("generate")

  // Set the from address to the connected wallet address
  useState(() => {
    if (account) {
      setFrom(account)
    }
  })

  const generateProof = async () => {
    if (!from || !to || !amount || !privateKey) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, amount, privateKey }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate proof")
      }

      const data = await response.json()
      setProof(data)
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the proof")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>PYUSD Privacy Features</CardTitle>
        <CardDescription>
          Generate zero-knowledge proofs for PYUSD transfers using GCP's computational power
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="generate">
              <Lock className="h-4 w-4 mr-2" />
              Generate Proof
            </TabsTrigger>
            <TabsTrigger value="verify">
              <Shield className="h-4 w-4 mr-2" />
              Verify Proof
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">From Address</label>
                  <Input placeholder="0x..." value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">To Address</label>
                  <Input placeholder="0x..." value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Amount (PYUSD)</label>
                <Input
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Private Key (for signing only)</label>
                <div className="relative">
                  <Input
                    placeholder="Enter your private key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    type={isPrivateKeyVisible ? "text" : "password"}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setIsPrivateKeyVisible(!isPrivateKeyVisible)}
                  >
                    {isPrivateKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your private key is only used locally to sign the proof and is never sent to the server.
                </p>
              </div>

              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  This is a simplified demonstration of zero-knowledge proofs. In a production environment, we would use
                  a proper ZK library like snarkjs and never require your private key.
                </AlertDescription>
              </Alert>

              <Button
                onClick={generateProof}
                disabled={isGenerating || !from || !to || !amount || !privateKey}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Proof...
                  </>
                ) : (
                  "Generate Zero-Knowledge Proof"
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {proof && (
                <div className="space-y-4">
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>Zero-knowledge proof generated successfully!</AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-semibold mb-2">Proof Details</h4>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="font-medium">Public Inputs:</div>
                        <div className="font-mono text-xs break-all">{JSON.stringify(proof.publicInputs, null, 2)}</div>

                        <Separator className="my-2" />

                        <div className="font-medium">Proof:</div>
                        <div className="font-mono text-xs break-all">{proof.proof.substring(0, 64)}...</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">How to Use This Proof</h4>
                    <p className="text-sm text-muted-foreground">
                      This proof can be used to verify that you have authorized a transfer of {amount} PYUSD to the
                      recipient without revealing your private key. In a real implementation, this proof would be
                      submitted to a smart contract that verifies the proof and executes the transfer if valid.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="verify" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Proof</label>
                <Input placeholder="Paste the proof here" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Public Inputs</label>
                <Input placeholder="Paste the public inputs here" />
              </div>

              <Button className="w-full">Verify Proof</Button>

              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  This feature would verify a zero-knowledge proof to confirm that a transaction was authorized by the
                  sender without revealing their private key.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
