import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';
import { articlesRouter } from './routes/articles';
import { userRouter } from './routes/user';

// Services and Repositories
import { ArticleApplicationService } from '../application/articleService';
import { DynamoDBArticleRepository } from '../infrastructure/db/dynamodb-article-repository';
import { InMemoryArticleRepository } from '../infrastructure/db/inMemoryArticleRepository';
import { InMemoryUserRepository } from '../infrastructure/db/inMemoryUserRepository';

// Types for Hono context
type Variables = {
  user: {
    sub: string;
    email: string;
  };
  articleService: ArticleApplicationService;
};

const app = new Hono<{ Variables: Variables }>();

// Initialize repositories
const isDevelopment = process.env.NODE_ENV !== 'production';
const useInMemory = process.env.USE_IN_MEMORY === 'true' || isDevelopment;

const articleRepository = useInMemory
  ? new InMemoryArticleRepository()
  : new DynamoDBArticleRepository();

const userRepository = useInMemory ? new InMemoryUserRepository() : new InMemoryUserRepository(); // TODO: Replace with DynamoDBUserRepository when implemented

// Initialize services
const articleService = new ArticleApplicationService(articleRepository, userRepository);

// Dependency Injection Middleware
app.use('*', async (c, next) => {
  c.set('articleService', articleService);
  await next();
});

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    repository: useInMemory ? 'in-memory' : 'dynamodb',
  });
});

// API routes (with auth)
app.use('/api/*', authMiddleware);
app.route('/api/articles', articlesRouter);
app.route('/api/user', userRouter);

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = Number.parseInt(process.env.PORT || '3001', 10);
  console.log(`🚀 Server starting on http://localhost:${port}`);
  console.log(`📦 Using ${useInMemory ? 'in-memory' : 'DynamoDB'} repository`);
  serve({
    fetch: app.fetch,
    port,
  });
}

// For Lambda Web Adapter
export default app;
