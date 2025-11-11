# Hono RPC + Zod OpenAPI 統合ガイド

## 概要

このプロジェクトでは **Hono RPC** と **@hono/zod-openapi** を統合し、以下の両方のメリットを享受しています:

1. ✅ **完全な型安全性** - フロントエンドでの型推論
2. ✅ **自動OpenAPI仕様生成** - ドキュメント・外部連携

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│                                                             │
│  import { apiClient } from '@/lib/api'                     │
│  const res = await apiClient.api.me.profile.$get()        │
│  const data = await res.json() // ← 完全に型付け           │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP Request
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Hono + OpenAPI)                  │
│                                                             │
│  ┌──────────────────┐    ┌────────────────────┐            │
│  │ OpenAPIHono      │───→│  OpenAPI Spec      │            │
│  │ createRoute()    │    │  /doc endpoint     │            │
│  │ Zod Schemas      │    │  Swagger UI /ui    │            │
│  └──────────────────┘    └────────────────────┘            │
│           ↓                                                 │
│  export type AppType = typeof routes                       │
└─────────────────────────────────────────────────────────────┘
```

## 実装パターン

### 1. バックエンド: OpenAPI ルート定義

```typescript
// backend/src/api/routes/me/me.route.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

// ✅ Zodスキーマでリクエスト/レスポンスを定義
const getUserProfileRoute = createRoute({
  method: 'get',
  path: '/profile',
  tags: ['Me'],
  summary: 'ユーザープロフィール取得',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserProfileResponseSchema, // Zodスキーマ
        },
      },
      description: 'プロフィール取得に成功',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'ユーザーが見つかりません',
    },
  },
});

// ✅ ルートハンドラーで明示的なステータスコード
meRouter.openapi(getUserProfileRoute, async (c) => {
  const user = await findUser();

  if (!user) {
    return c.json({ error: 'User not found' }, 404); // ✅ 明示的な404
  }

  return c.json({ user, profile: user.profile }, 200); // ✅ 明示的な200
});
```

### 2. バックエンド: AppType エクスポート

```typescript
// backend/src/api/index.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { meRouter } from './routes/me/me.route';

const app = new OpenAPIHono<{ Variables: Variables }>();

// ✅ ルート全体を1つの変数にまとめる
const routes = app.route('/api/me', meRouter);
// 他のルートも追加可能:
// .route('/api/articles', articlesRouter)
// .route('/api/feed', feedRouter);

// ✅ 完全な型をエクスポート
export type AppType = typeof routes;
```

### 3. フロントエンド: 型安全なRPCクライアント

```typescript
// frontend/src/lib/api.ts
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/api';

// ✅ AppTypeで完全な型推論
export const apiClient = hc<AppType>(API_BASE_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 4. フロントエンド: ステータスコード別の型推論

```typescript
// frontend/src/components/Profile.tsx
const res = await apiClient.api.me.profile.$get();

// ✅ ステータスコード別で型が異なる
if (res.status === 404) {
  const error = await res.json(); // Type: { error: string }
  console.error(error.error);
  return;
}

if (res.ok) {
  const data = await res.json(); // Type: UserProfileResponse
  console.log(data.user, data.profile);
}
```

## ベストプラクティス

### ✅ DO: 明示的なステータスコードを返す

```typescript
// Good
if (!user) {
  return c.json({ error: 'not found' }, 404); // ✅
}
return c.json({ user }, 200); // ✅
```

### ❌ DON'T: c.notFound() を使わない

```typescript
// Bad - RPC型推論が効かない
if (!user) {
  return c.notFound(); // ❌
}
```

**理由**: `c.notFound()`を使うと、クライアント側で`await res.json()`の型が`unknown`になってしまいます。

### ✅ DO: Zodスキーマをすべてのルートで使う

```typescript
const route = createRoute({
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateProfileSchema, // ✅ Zodスキーマ
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessResponseSchema, // ✅ Zodスキーマ
        },
      },
    },
  },
});
```

**理由**: Zodスキーマから型とバリデーションの両方が自動生成されます。

### ✅ DO: InferRequestType / InferResponseType を活用

```typescript
import { type InferRequestType, type InferResponseType } from 'hono/client';

// リクエスト型の推論
type UpdateReq = InferRequestType<typeof apiClient.api.me.profile.$put>;
type UpdateBody = UpdateReq['json'];

// レスポンス型の推論
type ProfileRes = InferResponseType<typeof apiClient.api.me.profile.$get>;
type ProfileRes200 = InferResponseType<typeof apiClient.api.me.profile.$get, 200>;
```

## OpenAPI 仕様の確認

### Swagger UI

開発環境で以下のURLにアクセス:

```
http://localhost:3001/ui
```

### OpenAPI JSON

```
http://localhost:3001/doc
```

### curl でテスト

```bash
# GET リクエスト
curl -X GET http://localhost:3001/api/me/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# PUT リクエスト
curl -X PUT http://localhost:3001/api/me/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"display_name": "New Name"}'
```

## 参考リンク

- [Hono RPC 公式ドキュメント](https://hono.dev/docs/guides/rpc)
- [Hono Zod OpenAPI 公式ドキュメント](https://hono.dev/docs/examples/zod-openapi)
- [Classmethod 記事: Hono + Zod OpenAPI スキーマ駆動開発](https://dev.classmethod.jp/articles/hono-zod-openapi-schema-driven-api-development/)

## トラブルシューティング

### Q: フロントエンドで型が `any` になる

**A**: `backend/src/api/index.ts` で `AppType` が正しくエクスポートされているか確認してください:

```typescript
// ❌ Bad
export type AppType = typeof meRouter;

// ✅ Good
const routes = app.route('/api/me', meRouter);
export type AppType = typeof routes;
```

### Q: ステータスコード別の型推論が効かない

**A**: バックエンドで `c.json()` の第2引数にステータスコードを明示してください:

```typescript
// ❌ Bad
return c.json({ user }); // ステータスコード省略

// ✅ Good
return c.json({ user }, 200); // 明示的に200
```

### Q: OpenAPI 仕様が生成されない

**A**: `createRoute()` を使用しているか確認してください:

```typescript
import { createRoute } from '@hono/zod-openapi';

const route = createRoute({ /* ... */ }); // ✅
meRouter.openapi(route, handler); // ✅
```

## まとめ

この統合により:

1. ✅ **開発体験の向上** - 型推論による補完とエラー検出
2. ✅ **ドキュメントの自動生成** - OpenAPI仕様とSwagger UI
3. ✅ **シングルソース・オブ・トゥルース** - Zodスキーマから型とバリデーション
4. ✅ **外部連携の容易さ** - OpenAPI仕様で他のツールと統合可能

開発効率とコード品質を両立できます。
