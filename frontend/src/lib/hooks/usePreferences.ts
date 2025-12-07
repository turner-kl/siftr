/**
 * SWR Hook for User Preferences
 */

import useSWR, { type SWRConfiguration } from "swr";
import { apiClient } from "@/lib/api";

// Fetcher function for preferences
const fetchPreferences = async () => {
  const res = await apiClient.api.me.preferences.$get();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
};

/**
 * SWR hook for user preferences
 */
export function usePreferences(config?: SWRConfiguration) {
  return useSWR("/api/me/preferences", fetchPreferences, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    ...config,
  });
}

/**
 * Update preferences
 */
export async function updatePreferences(data: {
  notification_enabled?: boolean;
  email_digest_frequency?: "daily" | "weekly" | "never";
  articles_per_page?: number;
}) {
  const res = await apiClient.api.me.preferences.$put({ json: data });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}
