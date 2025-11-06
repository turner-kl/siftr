import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth';

// Hono context type
type Variables = {
  user: AuthUser;
};

// Create a simple Hono app for RPC demo (not OpenAPI)
export const rpcDemoRouter = new Hono<{ Variables: Variables }>();

// Simple GET endpoint
rpcDemoRouter.get('/hello', (c) => {
  const user = c.get('user');
  return c.json({
    message: `Hello, ${user.email || user.sub}!`,
    timestamp: new Date().toISOString(),
  });
});

// GET endpoint with query params
rpcDemoRouter.get(
  '/greet',
  zValidator(
    'query',
    z.object({
      name: z.string().optional(),
      language: z.enum(['ja', 'en']).optional().default('ja'),
    })
  ),
  (c) => {
    const { name, language } = c.req.valid('query');
    const user = c.get('user');
    const displayName = name || user.email || user.sub;

    const greeting = language === 'ja'
      ? `こんにちは、${displayName}さん！`
      : `Hello, ${displayName}!`;

    return c.json({
      greeting,
      language,
      timestamp: new Date().toISOString(),
    });
  }
);

// POST endpoint with body
rpcDemoRouter.post(
  '/echo',
  zValidator(
    'json',
    z.object({
      message: z.string(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
  (c) => {
    const body = c.req.valid('json');
    const user = c.get('user');

    return c.json({
      echo: body.message,
      receivedFrom: user.email || user.sub,
      metadata: body.metadata,
      timestamp: new Date().toISOString(),
    });
  }
);

// GET endpoint with path params
rpcDemoRouter.get('/items/:id', (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  return c.json({
    id,
    name: `Item ${id}`,
    owner: user.email || user.sub,
    createdAt: new Date().toISOString(),
  });
});

// Example with array response
rpcDemoRouter.get('/items', (c) => {
  const user = c.get('user');

  return c.json({
    items: [
      { id: '1', name: 'Item 1', owner: user.email || user.sub },
      { id: '2', name: 'Item 2', owner: user.email || user.sub },
      { id: '3', name: 'Item 3', owner: user.email || user.sub },
    ],
    total: 3,
  });
});
