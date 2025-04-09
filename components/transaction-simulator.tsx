"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

export function TransactionSimulator() {
  const { account } = useWallet()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [simulation, setSimulation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("results")

  // Set the from address to the connected wallet address
  useState(() => {
    if (account) {
      setFrom(account)
    }
  })

  const simulateTransaction = async () => {
    if (!from || !to || !amount) return

    setIsSimulating(true)
    setError(null)

    try {
      const response = await fetch("/api/simulate-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, amount }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to simulate transaction")
      }

      const data = await response.json()
      setSimulation(data)
    } catch (err: any) {
      setError(err.message || "An error occurred while simulating the transaction")
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>PYUSD Transaction Simulator</CardTitle>
        <CardDescription>
          Simulate PYUSD transactions before sending them using GCP's trace_call capability
        </CardDescription>
      </CardHeader>
      <CardContent>
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

          <Button onClick={simulateTransaction} disabled={isSimulating || !from || !to || !amount} className="w-full">
            {isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              "Simulate Transaction"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {simulation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Simulation Results</h3>
                {simulation.success ? (
                  <Alert className="p-2 bg-green-50 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>Transaction would succeed</AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="p-2 bg-red-50 text-red-800 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>{simulation.error || "Transaction would fail"}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                <div className="flex items-center mb-4">
                  <div className="font-mono text-xs truncate flex-1">{from.substring(0, 10)}...</div>
                  <ArrowRight className="h-4 w-4 mx-2" />
                  <div className="font-mono text-xs truncate flex-1">{to.substring(0, 10)}...</div>
                  <div className="ml-auto font-medium">{amount} PYUSD</div>
                </div>

                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Estimated Gas:</div>
                  <div>{simulation.gasEstimate}</div>

                  <div className="font-medium">Estimated Gas Cost:</div>
                  <div>{simulation.gasCost} ETH</div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="results">Simulation Results</TabsTrigger>
                  <TabsTrigger value="trace">Detailed Trace</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="mt-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Transaction Effects</h4>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <p className="text-sm">
                        This transaction would transfer <strong>{amount} PYUSD</strong> from{" "}
                        <span className="font-mono text-xs">{from}</span> to{" "}
                        <span className="font-mono text-xs">{to}</span>.
                      </p>
                      <p className="text-sm mt-2">
                        The transaction would cost approximately <strong>{simulation.gasCost} ETH</strong> in gas fees.
                      </p>
                      {simulation.success ? (
                        <p className="text-sm mt-2 text-green-600">
                          Based on the simulation, this transaction would execute successfully.
                        </p>
                      ) : (
                        <p className="text-sm mt-2 text-red-600">
                          Based on the simulation, this transaction would fail with error: {simulation.error}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trace" className="mt-4">
                  <div className="max-h-96 overflow-auto">
                    <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(simulation.trace, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
