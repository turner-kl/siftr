/**
 * User Entity (Domain Model)
 */

import { type Result, ValidationError, err, ok } from '../../core/result';
import type { Category, TechnicalLevel, UserId } from '../types';

/**
 * User skill
 */
export interface UserSkill {
  readonly keyword: string;
  readonly level: TechnicalLevel;
}

/**
 * User profile
 */
export interface UserProfile {
  readonly interests: readonly string[];
  readonly skills: readonly UserSkill[];
  readonly primaryCategory: Category;
  readonly skillLevel: TechnicalLevel;
}

/**
 * User Entity
 */
export interface User {
  readonly userId: UserId;
  readonly email: string;
  readonly cognitoSub: string;
  readonly displayName?: string;
  readonly profile: UserProfile;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly settings: Record<string, unknown>;
}

/**
 * Parameters for creating a user
 */
export interface CreateUserParams {
  userId: UserId;
  email: string;
  cognitoSub: string;
  displayName?: string;
  primaryCategory: Category;
  skillLevel: TechnicalLevel;
  interests?: string[];
  skills?: UserSkill[];
}

/**
 * Create a new user
 */
export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // Validation
  if (!params.email || !isValidEmail(params.email)) {
    return err(new ValidationError('有効なメールアドレスが必要です'));
  }

  if (!params.cognitoSub || params.cognitoSub.trim().length === 0) {
    return err(new ValidationError('Cognito Subは必須です'));
  }

  const now = Date.now();

  return ok({
    userId: params.userId,
    email: params.email.toLowerCase().trim(),
    cognitoSub: params.cognitoSub,
    displayName: params.displayName?.trim(),
    profile: {
      primaryCategory: params.primaryCategory,
      skillLevel: params.skillLevel,
      interests: params.interests || [],
      skills: params.skills || [],
    },
    settings: {},
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Update user profile
 */
export function updateUserProfile(
  user: User,
  updates: {
    primaryCategory?: Category;
    skillLevel?: TechnicalLevel;
    interests?: string[];
    skills?: UserSkill[];
  }
): User {
  return {
    ...user,
    profile: {
      ...user.profile,
      ...updates,
    },
    updatedAt: Date.now(),
  };
}

/**
 * Update user settings
 */
export function updateUserSettings(user: User, settings: Record<string, unknown>): User {
  return {
    ...user,
    settings: {
      ...user.settings,
      ...settings,
    },
    updatedAt: Date.now(),
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
    updatedAt: Date.now(),
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
    updatedAt: Date.now(),
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
    updatedAt: Date.now(),
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
    updatedAt: Date.now(),
  };
}

/**
 * Reconstruct user from persistence layer
 */
export function reconstructUser(data: User): Result<User, ValidationError> {
  if (!data.userId || !data.email) {
    return err(new ValidationError('UserId and email are required'));
  }

  return ok(data);
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
