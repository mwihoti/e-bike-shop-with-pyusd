import { type NextRequest, NextResponse } from "next/server"
import { simulatePyusdTransaction } from "@/utils/advanced-rpc"
import { error } from "console"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { from, to, amount} = body

        if (!from || !to || !amount) {
            return NextResponse.json({ error: "From address, to address, and amount are required"}, { status : 400})
        }

        const simulation = await simulatePyusdTransaction(from, to, amount) 
        return NextResponse.json(simulation)
    } catch (error: any) {
        return NextResponse.json({error: error.message || "Failed to simulate transaction"}, {status: 500})
    }
}