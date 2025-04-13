"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AddressPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  // Get address from URL
  const address = params.address as string

  useEffect(() => {
    const fetchAddressTransactions = async () => {
      if (!address) return

      setIsLoading(true)
      setError(null)

      try {
        // Use a smaller block count to avoid query limit errors
        const response = await fetch(`/api/historical-transactions?address=${address}`)

        if (!response.ok) {
          const text = await response.text()
          let errorMessage = "Failed to fetch address transactions"

          try {
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorMessage
          } catch {
            errorMessage = text
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()

     {/*  // Add validation that was commented out, but make it handle objects too:
if (!data || (typeof data === 'object' && !Array.isArray(data) && !data.transactions)) {
  console.error("Invalid data format received:", data);
  throw new Error("Invalid data format received from server");
}

// Handle both array responses and object responses with a transactions field
const transactionsArray = Array.isArray(data) ? data : (data.transactions || []);
*/}
const transactionsArray = Array.isArray(data) ? data : (data.transactions && Array.isArray(data.transactions) ? data.transactions : [])

setTransactions(transactionsArray);

        // Calculate statistics with better error handling
        if (transactionsArray.length > 0) {
          try {
            const totalSent = transactionsArray.reduce((sum: number, tx: any) => {
              if (!tx.transfers || !Array.isArray(tx.transfers)) return sum

              const sentTransfers = tx.transfers.filter(
                (t: any) => t && t.from && address && t.from.toLowerCase() === address.toLowerCase(),
              )

              return (
                sum +
                sentTransfers.reduce((s: number, t: any) => {
                  const value = t && t.formattedValue ? Number.parseFloat(t.formattedValue) : 0
                  return s + (isNaN(value) ? 0 : value)
                }, 0)
              )
            }, 0)

            const totalReceived = transactionsArray.reduce((sum: number, tx: any) => {
              if (!tx.transfers || !Array.isArray(tx.transfers)) return sum

              const receivedTransfers = tx.transfers.filter(
                (t: any) => t && t.to && address && t.to.toLowerCase() === address.toLowerCase(),
              )

              return (
                sum +
                receivedTransfers.reduce((s: number, t: any) => {
                  const value = t && t.formattedValue ? Number.parseFloat(t.formattedValue) : 0
                  return s + (isNaN(value) ? 0 : value)
                }, 0)
              )
            }, 0)

            // ... rest of the statistics calculation with similar error handling ...

            // Continue with the rest of your statistics calculation
            const uniqueCounterparties = new Set()
            transactionsArray.forEach((tx: any) => {
              if (!tx.transfers || !Array.isArray(tx.transfers)) return

              tx.transfers.forEach((t: any) => {
                if (!t || !t.from || !t.to) return

                if (t.from.toLowerCase() === address.toLowerCase()) {
                  uniqueCounterparties.add(t.to.toLowerCase())
                } else if (t.to.toLowerCase() === address.toLowerCase()) {
                  uniqueCounterparties.add(t.from.toLowerCase())
                }
              })
            })

            // Group by date with error handling
            const txByDate: Record<string, number> = {}
            transactionsArray.forEach((tx: any) => {
              if (tx && tx.timestamp) {
                try {
                  const date = new Date(tx.timestamp * 1000).toISOString().split("T")[0]
                  txByDate[date] = (txByDate[date] || 0) + 1
                } catch (dateError) {
                  console.error("Error processing date:", dateError)
                }
              }
            })

            setStats({
              totalTransactions: transactionsArray.length,
              totalSent,
              totalReceived,
              netFlow: totalReceived - totalSent,
              uniqueCounterparties: uniqueCounterparties.size,
              txByDate,
            })
          } catch (statsError) {
            console.error("Error calculating statistics:", statsError)
            // Don't throw here, just log the error and continue without stats
          }
        }
      } catch (err: any) {
        console.error("Error fetching transactions:", err)
        setError(err.message || "An error occurred while fetching address transactions")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddressTransactions()
  }, [address])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
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
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Address Details</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>PYUSD Activity for Address</CardTitle>
          <CardDescription className="font-mono break-all">{address}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : stats ? (
            <div className="space-y-6">
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
                          <div className="text-xs mt-1 rotate-45 origin-left">{date.split("-").slice(1).join("/")}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No PYUSD transactions found for this address</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PYUSD Transactions</CardTitle>
          <CardDescription>Showing the most recent PYUSD transactions for this address</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : Array.isArray(transactions) && transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No PYUSD transactions found for this address</p>
            </div>
          ) : Array.isArray(transactions) ? (
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div key={index} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/explorer/tx/${tx.transactionHash}`} className="hover:underline">
                      <div className="font-medium">Transaction</div>
                      <div className="font-mono text-xs">{tx.transactionHash.substring(0, 18)}...</div>
                    </Link>
                    <Badge>Block {tx.blockNumber}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {tx.timestamp ? formatDate(tx.timestamp) : "Timestamp not available"}
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    {Array.isArray(tx.transfers) && tx.transfers.map((transfer: any, i: number) => (
                      <div key={i} className="flex items-center">
                        <div
                          className={`font-mono text-xs truncate ${transfer.from?.toLowerCase() === address.toLowerCase() ? "text-red-500" : ""}`}
                        >
                          <Link href={`/explorer/address/${transfer.from}`} className="hover:underline">
                            {formatAddress(transfer.from || "")}
                          </Link>
                        </div>
                        <ArrowRight className="h-4 w-4 mx-2" />
                        <div
                          className={`font-mono text-xs truncate ${transfer.to?.toLowerCase() === address.toLowerCase() ? "text-green-500" : ""}`}
                        >
                          <Link href={`/explorer/address/${transfer.to}`} className="hover:underline">
                            {formatAddress(transfer.to || "")}
                          </Link>
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Error: Invalid transaction data format received</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}