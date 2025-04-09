import { type NextRequest, NextResponse } from "next/server"
import { searchTransactionByHash } from "@/utils/advanced-rpc"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const txHash = searchParams.get("txHash")

  if (!txHash) {
    return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 })
  }

  try {
    // Use the improved search function
    const result = await searchTransactionByHash(txHash)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in transaction-trace API route:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to get transaction trace",
        details: error.code || "unknown_error",
      },
      { status: 500 },
    )
  }
}
