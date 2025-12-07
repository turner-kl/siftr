/**
 * User Profile Page (Server Component)
 * Next.js 15 Server Component with SWR for client-side interactions
 */

import { ProfileClient } from "./ProfileClient";

/**
 * Server Component: Initial data fetch at build/request time
 * Advantages:
 * - SEO-friendly
 * - Faster initial page load
 * - No loading spinner on first render
 */
export default async function ProfilePage() {
  // Server-side data fetching
  // In production, replace with actual API call
  const initialData = null; // await fetch(API_URL).then(res => res.json());

  return <ProfileClient initialData={initialData} />;
}
