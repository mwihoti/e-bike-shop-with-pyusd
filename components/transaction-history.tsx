'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, ArrowUpRight, Clock, CheckCircle, XCircle } from "lucide-react"

export function TransactionHistory({ transactions, provider }) {

    const [txStatuses, setTxStatuses] = useState({})

    // update transaction statuses
    useEffect(() => {
        const updateStatuses = async () => {
            if (!provider) return

            const pendingTxs = transactions.filter((tx) => tx.status === "pending")

            for (const tx of pendingTxs) {
                try {
                    const receipt = await provider.getTransactionReceipt(tx.hash)

                    if (receipt) {
                        setTxStatuses((prev) => ({
                            ...prev,
                            [tx.hash]: receipt.status === 1 ? "confirmed" : "failed",
                        }))
                    }
                } catch (err) {
                    console.error("Error checking transaction status:", err)
                }
            }
        }
        updateStatuses()

        // Poll for updates every 15  seconds
        const interval = setInterval(updateStatuses, 15000)

        return () => clearInterval(interval) 
    }, [transactions, provider])

    // Format timestamp
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString()
    }

    // Open transactions on etherScan
    const openEtherscan = (hash) => {
        window.open(`https://etherscan.io/tx/${hash}`, "_blank")
    }

    // Get status badge
    const getStatusBadge = (status, hash) => {
        // use updated status if available
        const currentStatus = txStatuses[hash] || status

        switch(currentStatus) {
            case "pending":
                return (
                    <Badge variant="outline" className="flex items-center gap-1 bg-yellow-800 border-yellow-200">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                )
            case "confirmed":
                return (
                    <Badge variant="outline" className="flex items-center gap-1 bg-yellow-800 border-yellow-200">
                        <CheckCircle className="h-3 w-3"/>
                        Confirmed
                    </Badge>
                )
            case "failed":
                return (
                    <Badge variant="outline" className="flex items-center gap-1 bg-yellow-800 border-yellow-200">
                        <XCircle className="h-3 w-3" />
                        Failed
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // Truncate address/hash
    const truncate = (str) => {
        return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`
    }

    return (
        <div className="space-y-4 py-4">
            <h3 className="text-lg font-medium">Recent Transactions</h3>

            {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No transactions yet</p>
                    </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx, index) => (
                        <Card key={`${tx.hash}-${index}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpRight className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">Sent {tx.amount} PYUSD</p>
                                            <p className="text-xs text-muted-foreground">To: {truncate(tx.to)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge(tx.status, tx.hash)}
                                    <div className="flex items-center gap-1">
                                        <p className="text-xs text-muted-foreground">{formatTime(tx.timestamp)}</p>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEtherscan(tx.hash)}>
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    </div>
            )}
        </div>
    )
}