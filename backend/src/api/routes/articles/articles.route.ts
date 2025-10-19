import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { ArticleApplicationService } from '../../../application/articleService';
import { DynamoDBArticleRepository } from '../../../infrastructure/db/dynamodb-article-repository';
import { InMemoryArticleRepository } from '../../../infrastructure/db/inMemoryArticleRepository';
import { InMemoryUserRepository } from '../../../infrastructure/db/inMemoryUserRepository';
import type { AuthUser } from '../../middleware/auth';
import {
  ArticleResponseSchema,
  ArticlesListResponseSchema,
  CreateArticleSchema,
  ErrorResponseSchema,
  GetArticlesQuerySchema,
  InteractionResponseSchema,
  InteractionSchema,
  MessageResponseSchema,
} from './articles.schema';

// Hono context type
type Variables = {
  user: AuthUser;
  articleService: ArticleApplicationService;
};

export const articlesRouter = new OpenAPIHono<{ Variables: Variables }>();

// Initialize services for this router only
const isDevelopment = process.env.NODE_ENV !== 'production';
const useInMemory = process.env.USE_IN_MEMORY === 'true' || isDevelopment;

const articleRepository = useInMemory
  ? new InMemoryArticleRepository()
  : new DynamoDBArticleRepository();

const userRepository = new InMemoryUserRepository();
const articleService = new ArticleApplicationService(articleRepository, userRepository);

// DI middleware for this router
articlesRouter.use('*', async (c, next) => {
  c.set('articleService', articleService);
  await next();
});

// ============================================================================
// Routes
// ============================================================================

// GET /api/articles
const getArticlesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Articles'],
  summary: '記事一覧取得',
  description: 'ユーザーの記事一覧を取得します。カテゴリ、優先度でフィルタリング可能です。',
  request: {
    query: GetArticlesQuerySchema,
  },
  responses: {
    200: {
      description: '記事一覧の取得に成功',
      content: {
        'application/json': {
          schema: ArticlesListResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'リソースが見つかりません',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

articlesRouter.openapi(getArticlesRoute, async (c) => {
  const user = c.get('user');
  const articleService = c.get('articleService');
  const query = c.req.valid('query');

  // Parse numeric values
  const priorityMin = query.priority_min ? Number(query.priority_min) : undefined;
  const priorityMax = query.priority_max ? Number(query.priority_max) : undefined;
  const limit = Number(query.limit);

  // Call application service
  const result = await articleService.getArticlesByUserId({
    userId: user.sub,
    category: query.category,
    limit,
    cursor: query.cursor,
    priorityMin,
    priorityMax,
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
      articles: result.value,
      total: result.value.length,
    },
    200
  );
});

// GET /api/articles/:article_id
const getArticleByIdRoute = createRoute({
  method: 'get',
  path: '/{article_id}',
  tags: ['Articles'],
  summary: '記事詳細取得',
  description: '指定されたIDの記事詳細を取得します。',
  request: {
    params: z.object({
      article_id: z.string().openapi({ description: '記事ID', example: 'article-123' }),
    }),
  },
  responses: {
    200: {
      description: '記事の取得に成功',
      content: {
        'application/json': {
          schema: ArticleResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '記事が見つかりません',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

articlesRouter.openapi(getArticleByIdRoute, async (c) => {
  const articleService = c.get('articleService');
  const { article_id } = c.req.valid('param');

  // Call application service
  const result = await articleService.getArticleById(article_id);

  // Handle Result type
  if (!result.ok) {
    return c.json({ error: result.error.message }, 400);
  }

  if (!result.value) {
    return c.json({ error: '記事が見つかりません' }, 404);
  }

  return c.json(
    {
      article: result.value,
    },
    200
  );
});

// POST /api/articles/manual
const createArticleRoute = createRoute({
  method: 'post',
  path: '/manual',
  tags: ['Articles'],
  summary: '手動で記事を追加',
  description: 'URLを指定して手動で記事を追加します。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateArticleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '記事の作成に成功',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'リソースが見つかりません',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

articlesRouter.openapi(createArticleRoute, async (c) => {
  const user = c.get('user');
  const articleService = c.get('articleService');
  const data = c.req.valid('json');

  // Call application service
  const result = await articleService.createArticle({
    userId: user.sub,
    sourceId: crypto.randomUUID(),
    sourceType: data.source_type,
    url: data.url,
    title: data.title || data.url,
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
const deleteArticleRoute = createRoute({
  method: 'delete',
  path: '/{article_id}',
  tags: ['Articles'],
  summary: '記事削除',
  description: '指定されたIDの記事を削除します。',
  request: {
    params: z.object({
      article_id: z.string().openapi({ description: '記事ID', example: 'article-123' }),
    }),
  },
  responses: {
    200: {
      description: '記事の削除に成功',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '記事が見つかりません',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

articlesRouter.openapi(deleteArticleRoute, async (c) => {
  const articleService = c.get('articleService');
  const { article_id } = c.req.valid('param');

  // Call application service
  const result = await articleService.deleteArticle(article_id);

  // Handle Result type
  if (!result.ok) {
    if (result.error.name === 'NotFoundError') {
      return c.json({ error: result.error.message }, 404);
    }
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ message: 'Article deleted successfully' }, 200);
});

// POST /api/articles/:article_id/calculate-priority
const calculatePriorityRoute = createRoute({
  method: 'post',
  path: '/{article_id}/calculate-priority',
  tags: ['Articles'],
  summary: '記事の優先度を計算',
  description: '指定されたIDの記事の優先度を再計算します。',
  request: {
    params: z.object({
      article_id: z.string().openapi({ description: '記事ID', example: 'article-123' }),
    }),
  },
  responses: {
    200: {
      description: '優先度の計算に成功',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '記事が見つかりません',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

articlesRouter.openapi(calculatePriorityRoute, async (c) => {
  const user = c.get('user');
  const articleService = c.get('articleService');
  const { article_id } = c.req.valid('param');

  // Call application service
  const result = await articleService.calculateArticlePriority(article_id, user.sub);

  // Handle Result type
  if (!result.ok) {
    if (result.error.name === 'NotFoundError') {
      return c.json({ error: result.error.message }, 404);
    }
    return c.json({ error: result.error.message }, 400);
  }

  return c.json(
    {
      message: 'Priority calculated successfully',
      article: result.value,
    },
    200
  );
});

// POST /api/articles/:article_id/interact
const interactRoute = createRoute({
  method: 'post',
  path: '/{article_id}/interact',
  tags: ['Articles'],
  summary: '記事とのインタラクションを記録',
  description: '記事の閲覧、クリック、保存、却下、評価などのインタラクションを記録します。',
  request: {
    params: z.object({
      article_id: z.string().openapi({ description: '記事ID', example: 'article-123' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: InteractionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'インタラクションの記録に成功',
      content: {
        'application/json': {
          schema: InteractionResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

articlesRouter.openapi(interactRoute, async (c) => {
  const user = c.get('user');
  const { article_id } = c.req.valid('param');
  const interaction = c.req.valid('json');

  // TODO: Implement interaction recording with InteractionService
  // For now, just acknowledge the request
  console.log('Interaction recorded:', { articleId: article_id, userId: user.sub, interaction });

  return c.json({ success: true, message: 'Interaction recorded' }, 200);
});
