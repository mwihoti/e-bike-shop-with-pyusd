import { type NextRequest, NextResponse } from "next/server"
import { searchTransactionByHash } from "@/utils/advanced-rpc"
import { safeStringify } from "@/utils/json-helpers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const txHash = searchParams.get("txHash")

  if (!txHash) {
    return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 })
  }

  try {
    // Use the improved search function
    const result = await searchTransactionByHash(txHash)

    // Use our custom JSON serialization to handle BigInt values
    const safeResult = JSON.parse(safeStringify(result))
    return NextResponse.json(safeResult)
  } catch (error: any) {
    console.error("Error in transaction-trace API route:", error)

    // Provide more specific error messages based on the error
    let errorMessage = error.message || "Failed to get transaction trace"
    let statusCode = 500

    if (errorMessage.includes("not found")) {
      statusCode = 404
    } else if (errorMessage.includes("network mismatch")) {
      errorMessage =
        "Network mismatch detected. Please ensure your wallet and RPC provider are connected to the same network."
    } else if (errorMessage.includes("tracing methods not supported")) {
      errorMessage =
        "Your RPC provider doesn't support advanced tracing methods. Basic transaction information will still be available, but detailed execution traces will not be shown."
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.code || "unknown_error",
      },
      { status: statusCode },
    )
  }
}
export const config = {
  maxDuration: 20, // maximum allowed is 10s for Node.js functions, 30s for Edge Functions
};