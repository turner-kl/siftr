/**
 * API Layer Schemas for User Profile (/me endpoints)
 * Independent from Domain layer schemas with snake_case convention
 * Conversion handled by toCamelCase/toSnakeCase utilities
 */

import { z } from 'zod';
import { categorySchema } from '../../../domain/shared/category.schema';
import { technicalLevelSchema } from '../../../domain/shared/technicalLevel.schema';

// ============================================================================
// Request bodies (snake_case for API)
// ============================================================================

/**
 * Update user profile (display_name, settings)
 * API layer schema with snake_case keys
 */
export const UpdateProfileSchema = z.object({
  display_name: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

/**
 * User skill schema (API layer)
 */
export const UserSkillApiSchema = z.object({
  keyword: z.string(),
  level: technicalLevelSchema,
});

/**
 * Update user skill profile
 * Independent API schema with snake_case keys
 */
export const UpdateSkillProfilesSchema = z.object({
  primary_category: categorySchema.optional(),
  skill_level: technicalLevelSchema.optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(UserSkillApiSchema).optional(),
});

/**
 * User preferences (API layer schema)
 */
export const UpdatePreferencesSchema = z.object({
  notification_enabled: z.boolean().optional(),
  email_digest_frequency: z.enum(['daily', 'weekly', 'never']).optional(),
  default_category: z.string().optional(),
  articles_per_page: z.number().int().min(10).max(100).optional(),
  language_preference: z.enum(['ja', 'en', 'both']).optional(),
});

// ============================================================================
// Response schemas (snake_case for API)
// ============================================================================

/**
 * User object in API responses
 */
export const UserApiSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  display_name: z.string().optional(),
});

/**
 * User profile object in API responses
 */
export const UserProfileApiSchema = z.object({
  primary_category: categorySchema,
  skill_level: technicalLevelSchema,
  interests: z.array(z.string()),
  skills: z.array(UserSkillApiSchema),
});

/**
 * User profile response schema
 */
export const UserProfileResponseSchema = z.object({
  user: UserApiSchema,
  profile: UserProfileApiSchema,
  settings: z.record(z.string(), z.unknown()),
});

/**
 * User preferences response schema
 */
export const PreferencesResponseSchema = z.object({
  notification_enabled: z.boolean(),
  email_digest_frequency: z.enum(['daily', 'weekly', 'never']),
  default_category: categorySchema,
  articles_per_page: z.number().int(),
  language_preference: z.enum(['ja', 'en', 'both']),
});
