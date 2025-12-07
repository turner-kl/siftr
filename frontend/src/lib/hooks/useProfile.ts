/**
 * SWR Hook for User Profile
 * Provides type-safe data fetching with caching, revalidation, and optimistic updates
 */

import { type SWRConfiguration, default as useSWR } from "swr";
import { apiClient } from "@/lib/api";

// Fetcher function for profile
const fetchProfile = async () => {
  const res = await apiClient.api.me.profile.$get();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
};

/**
 * SWR hook for user profile
 * @example
 * ```tsx
 * function ProfileComponent() {
 *   const { data, error, isLoading, mutate } = useProfile();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>{data.user.email}</div>;
 * }
 * ```
 */
export function useProfile(config?: SWRConfiguration) {
  return useSWR("/api/me/profile", fetchProfile, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // 10 seconds
    ...config,
  });
}

/**
 * Update profile with optimistic UI
 */
export async function updateProfile(data: {
  display_name?: string;
  settings?: Record<string, unknown>;
}) {
  const res = await apiClient.api.me.profile.$put({ json: data });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Update skill profiles with optimistic UI
 */
export async function updateSkillProfiles(data: {
  primary_category?: "technology" | "hr" | "business";
  skill_level?: "beginner" | "intermediate" | "advanced";
  interests?: string[];
  skills?: Array<{
    keyword: string;
    level: "beginner" | "intermediate" | "advanced";
  }>;
}) {
  const res = await apiClient.api.me["skill-profiles"].$put({ json: data });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}
