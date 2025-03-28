"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink } from "lucide-react"

export function WalletInfo({ account, balance, networkName, isMockContract, onDisconnect }) {

    const [copied, setCopied] = useState(false)

    const copyAddress = () => {
        navigator.clipboard.writeText(account)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const truncateAddress = (address) => {
        return `${address.substring(0, 6)}...${address.substring(address.length -4)}`
    }

    const openEtherscan = () => {
        // Determine coreect etherscan based on network
        let baseUrl = "https://etherscan.io"

        // handle test networks
        if (networkName && networkName.toLowerCase().includes("goerli")) {
            baseUrl = "https://goerli.etherscan.io"
        } else if (networkName && networkName.toLowerCase().includes("sepolia")) {
            baseUrl = "https://sepolia.etherscan.io"
        }
        window.open(`${baseUrl}/address/${account}`, "_blank")
    }
    return (
        <div className="space-y-6 py-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">Connected Account</p>
                                {networkName && (
                                    <Badge
                                        variant="outline"
                                        className={isMockContract ? "bg-amber-50 text-amber-800 border-amber-200": ""}
                                        >{networkName}</Badge>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <p className="font-mono text-sm">{truncateAddress(account)}</p>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEtherscan}>
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-coll space-y-1">
                            <div className="flex items-center">
                                <p className="text-sm font-medium text-muted-foreground">PYUSD Balance</p>
                                {isMockContract && (
                                    <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200">
                                        Simulated
                                    </Badge>
                                )}
                            </div>
                            <p className="text-2xl font-bold">{Number.parseFloat(balance).toFixed(2)}, PYUSD</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                <Button variant='outline' onClick={onDisconnect}>
                    Disconnect Wallet
                </Button>
            </div>
        </div>
    )


}