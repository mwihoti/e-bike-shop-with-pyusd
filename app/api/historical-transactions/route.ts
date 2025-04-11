import { type NextRequest, NextResponse } from "next/server"
import { getHistoricalPyusdTransactions } from "@/utils/advanced-rpc"
import { safeStringify } from "@/utils/json-helpers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")
  const blockCount = searchParams.get("blockCount")
  const maxBlocks = 200 // Drastically reduce default block count to avoid query limit errors

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    // Use a smaller block range to avoid query limit errors
    const transactions = await getHistoricalPyusdTransactions(
      address,
      blockCount ? Math.min(Number.parseInt(blockCount), maxBlocks) : maxBlocks,
    )

    // Use our custom JSON serialization to handle BigInt values
    const safeTransactions = JSON.parse(safeStringify(transactions))
    return NextResponse.json(safeTransactions)
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
