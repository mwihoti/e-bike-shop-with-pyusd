import { ethers } from "ethers"

// GCP Blockchain RPC endpoint - replace with your actual endpoint
const GCP_RPC_ENDPOINT = process.env.NEXT_PUBLIC_GCP_RPC_ENDPOINT || "https://your-gcp-rpc-endpoint.com"

// Create a provider specifically for advanced RPC calls
export const createAdvancedProvider = () => {
  // First try to use window.ethereum if available (for connected wallet's network)
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      return new ethers.BrowserProvider(window.ethereum)
    } catch (e) {
      console.log("Failed to create provider from window.ethereum, falling back to RPC endpoint")
    }
  }

  // Fall back to configured RPC endpoint
  return new ethers.JsonRpcProvider(GCP_RPC_ENDPOINT)
}

// Create a fallback provider that tries multiple sources
export const createFallbackProvider = () => {
  const providers = []

  // Add window.ethereum provider if available
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      providers.push(new ethers.BrowserProvider(window.ethereum))
    } catch (e) {
      console.log("Failed to add window.ethereum provider")
    }
  }

  // Add configured RPC endpoint
  providers.push(new ethers.JsonRpcProvider(GCP_RPC_ENDPOINT))

  // Add public Ethereum RPC endpoints as fallbacks
  providers.push(new ethers.JsonRpcProvider("https://eth.llamarpc.com"))
  providers.push(new ethers.JsonRpcProvider("https://ethereum.publicnode.com"))

  // If we have multiple providers, create a fallback provider
  if (providers.length > 1) {
    return new ethers.FallbackProvider(
      providers.map((provider, i) => ({
        provider,
        priority: providers.length - i,
        stallTimeout: 2000,
      })),
    )
  }

  // Otherwise just return the first provider
  return providers[0]
}

// PYUSD contract address on Ethereum mainnet
export const PYUSD_ADDRESS = "0x1456688345527bE1f37E9e627DA0837D6f08C925"

// Interface for trace transaction result
export interface TraceTransactionResult {
  gas: number
  returnValue: string
  structLogs: {
    depth: number
    error?: string
    gas: number
    gasCost: number
    memory: string[]
    op: string
    pc: number
    stack: string[]
    storage?: Record<string, string>
  }[]
}

// Interface for transaction receipt with trace data
export interface EnhancedTransactionReceipt extends ethers.TransactionReceipt {
  traceData?: TraceTransactionResult
  decodedInput?: any
  decodedLogs?: any[]
  pyusdTransfers?: {
    from: string
    to: string
    value: string
    formattedValue: string
  }[]
}

/**
 * Check if the provider supports advanced tracing methods
 */
export async function checkTracingSupport(): Promise<boolean> {
  const provider = createAdvancedProvider()

  try {
    // Try a simple debug_traceTransaction call with minimal parameters
    await provider.send("debug_traceTransaction", [
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      {},
    ])
    return true
  } catch (error: any) {
    // Check if the error is due to method not being supported
    if (
      error.code === "UNSUPPORTED_OPERATION" ||
      (error.message && error.message.includes("method") && error.message.includes("not exist"))
    ) {
      console.log("Advanced tracing methods not supported by this RPC endpoint")
      return false
    }

    // If it's another error (like invalid tx hash), tracing might still be supported
    return true
  }
}

/**
 * Get detailed trace for a transaction using debug_traceTransaction
 * This is a computationally expensive operation that GCP provides for free
 */
export async function getTransactionTrace(txHash: string): Promise<TraceTransactionResult | null> {
  const provider = createAdvancedProvider()

  try {
    // First check if tracing is supported
    const isSupported = await checkTracingSupport()
    if (!isSupported) {
      console.log("Tracing not supported, returning null")
      return null
    }

    const trace = await provider.send("debug_traceTransaction", [
      txHash,
      {
        tracer: "callTracer",
        tracerConfig: {
          onlyTopCall: false,
          withLog: true,
        },
      },
    ])

    return trace
  } catch (error) {
    console.error("Error tracing transaction:", error)
    return null
  }
}

/**
 * Get enhanced transaction receipt with trace data
 * Improved with better error handling and fallback mechanisms
 */
