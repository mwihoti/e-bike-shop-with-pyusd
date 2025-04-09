"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, AlertCircle, CheckCircle, Code, FileJson, List, AlertTriangle } from "lucide-react"
import type { EnhancedTransactionReceipt } from "@/utils/advanced-rpc"
import { checkTracingSupport } from "@/utils/advanced-rpc"

export function TransactionTraceViewer() {
  const [txHash, setTxHash] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<EnhancedTransactionReceipt | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [tracingSupported, setTracingSupported] = useState<boolean | null>(null)

  // Check if tracing is supported when component mounts
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = await checkTracingSupport()
      setTracingSupported(isSupported)
    }

    checkSupport()
  }, [])

  const fetchTransactionTrace = async () => {
    if (!txHash) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transaction-trace?txHash=${txHash}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch transaction trace")
      }

      const data = await response.json()
      setReceipt(data)
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching the transaction trace")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Advanced Transaction Trace</CardTitle>
        <CardDescription>
          Analyze PYUSD transactions with detailed execution traces using GCP's debug_traceTransaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tracingSupported === false && (
          <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Your RPC provider does not support advanced tracing methods. Some features will be limited. Basic
              transaction information will still be available, but detailed execution traces will not.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="flex-1"
            />
            <Button onClick={fetchTransactionTrace} disabled={isLoading || !txHash}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Trace Transaction"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {receipt && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transaction Details</h3>
                <Badge
                  variant={receipt.status === 1 ? "outline" : "destructive"}
                  className={receipt.status === 1 ? "bg-green-50 text-green-800 border-green-200" : ""}
                >
                  {receipt.status === 1 ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" /> Success
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" /> Failed
                    </>
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Transaction Hash:</div>
                <div className="font-mono break-all">{receipt.hash}</div>

                <div className="font-medium">Block Number:</div>
                <div>{receipt.blockNumber.toString()}</div>

                <div className="font-medium">Gas Used:</div>
                <div>{receipt.gasUsed.toString()}</div>
              </div>

              {receipt.pyusdTransfers && receipt.pyusdTransfers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">PYUSD Transfers</h3>
                    <div className="space-y-2">
                      {receipt.pyusdTransfers.map((transfer, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="font-medium">From:</div>
                            <div className="font-mono text-xs">{transfer.from}</div>

                            <div className="font-medium">To:</div>
                            <div className="font-mono text-xs">{transfer.to}</div>

                            <div className="font-medium">Amount:</div>
                            <div>{transfer.formattedValue} PYUSD</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview">
                    <List className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="trace" disabled={!receipt.traceData}>
                    <Code className="h-4 w-4 mr-2" />
                    Execution Trace
                  </TabsTrigger>
                  <TabsTrigger value="raw">
                    <FileJson className="h-4 w-4 mr-2" />
                    Raw Data
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-4">
                    {receipt.decodedInput && (
                      <div>
                        <h4 className="font-semibold mb-2">Decoded Function Call</h4>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                          <p className="font-mono text-sm">
                            {receipt.decodedInput.name}(
                            {receipt.decodedInput.args
                              .map(
                                (arg: any, i: number) =>
                                  `${receipt.decodedInput.functionFragment.inputs[i].name}: ${arg.toString()}`,
                              )
                              .join(", ")}
                            )
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Gas Analysis</h4>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Gas Used:</div>
                          <div>
                            {receipt.gasUsed.toString()} (
                            {((Number(receipt.gasUsed) / Number(receipt.gasLimit)) * 100).toFixed(2)}% of limit)
                          </div>

                          <div>Effective Gas Price:</div>
                          <div>
                            {receipt.effectiveGasPrice
                              ? (Number(receipt.effectiveGasPrice) / 1e9).toFixed(2) + " Gwei"
                              : "N/A"}
                          </div>

                          <div>Total Cost:</div>
                          <div>
                            {receipt.effectiveGasPrice
                              ? ((Number(receipt.gasUsed) * Number(receipt.effectiveGasPrice)) / 1e18).toFixed(6) +
                                " ETH"
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trace" className="mt-4">
                  {receipt.traceData ? (
                    <div className="space-y-4">
                      <div className="max-h-96 overflow-auto">
                        <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(receipt.traceData.structLogs, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Execution Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Total Operations:</div>
                          <div>{receipt.traceData.structLogs.length}</div>

                          <div>Gas Used:</div>
                          <div>{receipt.traceData.gas}</div>

                          <div>Return Value:</div>
                          <div className="font-mono">{receipt.traceData.returnValue}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>
                        Trace data not available for this transaction. Your RPC provider may not support advanced
                        tracing methods.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <div className="max-h-96 overflow-auto">
                    <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(receipt, null, 2)}
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
