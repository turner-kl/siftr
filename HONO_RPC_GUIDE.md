# Hono RPC 実装ガイド

このガイドでは、siftrプロジェクトでHono RPCを使用してフロントエンドとバックエンド間の型安全な通信を実装する方法を説明します。

## 概要

Hono RPCを使用すると、フロントエンドからバックエンドAPIに対して型安全な呼び出しが可能になります。これにより以下のメリットがあります：

- **型安全性**: バックエンドのAPI型が自動的に推論される
- **自動補完**: IDEでのコード補完が機能する
- **コンパイル時エラー**: 存在しないエンドポイントへのアクセスはビルド時に検出される
- **シンプルなAPI**: 直感的な呼び出しパターン

## 実装内容

### 1. バックエンド (backend/)

#### サンプルAPIルート: `backend/src/api/routes/rpc-demo.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const rpcDemoRouter = new Hono<{ Variables: Variables }>();

// シンプルなGETエンドポイント
rpcDemoRouter.get('/hello', (c) => {
  const user = c.get('user');
  return c.json({
    message: `Hello, ${user.email || user.sub}!`,
    timestamp: new Date().toISOString(),
  });
});

// クエリパラメータを含むGETエンドポイント
rpcDemoRouter.get('/greet', zValidator('query', schema), (c) => {
  const { name, language } = c.req.valid('query');
  // ...
});

// リクエストボディを含むPOSTエンドポイント
rpcDemoRouter.post('/echo', zValidator('json', schema), (c) => {
  const body = c.req.valid('json');
  // ...
});
```

#### アプリケーション型のエクスポート: `backend/src/api/index.ts`

```typescript
export default app;
export type AppType = typeof app;
```

この型エクスポートにより、フロントエンドで型安全なRPCクライアントを作成できます。

### 2. フロントエンド (frontend/)

#### RPCクライアント: `frontend/src/lib/rpc-client.ts`

```typescript
import { hc } from 'hono/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const createRpcClient = () => {
  return hc<any>(API_URL, {
    headers: {
      // 認証ヘッダーなどを追加
    },
  });
};

export const rpcClient = createRpcClient();
```

**注意**: 現在は型安全性を一部犠牲にした実装になっています。完全な型安全性を有効にするには：

1. バックエンドをビルドして型定義を生成
2. `AppType`をバックエンドからインポート
3. `hc<AppType>`として型パラメータを渡す

#### 使用例: `frontend/src/app/rpc-demo/page.tsx`

```typescript
import { rpcClient } from '@/lib/rpc-client';

// GETリクエスト
const response = await rpcClient.api['rpc-demo'].hello.$get();
const data = await response.json();

// クエリパラメータ付きGETリクエスト
const response = await rpcClient.api['rpc-demo'].greet.$get({
  query: {
    name: 'Siftr User',
    language: 'ja',
  },
});

// POSTリクエスト
const response = await rpcClient.api['rpc-demo'].echo.$post({
  json: {
    message: 'Hello from frontend!',
    metadata: { timestamp: new Date().toISOString() },
  },
});

// パスパラメータ付きリクエスト
const response = await rpcClient.api['rpc-demo'].items[':id'].$get({
  param: { id: '42' },
});
```

## セットアップと実行

### 前提条件

- Node.js 20以上
- npm

### インストール

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd frontend
npm install
```

### 開発サーバーの起動

**ターミナル1: バックエンド**
```bash
cd backend
npm run dev
```

バックエンドは `http://localhost:3001` で起動します。

**ターミナル2: フロントエンド**
```bash
cd frontend
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

### デモページへのアクセス

ブラウザで以下のURLを開いてください：

```
http://localhost:3000/rpc-demo
```

このページでは、以下のエンドポイントをテストできます：

- `GET /api/rpc-demo/hello` - シンプルな挨拶
- `GET /api/rpc-demo/greet?name=xxx&language=ja` - クエリパラメータ付き挨拶
- `POST /api/rpc-demo/echo` - エコーメッセージ
- `GET /api/rpc-demo/items/:id` - パスパラメータでアイテム取得
- `GET /api/rpc-demo/items` - アイテム一覧取得

## ファイル構成

```
siftr/
├── backend/
│   ├── src/
│   │   └── api/
│   │       ├── index.ts              # メインアプリケーション (AppType エクスポート)
│   │       ├── routes/
│   │       │   └── rpc-demo.ts       # RPCデモルート
│   │       └── types.ts              # 型定義のみのエクスポート
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   └── rpc-demo/
    │   │       └── page.tsx          # RPCデモページ
    │   └── lib/
    │       └── rpc-client.ts         # RPCクライアント
    ├── .env.local                    # 環境変数
    └── package.json
```

## 環境変数

### フロントエンド `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## トラブルシューティング

### CORS エラー

バックエンドのCORS設定で、フロントエンドのURLが許可されていることを確認してください：

```typescript
// backend/src/api/index.ts
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

### 型エラー

現在の実装では、フロントエンドで`any`型を使用しているため、完全な型安全性はありません。将来的には以下の手順で改善可能です：

1. バックエンドのビルド成果物をnpmパッケージとして公開
2. フロントエンドで型定義をインポート
3. RPCクライアントで`AppType`を使用

### 認証エラー

すべてのRPCデモエンドポイントは認証が必要です。バックエンドの`authMiddleware`が正しく設定されていることを確認してください。

## 次のステップ

1. **完全な型安全性の実装**
   - バックエンドの型定義を共有可能な形式で公開
   - フロントエンドで型定義をインポート

2. **認証の統合**
   - RPCクライアントに認証トークンを追加
   - 認証状態に基づいたエラーハンドリング

3. **エラーハンドリングの改善**
   - カスタムエラー型の定義
   - 統一的なエラーハンドリングパターン

4. **キャッシュとリアクティビティ**
   - React QueryやSWRとの統合
   - 最適な再検証戦略

## 参考リンク

- [Hono 公式ドキュメント](https://hono.dev/)
- [Hono RPC ガイド](https://hono.dev/docs/guides/rpc)
- [Zod バリデーション](https://zod.dev/)