export async function getEnhancedTransactionReceipt(txHash: string): Promise<EnhancedTransactionReceipt> {
  const provider = createAdvancedProvider()

  try {
    // Get basic transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) {
      // Try to get the transaction first to see if it exists but isn't confirmed
      const tx = await provider.getTransaction(txHash)
      if (tx) {
        throw new Error("Transaction exists but hasn't been confirmed yet. Please try again later.")
      } else {
        throw new Error("Transaction not found. Please check the transaction hash and network.")
      }
    }

    // Get transaction data
    const tx = await provider.getTransaction(txHash)
    if (!tx) throw new Error("Transaction not found")

    // Create enhanced receipt
    const enhancedReceipt: EnhancedTransactionReceipt = {
      ...receipt,
    }

    // Try to get trace data if supported
    try {
      const traceData = await getTransactionTrace(txHash)
      if (traceData) {
        enhancedReceipt.traceData = traceData
      }
    } catch (e) {
      console.log("Tracing not available:", e)
      // Continue without trace data
    }

    // Decode input data if it's a PYUSD transaction
    if (tx.to?.toLowerCase() === PYUSD_ADDRESS.toLowerCase()) {
      // PYUSD ABI fragment for transfer function
      const pyusdInterface = new ethers.Interface([
        "function transfer(address to, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ])

      try {
        enhancedReceipt.decodedInput = pyusdInterface.parseTransaction({ data: tx.data })
      } catch (e) {
        console.log("Could not decode input data:", e)
      }

      // Decode Transfer events
      const pyusdTransfers = []
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === PYUSD_ADDRESS.toLowerCase()) {
          try {
            const parsedLog = pyusdInterface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            })

            if (parsedLog && parsedLog.name === "Transfer") {
              pyusdTransfers.push({
                from: parsedLog.args[0],
                to: parsedLog.args[1],
                value: parsedLog.args[2].toString(),
                formattedValue: ethers.formatUnits(parsedLog.args[2], 6), // PYUSD has 6 decimals
              })
            }
          } catch (e) {
            console.log("Could not decode log:", e)
          }
        }
      }

      enhancedReceipt.pyusdTransfers = pyusdTransfers
    }

    return enhancedReceipt
  } catch (error: any) {
    console.error("Error getting enhanced transaction receipt:", error)
    throw error
  }
}

/**
 * Get historical PYUSD transactions for an address using standard methods
 * This is a fallback for when trace_block is not available
 */
export async function getHistoricalPyusdTransactionsStandard(address: string, blockCount = 10000): Promise<any[]> {
  const provider = createAdvancedProvider()

  try {
    console.log(`Using standard event logs to get transactions for ${address}`)

    // Create a filter for Transfer events where the address is either sender or receiver
    const pyusdContract = new ethers.Contract(
      PYUSD_ADDRESS,
      ["event Transfer(address indexed from, address indexed to, uint256 value)"],
      provider,
    )

    // Get the current block number
    const currentBlock = await provider.getBlockNumber()

    // Look back blockCount blocks or to block 0, whichever is greater
    const fromBlock = Math.max(0, currentBlock - blockCount)
    console.log(`Searching from block ${fromBlock} to ${currentBlock}`)

    // Create filters for sent and received transfers
    const sentFilter = pyusdContract.filters.Transfer(address)
    const receivedFilter = pyusdContract.filters.Transfer(null, address)

    // Get logs for both filters
    const [sentLogs, receivedLogs] = await Promise.all([
      provider.getLogs({
        ...sentFilter,
        fromBlock,
        toBlock: currentBlock,
      }),
      provider.getLogs({
        ...receivedFilter,
        fromBlock,
        toBlock: currentBlock,
      }),
    ])

    console.log(`Found ${sentLogs.length} sent transactions and ${receivedLogs.length} received transactions`)

    // Combine and sort logs
    const allLogs = [...sentLogs, ...receivedLogs].sort((a, b) => b.blockNumber - a.blockNumber)

    // Process logs into transaction objects
    const transactions = []
    const processedTxHashes = new Set()

    for (const log of allLogs) {
      try {
        // Skip duplicate transactions (same tx hash)
        if (processedTxHashes.has(log.transactionHash)) {
          continue
        }
        processedTxHashes.add(log.transactionHash)

        // Parse the log
        const parsedLog = pyusdContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        })

        if (!parsedLog) continue

        // Get block information for timestamp
        const block = await provider.getBlock(log.blockNumber)

        // Create transaction object
        transactions.push({
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: block?.timestamp || 0,
          transfers: [
            {
              from: parsedLog.args[0],
              to: parsedLog.args[1],
              value: parsedLog.args[2].toString(),
              formattedValue: ethers.formatUnits(parsedLog.args[2], 6),
            },
          ],
        })
      } catch (error) {
        console.error("Error processing log:", error)
      }
    }

    return transactions
  } catch (error) {
    console.error("Error getting historical PYUSD transactions:", error)
    return []
  }
}

/**
 * Get historical PYUSD transactions for an address
 * Uses trace_block if available, falls back to standard event logs if not
 */
