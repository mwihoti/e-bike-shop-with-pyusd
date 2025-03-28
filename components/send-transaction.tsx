"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { time, timeStamp } from "console"


export function SendTransaction({
    signer,
    pyusdContract,
    balance,
    chainId,
    isMockContract,
    addTransaction,
    updateBalance
}) {
    const [recipient, setRecipient] = useState("")
    const [amount, setAmount] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [warning, setWarning] = useState("")
    const [success, setSuccess] = useState("")
    const [gasEstimate, setGasEstimate] = useState(null)

    // validate Ethereum address
    const isValidAddress = (address) =>  {
        try {
            return ethers.isAddress(address)
        } catch {
            return false
        }
    }

    // Estimate for gas transaction

    const estimateGas = async () => {
        if (!isValidAddress(recipient) || !amount || Number.parseFloat(amount) <= 0) {
            setGasEstimate(null)
            return
        }

        // Skip gas estimation if using mock contract
        if (isMockContract) {
            setGasEstimate({
                gas: "21000",
                gasCostInEth: "0.000420"
            })
            return
        }
        try {
            const decimals = await pyusdContract.decimals()
            const amountInWei = ethers.parseUnits(amount, decimals)

            // Estimate gas
            const gasEstimate = await pyusdContract.transfer.estimateGas(recipient, amountInWei)
            const gasPrice = await signer.provider.getFeeData()

            // Calculate gas cost in eth

            const gasCost = gasEstimate * gasPrice.gasPrice
            const gasCostInEth = ethers.formatEther(gasCost)

            setGasEstimate({
                gas: gasEstimate.toString(),
                gasCostInEth,
            })
            setWarning("")
        } catch (err) {
            console.error("Gas estimate error:", err)
            setGasEstimate(null)


            // Only show warning if on mainnet
            if (chainId === 1 && !isMockContract) {
                setWarning("Could not estimate gas. The transaction may fail.")
            }
        }
    }

    // handle input change
    const handleRecipientChange = (e) => {
        setRecipient(e.target.value)
        setError("")
        setSuccess("")
    }

    const handleAmountChange = (e) => {
        setAmount(e.target.value)
        setError("")
        setSuccess("")
    }

    // Send PYUSD transaction
    const SendTransaction = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")
        setWarning("")

        try {
            if (!isValidAddress(recipient)) {
                throw new Error("Invalid recipient address")
            }

            if (!amount || Number.parseFloat(amount) <= 0) {
                throw new Error("Invalid amount")
            }
            if (Number.parseFloat(amount) > Number.parseFloat(balance)) {
                throw new Error("Insufficient PYUSD balance")
            }

            // Get token decimals
            const decimals = await pyusdContract.decimals()

            // convert amount to token units
            const amountInWei = ethers.parseUnits(amount, decimals)

            // Send transaction
            const tx = await pyusdContract.transfer(recipient, amountInWei)

            // Add to transaction history
            addTransaction({
                hash: tx.hash,
                to: recipient,
                amount: amount,
                timeStamp: Date.now(),
                status: "confirmed",
                isMock: isMockContract,
            })

            // Update balance
            updateBalance()

            // Show success message
            setSuccess(
                `Successfully sent ${amount} PYUSD to ${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}`
            )

            // Reset form
            setRecipient("")
            setAmount("")
            setGasEstimate(null)
        } catch (err) {
            console.error("Transaction error:", err)

            // provide more specific error message
            if (err.message.includes("Could not decode result data")) {
                setError("Transaction failed. The contract may not be available on this network.")
            } else if (err.message.includes("user rejected")) {
                setError("Transaction was rejected by user")
            } else {
                setError(err.message || "Transaction failed")
            }

            // Add failed transaction to history if it was submitted
            if (err.transaction) {
                addTransaction({
                    hash: err.transaction.hash,
                    to: recipient,
                    amount: amount,
                    timeStamp: Date.now(),
                    status: "failed",
                    isMock: isMockContract,
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={SendTransaction} className="space-y-6 py-4">
            {isMockContract && (
                <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="flex items-center">
                        Using Simulated PYSUD contract for testing
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                            Test Mode
                        </Badge>
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                        id="recipient"
                        placeholder="0x..."
                        value={recipient}
                        onChange={handleRecipientChange}
                        onBlur={estimateGas}
                        className={!recipient || isValidAddress(recipient) ? "" : "border-red-500"} />
                        {recipient && !isValidAddress(recipient) && <p className="text-sm text-red-500">Invalid Ethereum address</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PYUSD)</Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={handleAmountChange}
                        onBlur={estimateGas}
                        />
                        <p className="text-sm text-muted-foreground">Available: {Number.parseFloat(balance).toFixed(2)} PYUSD</p>
                </div>
                {gasEstimate && (
                    <div className="rounded-md bg-muted p-3">
                        <p className="text-sm font-medium">Estimated Gas Fee</p>
                        <p className="text-sm text-muted-foreground">
                            ~{Number.parseFloat(gasEstimate.gasCostInEth).toFixed(6)} ETH
                            {isMockContract && <span className="text-xs ml-2">(simulated)</span>}
                        </p>
                        </div>
                )}
                {warning && (
                    <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert variant="success">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                    </>
                ): (
                    "Send PYUSD"
                )}
            </Button>
        </form>
    )
}