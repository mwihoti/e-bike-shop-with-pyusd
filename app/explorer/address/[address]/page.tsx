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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const pageSize = 10

  // Get address from URL
  const address = params.address as string

  useEffect(() => {
    const fetchAddressTransactions = async () => {
      if (!address) return

      setIsLoading(true)
      setError(null)

      try {
        // Use a smaller block count and pagination for better performance
        const response = await fetch(
          `/api/historical-transactions?address=${address}&blockCount=50&page=${page}&pageSize=${pageSize}`,
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch address transactions")
        }

        const data = await response.json()

        // Validate the data before setting it
        if (!data.transactions || !Array.isArray(data.transactions)) {
          console.error("Invalid data format received:", data)
          throw new Error("Invalid data format received from server")
        }

        setTransactions(data.transactions)
        setHasMore(data.pagination.hasMore)
        setTotalTransactions(data.pagination.total)

        // Calculate statistics with better error handling
        if (data.transactions.length > 0) {
          try {
            const totalSent = data.transactions.reduce((sum: number, tx: any) => {
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

            const totalReceived = data.transactions.reduce((sum: number, tx: any) => {
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

            // Continue with the rest of your statistics calculation
            const uniqueCounterparties = new Set()
            data.transactions.forEach((tx: any) => {
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
            data.transactions.forEach((tx: any) => {
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
              totalTransactions: data.pagination.total,
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

        // Provide more specific error messages for common issues
        if (err.message && err.message.includes("query returned more than 10000 results")) {
          setError(
            "This address has too many transactions to display all at once. We're showing a limited set of the most recent transactions.",
          )

          // Try again with an even smaller block range
          try {
            const retryResponse = await fetch(
              `/api/historical-transactions?address=${address}&blockCount=10&page=${page}&pageSize=${pageSize}`,
            )

            if (retryResponse.ok) {
              const retryData = await retryResponse.json()
              if (retryData.transactions && Array.isArray(retryData.transactions)) {
                setTransactions(retryData.transactions)
                setHasMore(retryData.pagination.hasMore)
                setTotalTransactions(retryData.pagination.total)
              }
            }
          } catch (retryErr) {
            console.error("Error in retry attempt:", retryErr)
          }
        } else {
          setError(err.message || "An error occurred while fetching address transactions")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddressTransactions()
  }, [address, page])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  const loadMoreTransactions = () => {
    setPage(page + 1)
  }

  const loadPreviousTransactions = () => {
    if (page > 1) {
      setPage(page - 1)
    }
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
          {isLoading && page === 1 ? (
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
          <CardDescription>
            {totalTransactions > 0
              ? `Showing transactions ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalTransactions)} of ${totalTransactions}`
              : "No transactions found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && page === 1 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No PYUSD transactions found for this address</p>
            </div>
          ) : (
            <>
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
                      {tx.transfers.map((transfer: any, i: number) => (
                        <div key={i} className="flex items-center">
                          <div
                            className={`font-mono text-xs truncate ${transfer.from.toLowerCase() === address.toLowerCase() ? "text-red-500" : ""}`}
                          >
                            <Link href={`/explorer/address/${transfer.from}`} className="hover:underline">
                              {formatAddress(transfer.from)}
                            </Link>
                          </div>
                          <ArrowRight className="h-4 w-4 mx-2" />
                          <div
                            className={`font-mono text-xs truncate ${transfer.to.toLowerCase() === address.toLowerCase() ? "text-green-500" : ""}`}
                          >
                            <Link href={`/explorer/address/${transfer.to}`} className="hover:underline">
                              {formatAddress(transfer.to)}
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

              {/* Pagination controls */}
              {(page > 1 || hasMore) && (
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={loadPreviousTransactions} disabled={page <= 1 || isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowLeft className="h-4 w-4 mr-2" />
                    )}
                    Previous
                  </Button>

                  <Button variant="outline" onClick={loadMoreTransactions} disabled={!hasMore || isLoading}>
                    {isLoading && page > 1 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Next
                    {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