export async function getHistoricalPyusdTransactions(address: string, blockCount = 1000): Promise<any[]> {
  try {
    // First check if tracing is supported
    const isSupported = await checkTracingSupport()

    if (!isSupported) {
      console.log("Tracing not supported, using standard event logs instead")
      return getHistoricalPyusdTransactionsStandard(address, blockCount)
    }

    const provider = createAdvancedProvider()
    const currentBlock = await provider.getBlockNumber()
    const startBlock = Math.max(0, currentBlock - blockCount)

    const pyusdTransactions = []

    // Process blocks in batches to avoid overloading the RPC endpoint
    const batchSize = 10
    for (let i = startBlock; i <= currentBlock; i += batchSize) {
      const endBlock = Math.min(i + batchSize - 1, currentBlock)
      const batchPromises = []

      for (let blockNumber = i; blockNumber <= endBlock; blockNumber++) {
        batchPromises.push(
          provider
            .send("trace_block", [ethers.toBeHex(blockNumber)])
            .then((traces) => {
              // Filter traces for PYUSD transactions
              return traces.filter(
                (trace) =>
                  trace.action && trace.action.to && trace.action.to.toLowerCase() === PYUSD_ADDRESS.toLowerCase(),
              )
            })
            .catch((err) => {
              console.error(`Error tracing block ${blockNumber}:`, err)
              return []
            }),
        )
      }

      const batchResults = await Promise.all(batchPromises)

      // Process each block's traces
      for (let j = 0; j < batchResults.length; j++) {
        const blockTraces = batchResults[j]
        const blockNumber = i + j

        for (const trace of blockTraces) {
          // Check if this trace involves the target address
          if (
            trace.action.from &&
            (trace.action.from.toLowerCase() === address.toLowerCase() ||
              (trace.action.input && trace.action.input.includes(address.substring(2).toLowerCase())))
          ) {
            // Get full transaction data
            const tx = await provider.getTransaction(trace.transactionHash)
            if (tx) {
              const receipt = await getEnhancedTransactionReceipt(trace.transactionHash)

              // Check if this transaction involves PYUSD transfers for the target address
              const relevantTransfers = receipt.pyusdTransfers?.filter(
                (transfer) =>
                  transfer.from.toLowerCase() === address.toLowerCase() ||
                  transfer.to.toLowerCase() === address.toLowerCase(),
              )

              if (relevantTransfers && relevantTransfers.length > 0) {
                pyusdTransactions.push({
                  blockNumber,
                  transactionHash: trace.transactionHash,
                  from: tx.from,
                  to: tx.to,
                  transfers: relevantTransfers,
                  timestamp: (await provider.getBlock(blockNumber))?.timestamp,
                  receipt,
                })
              }
            }
          }
        }
      }
    }

    return pyusdTransactions
  } catch (error) {
    console.error("Error getting historical PYUSD transactions:", error)
    // Fall back to standard method if trace_block fails
    return getHistoricalPyusdTransactionsStandard(address, blockCount)
  }
}

/**
 * Search for a transaction by hash with improved error handling and fallback mechanisms
 * This function will try multiple providers to find the transaction
 */
export async function searchTransactionByHash(txHash: string): Promise<any> {
  // First try with the primary provider
  const provider = createAdvancedProvider()

  try {
    console.log(`Searching for transaction ${txHash}`)

    // Try to get the transaction
    let tx = await provider.getTransaction(txHash)

    // If not found with primary provider, try with fallback providers
    if (!tx) {
      console.log("Transaction not found with primary provider, trying fallback providers")
      const fallbackProvider = createFallbackProvider()
      tx = await fallbackProvider.getTransaction(txHash)

      if (!tx) {
        // Try one more approach - direct Etherscan API if available
        try {
          // This is a simplified example - in production you'd use an Etherscan API key
          const response = await fetch(
            `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`,
          )
          const data = await response.json()

          if (data.result) {
            console.log("Transaction found via Etherscan API")
            // Convert Etherscan format to ethers format
            tx = {
              hash: data.result.hash,
              from: data.result.from,
              to: data.result.to,
              data: data.result.input,
              value: BigInt(data.result.value),
              chainId: Number.parseInt(data.result.chainId || "1", 16),
              blockNumber: Number.parseInt(data.result.blockNumber || "0", 16),
              blockHash: data.result.blockHash,
              timestamp: Number.parseInt(data.result.timeStamp || "0", 10),
            }
          }
        } catch (etherscanError) {
          console.log("Failed to fetch from Etherscan:", etherscanError)
        }
      }

      if (!tx) {
        throw new Error(
          "Transaction not found across multiple providers. Please check the transaction hash and network. " +
            "If this is a very recent transaction, it may not have propagated to all nodes yet.",
        )
      }
    }

    // Try to get the receipt
    let receipt
    try {
      receipt = await provider.getTransactionReceipt(txHash)

      // If not found with primary provider, try with fallback providers
      if (!receipt) {
        console.log("Receipt not found with primary provider, trying fallback providers")
        const fallbackProvider = createFallbackProvider()
        receipt = await fallbackProvider.getTransactionReceipt(txHash)
      }
    } catch (receiptError) {
      console.log("Error getting receipt:", receiptError)
    }

    // If we have a transaction but no receipt, it's likely pending
    if (tx && !receipt) {
      return {
        transaction: tx,
        status: "pending",
        message: "Transaction exists but hasn't been confirmed yet. Please try again later.",
        networkInfo: {
          chainId: tx.chainId,
          blockNumber: await provider.getBlockNumber(),
        },
      }
    }

    // If we have both transaction and receipt, return enhanced receipt if possible
    if (tx && receipt) {
      try {
        // Try to enhance the receipt with trace data
        const enhancedReceipt = await getEnhancedTransactionReceipt(txHash)
        return {
          transaction: tx,
          receipt: enhancedReceipt,
          status: "confirmed",
          networkInfo: {
            chainId: tx.chainId,
            blockNumber: await provider.getBlockNumber(),
          },
        }
      } catch (enhanceError) {
        // Fall back to basic receipt if enhanced receipt fails
        console.log("Error enhancing receipt:", enhanceError)
        return {
          transaction: tx,
          receipt,
          status: "confirmed",
          message: "Basic transaction information available. Advanced tracing not supported by your RPC provider.",
          networkInfo: {
            chainId: tx.chainId,
            blockNumber: await provider.getBlockNumber(),
          },
        }
      }
    }

    // This should not happen, but just in case
    throw new Error("Unexpected error processing transaction data")
  } catch (error: any) {
    console.error("Error searching for transaction:", error)

    // Check if it's a network mismatch
    try {
      const networkInfo = await provider.getNetwork()

      throw new Error(
        `Transaction not found. Please check the transaction hash and ensure you're connected to the correct network. ` +
          `Currently connected to: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`,
      )
    } catch (networkError) {
      // If we can't get network info, just throw the original error
      throw error
    }
  }
}

