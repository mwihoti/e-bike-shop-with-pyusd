"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, FileSearch, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ExplorerPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchType, setSearchType] = useState("tx")

    const handleSearch = () => {
        if (!searchQuery) return

        if (searchType === "tx") {
            router.push(`/explorer/tx/${searchQuery}`)
        } else if (searchType === "address") {
            router.push(`/explorer/address/${searchQuery}`)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">PYUSD Block Explorer</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Search PYUSD Transactions</CardTitle>
                    <CardDescription>
                    Explore PYUSD transactions with detailed execution traces using GCP's advanced RPC methods
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Tabs value={searchType} onValueChange={setSearchQuery}
                        className="w-40">
                            <TabsList className="grid grid-cols-2 w-full">
                                <TabsTrigger value="tx">
                                    <FileSearch className="h-4 w-4 mr-2"/>
                                    Tx
                                </TabsTrigger>
                                <TabsTrigger value="address">
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Address
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex flex-1 gap-2">
                            <Input placeholder={searchType === "tx" ? "Enter transaction hash": "Enter Ethereum address"}
                            value={searchQuery}
                            onChange={(e) => 
                                setSearchQuery(e.target.value)
                            }
                            className="flex-1"/>
                            <Button onClick={handleSearch}>
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Advanced Transaction Tracing</CardTitle>
                        <CardDescription>Analyze PYUSD transactions with detailed execution traces</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Our explorer leverages GCP'S debug_traceTransaction to provide detailed insights into PYUSD transactions:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Step-by-step execution trace of transactions</li>
                            <li>Gas usage analysis at each execution step</li>
                            <li>Memory and storage state changes</li>
                            <li>Detailed error information for failed transactions</li>
                        </ul>
                        <Button className="mt-6 w-full" onClick={() => router.push("/explorer/features")}>
                            Learn More
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Historical Analysis</CardTitle>
                        <CardDescription>Analyze historical PYUSD transaction patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Our explorer uses GCP's trace_block to analyze historical PYUSD transactions:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Track PYUSD flow across thousands of blocks</li>
                            <li>Identify transaction patterns and trends</li>
                            <li>Analyze counterparty relationships</li>
                            <li>Visualize transaction volume over time</li>
                        </ul>
                        <Button className="mt-6 w-full" onClick={() => router.push("/explorer/analytics")}>
                            View Analytics
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}