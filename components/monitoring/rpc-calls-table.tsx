"use client"

import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export function RpcCallsTable({ calls = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No RPC calls recorded yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4">Time</th>
            <th className="text-left py-2 px-4">Method</th>
            <th className="text-left py-2 px-4">Params</th>
            <th className="text-right py-2 px-4">Duration</th>
            <th className="text-right py-2 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call, i) => (
            <tr key={i} className="border-b">
              <td className="py-2 px-4 text-sm">{new Date(call.timestamp).toLocaleTimeString()}</td>
              <td className="py-2 px-4 font-mono text-sm">{call.method}</td>
              <td className="py-2 px-4 font-mono text-xs truncate max-w-[200px]">{JSON.stringify(call.params)}</td>
              <td className="text-right py-2 px-4">{call.duration} ms</td>
              <td className="text-right py-2 px-4">
                <Badge
                  variant="outline"
                  className={
                    call.success
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }
                >
                  {call.success ? "Success" : "Error"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
