"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, ArrowRight, AlertTriangle } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import Link from "next/link"
import { checkTracingSupport } from "@/utils/advanced-rpc"

export function HistoricalAnalysisTool() {
  const { account } = useWallet()
  const [address, setAddress] = useState("")
  const [blockCount, setBlockCount] = useState("1000")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [tracingSupported, setTracingSupported] = useState<boolean | null>(null)

  // Check if tracing is supported when component mounts
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = await checkTracingSupport()
      setTracingSupported(isSupported)
    }

    checkSupport()
  }, [])

  useEffect(() => {
    if (account) {
      setAddress(account)
    }
  }, [account])

  const fetchHistoricalTransactions = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/historical-transactions?address=${address}&blockCount=${blockCount}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch historical transactions")
      }

      const data = await response.json()
      setTransactions(data)

      // Calculate statistics
      if (data.length > 0) {
        const totalSent = data.reduce((sum: number, tx: any) => {
          const sentTransfers = tx.transfers.filter((t: any) => t.from.toLowerCase() === address.toLowerCase())
          return sum + sentTransfers.reduce((s: number, t: any) => s + Number.parseFloat(t.formattedValue), 0)
        }, 0)

        const totalReceived = data.reduce((sum: number, tx: any) => {
          const receivedTransfers = tx.transfers.filter((t: any) => t.to.toLowerCase() === address.toLowerCase())
          return sum + receivedTransfers.reduce((s: number, t: any) => s + Number.parseFloat(t.formattedValue), 0)
        }, 0)

        const uniqueCounterparties = new Set()
        data.forEach((tx: any) => {
          tx.transfers.forEach((t: any) => {
            if (t.from.toLowerCase() === address.toLowerCase()) {
              uniqueCounterparties.add(t.to.toLowerCase())
            } else if (t.to.toLowerCase() === address.toLowerCase()) {
              uniqueCounterparties.add(t.from.toLowerCase())
            }
          })
        })

        // Group by date
        const txByDate: Record<string, number> = {}
        data.forEach((tx: any) => {
          if (tx.timestamp) {
            const date = new Date(tx.timestamp * 1000).toISOString().split("T")[0]
            txByDate[date] = (txByDate[date] || 0) + 1
          }
        })

        setStats({
          totalTransactions: data.length,
          totalSent,
          totalReceived,
          netFlow: totalReceived - totalSent,
          uniqueCounterparties: uniqueCounterparties.size,
          txByDate,
        })
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching historical transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Historical PYUSD Analysis</CardTitle>
        <CardDescription>Analyze historical PYUSD transactions using event logs and blockchain data</CardDescription>
      </CardHeader>
      <CardContent>
        {tracingSupported === false && (
          <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Your RPC provider does not support advanced tracing methods. Limited transaction history will be available
              using standard event logs.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Ethereum address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Block count"
              value={blockCount}
              onChange={(e) => setBlockCount(e.target.value)}
              className="w-24"
              type="number"
              max="200"
            />
            <Button onClick={fetchHistoricalTransactions} disabled={isLoading || !address}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Transactions"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: For performance reasons, block count is limited to 200 blocks. Larger ranges may be processed in
            smaller chunks to avoid query limits.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {stats && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transaction Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Total Transactions</div>
                  <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Total Sent</div>
                  <div className="text-2xl font-bold">{stats.totalSent.toFixed(2)} PYUSD</div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Total Received</div>
                  <div className="text-2xl font-bold">{stats.totalReceived.toFixed(2)} PYUSD</div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Net Flow</div>
                  <div className={`text-2xl font-bold ${stats.netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {stats.netFlow >= 0 ? "+" : ""}
                    {stats.netFlow.toFixed(2)} PYUSD
                  </div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Unique Counterparties</div>
                  <div className="text-2xl font-bold">{stats.uniqueCounterparties}</div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Most Active Day</div>
                  <div className="text-2xl font-bold">
                    {
                      Object.entries(stats.txByDate).reduce(
                        (max: [string, number], [date, count]: [string, number]) =>
                          count > max[1] ? [date, count] : max,
                        ["", 0],
                      )[0]
                    }
                  </div>
                </div>
              </div>

              {Object.keys(stats.txByDate).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Transaction Activity</h4>
                  <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-md p-2">
                    <div className="flex h-full items-end">
                      {Object.entries(stats.txByDate)
                        .slice(-14)
                        .map(([date, count]: [string, number], i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-primary rounded-t-sm"
                              style={{
                                height: `${Math.max(10, (count / Math.max(...(Object.values(stats.txByDate) as number[]))) * 100)}%`,
                              }}
                            />
                            <div className="text-xs mt-1 rotate-45 origin-left">
                              {date.split("-").slice(1).join("/")}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No PYUSD transactions found for this address</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">Transaction Hash</div>
                        <div className="font-mono text-xs">{tx.transactionHash}</div>
                      </div>
                      <Badge>Block {tx.blockNumber}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {tx.timestamp ? formatDate(tx.timestamp) : "Timestamp not available"}
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      {tx.transfers.map((transfer: any, i: number) => (
                        <div key={i} className="flex items-center">
                          <div
                            className={`font-mono text-xs truncate ${transfer.from.toLowerCase() === address.toLowerCase() ? "text-red-500" : ""}`}
                          >
                            {transfer.from.substring(0, 8)}...
                          </div>
                          <ArrowRight className="h-4 w-4 mx-2" />
                          <div
                            className={`font-mono text-xs truncate ${transfer.to.toLowerCase() === address.toLowerCase() ? "text-green-500" : ""}`}
                          >
                            {transfer.to.substring(0, 8)}...
                          </div>
                          <div className="ml-auto font-medium">{transfer.formattedValue} PYUSD</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Link href={`/explorer/tx/${tx.transactionHash}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
