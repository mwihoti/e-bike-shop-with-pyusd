import { type NextRequest, NextResponse } from "next/server"
import { getHistoricalPyusdTransactions } from "@/utils/advanced-rpc"
import { safeStringify } from "@/utils/json-helpers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")
  const blockCount = searchParams.get("blockCount")
  const page = searchParams.get("page") || "1"
  const pageSize = searchParams.get("pageSize") || "10"

  // Drastically reduce default block count to improve performance
  const maxBlocks = 400 // Reduced from 100 to 50 to avoid query limit errors

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    // Use a smaller block range to avoid query limit errors and improve performance
    const transactions = await getHistoricalPyusdTransactions(
      address,
      blockCount ? Math.min(Number.parseInt(blockCount), maxBlocks) : maxBlocks,
    )

    // Implement pagination
    const pageNum = Number.parseInt(page, 10)
    const pageSizeNum = Number.parseInt(pageSize, 10)
    const startIndex = (pageNum - 1) * pageSizeNum
    const endIndex = startIndex + pageSizeNum
    const paginatedTransactions = transactions.slice(startIndex, endIndex)

    

    // Use our custom JSON serialization to handle BigInt values
    const safeResult = JSON.parse(safeStringify(paginatedTransactions))
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
