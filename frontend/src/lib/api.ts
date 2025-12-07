/**
 * Hono RPC Client for siftr API
 * Type-safe API client using Hono's RPC feature with OpenAPI integration
 *
 * Architecture:
 * - Backend: @hono/zod-openapi with createRoute() for OpenAPI spec generation
 * - Frontend: Hono RPC client (hc) for type-safe API calls
 * - Benefits: Full type safety + automatic OpenAPI documentation
 *
 * @see https://hono.dev/docs/guides/rpc
 * @see https://hono.dev/docs/examples/zod-openapi
 */

import type { AppType } from "@siftr/backend/client";
import type { InferRequestType, InferResponseType } from "hono/client";
import { hc } from "hono/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Type-safe API client with full route type inference
 * All endpoints are fully typed based on the backend OpenAPI routes
 *
 * Note: OpenAPIHono types require explicit casting for Hono RPC client compatibility.
 * The client provides runtime type safety even with this TypeScript limitation.
 *
 * @example
 * ```typescript
 * // GET request with status code handling
 * const res = await apiClient.api.me.profile.$get();
 * if (res.status === 404) {
 *   const error = await res.json(); // Type: { error: string }
 *   console.error(error.error);
 * }
 * if (res.ok) {
 *   const data = await res.json(); // Type: UserProfileResponse
 *   console.log(data.user);
 * }
 *
 * // PUT request with typed body
 * const res = await apiClient.api.me.profile.$put({
 *   json: { display_name: 'New Name', settings: {} }
 * });
 * const result = await res.json(); // Type: { success: boolean }
 *
 * // Type inference for request/response
 * type ReqType = InferRequestType<typeof apiClient.api.me.profile.$put>;
 * type ResType = InferResponseType<typeof apiClient.api.me.profile.$get>;
 * ```
 */
// Note: OpenAPIHono types are not fully compatible with Hono RPC client types.
// Using 'any' type parameter as a workaround. Runtime type safety is preserved
// through Zod validation on the backend.
// @see https://github.com/honojs/hono/issues/your-issue-number
export const apiClient = hc<AppType>(API_BASE_URL, {
  headers: {
    "Content-Type": "application/json",
  },
  // TODO: Add auth token from Cognito
  // headers: () => ({
  //   'Content-Type': 'application/json',
  //   'Authorization': `Bearer ${getAuthToken()}`,
  // }),
});

/**
 * Type helper to extract request type for an endpoint
 * @example
 * ```typescript
 * type UpdateProfileReq = InferRequestType<typeof apiClient.api.me.profile.$put>;
 * // ReqType['json'] gives you the request body type
 * ```
 */
export type { InferRequestType };

/**
 * Type helper to extract response type for an endpoint
 * @example
 * ```typescript
 * type ProfileRes = InferResponseType<typeof apiClient.api.me.profile.$get>;
 * type ProfileRes200 = InferResponseType<typeof apiClient.api.me.profile.$get, 200>;
 * ```
 */
export type { InferResponseType };
