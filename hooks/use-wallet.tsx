'use client'

import { Contract } from "ethers"
import { createContext, useContext, useState, useEffect } from "react"


const walletContext = createContext({})

// Wallet provider
export function WalletProvider({ children }) {
    const [isConnected, setIsConnected] = useState(false)
    const [account, setAccount] = useState("")
    const [balance, setBalance] = useState("0")
    const [pyusdContract, setPyusdContract] = useState(null)
    const [isMockContract, setIsMockContract] = useState(false)
    const [transactions, setTransactions] = useState([])
    const [isMounted, setIsMounted] = useState(false)

    // Set mounted state

    useEffect(() => {
        setIsMounted(true)

        // check if wallet component has connected
        const checkWalletConnection = () => {
            const walletData = localStorage.getItem("pyusd-wallet-data")
            if (walletData) {
                try {
                    const { account, balance, isMockContract} = JSON.parse(walletData)
                    setAccount(account || "")
                    setBalance(balance || "0")
                    setIsConnected(!!account)
                    setIsMockContract(isMockContract || false)
                } catch (error) {
                    console.error("Failed to parse wallet data from localStorage:", error)
                }
            }
        }

        // check connection on mount
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

    // Set contract reference
    const setContract = (contract) => {
        setPyusdContract(contract)
    }

    return (
        <walletContext.Provider
            value={{
                isConnected,
                account,
                balance,
                pyusdContract,
                isMockContract,
                transactions,
                addTransaction,
                setContract,
            }}>
                {children}
            </walletContext.Provider>
    )
}

// Hook to use wallet context
export function useWallet() {
    return useContext(walletContext)
}