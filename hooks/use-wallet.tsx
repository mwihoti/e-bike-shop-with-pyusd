"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { ethers } from "ethers"
import { useAuth } from "@/contexts/auth-context"

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

// Wallet context
const WalletContext = createContext({})

// Wallet provider
export function WalletProvider({ children }) {
  const { user, isLoading: authLoading, setWalletAddress: setSupabaseWalletAddress } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState("")
  const [balance, setBalance] = useState("0")
  const [pyusdContract, setPyusdContract] = useState(null)
  const [realPyusdContract, setRealPyusdContract] = useState(null)
  const [mockPyusdContract, setMockPyusdContract] = useState(null)
  const [isMockContract, setIsMockContract] = useState(false)
  const [useTestMode, setUseTestMode] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [isMounted, setIsMounted] = useState(false)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [networkName, setNetworkName] = useState("")

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)

    // Check if wallet component has connected
    const checkWalletConnection = () => {
      const walletData = localStorage.getItem("pyusd-wallet-data")
      if (walletData) {
        try {
          const { account, balance, isMockContract, useTestMode } = JSON.parse(walletData)
          setAccount(account || "")
          setBalance(balance || "0")
          setIsConnected(!!account)
          setIsMockContract(isMockContract || false)
          setUseTestMode(useTestMode || false)

          // If we have a connected account but no contract, try to get the contract from window
          if (account && !pyusdContract && window.pyusdContract) {
            setPyusdContract(window.pyusdContract)
          }

          // If we have a connected account but no signer, try to get the signer from window
          if (account && !signer && window.ethereum) {
            const connectSigner = async () => {
              try {
                const provider = new ethers.BrowserProvider(window.ethereum)
                const signer = await provider.getSigner()
                setSigner(signer)
                setProvider(provider)

                // Create a mock contract with the signer
                if (isMockContract || useTestMode) {
                  const mockContract = new MockPYUSDContract(signer)
                  mockContract._balances[account] = balance
                  setMockPyusdContract(mockContract)

                  // If in test mode, use the mock contract
                  if (useTestMode) {
                    setPyusdContract(mockContract)
                  }
                }
              } catch (error) {
                console.error("Failed to reconnect signer:", error)
              }
            }
            connectSigner()
          }
        } catch (error) {
          console.error("Failed to parse wallet data from localStorage:", error)
        }
      }
    }

    // Check connection on mount
    checkWalletConnection()

    // Listen for wallet connection events
    window.addEventListener("pyusd-wallet-connected", checkWalletConnection)
    window.addEventListener("pyusd-wallet-disconnected", checkWalletConnection)

    return () => {
      window.removeEventListener("pyusd-wallet-connected", checkWalletConnection)
      window.removeEventListener("pyusd-wallet-disconnected", checkWalletConnection)
    }
  }, [])

  // Add transaction to history
  const addTransaction = (tx) => {
    setTransactions((prev) => [tx, ...prev])
  }

  // Toggle between real and test tokens
  const toggleTestMode = () => {
    // Can't toggle if already using mock contract due to network
    if (isMockContract) return

    const newTestMode = !useTestMode
    setUseTestMode(newTestMode)

    // Update contract reference
    if (newTestMode) {
      if (mockPyusdContract) {
        setPyusdContract(mockPyusdContract)
      } else if (signer) {
        // Create a new mock contract if needed
        const mockContract = new MockPYUSDContract(signer)
        if (account) {
          mockContract._balances[account] = "10000"
        }
        setMockPyusdContract(mockContract)
        setPyusdContract(mockContract)
      }
    } else {
      if (realPyusdContract) {
        setPyusdContract(realPyusdContract)
      }
    }

    // Update localStorage
    if (account) {
      localStorage.setItem(
        "pyusd-wallet-data",
        JSON.stringify({
          account,
          balance: newTestMode ? "10000" : balance,
          isMockContract,
          useTestMode: newTestMode,
        }),
      )

      // If switching to test mode, update balance
      if (newTestMode) {
        setBalance("10000")
      }
    }
  }

  // Get test tokens
  const getTestTokens = async () => {
    if (!account || (!isMockContract && !useTestMode)) return

    try {
      // Set a high balance for testing
      const testBalance = "10000"

      // If using mock contract, update its internal balance
      if (mockPyusdContract) {
        mockPyusdContract._balances[account] = testBalance
      }

      // Update displayed balance
      setBalance(testBalance)

      // Update localStorage
      localStorage.setItem(
        "pyusd-wallet-data",
        JSON.stringify({
          account,
          balance: testBalance,
          isMockContract,
          useTestMode,
        }),
      )
    } catch (error) {
      console.error("Error getting test tokens:", error)
    }
  }

  // Update balance with better error handling
  const updateBalance = async (contract, address) => {
    if (!contract || !address) return

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
            useTestMode,
          }),
        )
      }
    } catch (err) {
      console.error("Error fetching balance:", err)

      // If we're on mainnet and not using test mode, show the error
      if (chainId === 1 && !isMockContract && !useTestMode) {
        console.error("Failed to fetch PYUSD balance: " + err.message)
      } else {
        // For non-mainnet or if using mock/test, set a default balance
        setBalance("1000")

        // Update stored wallet data
        if (account) {
          localStorage.setItem(
            "pyusd-wallet-data",
            JSON.stringify({
              account,
              balance: "1000",
              isMockContract,
              useTestMode,
            }),
          )
        }
      }
    }
  }

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      console.error("No Ethereum wallet detected")
      return
    }

    // Check if user is authenticated
    if (!user) {
      console.error("User must be authenticated before connecting wallet")
      throw new Error("Please login before connecting your wallet")
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

      // Create ethers provider
      const ethersProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(ethersProvider)

      // Get network information
      const network = await ethersProvider.getNetwork()
      const currentChainId = Number(network.chainId)
      setChainId(currentChainId)
      setNetworkName(network.name === "homestead" ? "Ethereum Mainnet" : network.name)

      // Get signer
      const ethersSigner = await ethersProvider.getSigner()
      setSigner(ethersSigner)

      // Set account
      setAccount(accounts[0])
      setIsConnected(true)

      // Store wallet address in Supabase user metadata
      await setSupabaseWalletAddress(accounts[0])

      // Determine if we should use a real contract or mock
      const shouldUseMock = currentChainId !== 1 || !PYUSD_ADDRESSES[currentChainId]
      setIsMockContract(shouldUseMock)

      // Create both real and mock contracts
      let realContract = null
      if (currentChainId === 1 && PYUSD_ADDRESSES[currentChainId]) {
        const contractAddress = PYUSD_ADDRESSES[currentChainId]
        realContract = new ethers.Contract(contractAddress, PYUSD_ABI, ethersSigner)
        setRealPyusdContract(realContract)
      }

      // Always create a mock contract for testing
      const mockContract = new MockPYUSDContract(ethersSigner)
      mockContract._balances[accounts[0]] = "10000" // Set initial balance
      setMockPyusdContract(mockContract)

      // Set the active contract based on network and test mode
      const activeContract = shouldUseMock || useTestMode ? mockContract : realContract
      setPyusdContract(activeContract)

      // Get PYUSD balance
      if (shouldUseMock || useTestMode) {
        setBalance("10000") // Set a default balance for test mode
      } else {
        await updateBalance(activeContract, accounts[0])
      }

      // Store wallet data for other components
      localStorage.setItem(
        "pyusd-wallet-data",
        JSON.stringify({
          account: accounts[0],
          balance: shouldUseMock || useTestMode ? "10000" : balance,
          isMockContract: shouldUseMock,
          useTestMode,
        }),
      )

      // Make contract available to other components
      window.pyusdContract = activeContract

      // Dispatch event for other components
      window.dispatchEvent(new Event("pyusd-wallet-connected"))

      return activeContract
    } catch (err) {
      console.error("Connection error:", err)
      throw err
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount("")
    setBalance("0")
    setSigner(null)
    setProvider(null)
    setPyusdContract(null)
    setRealPyusdContract(null)
    setMockPyusdContract(null)
    setChainId(null)
    setNetworkName("")
    setIsMockContract(false)
    setUseTestMode(false)
    setIsConnected(false)

    // Clear stored wallet data
    localStorage.removeItem("pyusd-wallet-data")

    // Remove from window
    if (window.pyusdContract) {
      delete window.pyusdContract
    }

    // Dispatch event for other components
    window.dispatchEvent(new Event("pyusd-wallet-disconnected"))
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        account,
        balance,
        pyusdContract,
        isMockContract,
        useTestMode,
        transactions,
        networkName,
        chainId,
        signer,
        addTransaction,
        toggleTestMode,
        getTestTokens,
        connectWallet,
        disconnectWallet,
        updateBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// Hook to use wallet context
export function useWallet() {
  return useContext(WalletContext)
}

