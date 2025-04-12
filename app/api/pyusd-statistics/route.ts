import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { createAdvancedProvider, PYUSD_ADDRESS } from "@/utils/advanced-rpc"

// PYUSD ABI for Transfer events
const PYUSD_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"]

export async function GET(request: NextRequest) {
  try {
    const provider = createAdvancedProvider()

    // Get current block number
    const currentBlock = await provider.getBlockNumber()

    // Look back 10,000 blocks (approximately 1-2 days)
    const blockCount = 10000
    const fromBlock = Math.max(0, currentBlock - blockCount)

    console.log(`Analyzing PYUSD transactions from block ${fromBlock} to ${currentBlock}`)

    // Create PYUSD contract instance
    const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, provider)

    // Get all Transfer events in smaller chunks to avoid query limits
    const chunkSize = 2000
    let allTransfers = []

    for (let chunkStart = fromBlock; chunkStart <= currentBlock; chunkStart += chunkSize) {
      const chunkEnd = Math.min(chunkStart + chunkSize - 1, currentBlock)

      try {
        console.log(`Fetching transfers for blocks ${chunkStart} to ${chunkEnd}`)

        const transferFilter = pyusdContract.filters.Transfer()
        const transfers = await provider.getLogs({
          ...transferFilter,
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        })

        // Parse the transfer logs
        const parsedTransfers = transfers
          .map((log) => {
            try {
              const parsedLog = pyusdContract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              })

              if (!parsedLog || !parsedLog.args) return null

              return {
                from: parsedLog.args[0],
                to: parsedLog.args[1],
                value: parsedLog.args[2].toString(),
                formattedValue: ethers.formatUnits(parsedLog.args[2], 6), // PYUSD has 6 decimals
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
              }
            } catch (e) {
              console.error("Error parsing log:", e)
              return null
            }
          })
          .filter((t) => t !== null)

        allTransfers = [...allTransfers, ...parsedTransfers]
      } catch (chunkError) {
        console.error(`Error fetching chunk ${chunkStart}-${chunkEnd}:`, chunkError)
        // Continue with next chunk
      }
    }

    console.log(`Found ${allTransfers.length} PYUSD transfers`)

    // Calculate statistics
    const uniqueAddresses = new Set()
    const senderVolumes = {}
    const receiverVolumes = {}
    const dailyVolumes = {}
    let totalVolume = 0
    let largestTransaction = 0

    // Get block timestamps for the transfers (in batches to avoid rate limits)
    const blockCache = {}
    const transfersWithTimestamp = []

    // Process in batches of 100 transfers
    const batchSize = 100
    for (let i = 0; i < allTransfers.length; i += batchSize) {
      const batch = allTransfers.slice(i, i + batchSize)

      // Get unique block numbers in this batch
      const blockNumbers = [...new Set(batch.map((t) => t.blockNumber))]

      // Fetch timestamps for blocks not in cache
      const blocksToFetch = blockNumbers.filter((bn) => !blockCache[bn])

      for (const blockNumber of blocksToFetch) {
        try {
          const block = await provider.getBlock(blockNumber)
          if (block && block.timestamp) {
            blockCache[blockNumber] = block.timestamp
          }
        } catch (e) {
          console.error(`Error fetching block ${blockNumber}:`, e)
        }
      }

      // Add timestamp to transfers
      for (const transfer of batch) {
        const timestamp = blockCache[transfer.blockNumber]
        if (timestamp) {
          const date = new Date(Number(timestamp) * 1000).toISOString().split("T")[0]

          transfersWithTimestamp.push({
            ...transfer,
            timestamp,
            date,
          })

          // Update statistics
          uniqueAddresses.add(transfer.from)
          uniqueAddresses.add(transfer.to)

          const value = Number.parseFloat(transfer.formattedValue)
          totalVolume += value

          if (value > largestTransaction) {
            largestTransaction = value
          }

          // Update sender volumes
          senderVolumes[transfer.from] = (senderVolumes[transfer.from] || 0) + value

          // Update receiver volumes
          receiverVolumes[transfer.to] = (receiverVolumes[transfer.to] || 0) + value

          // Update daily volumes
          dailyVolumes[date] = (dailyVolumes[date] || 0) + value
        }
      }
    }

    // Format top senders and receivers
    const formatAddress = (address) => {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    }

    const topSenders = Object.entries(senderVolumes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([address, volume]) => ({
        address: formatAddress(address),
        fullAddress: address,
        volume,
      }))

    const topReceivers = Object.entries(receiverVolumes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([address, volume]) => ({
        address: formatAddress(address),
        fullAddress: address,
        volume,
      }))

    // Format daily volumes for chart
    const dailyVolumeArray = Object.entries(dailyVolumes)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14) // Last 14 days
      .map(([date, volume]) => ({
        date,
        volume,
      }))

    // Find most active day
    const mostActiveDay =
      Object.entries(dailyVolumes)
        .sort((a, b) => b[1] - a[1])
        .map(([date]) => date)[0] || "N/A"

    // Calculate average transaction value
    const averageTransactionValue = totalVolume / allTransfers.length

    // Compile statistics
    const statistics = {
      totalTransactions: allTransfers.length,
      uniqueAddresses: uniqueAddresses.size,
      totalVolume,
      averageTransactionValue,
      largestTransaction,
      mostActiveDay,
      dailyVolume: dailyVolumeArray,
      topSenders,
      topReceivers,
      dataSource: {
        fromBlock,
        toBlock: currentBlock,
        blockRange: currentBlock - fromBlock,
      },
    }

    return NextResponse.json(statistics)
  } catch (error: any) {
    console.error("Error in PYUSD statistics API route:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch PYUSD statistics",
        details: error.code || "unknown_error",
      },
      { status: 500 },
    )
  }
}
