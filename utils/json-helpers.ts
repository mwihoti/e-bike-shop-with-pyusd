/**
 * Safely stringify an object that may contain BigInt values
 * @param obj The object to stringify
 * @returns A JSON string with BigInt values converted to strings
 */
export function safeStringify(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
      // Convert BigInt to string
      if (typeof value === "bigint") {
        return value.toString()
      }
      return value
    })
  }
  
  /**
   * Parse a JSON string that may contain BigInt values
   * @param jsonString The JSON string to parse
   * @returns The parsed object
   */
  export function safeParse(jsonString: string): any {
    return JSON.parse(jsonString)
  }
  