/**
 * User Profile Page
 * Demonstrates Hono RPC client usage with type-safe API calls
 */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

// Type-safe response types extracted from API
type UserProfile = any; // TODO: Fix type extraction from Hono RPC client

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await (apiClient as any).api.me.profile.$get();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const res = await (apiClient as any).api.me.profile.$put({
        json: {
          display_name: '更新されたユーザー名',
          settings: {},
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('Profile updated:', data);
      alert('プロフィールを更新しました');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Update skill profiles
  const handleUpdateSkills = async () => {
    try {
      setUpdating(true);
      const res = await (apiClient as any).api.me['skill-profiles'].$put({
        json: {
          primary_category: 'technology',
          skill_level: 'intermediate',
          interests: ['AI', 'Web開発', 'TypeScript'],
          skills: [
            { keyword: 'TypeScript', level: 'advanced' },
            { keyword: 'React', level: 'intermediate' },
          ],
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('Skills updated:', data);
      alert('スキルプロフィールを更新しました');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update skills');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
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
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure the backend server is running at http://localhost:3001
          </p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">User ID:</span>
              <p className="text-gray-900">{profile?.user.user_id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{profile?.user.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Display Name:</span>
              <p className="text-gray-900">{profile?.user.display_name || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Skill Profile */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skill Profile</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Primary Category:</span>
              <p className="text-gray-900">{profile?.profile.primary_category}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Skill Level:</span>
              <p className="text-gray-900">{profile?.profile.skill_level}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Interests:</span>
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
                  profile.profile.skills.map((skill: { keyword: string; level: string }) => (
                    <span
                      key={skill.keyword}
                      className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded"
                    >
                      {skill.keyword} ({skill.level})
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400">No skills set</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
          <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(profile?.settings, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions (Hono RPC Demo)</h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleUpdateProfile}
              disabled={updating}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
            <button
              type="button"
              onClick={handleUpdateSkills}
              disabled={updating}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ml-0 sm:ml-3"
            >
              {updating ? 'Updating...' : 'Update Skills'}
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Note: These buttons demonstrate Hono RPC type-safe API calls. Check the browser console
            for API responses.
          </p>
        </div>

        {/* Code Example */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Code Example</h2>
          <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-auto">
            {`// Type-safe API calls with Hono RPC
import { apiClient } from '@/lib/api';

// GET request
const res = await apiClient.api.me.profile.$get();
const data = await res.json();

// PUT request
await apiClient.api.me.profile.$put({
  json: {
    display_name: 'New Name',
    settings: {},
  },
});

// All types are automatically inferred from backend!`}
          </pre>
        </div>
      </div>
    </div>
  );
}
