"use client";

import { useState } from "react";
/**
 * Profile Client Component
 * Uses SWR for data fetching with optimistic updates
 */
import {
  updateProfile,
  updateSkillProfiles,
  useProfile,
} from "@/lib/hooks/useProfile";

type ProfileClientProps = {
  initialData?: any;
};

export function ProfileClient({ initialData }: ProfileClientProps) {
  const {
    data: profile,
    error,
    isLoading,
    mutate,
  } = useProfile({
    fallbackData: initialData,
  });
  const [updating, setUpdating] = useState(false);

  // Update profile with optimistic UI
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const newData = {
        display_name: "更新されたユーザー名",
        settings: {},
      };

      // Optimistic update
      await mutate(
        async () => {
          await updateProfile(newData);
          // Revalidate to get fresh data from server
          return mutate();
        },
        {
          optimisticData: profile
            ? {
                ...profile,
                user: { ...profile.user, display_name: newData.display_name },
              }
            : undefined,
          rollbackOnError: true,
        },
      );

      alert("プロフィールを更新しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  // Update skill profiles with optimistic UI
  const handleUpdateSkills = async () => {
    try {
      setUpdating(true);
      const newSkills = {
        primary_category: "technology" as const,
        skill_level: "intermediate" as const,
        interests: ["AI", "Web開発", "TypeScript"],
        skills: [
          { keyword: "TypeScript", level: "advanced" as const },
          { keyword: "React", level: "intermediate" as const },
        ],
      };

      // Optimistic update
      await mutate(
        async () => {
          await updateSkillProfiles(newSkills);
          return mutate();
        },
        {
          optimisticData: profile
            ? ({
                ...profile,
                profile: { ...profile.profile, ...newSkills },
              } as any)
            : undefined,
          rollbackOnError: true,
        },
      );

      alert("スキルプロフィールを更新しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update skills");
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error.message}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure the backend server is running at http://localhost:3001
          </p>
          <button
            type="button"
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">User Profile</h1>

        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Profile Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">
                User ID:
              </span>
              <p className="text-gray-900">{profile?.user.user_id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{profile?.user.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Display Name:
              </span>
              <p className="text-gray-900">
                {profile?.user.display_name || "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* Skill Profile */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Skill Profile
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Primary Category:
              </span>
              <p className="text-gray-900">
                {profile?.profile.primary_category}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Skill Level:
              </span>
              <p className="text-gray-900">{profile?.profile.skill_level}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Interests:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.profile.interests.length ? (
                  profile.profile.interests.map((interest: string) => (
                    <span
                      key={interest}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400">No interests set</p>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Skills:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.profile.skills.length ? (
                  profile.profile.skills.map(
                    (skill: { keyword: string; level: string }) => (
                      <span
                        key={skill.keyword}
                        className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded"
                      >
                        {skill.keyword} ({skill.level})
                      </span>
                    ),
                  )
                ) : (
                  <p className="text-gray-400">No skills set</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Actions (SWR + Hono RPC Demo)
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleUpdateProfile}
              disabled={updating}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? "Updating..." : "Update Profile"}
            </button>
            <button
              type="button"
              onClick={handleUpdateSkills}
              disabled={updating}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ml-0 sm:ml-3"
            >
              {updating ? "Updating..." : "Update Skills"}
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Note: These buttons demonstrate SWR optimistic updates with Hono
            RPC. Data updates immediately in the UI, then syncs with the
            backend.
          </p>
        </div>

        {/* Code Example */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Code Example
          </h2>
          <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-auto">
            {`// SWR + Hono RPC with optimistic updates
import { useProfile, updateProfile } from '@/lib/hooks/useProfile';

function Component() {
  const { data, mutate } = useProfile();

  const handleUpdate = async () => {
    await mutate(
      async () => {
        await updateProfile({ display_name: 'New Name' });
        return mutate(); // Revalidate
      },
      {
        optimisticData: { ...data, user: { ...data.user, display_name: 'New Name' } },
        rollbackOnError: true,
      }
    );
  };
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
