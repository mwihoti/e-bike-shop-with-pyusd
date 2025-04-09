"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionTraceViewer } from "@/components/transaction-trace-viewer"
import { HistoricalAnalysisTool } from "@/components/historical-analysis-tool"
import { TransactionSimulator } from "@/components/transaction-simulator"
import { PrivacyFeatures } from "@/components/privacy-features"
import { FileSearch, History, PlayCircle, Lock } from "lucide-react"

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("trace")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">PYUSD Advanced Analytics</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto">
          <TabsTrigger value="trace">
            <FileSearch className="h-4 w-4 mr-2" />
            Transaction Tracing
          </TabsTrigger>
          <TabsTrigger value="historical">
            <History className="h-4 w-4 mr-2" />
            Historical Analysis
          </TabsTrigger>
          <TabsTrigger value="simulator">
            <PlayCircle className="h-4 w-4 mr-2" />
            Transaction Simulator
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="h-4 w-4 mr-2" />
            Privacy Features
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs>

      <TabsContent value="trace" className="mt-0">
        <TransactionTraceViewer />
      </TabsContent>

      <TabsContent value="historical" className="mt-0">
        <HistoricalAnalysisTool />
      </TabsContent>

      <TabsContent value="simulator" className="mt-0">
        <TransactionSimulator />
      </TabsContent>

      <TabsContent value="privacy" className="mt-0">
        <PrivacyFeatures />
      </TabsContent>
      </Tabs>
    </div>
  )
}
