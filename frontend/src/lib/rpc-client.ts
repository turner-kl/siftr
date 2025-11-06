import { hc } from "hono/client";

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Create an RPC client for the backend API
 *
 * Note: For now, we're using the non-typed version of hc.
 * To enable full type safety, you would need to:
 * 1. Build the backend and export its types
 * 2. Import the AppType from the backend
 * 3. Pass it as a type parameter to hc<AppType>
 *
 * Usage:
 * ```ts
 * const client = createRpcClient();
 * const response = await client.api['rpc-demo'].hello.$get();
 * const data = await response.json();
 * ```
 */
export const createRpcClient = () => {
  // Using any here for simplicity - in production, you'd import AppType from backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return hc<any>(API_URL, {
    headers: {
      // Add authentication headers here when needed
      // 'Authorization': `Bearer ${token}`,
    },
  });
};

// Export a singleton instance for convenience
export const rpcClient = createRpcClient();
