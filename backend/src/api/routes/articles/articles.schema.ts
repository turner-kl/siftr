import { z } from '@hono/zod-openapi';

// ============================================================================
// Query parameters
// ============================================================================

export const GetArticlesQuerySchema = z.object({
  category: z
    .enum(['technology', 'hr', 'business'])
    .optional()
    .openapi({ description: '記事のカテゴリ', example: 'technology' }),
  priority_min: z.string().optional().openapi({ description: '優先度の最小値', example: '50' }),
  priority_max: z.string().optional().openapi({ description: '優先度の最大値', example: '100' }),
  limit: z.string().optional().default('20').openapi({ description: '取得件数', example: '20' }),
  cursor: z.string().optional().openapi({ description: 'ページネーション用カーソル' }),
});

// ============================================================================
// Request bodies
// ============================================================================

export const CreateArticleSchema = z.object({
  url: z
    .string()
    .url()
    .openapi({ description: '記事のURL', example: 'https://example.com/article' }),
  title: z.string().min(1).optional().openapi({
    description: '記事のタイトル（省略時はURLを使用）',
    example: 'サンプル記事タイトル',
  }),
  source_type: z
    .enum(['manual', 'rss', 'twitter', 'reddit', 'hackernews'])
    .default('manual')
    .openapi({ description: '記事のソースタイプ', example: 'manual' }),
  content_preview: z.string().max(500).optional().openapi({
    description: 'コンテンツプレビュー（最大500文字）',
    example: 'This is a preview...',
  }),
  language: z
    .enum(['ja', 'en'])
    .default('ja')
    .openapi({ description: '記事の言語', example: 'ja' }),
});

export const InteractionSchema = z.object({
  interaction_type: z
    .enum(['view', 'click', 'save', 'dismiss', 'rate'])
    .openapi({ description: 'インタラクションのタイプ', example: 'view' }),
  read_time_seconds: z
    .number()
    .int()
    .positive()
    .optional()
    .openapi({ description: '読了時間（秒）', example: 120 }),
  scroll_depth_percent: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .openapi({ description: 'スクロール深度（％）', example: 75 }),
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .openapi({ description: '評価（1-5）', example: 4 }),
  feedback: z
    .enum(['useful', 'not_useful', 'misleading'])
    .optional()
    .openapi({ description: 'フィードバック', example: 'useful' }),
  feedback_comment: z
    .string()
    .optional()
    .openapi({ description: 'フィードバックコメント', example: 'とても役に立ちました' }),
});

// ============================================================================
// Response schemas
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string().openapi({ example: 'エラーメッセージ' }),
  details: z.any().optional(),
});

export const ArticleSchema = z.object({
  articleId: z.string(),
  userId: z.string(),
  url: z.string(),
  title: z.string(),
  category: z.string(),
  priorityScore: z.number(),
  // ... その他のフィールドは省略（実際のArticle型に合わせて定義）
});

export const ArticlesListResponseSchema = z.object({
  articles: z.array(ArticleSchema).openapi({ description: '記事一覧' }),
  total: z.number().openapi({ description: '記事の合計数', example: 10 }),
});

export const ArticleResponseSchema = z.object({
  article: ArticleSchema.openapi({ description: '記事情報' }),
});

export const MessageResponseSchema = z.object({
  message: z.string().openapi({ example: '操作が成功しました' }),
  article: ArticleSchema.optional(),
});

export const InteractionResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'Interaction recorded' }),
});
