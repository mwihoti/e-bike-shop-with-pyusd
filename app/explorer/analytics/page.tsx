"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { HistoricalAnalysisTool } from "@/components/historical-analysis-tool"
import { NetworkStatus } from "@/components/network-status"
import { ArrowLeft, BarChart2, TrendingUp, Activity, AlertTriangle, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { checkTracingSupport } from "@/utils/advanced-rpc"

export default function ExplorerAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [tracingSupported, setTracingSupported] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Check if tracing is supported when component mounts
  useEffect(() => {
    setIsMounted(true)

    const checkSupport = async () => {
      const isSupported = await checkTracingSupport()
      setTracingSupported(isSupported)
    }

    checkSupport()
    fetchGlobalStats()
  }, [])

  // Fetch global PYUSD statistics from our API
  const fetchGlobalStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/pyusd-statistics")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch PYUSD statistics")
      }

      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      console.error("Error fetching PYUSD statistics:", err)
      setError(err.message || "An error occurred while fetching PYUSD statistics")
    } finally {
      setIsLoading(false)
    }
  }

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  if (!isMounted) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/explorer">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explorer
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">PYUSD Analytics</h1>
        </div>
        <NetworkStatus />
      </div>

      {tracingSupported === false && (
        <Alert className="mb-8 bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Your RPC provider doesn't support advanced tracing methods. Some analytics features may be limited. Basic
            transaction information will still be available, but detailed analytics may not be complete.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <p className="mt-2">
              This could be due to RPC provider limitations or rate limiting. Try again later or with a different RPC
              provider.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Activity className="h-4 w-4 mr-2" />
            Analysis Tool
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>PYUSD Transaction Overview</CardTitle>
              <CardDescription>
                Global statistics for PYUSD transactions across the Ethereum network
                {stats?.dataSource && (
                  <span className="block mt-1 text-xs">
                    Analyzing blocks {stats.dataSource.fromBlock.toLocaleString()} to{" "}
                    {stats.dataSource.toBlock.toLocaleString()}({stats.dataSource.blockRange.toLocaleString()} blocks)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Total Transactions</div>
                      <div className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Unique Addresses</div>
                      <div className="text-2xl font-bold">{formatNumber(stats.uniqueAddresses)}</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Average Transaction</div>
                      <div className="text-2xl font-bold">{formatNumber(stats.averageTransactionValue)} PYUSD</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Largest Transaction</div>
                      <div className="text-2xl font-bold">{formatNumber(stats.largestTransaction)} PYUSD</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Total Volume</div>
                      <div className="text-2xl font-bold">{formatNumber(stats.totalVolume)} PYUSD</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Most Active Day</div>
                      <div className="text-2xl font-bold">{stats.mostActiveDay}</div>
                    </div>
                  </div>

                  <Separator />

                  {stats.dailyVolume && stats.dailyVolume.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Daily Transaction Volume</h3>
                      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-md p-4">
                        <div className="flex h-full items-end">
                          {stats.dailyVolume.map((day: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                              <div
                                className="w-full bg-primary rounded-t-sm"
                                style={{
                                  height: `${(day.volume / Math.max(...stats.dailyVolume.map((d: any) => d.volume))) * 100}%`,
                                }}
                              />
                              <div className="text-xs mt-1 rotate-45 origin-left">
                                {day.date.split("-").slice(1).join("/")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">Top Senders</h3>
                      <div className="space-y-2">
                        {stats.topSenders &&
                          stats.topSenders.map((sender: any, i: number) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-md"
                            >
                              <Link
                                href={`/explorer/address/${sender.fullAddress}`}
                                className="font-mono text-sm hover:underline"
                              >
                                {sender.address}
                              </Link>
                              <span className="font-medium">{formatNumber(sender.volume)} PYUSD</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4">Top Receivers</h3>
                      <div className="space-y-2">
                        {stats.topReceivers &&
                          stats.topReceivers.map((receiver: any, i: number) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-md"
                            >
                              <Link
                                href={`/explorer/address/${receiver.fullAddress}`}
                                className="font-mono text-sm hover:underline"
                              >
                                {receiver.address}
                              </Link>
                              <span className="font-medium">{formatNumber(receiver.volume)} PYUSD</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center mt-4">
                    <Link href="https://etherscan.io/token/0x1456688345527bE1f37E9e627DA0837D6f08C925" target="_blank">
                      <Button variant="outline" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View on Etherscan
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Failed to load PYUSD statistics</p>
                  <Button onClick={fetchGlobalStats} className="mt-4">
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>PYUSD Transaction Trends</CardTitle>
              <CardDescription>Analyze trends and patterns in PYUSD transactions over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">Volume Trend</h3>
                      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-md p-4">
                        {stats.dailyVolume && stats.dailyVolume.length > 0 ? (
                          <div className="h-full flex items-end">
                            {stats.dailyVolume.map((day: any, i: number) => (
                              <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full bg-primary rounded-t-sm"
                                  style={{
                                    height: `${(day.volume / Math.max(...stats.dailyVolume.map((d: any) => d.volume))) * 100}%`,
                                  }}
                                />
                                <div className="text-xs mt-1 rotate-45 origin-left">
                                  {day.date.split("-").slice(1).join("/")}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No volume data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Transaction Distribution</h3>
                      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-md p-4 flex items-center justify-center">
                        <p className="text-muted-foreground">
                          Enhanced transaction distribution charts would be displayed here in a production environment.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Transaction Growth</h3>
                    <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Total Transactions</div>
                          <div className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Total Volume</div>
                          <div className="text-2xl font-bold">{formatNumber(stats.totalVolume)} PYUSD</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Unique Addresses</div>
                          <div className="text-2xl font-bold">{formatNumber(stats.uniqueAddresses)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Failed to load PYUSD trend data</p>
                  <Button onClick={fetchGlobalStats} className="mt-4">
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <HistoricalAnalysisTool />
        </TabsContent>
      </Tabs>
    </div>
  )
}
