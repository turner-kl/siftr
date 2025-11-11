/**
 * API Layer Schemas for User Profile (/me endpoints)
 * Independent from Domain layer schemas with snake_case convention
 * Conversion handled by toCamelCase/toSnakeCase utilities
 */

import { z } from '@hono/zod-openapi';
import { categorySchema } from '../../../domain/shared/category.schema';
import { technicalLevelSchema } from '../../../domain/shared/technicalLevel.schema';

// ============================================================================
// Request bodies (snake_case for API)
// ============================================================================

/**
 * Update user profile (display_name, settings)
 * API layer schema with snake_case keys
 */
export const UpdateProfileSchema = z
  .object({
    display_name: z.string().optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .openapi({
    description: 'ユーザープロフィール更新',
    example: {
      display_name: '田中太郎',
      settings: {},
    },
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
export const UpdateSkillProfilesSchema = z
  .object({
    primary_category: categorySchema.optional(),
    skill_level: technicalLevelSchema.optional(),
    interests: z.array(z.string()).optional(),
    skills: z.array(UserSkillApiSchema).optional(),
  })
  .openapi({
    description: 'スキルプロフィール更新',
    example: {
      primary_category: 'technology',
      skill_level: 'intermediate',
      interests: ['AI', 'Web開発'],
      skills: [{ keyword: 'TypeScript', level: 'advanced' }],
    },
  });

/**
 * User preferences (API layer schema)
 */
export const UpdatePreferencesSchema = z
  .object({
    notification_enabled: z.boolean().optional(),
    email_digest_frequency: z.enum(['daily', 'weekly', 'never']).optional(),
    default_category: z.string().optional(),
    articles_per_page: z.number().int().min(10).max(100).optional(),
    language_preference: z.enum(['ja', 'en', 'both']).optional(),
  })
  .openapi({
    description: 'ユーザー設定',
    example: {
      notification_enabled: true,
      email_digest_frequency: 'daily',
      default_category: 'technology',
      articles_per_page: 20,
      language_preference: 'ja',
    },
  });

// ============================================================================
// Response schemas (snake_case for API)
// ============================================================================

/**
 * User object in API responses
 */
export const UserApiSchema = z.object({
  user_id: z.string().openapi({ example: 'user-123' }),
  email: z.string().email().openapi({ example: 'user@example.com' }),
  display_name: z.string().optional().openapi({ example: 'ユーザー名' }),
});

/**
 * User profile object in API responses
 */
export const UserProfileApiSchema = z.object({
  primary_category: categorySchema.openapi({ example: 'technology' }),
  skill_level: technicalLevelSchema.openapi({ example: 'intermediate' }),
  interests: z.array(z.string()).openapi({ example: ['AI', 'Web開発'] }),
  skills: z.array(UserSkillApiSchema).openapi({
    example: [{ keyword: 'TypeScript', level: 'advanced' }],
  }),
});

/**
 * User profile response schema
 */
export const UserProfileResponseSchema = z.object({
  user: UserApiSchema,
  profile: UserProfileApiSchema,
  settings: z.record(z.unknown()).openapi({ example: {} }),
});

/**
 * User preferences response schema
 */
export const PreferencesResponseSchema = z.object({
  notification_enabled: z.boolean().openapi({ example: true }),
  email_digest_frequency: z.enum(['daily', 'weekly', 'never']).openapi({ example: 'daily' }),
  default_category: categorySchema.openapi({ example: 'technology' }),
  articles_per_page: z.number().int().openapi({ example: 20 }),
  language_preference: z.enum(['ja', 'en', 'both']).openapi({ example: 'ja' }),
});
