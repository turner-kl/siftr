import { z } from '@hono/zod-openapi';

// ============================================================================
// Request bodies
// ============================================================================

export const UpdateProfileSchema = z.object({
  display_name: z.string().optional().openapi({
    description: '表示名',
    example: '田中太郎',
  }),
  settings: z.record(z.unknown()).optional().openapi({
    description: 'ユーザー設定',
  }),
});

export const SkillProfileSchema = z.object({
  category: z.enum(['technology', 'hr', 'business']).openapi({
    description: 'カテゴリ',
    example: 'technology',
  }),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).openapi({
    description: 'スキルレベル',
    example: 'intermediate',
  }),
  interests: z.array(z.string()).openapi({
    description: '興味のあるトピック',
    example: ['AI', 'Web開発'],
  }),
});

export const UpdateSkillProfilesSchema = z.object({
  profiles: z.array(SkillProfileSchema).openapi({
    description: 'スキルプロフィールの配列',
  }),
});

export const UpdatePreferencesSchema = z.object({
  notification_enabled: z.boolean().optional().openapi({
    description: '通知の有効化',
    example: true,
  }),
  email_digest_frequency: z.enum(['daily', 'weekly', 'never']).optional().openapi({
    description: 'メールダイジェストの頻度',
    example: 'daily',
  }),
  default_category: z.enum(['technology', 'hr', 'business']).optional().openapi({
    description: 'デフォルトカテゴリ',
    example: 'technology',
  }),
  articles_per_page: z.number().int().min(10).max(100).optional().openapi({
    description: '1ページあたりの記事数',
    example: 20,
  }),
  language_preference: z.enum(['ja', 'en', 'both']).optional().openapi({
    description: '言語設定',
    example: 'ja',
  }),
});

// ============================================================================
// Response schemas
// ============================================================================

export const UserProfileResponseSchema = z.object({
  user: z.object({
    userId: z.string().openapi({ example: 'user-123' }),
    email: z.string().email().openapi({ example: 'user@example.com' }),
    displayName: z.string().openapi({ example: 'ユーザー名' }),
  }),
  skill_profiles: z.array(z.any()).openapi({ description: 'スキルプロフィール' }),
});

export const PreferencesResponseSchema = z.object({
  notification_enabled: z.boolean().openapi({ example: true }),
  email_digest_frequency: z.enum(['daily', 'weekly', 'never']).openapi({ example: 'daily' }),
  default_category: z.enum(['technology', 'hr', 'business']).openapi({ example: 'technology' }),
  articles_per_page: z.number().int().openapi({ example: 20 }),
  language_preference: z.enum(['ja', 'en', 'both']).openapi({ example: 'ja' }),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
});

export const ErrorResponseSchema = z.object({
  error: z.string().openapi({ example: 'エラーメッセージ' }),
  details: z.any().optional(),
});
