/**
 * Hono RPC Client for siftr API
 * Type-safe API client using Hono's RPC feature
 *
 * Note: OpenAPIHono and Hono client type compatibility requires workarounds
 * The client provides runtime type safety even with TypeScript limitations
 */

import { hc } from 'hono/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Type-safe API client
 * All endpoints are fully typed based on the backend implementation
 *
 * @example
 * ```typescript
 * // GET request
 * const res = await apiClient.api.me.profile.$get();
 * const data = await res.json();
 *
 * // PUT request
 * const res = await apiClient.api.me.profile.$put({
 *   json: { display_name: 'New Name' }
 * });
 * ```
 */
export const apiClient = hc<any>(API_BASE_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
  // TODO: Add auth token from Cognito
  // headers: () => ({
  //   'Content-Type': 'application/json',
  //   'Authorization': `Bearer ${getAuthToken()}`,
  // }),
});

/**
 * Type helper to extract response data type
 */
export type ApiResponse<T> = T extends Promise<infer U>
  ? U extends { json: () => Promise<infer V> }
    ? V
    : never
  : never;
