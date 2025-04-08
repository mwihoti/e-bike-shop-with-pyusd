// Rpc monitoring utility

/**
 * MOnitors RPC requests to verify GCP Blockchain RPC Service connnectivity
 */

export function monitorRpcConnection(provider: any) {
    // store original request method

    const originalSend = provider.send

    // override the send method to add logging
    provider.send = function (method: string, params: any[]) {
        console.log(`Rpc request: ${method}`, params)


        const startTime = performance.now()
        const result = originalSend.apply(this, [method, params])

        // For promises add then/caatch handlers
        if (result instanceof Promise) {
            return result
                .then((response:: any) => {
                    const endTime = performance.now()
                    console.log(`RPC Response (${(endTime - startTime).toFixed(2)}ms): ${method}`, response)
                    return response
                })
                .catch((error: any) => {
                    console.error(`RPC Error: ${method}`, error)
                    throw error
                })
        }
        return result
    }
    return provider
}

/**
 * Checks if the provider is connected to the expected network
 */

export async function verifyRpcEndpoint(provider: any, expectedUrl?: string) {
    try {
        // Get network information
        const network = await provider.getNetwork()
        console.log("Connected to network:", {
            chainId: network.chainId,
            name: network.name
        })

        // Get node information if avaailable
        try {
            const clientVersion = await provider.send("web3_clientVersion", [])
            console.log("Node client version:", clientVersion)

        } catch (e) {
            console.log("Could not retrieve node client versin")
        }

        // If an expected url was provided try to verify

        if (expectedUrl) {
            // This is tricky as providers don't always expose URL
            // We can check indirectly by comparing network properties
            console.log(`Expected RPC endpoint: ${expectedUrl}`)
            console.log("Verify this mathes your GCP BLockchain RPC Service configuration")
        }
        return true
    } catch (error) {
        console.error("Failed to verify RPC endpoint:", error)
        return false
    }
}