"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NetworkStatus } from "@/components/network-status"
import { RpcMetricsChart } from "@/components/monitoring/rpc-metrics-chart"
import { RpcLatencyGauge } from "@/components/monitoring/rpc-latency-gauge"
import { RpcCallsTable } from "@/components/monitoring/rpc-calls-table"
import { RpcStatusIndicator } from "@/components/monitoring/rpc-status-indicator"
import { BarChart2, Clock, Activity, AlertTriangle, Loader2, RefreshCw, Server, Zap } from "lucide-react"
import { useRpcMonitor } from "@/hooks/use-rpc-monitor"

export default function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { metrics, latestCalls, status, refreshMetrics, isLoading, error } = useRpcMonitor()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshMetrics()
    setIsRefreshing(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">GCP RPC Monitoring Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <NetworkStatus />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
            {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Server className="h-5 w-5 mr-2 text-primary" />
              RPC Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RpcStatusIndicator status={status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Average Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RpcLatencyGauge value={metrics?.averageLatency || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-4xl font-bold">
                {metrics?.successRate ? `${metrics.successRate.toFixed(1)}%` : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Last 100 calls</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="calls">
            <Server className="h-4 w-4 mr-2" />
            Recent Calls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>GCP RPC Performance Overview</CardTitle>
              <CardDescription>Key performance metrics for your GCP Blockchain RPC Service connection</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Total RPC Calls</div>
                      <div className="text-2xl font-bold">{metrics?.totalCalls || 0}</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Error Rate</div>
                      <div className="text-2xl font-bold">
                        {metrics?.errorRate ? `${metrics.errorRate.toFixed(2)}%` : "0%"}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">Avg. Block Time</div>
                      <div className="text-2xl font-bold">
                        {metrics?.averageBlockTime ? `${metrics.averageBlockTime.toFixed(2)}s` : "N/A"}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4">RPC Call Volume (Last 24 Hours)</h3>
                    <div className="h-64">
                      <RpcMetricsChart data={metrics?.hourlyCallVolume || []} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">Most Used Methods</h3>
                      <div className="space-y-2">
                        {metrics?.topMethods?.map((method, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-md"
                          >
                            <span className="font-mono text-sm">{method.name}</span>
                            <Badge variant="outline">{method.count} calls</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                   
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>In-depth analysis of GCP RPC performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">Response Time Distribution</h3>
                      <div className="h-64">
                        <RpcMetricsChart
                          data={metrics?.latencyDistribution || []}
                          xKey="range"
                          yKey="count"
                          xLabel="Response Time (ms)"
                          yLabel="Number of Calls"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4">Success Rate Over Time</h3>
                      <div className="h-64">
                        <RpcMetricsChart
                          data={metrics?.successRateOverTime || []}
                          xKey="time"
                          yKey="rate"
                          xLabel="Time"
                          yLabel="Success Rate (%)"
                          lineChart
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4">Method Performance Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Method</th>
                            <th className="text-right py-2 px-4">Calls</th>
                            <th className="text-right py-2 px-4">Avg. Latency</th>
                            <th className="text-right py-2 px-4">Success Rate</th>
                            <th className="text-right py-2 px-4">Error Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics?.methodPerformance?.map((method, i) => (
                            <tr key={i} className="border-b">
                              <td className="py-2 px-4 font-mono text-sm">{method.name}</td>
                              <td className="text-right py-2 px-4">{method.calls}</td>
                              <td className="text-right py-2 px-4">{method.avgLatency.toFixed(2)} ms</td>
                              <td className="text-right py-2 px-4">{method.successRate.toFixed(1)}%</td>
                              <td className="text-right py-2 px-4">{method.errorRate.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent RPC Calls</CardTitle>
              <CardDescription>Detailed log of recent calls to the GCP Blockchain RPC Service</CardDescription>
            </CardHeader>
            <CardContent>
              <RpcCallsTable calls={latestCalls} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>GCP RPC Service Configuration</CardTitle>
          <CardDescription>Current configuration for your GCP Blockchain RPC Service connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Connection Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <span className="text-muted-foreground">Endpoint</span>
                    <span className="font-mono text-sm truncate max-w-[250px]">
                      {process.env.NEXT_PUBLIC_GCP_RPC_ENDPOINT || "Not configured"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <span className="text-muted-foreground">Network</span>
                    <span>{status?.network || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <span className="text-muted-foreground">Chain ID</span>
                    <span>{status?.chainId || "Unknown"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Service Health</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant="outline"
                      className={
                        status?.isConnected
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }
                    >
                      {status?.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <span className="text-muted-foreground">Latest Block</span>
                    <span>{status?.latestBlock || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <span className="text-muted-foreground">Sync Status</span>
                    <Badge
                      variant="outline"
                      className={
                        status?.isSynced
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }
                    >
                      {status?.isSynced ? "Synced" : "Syncing"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
