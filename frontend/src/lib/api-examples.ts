/**
 * Hono RPC + Zod OpenAPI Usage Examples
 *
 * This file demonstrates how to use the type-safe API client
 * with proper error handling and type inference.
 *
 * @see https://hono.dev/docs/guides/rpc
 */

import { apiClient, type InferRequestType, type InferResponseType } from './api';

// ============================================================================
// Example 1: Basic GET Request
// ============================================================================

export async function getUserProfile() {
  const res = await apiClient.api.me.profile.$get();

  if (res.ok) {
    const data = await res.json(); // Type: UserProfileResponse
    console.log('User:', data.user);
    console.log('Profile:', data.profile);
    return data;
  }

  throw new Error('Failed to fetch user profile');
}

// ============================================================================
// Example 2: PUT Request with Typed Body
// ============================================================================

export async function updateUserProfile(displayName: string) {
  const res = await apiClient.api.me.profile.$put({
    json: {
      display_name: displayName,
      settings: {},
    },
  });

  if (res.ok) {
    const result = await res.json(); // Type: { success: boolean }
    return result;
  }

  throw new Error('Failed to update profile');
}

// ============================================================================
// Example 3: Type Inference for Request/Response
// ============================================================================

// Infer request type from endpoint
type UpdateProfileRequest = InferRequestType<typeof apiClient.api.me.profile.$put>;
type UpdateProfileBody = UpdateProfileRequest['json']; // { display_name?: string, settings?: Record<string, unknown> }

// Infer response type from endpoint
type ProfileResponse = InferResponseType<typeof apiClient.api.me.profile.$get>;
type ProfileResponse200 = InferResponseType<typeof apiClient.api.me.profile.$get, 200>;

// Use inferred types in function signatures
export async function updateProfileTyped(body: UpdateProfileBody): Promise<{ success: boolean } | null> {
  const res = await apiClient.api.me.profile.$put({ json: body });

  if (res.ok) {
    return await res.json();
  }

  return null;
}

// ============================================================================
// Example 4: Update Skill Profiles
// ============================================================================

export async function updateSkillProfiles(data: {
  primary_category?: 'technology' | 'hr' | 'business';
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  interests?: string[];
  skills?: Array<{ keyword: string; level: 'beginner' | 'intermediate' | 'advanced' }>;
}) {
  const res = await apiClient.api.me['skill-profiles'].$put({
    json: data,
  });

  if (res.ok) {
    const result = await res.json();
    return result;
  }

  throw new Error('Failed to update skill profiles');
}

// ============================================================================
// Example 5: Get User Preferences
// ============================================================================

export async function getUserPreferences() {
  const res = await apiClient.api.me.preferences.$get();

  if (res.ok) {
    const preferences = await res.json();
    // Type: {
    //   notification_enabled: boolean;
    //   email_digest_frequency: 'daily' | 'weekly' | 'never';
    //   default_category: string;
    //   articles_per_page: number;
    //   language_preference: 'ja' | 'en' | 'both';
    // }
    return preferences;
  }

  throw new Error('Failed to fetch preferences');
}

// ============================================================================
// Example 6: Update Preferences with Partial Data
// ============================================================================

export async function updatePreferences(updates: {
  notification_enabled?: boolean;
  email_digest_frequency?: 'daily' | 'weekly' | 'never';
  articles_per_page?: number;
}) {
  const res = await apiClient.api.me.preferences.$put({
    json: updates,
  });

  if (res.ok) {
    return await res.json();
  }

  const error = await res.json();
  throw new Error(`Failed to update preferences: ${JSON.stringify(error)}`);
}

// ============================================================================
// Example 7: Error Handling Pattern with Type Guards
// ============================================================================

type ApiError = {
  error: string;
  details?: unknown;
};

function isApiError(data: unknown): data is ApiError {
  return typeof data === 'object' && data !== null && 'error' in data;
}

export async function safeApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const res = await apiCall();

    if (res.ok) {
      const data = await res.json();
      return { data: data as T, error: null };
    }

    const errorData = await res.json();
    if (isApiError(errorData)) {
      return { data: null, error: errorData };
    }

    return { data: null, error: { error: 'Unknown error' } };
  } catch (err) {
    return {
      data: null,
      error: { error: err instanceof Error ? err.message : 'Unknown error' },
    };
  }
}

// Usage:
// const { data, error } = await safeApiCall(() => apiClient.api.me.profile.$get());
