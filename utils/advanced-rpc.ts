import { ethers } from "ethers"

// GCP Blockchain RPC endpoint - replace with your actual endpoint
const GCP_RPC_ENDPOINT = process.env.NEXT_PUBLIC_GCP_RPC_ENDPOINT || "https://your-gcp-rpc-endpoint.com"

// PYUSD contract address on Ethereum mainnet (updated to correct address)
export const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"

// Add this list of known high-volume addresses that should be handled specially
const HIGH_VOLUME_ADDRESSES = [
  "0x264bd8291fAE1D75DB2c5F573b07faA6715997B5", // Paxos 4
  "0x8c8149a1a8b5d5a6e6eb2d1f5c8601e9c4267b98", // Paxos Treasury
  // Add other known high-volume addresses here
]

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
  try {
    // Check if we have a valid RPC endpoint
    if (!GCP_RPC_ENDPOINT || GCP_RPC_ENDPOINT === "https://your-gcp-rpc-endpoint.com") {
      console.warn("No valid RPC endpoint configured, using public fallback")
      return new ethers.JsonRpcProvider("https://eth.llamarpc.com")
    }

    return new ethers.JsonRpcProvider(GCP_RPC_ENDPOINT)
  } catch (e) {
    console.error("Failed to create provider with configured endpoint, using public fallback", e)
    return new ethers.JsonRpcProvider("https://eth.llamarpc.com")
  }
}

