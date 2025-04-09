"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RpcLimitationsGuide } from "@/components/rpc-limitations-guide"
import { ArrowLeft, FileSearch, Code, Database, History } from "lucide-react"
import Link from "next/link"

export default function ExplorerFeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/explorer">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explorer
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Explorer Features</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSearch className="h-5 w-5 mr-2 text-primary" />
              Transaction Lookup
            </CardTitle>
            <CardDescription>Search for transactions by hash</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our transaction lookup feature allows you to search for any PYUSD transaction by its hash. You'll get:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Basic transaction details (from, to, value, gas used)</li>
              <li>Transaction status (pending, confirmed, failed)</li>
              <li>PYUSD transfer details (sender, recipient, amount)</li>
              <li>Detailed execution trace (if supported by your RPC provider)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary" />
              Address Lookup
            </CardTitle>
            <CardDescription>Search for transactions by address</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our address lookup feature allows you to search for all PYUSD transactions associated with an address:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>View all incoming and outgoing PYUSD transfers</li>
              <li>See transaction history with timestamps</li>
              <li>Analyze transaction patterns and counterparties</li>
              <li>Calculate total PYUSD sent and received</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 mr-2 text-primary" />
              Execution Tracing
            </CardTitle>
            <CardDescription>Analyze transaction execution step by step</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our execution tracing feature provides detailed insights into how transactions are executed:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Step-by-step execution trace with opcodes</li>
              <li>Gas usage analysis at each execution step</li>
              <li>Memory and storage state changes</li>
              <li>Detailed error information for failed transactions</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Note:</strong> This feature requires an RPC provider that supports debug_traceTransaction.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2 text-primary" />
              Historical Analysis
            </CardTitle>
            <CardDescription>Analyze historical transaction patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our historical analysis feature helps you understand transaction patterns over time:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Track PYUSD flow across thousands of blocks</li>
              <li>Identify transaction patterns and trends</li>
              <li>Analyze counterparty relationships</li>
              <li>Visualize transaction volume over time</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Note:</strong> Full functionality requires an RPC provider that supports trace_block.
            </p>
          </CardContent>
        </Card>
      </div>

      <RpcLimitationsGuide />
    </div>
  )
}
