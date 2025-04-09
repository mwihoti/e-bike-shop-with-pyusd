"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Code, FileJson, List, Clock } from "lucide-react"
import Link from "next/link"

export default function TransactionPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [txData, setTxData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Get transaction hash from URL
  const txHash = params.hash as string

  useEffect(() => {
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
        setTxData(data)
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching the transaction trace")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactionTrace()
  }, [txHash])

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/explorer">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explorer
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Transaction Details</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : txData ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div>
                  <CardTitle>Transaction Hash</CardTitle>
                  <CardDescription className="font-mono break-all">{txData.transaction.hash}</CardDescription>
                </div>
                <Badge
                  variant={
                    txData.status === "confirmed"
                      ? txData.receipt.status === 1
                        ? "outline"
                        : "destructive"
                      : "outline"
                  }
                  className={
                    txData.status === "confirmed"
                      ? txData.receipt.status === 1
                        ? "bg-green-50 text-green-800 border-green-200"
                        : ""
                      : "bg-yellow-50 text-yellow-800 border-yellow-200"
                  }
                >
                  {txData.status === "confirmed" ? (
                    txData.receipt.status === 1 ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" /> Success
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" /> Failed
                      </>
                    )
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {txData.message && (
                <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription>{txData.message}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Block Number:</div>
                  <div>
                    {txData.status === "confirmed" ? txData.receipt.blockNumber.toString() : "Pending confirmation"}
                  </div>
                </div>
                {txData.status === "confirmed" && (
                  <>
                    <div>
                      <div className="font-medium">Gas Used:</div>
                      <div>
                        {txData.receipt.gasUsed.toString()} (
                        {((Number(txData.receipt.gasUsed) / Number(txData.receipt.gasLimit)) * 100).toFixed(2)}% of
                        limit)
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Effective Gas Price:</div>
                      <div>
                        {txData.receipt.effectiveGasPrice
                          ? (Number(txData.receipt.effectiveGasPrice) / 1e9).toFixed(2) + " Gwei"
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Total Cost:</div>
                      <div>
                        {txData.receipt.effectiveGasPrice
                          ? (
                              (Number(txData.receipt.gasUsed) * Number(txData.receipt.effectiveGasPrice)) /
                              1e18
                            ).toFixed(6) + " ETH"
                          : "N/A"}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <div className="font-medium">From:</div>
                  <div className="font-mono text-sm">{txData.transaction.from}</div>
                </div>
                <div>
                  <div className="font-medium">To:</div>
                  <div className="font-mono text-sm">{txData.transaction.to}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {txData.status === "confirmed" &&
            txData.receipt.pyusdTransfers &&
            txData.receipt.pyusdTransfers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>PYUSD Transfers</CardTitle>
                  <CardDescription>
                    This transaction contains {txData.receipt.pyusdTransfers.length} PYUSD transfer
                    {txData.receipt.pyusdTransfers.length > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {txData.receipt.pyusdTransfers.map((transfer, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="font-medium">From:</div>
                            <Link href={`/explorer/address/${transfer.from}`} className="font-mono hover:underline">
                              {formatAddress(transfer.from)}
                            </Link>
                          </div>
                          <div>
                            <div className="font-medium">To:</div>
                            <Link href={`/explorer/address/${transfer.to}`} className="font-mono hover:underline">
                              {formatAddress(transfer.to)}
                            </Link>
                          </div>
                          <div>
                            <div className="font-medium">Amount:</div>
                            <div className="font-bold">{transfer.formattedValue} PYUSD</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {txData.status === "confirmed" && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Analysis</CardTitle>
                <CardDescription>
                  {txData.receipt.traceData
                    ? "Detailed analysis of the transaction execution using GCP's debug_traceTransaction"
                    : "Basic transaction information (advanced tracing not available)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="overview">
                      <List className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="trace" disabled={!txData.receipt.traceData}>
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
                      {txData.receipt.decodedInput && (
                        <div>
                          <h4 className="font-semibold mb-2">Decoded Function Call</h4>
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                            <p className="font-mono text-sm">
                              {txData.receipt.decodedInput.name}(
                              {txData.receipt.decodedInput.args
                                .map(
                                  (arg: any, i: number) =>
                                    `${txData.receipt.decodedInput.functionFragment.inputs[i].name}: ${arg.toString()}`,
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
                              {txData.receipt.gasUsed.toString()} (
                              {((Number(txData.receipt.gasUsed) / Number(txData.receipt.gasLimit)) * 100).toFixed(2)}%
                              of limit)
                            </div>

                            <div>Effective Gas Price:</div>
                            <div>
                              {txData.receipt.effectiveGasPrice
                                ? (Number(txData.receipt.effectiveGasPrice) / 1e9).toFixed(2) + " Gwei"
                                : "N/A"}
                            </div>

                            <div>Total Cost:</div>
                            <div>
                              {txData.receipt.effectiveGasPrice
                                ? (
                                    (Number(txData.receipt.gasUsed) * Number(txData.receipt.effectiveGasPrice)) /
                                    1e18
                                  ).toFixed(6) + " ETH"
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trace" className="mt-4">
                    {txData.receipt.traceData ? (
                      <div className="space-y-4">
                        <div className="max-h-96 overflow-auto">
                          <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(txData.receipt.traceData.structLogs, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Execution Summary</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Total Operations:</div>
                            <div>{txData.receipt.traceData.structLogs.length}</div>

                            <div>Gas Used:</div>
                            <div>{txData.receipt.traceData.gas}</div>

                            <div>Return Value:</div>
                            <div className="font-mono">{txData.receipt.traceData.returnValue}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Trace data not available for this transaction</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <div className="max-h-96 overflow-auto">
                      <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(txData, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Transaction not found</p>
        </div>
      )}
    </div>
  )
}
