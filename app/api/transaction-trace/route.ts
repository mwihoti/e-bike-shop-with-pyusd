import { type NextRequest, NextResponse } from "next/server"
import { getEnhancedTransactionReceipt } from "@/utils/advanced-rpc"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const txHash = searchParams.get("txHash")

    if (!txHash) {
        return NextResponse.json({error: "Transaction hash is required"}, { status: 400})
    }
    try {
        const enhancedReceipt = await getEnhancedTransactionReceipt(txHash) 
        return NextResponse.json(enhancedReceipt)
    } catch (error: any) {
        return NextResponse.json({error: error.message || "Failed to get transaction trace"}, { status: 500})
    }
}