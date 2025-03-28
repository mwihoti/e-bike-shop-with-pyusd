"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TransactionHistory } from "@/components/transaction-history"
import { SendTransaction } from "@/components/send-transaction"
import { WalletInfo } from "@/components/wallet-info"
import { Wallet, ArrowLeftRight, History, AlertCircle, AlertTriangle } from "lucide-react"

// PYUSD Token Contract ABI (minimal for balance and transfer)
const PYUSD_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

// PYUSD contract addresses by network
const PYUSD_ADDRESSES = {
  // Ethereum Mainnet
  1: "0x1456688345527bE1f37E9e627DA0837D6f08C925",
  // Add testnet addresses if available
  // 5: "0x...", // Goerli
  // 11155111: "0x...", // Sepolia
}

// Mock contract implementation for testing
class MockPYUSDContract {
  constructor(signer) {
    this.signer = signer
    this._balances = {}
    this._decimals = 6
    this._symbol = "PYUSD"
  }

  async balanceOf(address) {
    // Return mock balance or default to 1000 PYUSD
    return ethers.parseUnits(this._balances[address] || "1000", this._decimals)
  }

  async decimals() {
    return this._decimals
  }

  async symbol() {
    return this._symbol
  }

  async transfer(to, amount) {
    const fromAddress = await this.signer.getAddress()

    // Simulate transaction
    const tx = {
      hash:
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join(""),
      wait: async () => {
        // Simulate transaction confirmation after 2 seconds
        return new Promise((resolve) => {
          setTimeout(() => {
            // Update balances
            const amountInPYUSD = ethers.formatUnits(amount, this._decimals)
            this._balances[fromAddress] = (
              Number.parseFloat(this._balances[fromAddress] || "1000") - Number.parseFloat(amountInPYUSD)
            ).toString()
            this._balances[to] = (
              Number.parseFloat(this._balances[to] || "0") + Number.parseFloat(amountInPYUSD)
            ).toString()

            resolve({
              status: 1,
              transactionHash: tx.hash,
            })
          }, 2000)
        })
      },
    }

    // Add transfer.estimateGas method
    tx.estimateGas = async () => ethers.parseUnits("21000", 0)

    return tx
  }
}

// Add estimateGas method to the transfer function
MockPYUSDContract.prototype.transfer.estimateGas = async (to, amount) => ethers.parseUnits("21000", 0)

