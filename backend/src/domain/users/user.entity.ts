/**
 * User Entity (Domain Model)
 * Pure functions with Always-Valid Domain Model pattern
 * - Form validation: handled by Schema at Application layer
 * - Business rules: handled here with Result type
 */

import { type Result, ok } from 'neverthrow';
import type { ValidationError } from '../../core/errors';
import type {
  Category,
  CreateUserParams,
  TechnicalLevel,
  UpdateUserProfileParams,
  UpdateUserSettingsParams,
  User,
  UserId,
  UserProfile,
  UserSkill,
} from './user.schema';

// Re-export types for convenience
export type {
  User,
  UserId,
  UserProfile,
  UserSkill,
  Category,
  TechnicalLevel,
  CreateUserParams,
  UpdateUserProfileParams,
  UpdateUserSettingsParams,
};

// ============================================================================
// UserId Utility Functions
// ============================================================================

/**
 * Generate a new random UserId
 */
export function generateUserId(): UserId {
  return crypto.randomUUID() as UserId;
}

// ============================================================================
// Entity Functions
// ============================================================================

/**
 * Create a new user
 * Form validation is handled by Schema at Application layer
 * This function handles business rules only
 */
export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // Business rules (none currently, but extensible)
  const user: User = {
    userId: params.userId,
    email: params.email,
    cognitoSub: params.cognitoSub,
    displayName: params.displayName,
    profile: {
      primaryCategory: params.primaryCategory,
      skillLevel: params.skillLevel,
      interests: params.interests || [],
      skills: params.skills || [],
    },
    settings: {},
  };

  return ok(user);
}

/**
 * Update user profile
 * Form validation is handled by Schema at Application layer
 * This function handles business rules only
 */
export function updateUserProfile(
  user: User,
  updates: UpdateUserProfileParams
): Result<User, ValidationError> {
  // Business rules (none currently, but extensible)
  const updated: User = {
    ...user,
    profile: {
      ...user.profile,
      primaryCategory: updates.primaryCategory ?? user.profile.primaryCategory,
      skillLevel: updates.skillLevel ?? user.profile.skillLevel,
      interests: updates.interests ?? user.profile.interests,
      skills: updates.skills ?? user.profile.skills,
    },
  };

  return ok(updated);
}

/**
 * Update user settings
 */
export function updateUserSettings(user: User, settings: UpdateUserSettingsParams): User {
  return {
    ...user,
    settings: {
      ...user.settings,
      ...settings,
    },
  };
}

/**
 * Add interest to user profile
 */
export function addInterest(user: User, interest: string): User {
  if (user.profile.interests.includes(interest)) {
    return user; // Already exists, no change
  }

  return {
    ...user,
    profile: {
      ...user.profile,
      interests: [...user.profile.interests, interest],
    },
  };
}

/**
 * Remove interest from user profile
 */
export function removeInterest(user: User, interest: string): User {
  return {
    ...user,
    profile: {
      ...user.profile,
      interests: user.profile.interests.filter((i) => i !== interest),
    },
  };
}

/**
 * Add or update skill
 */
export function upsertSkill(user: User, skill: UserSkill): User {
  const existingSkills = user.profile.skills.filter((s) => s.keyword !== skill.keyword);

  return {
    ...user,
    profile: {
      ...user.profile,
      skills: [...existingSkills, skill],
    },
  };
}

/**
 * Remove skill
 */
export function removeSkill(user: User, keyword: string): User {
  return {
    ...user,
    profile: {
      ...user.profile,
      skills: user.profile.skills.filter((s) => s.keyword !== keyword),
    },
  };
}

/**
 * Reconstruct user from persistence layer
 * Data should be validated by Schema before calling this function
 */
export function reconstructUser(data: User): Result<User, ValidationError> {
  // Business rules validation (if any)
  return ok(data);
}