/**
 * Search for transactions by address with improved error handling
 * This function will work even without advanced tracing methods
 */
export async function searchTransactionsByAddress(address: string, blockCount = 1000): Promise<any> {
  try {
    // Validate address
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum address format")
    }

    // Get historical transactions
    const transactions = await getHistoricalPyusdTransactions(address, blockCount)

    return {
      address,
      transactions,
      count: transactions.length,
      message:
        transactions.length === 0
          ? "No PYUSD transactions found for this address in the specified block range."
          : undefined,
    }
  } catch (error: any) {
    console.error("Error searching for transactions by address:", error)
    throw error
  }
}

/**
 * Simulate a PYUSD transaction using trace_call
 */
export async function simulatePyusdTransaction(from: string, to: string, amount: string): Promise<any> {
  const provider = createAdvancedProvider()

  try {
    // Validate inputs
    if (!ethers.isAddress(from)) {
      throw new Error("Invalid 'from' address")
    }
    if (!ethers.isAddress(to)) {
      throw new Error("Invalid 'to' address")
    }
    const amountInWei = ethers.parseUnits(amount, 6) // PYUSD has 6 decimals

    // Construct the transaction object
    const tx = {
      to: PYUSD_ADDRESS,
      from: from,
      data: new ethers.Interface(["function transfer(address to, uint256 amount) returns (bool)"]).encodeFunctionData(
        "transfer",
        [to, amountInWei],
      ),
      gas: 3000000, // Set a reasonable gas limit
    }

    // Simulate the transaction using trace_call
    const trace = await provider.send("debug_traceCall", [
      tx,
      "latest",
      {
        tracer: "callTracer",
        tracerConfig: {
          onlyTopCall: true,
        },
      },
    ])

    // Check for errors in the trace
    if (trace.error) {
      return {
        success: false,
        error: trace.error,
        trace,
      }
    }

    // Estimate gas cost
    const gasEstimate = 21000 // ethers.toNumber(trace.gas)
    const gasPrice = await provider.getGasPrice()
    const gasCost = gasEstimate * Number(gasPrice)
    const gasCostInEth = ethers.formatEther(gasCost)

    return {
      success: true,
      gasEstimate,
      gasCost: gasCostInEth,
      trace,
    }
  } catch (error: any) {
    console.error("Error simulating transaction:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate transaction",
    }
  }
}

/**
 * Generate a zero-knowledge proof for a PYUSD transfer
 */
export async function generateTransferProof(
  from: string,
  to: string,
  amount: string,
  privateKey: string,
): Promise<any> {
  // Placeholder implementation - replace with actual ZK proof generation logic
  return new Promise((resolve) => {
    setTimeout(() => {
      const proofData = {
        proof: "0x" + Array(128).fill(0).join(""), // Dummy proof
        publicInputs: {
          from: from,
          to: to,
          amount: amount,
        },
      }
      resolve(proofData)
    }, 1000)
  })
}
