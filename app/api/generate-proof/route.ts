import { type NextRequest, NextResponse } from "next/server"
import { generateTransferProof } from "@/utils/advanced-rpc"


export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { from, to, amount, privateKey} = body

        if (!from || !to || !amount || !privateKey) {
            return NextResponse.json(
                {error: "From address, to address, amount, and private key are required"},
                { status: 400 },
            )
        }

        const proof = await generateTransferProof(from, to, amount, privateKey)
        return NextResponse.json(proof)
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to generate proof"}, {status: 500})
    }
}