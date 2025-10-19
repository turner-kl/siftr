import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';
import type { AuthUser } from './middleware/auth';
import { articlesRouter } from './routes/articles/articles.route';
import { meRouter } from './routes/me/me.route';

// Types for Hono context
type Variables = {
  user: AuthUser;
};

const app = new OpenAPIHono<{ Variables: Variables }>();

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
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const useInMemory = process.env.USE_IN_MEMORY === 'true' || isDevelopment;

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
app.route('/api/me', meRouter);

// OpenAPI documentation endpoint
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'Siftr API',
    version: '0.1.0',
    description: 'AI駆動型パーソナライズド情報キュレーションシステムのAPI',
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3001',
      description: process.env.NODE_ENV !== 'production' ? 'ローカル開発環境' : '本番環境',
    },
  ],
});

// Swagger UI
app.get('/ui', swaggerUI({ url: '/doc' }));

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
  const useInMemory = process.env.USE_IN_MEMORY === 'true' || true; // isDevelopment
  console.log(`🚀 Server starting on http://localhost:${port}`);
  console.log(`📦 Using ${useInMemory ? 'in-memory' : 'DynamoDB'} repository`);
  console.log(`📚 API documentation available at http://localhost:${port}/ui`);
  serve({
    fetch: app.fetch,
    port,
  });
}

// For Lambda Web Adapter
export default app;
