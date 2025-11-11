/**
 * API Layer Schemas for User Profile (/me endpoints)
 * Uses Domain layer schemas as SSOT
 *
 * TODO: camelCase → snake_case変換を実装
 * TODO: ts-case-convert や radash を使って変換層を追加する
 */

import { z } from '@hono/zod-openapi';
import { categorySchema } from '../../../domain/shared/category.schema';
import { updateUserProfileParamsSchema } from '../../../domain/users/user.schema';

// Re-export common schemas for backward compatibility

// ============================================================================
// Request bodies (reusing domain schemas)
// ============================================================================

/**
 * Update user profile (displayName, settings)
 * TODO: snake_case変換を追加
 */
export const UpdateProfileSchema = z
  .object({
    displayName: z.string().optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .openapi({
    description: 'ユーザープロフィール更新',
    example: {
      displayName: '田中太郎',
      settings: {},
    },
  });

/**
 * Update user skill profile
 * Reuses domain schema
 * TODO: snake_case変換を追加
 */
export const UpdateSkillProfilesSchema = updateUserProfileParamsSchema.openapi({
  description: 'スキルプロフィール更新',
  example: {
    primaryCategory: 'technology',
    skillLevel: 'intermediate',
    interests: ['AI', 'Web開発'],
    skills: [{ keyword: 'TypeScript', level: 'advanced' }],
  },
});

/**
 * User preferences (placeholder for future implementation)
 * TODO: Define in domain layer
 * TODO: snake_case変換を追加
 */
export const UpdatePreferencesSchema = z
  .object({
    notificationEnabled: z.boolean().optional(),
    emailDigestFrequency: z.enum(['daily', 'weekly', 'never']).optional(),
    defaultCategory: z.string().optional(),
    articlesPerPage: z.number().int().min(10).max(100).optional(),
    languagePreference: z.enum(['ja', 'en', 'both']).optional(),
  })
  .openapi({
    description: 'ユーザー設定',
    example: {
      notificationEnabled: true,
      emailDigestFrequency: 'daily',
      defaultCategory: 'technology',
      articlesPerPage: 20,
      languagePreference: 'ja',
    },
  });

// ============================================================================
// Response schemas
// ============================================================================

export const UserProfileResponseSchema = z.object({
  user: z.object({
    userId: z.string().openapi({ example: 'user-123' }),
    email: z.string().email().openapi({ example: 'user@example.com' }),
    displayName: z.string().optional().openapi({ example: 'ユーザー名' }),
  }),
  skill_profiles: z.array(z.any()).openapi({ description: 'スキルプロフィール' }),
});

export const PreferencesResponseSchema = z.object({
  notification_enabled: z.boolean().openapi({ example: true }),
  email_digest_frequency: z.enum(['daily', 'weekly', 'never']).openapi({ example: 'daily' }),
  default_category: categorySchema.openapi({ example: 'technology' }),
  articles_per_page: z.number().int().openapi({ example: 20 }),
  language_preference: z.enum(['ja', 'en', 'both']).openapi({ example: 'ja' }),
});