// Create a fallback provider that tries multiple sources
export const createFallbackProvider = async (preferredChainId = null) => {
  const providers = []
  let targetChainId = preferredChainId // Use preferred chain ID if provided
  let walletChainId = null

  console.log(
    "Creating fallback provider...",
    preferredChainId ? `Preferred chain ID: ${preferredChainId}` : "No preferred chain ID",
  )

  // Attempt to get wallet's network first
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const walletProvider = new ethers.BrowserProvider(window.ethereum)
      const walletNetwork = await walletProvider.getNetwork()
      walletChainId = Number(walletNetwork.chainId)
      console.log("Wallet connected to network:", walletNetwork.name, walletChainId)

      // Only set target chain ID from wallet if no preferred chain ID was specified
      if (!targetChainId) {
        targetChainId = walletChainId
      }

      // Add wallet provider to the list (we'll filter for compatibility later)
      providers.push({
        provider: walletProvider,
        chainId: walletChainId,
        name: walletNetwork.name,
        priority: 100, // Highest priority to wallet provider
        stallTimeout: 2000,
      })
    } catch (e) {
      console.log("Failed to add window.ethereum provider:", e)
    }
  }

  // Try to get network from configured RPC
  try {
    const configuredProvider = new ethers.JsonRpcProvider(GCP_RPC_ENDPOINT)
    const configNetwork = await configuredProvider.getNetwork()
    const configChainId = Number(configNetwork.chainId)
    console.log("Configured provider network:", configNetwork.name, configChainId)

    // If we don't have a target chain ID yet, use the configured provider's chain ID
    if (!targetChainId) {
      targetChainId = configChainId
      console.log("Using configured provider network as target:", configNetwork.name, targetChainId)
    }

    // Add configured provider to the list
    providers.push({
      provider: configuredProvider,
      chainId: configChainId,
      name: configNetwork.name,
      priority: 90,
      stallTimeout: 2000,
    })
  } catch (e) {
    console.log("Failed to determine network from configured provider:", e)
  }

  // If we still don't have a target network, default to Ethereum mainnet (chainId 1)
  if (!targetChainId) {
    targetChainId = 1 // Default to Ethereum mainnet
    console.log("No network detected from wallet or configured provider, defaulting to Ethereum mainnet")
  }

  // Add public Ethereum RPC endpoints as fallbacks
  const publicProviders = [
    { url: "https://eth.llamarpc.com", chainId: 1, name: "Ethereum Mainnet" },
    { url: "https://ethereum.publicnode.com", chainId: 1, name: "Ethereum Mainnet" },
    { url: "https://rpc.ankr.com/eth", chainId: 1, name: "Ethereum Mainnet" },
    // Add some testnet providers too
    { url: "https://rpc.ankr.com/eth_sepolia", chainId: 11155111, name: "Sepolia" },
    { url: "https://rpc.ankr.com/eth_holesky", chainId: 17000, name: "Holesky" },
  ]

  for (const publicProvider of publicProviders) {
    try {
      const provider = new ethers.JsonRpcProvider(publicProvider.url)

      // Add the provider to our list
      providers.push({
        provider: provider,
        chainId: publicProvider.chainId,
        name: publicProvider.name,
        priority: 70 - publicProviders.indexOf(publicProvider) * 5, // Lower priority for each subsequent fallback
        stallTimeout: 3000,
      })
      console.log(`Added public provider ${publicProvider.url} for network: ${publicProvider.name}`)
    } catch (e) {
      console.log(`Failed to add public provider ${publicProvider.url}:`, e)
    }
  }

  // Filter providers to only include those matching the target chain ID
  const compatibleProviders = providers.filter((p) => p.chainId === targetChainId)
  console.log(`Found ${compatibleProviders.length} providers compatible with target chain ID ${targetChainId}`)

  // If we have no compatible providers but we're looking for mainnet, try to add a default mainnet provider
  if (compatibleProviders.length === 0 && targetChainId === 1) {
    try {
      const defaultProvider = new ethers.JsonRpcProvider("https://eth.llamarpc.com")
      compatibleProviders.push({
        provider: defaultProvider,
        chainId: 1,
        name: "Ethereum Mainnet (Default)",
        priority: 50,
        stallTimeout: 3000,
      })
      console.log("Added default Ethereum mainnet provider")
    } catch (e) {
      console.log("Failed to add default Ethereum mainnet provider:", e)
    }
  }

  // If we have no compatible providers and we're not looking for mainnet,
  // check if we should fall back to mainnet for transaction lookups
  if (compatibleProviders.length === 0 && targetChainId !== 1 && preferredChainId === null) {
    console.log(`No providers found for chain ID ${targetChainId}, trying mainnet providers as fallback`)

    // Try to find mainnet providers from our list
    const mainnetProviders = providers.filter((p) => p.chainId === 1)

    if (mainnetProviders.length > 0) {
      console.log(`Found ${mainnetProviders.length} mainnet providers to use as fallback`)

      // If we have multiple mainnet providers, create a fallback provider
      if (mainnetProviders.length > 1) {
        try {
          const fallbackConfig = mainnetProviders.map((p) => ({
            provider: p.provider,
            priority: p.priority,
            stallTimeout: p.stallTimeout,
          }))
          return new ethers.FallbackProvider(fallbackConfig)
        } catch (e) {
          console.error("Failed to create mainnet FallbackProvider:", e)
          // If creating a fallback provider fails, just return the highest priority provider
          return mainnetProviders[0].provider
        }
      }

      // If we only have one mainnet provider, return it
      return mainnetProviders[0].provider
    }

    // If we couldn't find any mainnet providers, create a new one
    try {
      console.log("Creating new mainnet provider as last resort")
      return new ethers.JsonRpcProvider("https://eth.llamarpc.com")
    } catch (e) {
      console.error("Failed to create new mainnet provider:", e)
    }
  }

  // If we have multiple compatible providers, create a fallback provider
  if (compatibleProviders.length > 1) {
    try {
      const fallbackConfig = compatibleProviders.map((p) => ({
        provider: p.provider,
        priority: p.priority,
        stallTimeout: p.stallTimeout,
      }))
      return new ethers.FallbackProvider(fallbackConfig)
    } catch (e) {
      console.error("Failed to create FallbackProvider:", e)
      // If creating a fallback provider fails, just return the highest priority provider
      return compatibleProviders[0].provider
    }
  }

  // If we only have one compatible provider, return it
  if (compatibleProviders.length === 1) {
    return compatibleProviders[0].provider
  }

  // Fallback to a simple mainnet provider if nothing else worked
  console.log("No compatible providers found, using default Ethereum mainnet provider")
  return new ethers.JsonRpcProvider("https://eth.llamarpc.com")
}

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

    // Decode logs to find PYUSD transfers
    const pyusdTransfers = []

    // PYUSD ABI fragment for Transfer event
    const pyusdInterface = new ethers.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ])

    // Process all logs to find PYUSD transfers
    for (const log of receipt.logs) {
      try {
        // Check if this is a Transfer event (has 3 topics)
        if (log.topics && log.topics.length === 3) {
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
        }
      } catch (e) {
        // Skip logs that can't be parsed as Transfer events
        console.log("Could not decode log:", e)
      }
    }

    enhancedReceipt.pyusdTransfers = pyusdTransfers

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
export async function getHistoricalPyusdTransactionsStandard(address: string, blockCount = 100): Promise<any[]> {
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
    const fromBlock = Math.max(0, currentBlock - Math.min(blockCount, 100)) // Reduced from 1000 to 100
    console.log(`Searching from block ${fromBlock} to ${currentBlock}`)

    // Process in much smaller chunks to avoid query limit errors
    // Start with a very small chunk size to avoid the 10000 results limit
    let CHUNK_SIZE = 5 // Start with a tiny chunk size
    const transactions = []
    const processedTxHashes = new Set()

    // Cache for block timestamps to avoid repeated requests
    const blockTimestampCache = new Map()

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
        CHUNK_SIZE = Math.min(CHUNK_SIZE + 1, 10) // Keep chunk size very small

        // Combine and sort logs for this chunk
        const allLogs = [...sentLogs, ...receivedLogs].sort((a, b) => b.blockNumber - a.blockNumber)

        // Process logs into transaction objects
        for (const log of allLogs) {
          try {
            // Skip duplicate transactions (same tx hash)
            if (processedTxHashes.has(log.transactionHash)) {
              continue
            }

            // Skip logs with invalid data structure
            if (!log.data || !log.topics || log.topics.length < 3) {
              console.log("Skipping invalid log data:", log)
              continue
            }

            // Only process logs from the PYUSD contract
            if (log.address.toLowerCase() !== PYUSD_ADDRESS.toLowerCase()) {
              continue
            }

            // Try to parse the log
            let parsedLog
            try {
              parsedLog = pyusdContract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              })

              // Skip if we couldn't parse the log or it's missing required arguments
              if (!parsedLog || !parsedLog.args || parsedLog.args.length < 3) {
                console.log("Invalid parsed log, missing arguments:", parsedLog)
                continue
              }
            } catch (parseError) {
              console.error("Error parsing log:", parseError)
              continue
            }

            processedTxHashes.add(log.transactionHash)

            // Get block timestamp (use cache if available)
            let timestamp = 0
            if (blockTimestampCache.has(log.blockNumber)) {
              timestamp = blockTimestampCache.get(log.blockNumber)
            } else {
              try {
                const block = await provider.getBlock(log.blockNumber)
                if (block && block.timestamp) {
                  timestamp = Number(block.timestamp)
                  blockTimestampCache.set(log.blockNumber, timestamp)
                }
              } catch (blockError) {
                console.error(`Error getting block ${log.blockNumber}:`, blockError)
              }
            }

            // Create transaction object
            transactions.push({
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              timestamp,
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

        // If we have a suggested range, use it to adjust our chunk size
        if (suggestedStart && suggestedEnd) {
          // Calculate a new chunk size based on the suggested range
          const suggestedRange = suggestedEnd - suggestedStart
          if (suggestedRange > 0) {
            // Use a much smaller chunk size than suggested to be safe
            CHUNK_SIZE = Math.max(1, Math.floor(suggestedRange / 100))
            console.log(`Adjusted chunk size to ${CHUNK_SIZE} based on provider suggestion (range: ${suggestedRange})`)

            // If the suggested range is very small, just process it directly
            if (suggestedRange < 5) {
              chunkStart = suggestedStart - 1 // Set to just before the suggested start
              CHUNK_SIZE = 1 // Process one block at a time
            } else {
              // Otherwise, go back to retry with the smaller chunk size
              chunkStart = chunkStart - CHUNK_SIZE
            }
          } else {
            // If we can't determine a good range, just use a very small chunk size
            CHUNK_SIZE = 1
            console.log(`Using minimum chunk size of ${CHUNK_SIZE} due to invalid suggested range`)
          }
        } else {
          // If we can't parse the suggested range, just reduce the chunk size significantly
          CHUNK_SIZE = 1 // Use the smallest possible chunk size
          console.log(`Reduced chunk size to ${CHUNK_SIZE} due to unparseable error`)
          chunkStart = chunkStart - CHUNK_SIZE // Go back to retry with smaller chunks
        }
      }

      // If we have enough transactions, we can stop processing to improve performance
      if (transactions.length >= 50) {
        console.log(`Found ${transactions.length} transactions, stopping early for performance`)
        break
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
export async function getHistoricalPyusdTransactions(address: string, blockCount = 50): Promise<any[]> {
  // Check if this is a known high-volume address
  if (HIGH_VOLUME_ADDRESSES.includes(address.toLowerCase())) {
    // Return a special indicator for high-volume addresses
    return [
      {
        isHighVolumeAddress: true,
        message:
          "This is a high-volume address with millions of transactions. Please use Etherscan for complete history.",
        etherscanUrl: `https://etherscan.io/token/${PYUSD_ADDRESS}?a=${address}`,
        sampleSize: 10, // We'll still try to get a small sample
      },
    ]
  }

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
    const batchSize = 2 // Reduced from 5 to 2
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

      // If we have enough transactions, we can stop processing to improve performance
      if (pyusdTransactions.length >= 30) {
        console.log(`Found ${pyusdTransactions.length} transactions, stopping early for performance`)
        break
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
 * Search for a transaction by hash with improved error handling and fallbacks
 */
export async function searchTransactionByHash(txHash: string): Promise<any> {
  // Declare provider outside the try block
  let provider
  let targetNetwork = null

  try {
    // For transaction lookups, prefer mainnet (chainId 1) unless we know otherwise
    // This helps when wallet is on testnet but transaction is on mainnet
    try {
      provider = await createFallbackProvider(1) // Prefer mainnet for transaction lookups

      // Get the network information
      targetNetwork = await provider.getNetwork()
      console.log("Using provider with network:", {
        name: targetNetwork.name,
        chainId: targetNetwork.chainId,
      })
    } catch (providerError) {
      console.error("Error creating fallback provider:", providerError)
      // Fall back to a simple provider if fallback creation fails
      provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com")
      targetNetwork = await provider.getNetwork()
    }

    console.log(`Searching for transaction ${txHash}`)

    // Try to get the transaction
    let tx = await provider.getTransaction(txHash)

    // If not found on mainnet, try with wallet's network
    if (!tx && typeof window !== "undefined" && window.ethereum) {
      try {
        console.log("Transaction not found on mainnet, trying wallet's network")
        const walletProvider = new ethers.BrowserProvider(window.ethereum)
        const walletNetwork = await walletProvider.getNetwork()

        console.log("Wallet network:", {
          name: walletNetwork.name,
          chainId: walletNetwork.chainId,
        })

        // Try to get the transaction from wallet's network
        tx = await walletProvider.getTransaction(txHash)

        if (tx) {
          console.log("Transaction found on wallet's network")
          // Update provider and target network
          provider = walletProvider
          targetNetwork = walletNetwork
        }
      } catch (e) {
        console.log("Failed to get transaction with wallet provider:", e)
      }
    }

    // If still not found, try with public providers for different networks
    if (!tx) {
      console.log("Transaction not found with primary providers, trying other networks")

      // Try some common testnets
      const testnetProviders = [
        { url: "https://rpc.ankr.com/eth_sepolia", name: "Sepolia" },
        { url: "https://rpc.ankr.com/eth_holesky", name: "Holesky" },
        { url: "https://rpc.ankr.com/eth_goerli", name: "Goerli" },
      ]

      for (const testnet of testnetProviders) {
        if (tx) break // Stop if we found the transaction

        try {
          console.log(`Trying ${testnet.name} network`)
          const testnetProvider = new ethers.JsonRpcProvider(testnet.url)
          tx = await testnetProvider.getTransaction(txHash)

          if (tx) {
            console.log(`Transaction found on ${testnet.name} network`)
            // Update provider and target network
            provider = testnetProvider
            targetNetwork = await testnetProvider.getNetwork()
          }
        } catch (e) {
          console.log(`Failed to get transaction on ${testnet.name}:`, e)
        }
      }
    }

    if (!tx) {
      // Get current network info to help user troubleshoot
      const networkName = targetNetwork.name === "homestead" ? "Ethereum Mainnet" : targetNetwork.name

      throw new Error(
        `Transaction not found. Please check the transaction hash and ensure you're connected to the correct network. ` +
          `Currently connected to: ${networkName} (Chain ID: ${targetNetwork.chainId})`,
      )
    }

    // Rest of the function remains the same...
    // Try to get the receipt
    let receipt
    try {
      receipt = await provider.getTransactionReceipt(txHash)

      // If not found with primary provider, try with fallback providers
      if (!receipt) {
        console.log("Receipt not found with primary provider, trying fallback providers")
        const fallbackProvider = createAdvancedProvider()
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

        // Get gas price information
        const gasPrice = receipt.gasPrice || receipt.effectiveGasPrice
        let gasCost = null

        if (gasPrice && receipt.gasUsed) {
          gasCost = (Number(gasPrice) * Number(receipt.gasUsed)) / 1e18
        }

        return {
          transaction: tx,
          receipt: enhancedReceipt,
          status: "confirmed",
          gasInfo: {
            gasPrice: gasPrice ? ethers.formatUnits(gasPrice, "gwei") + " Gwei" : null,
            gasCost: gasCost ? gasCost.toFixed(9) + " ETH" : null,
          },
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
    if (targetNetwork) {
      const networkName = targetNetwork.name === "homestead" ? "Ethereum Mainnet" : targetNetwork.name

      throw new Error(
        `Transaction not found. Please check the transaction hash and ensure you're connected to the correct network. ` +
          `Currently connected to: ${networkName} (Chain ID: ${targetNetwork.chainId})`,
      )
    } else {
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
