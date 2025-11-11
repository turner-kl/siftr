/**
 * User Domain Schemas (Single Source of Truth with z.brand and z.infer)
 * All validation rules and types for User aggregate are defined here using Zod
 */

import { z } from 'zod';
import { type Category, categorySchema } from '../shared/category.schema';
import { type TechnicalLevel, technicalLevelSchema } from '../shared/technicalLevel.schema';

// Re-export for convenience
export type { Category, TechnicalLevel };

// ============================================================================
// Value Object Schemas (SSOT: schema + type)
// ============================================================================

/**
 * UserId schema with validation and branding
 */
export const userIdSchema = z.string().uuid('有効なUUID形式が必要です').brand<'UserId'>();
export type UserId = z.infer<typeof userIdSchema>;

/**
 * Email schema with validation and transformation
 */
export const emailSchema = z
  .string()
  .email('有効なメールアドレスが必要です')
  .transform((email) => email.toLowerCase().trim());

// ============================================================================
// Sub-Entity Schemas (SSOT: schema + type)
// ============================================================================

/**
 * User skill schema
 */
export const userSkillSchema = z.object({
  keyword: z.string().min(1),
  level: technicalLevelSchema,
});

export type UserSkill = z.infer<typeof userSkillSchema>;

/**
 * User profile schema
 */
export const userProfileSchema = z.object({
  interests: z.array(z.string()),
  skills: z.array(userSkillSchema),
  primaryCategory: categorySchema,
  skillLevel: technicalLevelSchema,
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// ============================================================================
// Entity Schemas (SSOT: schema + type)
// ============================================================================

/**
 * User Entity schema
 */
export const userSchema = z.object({
  userId: userIdSchema,
  email: emailSchema,
  cognitoSub: z.string().min(1, 'Cognito Subは必須です'),
  displayName: z.string().optional(),
  profile: userProfileSchema,
  settings: z.record(z.unknown()),
});

export type User = z.infer<typeof userSchema>;

// ============================================================================
// Create/Update Parameter Schemas (SSOT: schema + type)
// ============================================================================

/**
 * Parameters for creating a user
 * Used by Application layer to validate unknown request
 */
export const createUserParamsSchema = z.object({
  userId: userIdSchema,
  email: emailSchema,
  cognitoSub: z.string().min(1, 'Cognito Subは必須です'),
  displayName: z.string().optional(),
  primaryCategory: categorySchema,
  skillLevel: technicalLevelSchema,
  interests: z.array(z.string()).optional(),
  skills: z.array(userSkillSchema).optional(),
});

export type CreateUserParams = z.infer<typeof createUserParamsSchema>;

/**
 * Parameters for updating user profile
 * Used by Application layer to validate unknown request
 */
export const updateUserProfileParamsSchema = z.object({
  primaryCategory: categorySchema.optional(),
  skillLevel: technicalLevelSchema.optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(userSkillSchema).optional(),
});

export type UpdateUserProfileParams = z.infer<typeof updateUserProfileParamsSchema>;

/**
 * Parameters for updating user settings
 * Used by Application layer to validate unknown request
 */
export const updateUserSettingsParamsSchema = z.record(z.unknown());

export type UpdateUserSettingsParams = z.infer<typeof updateUserSettingsParamsSchema>;
