import { type NextRequest, NextResponse } from "next/server"
import { getHistoricalPyusdTransactions } from "@/utils/advanced-rpc"
import { error } from "console"

export async function GET(request: NextRequest) {
    const searchParams  = request.nextUrl.searchParams
    const address = searchParams.get("address")
    const blockCount = searchParams.get("blockCount")


    if (!address) {
        return NextResponse.json({error: "Address is required"}, { status: 400})
    }

    try {
        const transactions = await getHistoricalPyusdTransactions(address,
            blockCount ? Number.parseInt(blockCount) : undefined
        )
        return NextResponse.json(transactions)
    } catch (error: any) {
        return NextResponse.json({error: error.message || "Failed to get historical transactions"}, {status: 500})
    }
}