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
export const createFallbackProvider = async () => {
  const providers = []
  let targetChainId = null
  
  // Attempt to get wallet's network first to establish target network
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const walletProvider = new ethers.BrowserProvider(window.ethereum)
      const walletNetwork = await walletProvider.getNetwork()
      targetChainId = Number(walletNetwork.chainId)
      console.log("Wallet connected to network:", walletNetwork.name, targetChainId)
      providers.push({
        provider: walletProvider,
        priority: 100, // Highest priority to wallet provider
        stallTimeout: 2000,
      })
    } catch (e) {
      console.log("Failed to add window.ethereum provider:", e)
    }
  }
  
  // If we don't have a wallet provider, try to get network from configured RPC
  if (!targetChainId) {
    try {
      const configuredProvider = new ethers.JsonRpcProvider(GCP_RPC_ENDPOINT)
      const configNetwork = await configuredProvider.getNetwork()
      targetChainId = Number(configNetwork.chainId)
      console.log("Using configured provider network as target:", configNetwork.name, targetChainId)
      providers.push({
        provider: configuredProvider,
        priority: 90,
        stallTimeout: 2000,
      })
    } catch (e) {
      console.log("Failed to determine network from configured provider:", e)
    }
  }
  
  // If we still don't have a target network, default to Ethereum mainnet (chainId 1)
  if (!targetChainId) {
    targetChainId = 1 // Default to Ethereum mainnet
    console.log("No network detected from wallet or configured provider, defaulting to Ethereum mainnet")
  }
  
  // Add configured RPC endpoint if not added yet and it matches the target network
  if (providers.length === 0 || providers[0].provider.connection.url !== GCP_RPC_ENDPOINT) {
    try {
      const configuredProvider = new ethers.JsonRpcProvider(GCP_RPC_ENDPOINT)
      const configNetwork = await configuredProvider.getNetwork()
      
      if (Number(configNetwork.chainId) === targetChainId) {
        providers.push({
          provider: configuredProvider,
          priority: 80,
          stallTimeout: 2000,
        })
        console.log("Added configured provider with matching network:", configNetwork.name)
      } else {
        console.log(
          `Skipping configured provider - network mismatch: ${configNetwork.name} (${configNetwork.chainId}) vs target ${targetChainId}`
        )
      }
    } catch (e) {
      console.log("Failed to add configured RPC provider:", e)
    }
  }

  // Add public Ethereum RPC endpoints as fallbacks, but only if they match the target network
  const publicProviders = [
    "https://eth.llamarpc.com", 
    "https://ethereum.publicnode.com", 
    "https://rpc.ankr.com/eth"
  ]

  for (const url of publicProviders) {
    try {
      const publicProvider = new ethers.JsonRpcProvider(url)
      const publicNetwork = await publicProvider.getNetwork()
      
      if (Number(publicNetwork.chainId) === targetChainId) {
        providers.push({
          provider: publicProvider,
          priority: 70 - publicProviders.indexOf(url) * 10, // Lower priority for each subsequent fallback
          stallTimeout: 3000,
        })
        console.log(`Added public provider ${url} with matching network:`, publicNetwork.name)
      } else {
        console.log(
          `Skipping public provider ${url} - network mismatch: ${publicNetwork.name} (${publicNetwork.chainId}) vs target ${targetChainId}`
        )
      }
    } catch (e) {
      console.log(`Failed to add public provider ${url}:`, e)
    }
  }

  // If we have multiple providers, create a fallback provider
  if (providers.length > 1) {
    try {
      return new ethers.FallbackProvider(providers)
    } catch (e) {
      console.error("Failed to create FallbackProvider:", e)
      // If creating a fallback provider fails, just return the highest priority provider
      return providers[0].provider
    }
  }

  // If we only have one provider or zero, return the first provider or a default one
  if (providers.length === 1) {
    return providers[0].provider
  }
  
  // Fallback to a simple mainnet provider if nothing else worked
  console.log("No compatible providers found, using default Ethereum mainnet provider")
  return new ethers.JsonRpcProvider("https://eth.llamarpc.com")
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
export async function getHistoricalPyusdTransactionsStandard(address: string, blockCount = 1000): Promise<any[]> {
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
    // Limit to a smaller range to avoid query limit errors
    const fromBlock = Math.max(0, currentBlock - Math.min(blockCount, 1000))
    console.log(`Searching from block ${fromBlock} to ${currentBlock}`)

    // Process in much smaller chunks to avoid query limit errors
    // Start with a very small chunk size and adapt based on errors
    let CHUNK_SIZE = 20 // Start with a tiny chunk size
    const transactions = []
    const processedTxHashes = new Set()

    // Process blocks in chunks
    for (let chunkStart = fromBlock; chunkStart <= currentBlock; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, currentBlock)
      console.log(`Processing blocks ${chunkStart} to ${chunkEnd}`)

      try {
        // Create filters for sent and received transfers for this chunk
        const sentFilter = pyusdContract.filters.Transfer(address)
        const receivedFilter = pyusdContract.filters.Transfer(null, address)

        // Get logs for both filters in this chunk
        const [sentLogs, receivedLogs] = await Promise.all([
          provider.getLogs({
            ...sentFilter,
            fromBlock: chunkStart,
            toBlock: chunkEnd,
          }),
          provider.getLogs({
            ...receivedFilter,
            fromBlock: chunkStart,
            toBlock: chunkEnd,
          }),
        ])

        console.log(`Found ${sentLogs.length} sent and ${receivedLogs.length} received transactions in chunk`)

        // If successful, we can try to increase the chunk size very slightly for efficiency
        // but cap it to avoid hitting limits
        CHUNK_SIZE = Math.min(CHUNK_SIZE + 5, 50)

        // Combine and sort logs for this chunk
        const allLogs = [...sentLogs, ...receivedLogs].sort((a, b) => b.blockNumber - a.blockNumber)

        // Process logs into transaction objects
        for (const log of allLogs) {
          try {
            // Skip duplicate transactions (same tx hash)
            if (processedTxHashes.has(log.transactionHash)) {
              continue
            }
            processedTxHashes.add(log.transactionHash)

            // Parse the log with better error handling
            let parsedLog
            try {
              // Check if log data is valid before parsing
              if (!log.data || log.data === "0x" || !log.topics || log.topics.length === 0) {
                console.log("Skipping invalid log data:", log)
                continue
              }

              parsedLog = pyusdContract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              })

              if (!parsedLog || !parsedLog.args || parsedLog.args.length < 3) {
                console.log("Invalid parsed log, missing arguments:", parsedLog)
                continue
              }
            } catch (parseError) {
              console.error("Error parsing log:", parseError, "Log data:", log)
              continue
            }

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
                  value: parsedLog.args[2].toString(), // Convert BigInt to string
                  formattedValue: ethers.formatUnits(parsedLog.args[2], 6),
                },
              ],
            })
          } catch (error) {
            console.error("Error processing log:", error)
          }
        }
      } catch (chunkError: any) {
        console.error(`Error processing chunk ${chunkStart}-${chunkEnd}:`, chunkError)

        // Try to extract the suggested range from the error message or error data
        let suggestedStart, suggestedEnd

        // First try to get it from error.data if available
        if (chunkError.data && chunkError.data.from && chunkError.data.to) {
          try {
            suggestedStart =
              typeof chunkError.data.from === "string"
                ? Number.parseInt(chunkError.data.from, 16)
                : Number(chunkError.data.from)

            suggestedEnd =
              typeof chunkError.data.to === "string"
                ? Number.parseInt(chunkError.data.to, 16)
                : Number(chunkError.data.to)

            console.log(`Found suggested range in error data: ${suggestedStart}-${suggestedEnd}`)
          } catch (parseErr) {
            console.error("Error parsing suggested range from error data:", parseErr)
          }
        }

        // If not found in error.data, try to extract from error message
        if (!suggestedStart || !suggestedEnd) {
          const match = chunkError.message.match(/Try with this block range \[(0x[0-9a-f]+), (0x[0-9a-f]+)\]/)
          if (match && match.length === 3) {
            try {
              suggestedStart = Number.parseInt(match[1], 16)
              suggestedEnd = Number.parseInt(match[2], 16)
              console.log(`Found suggested range in error message: ${suggestedStart}-${suggestedEnd}`)
            } catch (parseErr) {
              console.error("Error parsing suggested range from error message:", parseErr)
            }
          }
        }

        // Calculate a new chunk size based on the suggested range
        if (suggestedStart && suggestedEnd) {
          const suggestedRange = suggestedEnd - suggestedStart
          if (suggestedRange > 0) {
            // Use an even smaller chunk size than suggested to be safe
            CHUNK_SIZE = Math.max(2, Math.floor(suggestedRange / 4))
            console.log(`Adjusted chunk size to ${CHUNK_SIZE} based on provider suggestion (range: ${suggestedRange})`)

            // Adjust the current chunk start to retry with the smaller size
            chunkStart = chunkStart - CHUNK_SIZE // Go back to retry this range with smaller chunks
          } else {
            // If we can't determine a good range, just use a very small chunk size
            CHUNK_SIZE = 5
            console.log(`Using minimum chunk size of ${CHUNK_SIZE} due to invalid suggested range`)
            chunkStart = chunkStart - CHUNK_SIZE
          }
        } else {
          // If we can't parse the suggested range, just reduce the chunk size significantly
          CHUNK_SIZE = Math.max(2, Math.floor(CHUNK_SIZE / 4))
          console.log(`Reduced chunk size to ${CHUNK_SIZE} due to unparseable error`)
          chunkStart = chunkStart - CHUNK_SIZE
        }
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
    // Use a smaller batch size
    const batchSize = 5 // Reduced from 10 to 5
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

export async function searchTransactionByHash(txHash: string): Promise<any> {
  // First try to create the fallback provider
  let provider
  let networkInfo = { name: "Unknown", chainId: 0 }
  
  try {
    provider = await createFallbackProvider()
    // Get current network information
    try {
      const network = await provider.getNetwork()
      networkInfo = {
        name: network.name === "homestead" ? "Ethereum Mainnet" : network.name,
        chainId: Number(network.chainId)
      }
      console.log(`Connected to network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`)
    } catch (networkErr) {
      console.error("Failed to get network info:", networkErr)
    }
  } catch (providerError) {
    console.error("Error creating fallback provider:", providerError)
    // Fall back to a simple provider if fallback creation fails
    provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com")
  }

  try {
    console.log(`Searching for transaction ${txHash}`)

    // Try to get the transaction
    let tx = await provider.getTransaction(txHash)

    // If not found, try with individual providers separately (useful for cross-chain transactions)
    if (!tx) {
      console.log("Transaction not found with primary provider, trying individual providers")
      
      // Try with wallet provider if available
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const walletProvider = new ethers.BrowserProvider(window.ethereum)
          tx = await walletProvider.getTransaction(txHash)
          if (tx) {
            console.log("Transaction found with wallet provider")
            provider = walletProvider // Switch to the provider that found the transaction
          }
        } catch (e) {
          console.log("Failed to get transaction with wallet provider:", e)
        }
      }

      // Try with public providers if still not found
      if (!tx) {
        // Try using providers on multiple networks explicitly to handle cross-chain scenarios
        const multiNetworkProviders = [
          // Ethereum Mainnet
          "https://eth.llamarpc.com",
          // Arbitrum
          "https://arb1.arbitrum.io/rpc",
          // Polygon
          "https://polygon-rpc.com",
          // Optimism
          "https://mainnet.optimism.io",
          // Base
          "https://mainnet.base.org"
        ]

        for (const url of multiNetworkProviders) {
          if (tx) break // Stop if we found the transaction

          try {
            const networkProvider = new ethers.JsonRpcProvider(url)
            tx = await networkProvider.getTransaction(txHash)
            
            if (tx) {
              console.log(`Transaction found with provider: ${url}`)
              provider = networkProvider // Switch to the provider that found the transaction
              
              // Update network info
              const network = await provider.getNetwork()
              networkInfo = {
                name: network.name === "homestead" ? "Ethereum Mainnet" : network.name,
                chainId: Number(network.chainId)
              }
              console.log(`Transaction is on network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`)
            }
          } catch (e) {
            console.log(`Failed to get transaction with provider ${url}:`, e)
          }
        }
      }

      // Try Etherscan API as last resort
      if (!tx) {
        try {
          const response = await fetch(
            `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`
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
            
            // Update network info based on chainId from Etherscan
            networkInfo = {
              name: tx.chainId === 1 ? "Ethereum Mainnet" : `Chain ID: ${tx.chainId}`,
              chainId: tx.chainId
            }
          }
        } catch (etherscanError) {
          console.log("Failed to fetch from Etherscan:", etherscanError)
        }
      }
    }

    if (!tx) {
      throw new Error(
        `Transaction not found. Please check the transaction hash and ensure you're connected to the correct network. ` +
        `Currently connected to: ${networkInfo.name} (Chain ID: ${networkInfo.chainId}). ` +
        `The transaction may be on a different blockchain network.`
      )
    }

    // Try to get the receipt
    let receipt
    try {
      receipt = await provider.getTransactionReceipt(txHash)
    } catch (receiptError) {
      console.log("Error getting receipt:", receiptError)
    }

    // If we have a transaction but no receipt, it's likely pending
    if (tx && !receipt) {
      return {
        transaction: tx,
        status: "pending",
        message: "Transaction exists but hasn't been confirmed yet. Please try again later.",
        networkInfo: networkInfo
      }
    }

    // If we have both transaction and receipt, return enhanced receipt if possible
    if (tx && receipt) {
      try {
        // Only try to enhance the receipt if we're on the right network for PYUSD (Ethereum mainnet)
        if (networkInfo.chainId === 1) {
          const enhancedReceipt = await getEnhancedTransactionReceipt(txHash)
          return {
            transaction: tx,
            receipt: enhancedReceipt,
            status: "confirmed",
            networkInfo: networkInfo
          }
        } else {
          // For other networks, return basic receipt
          return {
            transaction: tx,
            receipt,
            status: "confirmed",
            message: `Transaction found on ${networkInfo.name}. PYUSD token data is only available for Ethereum mainnet transactions.`,
            networkInfo: networkInfo
          }
        }
      } catch (enhanceError) {
        // Fall back to basic receipt if enhanced receipt fails
        console.log("Error enhancing receipt:", enhanceError)
        return {
          transaction: tx,
          receipt,
          status: "confirmed",
          message: "Basic transaction information available. Advanced tracing not supported by your RPC provider.",
          networkInfo: networkInfo
        }
      }
    }

    // This should not happen, but just in case
    throw new Error("Unexpected error processing transaction data")
  } catch (error: any) {
    console.error("Error searching for transaction:", error)
    throw new Error(
      `Error searching for transaction: ${error.message}. ` +
      `Currently connected to: ${networkInfo.name} (Chain ID: ${networkInfo.chainId}).`
    )
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
