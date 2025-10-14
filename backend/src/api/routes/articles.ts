import { Hono } from 'hono';
import { z } from 'zod';
import type { ArticleApplicationService } from '../../application/articleService';
import type { AuthUser } from '../middleware/auth';

// Hono context type
type Variables = {
  user: AuthUser;
  articleService: ArticleApplicationService;
};

export const articlesRouter = new Hono<{ Variables: Variables }>();

// Query schema for GET /articles
const GetArticlesQuerySchema = z.object({
  category: z.enum(['technology', 'hr', 'business']).optional(),
  priority_min: z.string().transform(Number).pipe(z.number().min(0).max(100)).optional(),
  priority_max: z.string().transform(Number).pipe(z.number().min(0).max(100)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('20'),
  cursor: z.string().optional(),
});

// Request schema for POST /articles/manual
const CreateArticleSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).optional(),
  source_type: z.enum(['manual', 'rss', 'twitter', 'reddit', 'hackernews']).default('manual'),
  content_preview: z.string().max(500).optional(),
  language: z.enum(['ja', 'en']).default('ja'),
});

// GET /api/articles
articlesRouter.get('/', async (c) => {
  const user = c.get('user');
  const articleService = c.get('articleService');

  const queryResult = GetArticlesQuerySchema.safeParse(c.req.query());

  if (!queryResult.success) {
    return c.json({ error: 'Invalid query parameters', details: queryResult.error }, 400);
  }

  const query = queryResult.data;

  // Call application service
  const result = await articleService.getArticlesByUserId({
    userId: user.sub,
    category: query.category,
    limit: query.limit,
    cursor: query.cursor,
    priorityMin: query.priority_min,
    priorityMax: query.priority_max,
  });

  // Handle Result type
  if (!result.ok) {
    if (result.error.name === 'NotFoundError') {
      return c.json({ error: result.error.message }, 404);
    }
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({
    articles: result.value,
    total: result.value.length,
  });
});

// GET /api/articles/:article_id
articlesRouter.get('/:article_id', async (c) => {
  const articleService = c.get('articleService');
  const articleId = c.req.param('article_id');

  // Call application service
  const result = await articleService.getArticleById(articleId);

  // Handle Result type
  if (!result.ok) {
    return c.json({ error: result.error.message }, 400);
  }

  if (!result.value) {
    return c.json({ error: '記事が見つかりません' }, 404);
  }

  return c.json({
    article: result.value,
  });
});

// POST /api/articles/manual
articlesRouter.post('/manual', async (c) => {
  const user = c.get('user');
  const articleService = c.get('articleService');

  const bodyResult = CreateArticleSchema.safeParse(await c.req.json());
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error }, 400);
  }

  const data = bodyResult.data;

  // Call application service
  const result = await articleService.createArticle({
    userId: user.sub,
    sourceId: crypto.randomUUID(), // Generate source ID
    sourceType: data.source_type,
    url: data.url,
    title: data.title || data.url, // Use URL as fallback title
    contentPreview: data.content_preview || '',
    language: data.language,
  });

  // Handle Result type
  if (!result.ok) {
    if (result.error.name === 'NotFoundError') {
      return c.json({ error: result.error.message }, 404);
    }
    return c.json({ error: result.error.message }, 400);
  }

  return c.json(
    {
      message: 'Article created successfully',
      article: result.value,
    },
    201
  );
});

// DELETE /api/articles/:article_id
articlesRouter.delete('/:article_id', async (c) => {
  const articleService = c.get('articleService');
  const articleId = c.req.param('article_id');

  // Call application service
  const result = await articleService.deleteArticle(articleId);

  // Handle Result type
  if (!result.ok) {
    if (result.error.name === 'NotFoundError') {
      return c.json({ error: result.error.message }, 404);
    }
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ message: 'Article deleted successfully' });
});

// POST /api/articles/:article_id/calculate-priority
articlesRouter.post('/:article_id/calculate-priority', async (c) => {
  const user = c.get('user');
  const articleService = c.get('articleService');
  const articleId = c.req.param('article_id');

  // Call application service
  const result = await articleService.calculateArticlePriority(articleId, user.sub);

  // Handle Result type
  if (!result.ok) {
    if (result.error.name === 'NotFoundError') {
      return c.json({ error: result.error.message }, 404);
    }
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({
    message: 'Priority calculated successfully',
    article: result.value,
  });
});

// Interaction tracking endpoint
const InteractionSchema = z.object({
  interaction_type: z.enum(['view', 'click', 'save', 'dismiss', 'rate']),
  read_time_seconds: z.number().int().positive().optional(),
  scroll_depth_percent: z.number().min(0).max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.enum(['useful', 'not_useful', 'misleading']).optional(),
  feedback_comment: z.string().optional(),
});

articlesRouter.post('/:article_id/interact', async (c) => {
  const user = c.get('user');
  const articleId = c.req.param('article_id');

  const bodyResult = InteractionSchema.safeParse(await c.req.json());
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error }, 400);
  }

  const interaction = bodyResult.data;

  // TODO: Implement interaction recording with InteractionService
  // For now, just acknowledge the request
  console.log('Interaction recorded:', { articleId, userId: user.sub, interaction });

  return c.json({ success: true, message: 'Interaction recorded' });
});
