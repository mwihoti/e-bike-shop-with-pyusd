import { type NextRequest, NextResponse } from "next/server"
import { getHistoricalPyusdTransactions } from "@/utils/advanced-rpc"
import { safeStringify } from "@/utils/json-helpers"
export const config = {
  maxDuration: 30 // set max duration to 30
}
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")
  const blockCount = searchParams.get("blockCount")
  const page = searchParams.get("page") || "1"
  const pageSize = searchParams.get("pageSize") || "10"

  // Drastically reduce default block count to improve performance
  const maxBlocks = 100 // Reduced from 1000 to 100 to avoid query limit errors

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    console.log(`Fetching transactions for address ${address} with block count ${maxBlocks}`)
    
    // Get all transactions first
    const transactions = await getHistoricalPyusdTransactions(
      address,
      blockCount ? Math.min(Number.parseInt(blockCount), maxBlocks) : maxBlocks,
    )
    
    console.log(`Found ${transactions.length} transactions for address ${address}`)

    // Implement pagination
    const pageNum = Number.parseInt(page, 10)
    const maxPageSize = 100
    const pageSizeNum = Math.min(Number.parseInt(pageSize, 10), maxPageSize)
    if (isNaN(pageNum) || isNaN(pageSizeNum)) {
      return NextResponse.json({ error: "Invalid pagination values"}, { status: 400})
    }
    const startIndex = (pageNum - 1) * pageSizeNum
    const endIndex = startIndex + pageSizeNum
    const paginatedTransactions = transactions.slice(startIndex, endIndex)

    // Return pagination metadata along with the transactions
    const result = {
      transactions: paginatedTransactions,
      pagination: {
        total: transactions.length,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(transactions.length / pageSizeNum),
        hasMore: endIndex < transactions.length,
      },
    }

    // Use our custom JSON serialization to handle BigInt values
    const safeResult = JSON.parse(safeStringify(transactions))
    return NextResponse.json(safeResult)
  } catch (error: any) {
    console.error("Error in historical-transactions API route:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to get historical transactions",
        details: error.code || "unknown_error",
      },
      { status: 500 },
    )
  }
}