export function WalletComponent() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState("")
  const [balance, setBalance] = useState("0")
  const [pyusdContract, setPyusdContract] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [transactions, setTransactions] = useState([])
  const [networkName, setNetworkName] = useState("")
  const [chainId, setChainId] = useState(null)
  const [isMockContract, setIsMockContract] = useState(false)

  // Switch to Ethereum Mainnet
  const switchToMainnet = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }], // Ethereum Mainnet
      })
    } catch (err) {
      console.error("Failed to switch network:", err)
      setError("Failed to switch network. Please switch to Ethereum Mainnet manually.")
    }
  }
  // Debugging log function
  const debuglog = (message: string, ...args: any[]) => {
    console.log(`[walletComponent] ${message}`, ...args)
  }

  // Connect wallet with more flexible network handling
  const connectWallet = async () => {
    debuglog("Connect wallet initiated")

    // Check for ethereum provider
    debuglog("Window ethereum:", window.ethereum)
    if (!window.ethereum) {
        debuglog("No Ethereum wallet detected")
        setError("No Ethereum wallet detected. Please install Metamask or another web3 wallet.")
        return
    }

    setIsConnecting(true)
    setError("")
    setWarning("")

    try {

        // Detailed account request logging
        debuglog("Requesting accounts...")
      

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

      debuglog("Accounts received:", accounts)
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts available. Please unlock your wallet")
      }

      // Create ethers provider
      debuglog("Creating Ethereum provider")
      const ethersProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(ethersProvider)

      // Get network information
      debuglog("Fetching network information")
      const network = await ethersProvider.getNetwork()
      const currentChainId = Number(network.chainId)
      debuglog("Current network:", {
        name: network.name,
        chainId: currentChainId
      })
      setChainId(currentChainId)
      setNetworkName(network.name === "homestead" ? "Ethereum Mainnet" : network.name)

      // Get signer
      debuglog("Getting signer")
      const ethersSigner = await ethersProvider.getSigner()
      setSigner(ethersSigner)

      // Set account
      setAccount(accounts[0])

      // Determine if we should use a real contract or mock
      const shouldUseMock = currentChainId !== 1 || !PYUSD_ADDRESSES[currentChainId]
      setIsMockContract(shouldUseMock)


      let contract

      if (shouldUseMock) {
        // Use mock contract for testing
        contract = new MockPYUSDContract(ethersSigner)
        setWarning(`You're connected to ${network.name}. Using a simulated PYUSD contract for testing.`)
      } else {
        // Use real contract on mainnet
        const contractAddress = PYUSD_ADDRESSES[currentChainId]
        contract = new ethers.Contract(contractAddress, PYUSD_ABI, ethersSigner)
      }

      setPyusdContract(contract)

      // Get PYUSD balance
      await updateBalance(contract, accounts[0])

      // Setup account change listener
      window.ethereum.on("accountsChanged", handleAccountsChanged)

      // Setup chain change listener
      window.ethereum.on("chainChanged", () => window.location.reload())

      // Store wallet data for other components
      localStorage.setItem(
        "pyusd-wallet-data",
        JSON.stringify({
          account: accounts[0],
          balance: balance,
          isMockContract: shouldUseMock,
        }),
      )

      // Dispatch event for other components
      window.dispatchEvent(new Event("pyusd-wallet-connected"))
    } catch (err) {
      console.error("Connection error:", err)
      setError(err.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle account change
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      disconnectWallet()
    } else {
      // Account changed
      setAccount(accounts[0])
      if (pyusdContract) {
        await updateBalance(pyusdContract, accounts[0])

        // Update stored wallet data
        localStorage.setItem(
          "pyusd-wallet-data",
          JSON.stringify({
            account: accounts[0],
            balance: balance,
            isMockContract,
          }),
        )

        // Dispatch event for other components
        window.dispatchEvent(new Event("pyusd-wallet-connected"))
      }
    }
  }

  // Update balance with better error handling
  const updateBalance = async (contract, address) => {
    try {
      // Get balance and decimals
      const rawBalance = await contract.balanceOf(address)
      const decimals = await contract.decimals()
      const formattedBalance = ethers.formatUnits(rawBalance, decimals)
      setBalance(formattedBalance)

      // Update stored wallet data
      if (account) {
        localStorage.setItem(
          "pyusd-wallet-data",
          JSON.stringify({
            account,
            balance: formattedBalance,
            isMockContract,
          }),
        )
      }
    } catch (err) {
      console.error("Error fetching balance:", err)

      // If we're on mainnet, show the error
      if (chainId === 1 && !isMockContract) {
        if (err.message.includes("could not decode result data")) {
          setError("Could not fetch PYUSD balance. The contract may not be available.")
        } else {
          setError("Failed to fetch PYUSD balance: " + err.message)
        }
        throw err
      } else {
        // For non-mainnet or if using mock, set a default balance
        setBalance("1000")

        // Update stored wallet data
        if (account) {
          localStorage.setItem(
            "pyusd-wallet-data",
            JSON.stringify({
              account,
              balance: "1000",
              isMockContract,
            }),
          )
        }
      }
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount("")
    setBalance("0")
    setSigner(null)
    setProvider(null)
    setPyusdContract(null)
    setWarning("")
    setError("")
    setChainId(null)
    setNetworkName("")
    setIsMockContract(false)

    // Remove listeners
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
    }

    // Clear stored wallet data
    localStorage.removeItem("pyusd-wallet-data")

    // Dispatch event for other components
    window.dispatchEvent(new Event("pyusd-wallet-disconnected"))
  }

  // Add transaction to history
  const addTransaction = (tx) => {
    setTransactions((prev) => [tx, ...prev])
  }

  // Make contract available to other components
  useEffect(() => {
    if (pyusdContract) {
      window.pyusdContract = pyusdContract
    }
  }, [pyusdContract])

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          PYUSD Wallet
          {isMockContract && (
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
              Test Mode
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Send and receive PYUSD using Ethereum</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {warning && (
          <Alert variant="warning" className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Warning</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{warning}</span>
              {chainId !== 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit border-amber-300 hover:bg-amber-100"
                  onClick={switchToMainnet}
                >
                  Switch to Ethereum Mainnet
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!account ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-4 text-center text-muted-foreground">
              Connect your Ethereum wallet to send and receive PYUSD
            </p>
            <Button onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="wallet">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="send">
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Send
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet">
              <WalletInfo
                account={account}
                balance={balance}
                networkName={networkName}
                isMockContract={isMockContract}
                onDisconnect={disconnectWallet}
              />
            </TabsContent>

            <TabsContent value="send">
              <SendTransaction
                signer={signer}
                pyusdContract={pyusdContract}
                balance={balance}
                chainId={chainId}
                isMockContract={isMockContract}
                addTransaction={addTransaction}
                updateBalance={() => updateBalance(pyusdContract, account)}
              />
            </TabsContent>

            <TabsContent value="history">
              <TransactionHistory transactions={transactions} provider={provider} isMockContract={isMockContract} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

