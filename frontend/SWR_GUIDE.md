# SWR + Hono RPC Integration Guide

このガイドでは、Next.js 15でSWRとHono RPCを組み合わせて使用する方法を説明します。

## アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│ Next.js 15 App Router                           │
│                                                 │
│  ┌────────────────────┐  ┌──────────────────┐  │
│  │ Server Component   │  │ Client Component │  │
│  │ (page.tsx)         │  │ (*.Client.tsx)   │  │
│  │                    │  │                  │  │
│  │ - SSR/SSG          │  │ - SWR hooks      │  │
│  │ - Initial fetch    │  │ - Optimistic UI  │  │
│  │ - SEO              │  │ - Real-time      │  │
│  └────────┬───────────┘  └────────┬─────────┘  │
│           │                       │             │
│           └───────────┬───────────┘             │
│                       │                         │
│              ┌────────▼─────────┐               │
│              │ Hono RPC Client  │               │
│              │ (type-safe)      │               │
│              └────────┬─────────┘               │
└───────────────────────┼─────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Backend API     │
              │ (Hono + Zod)    │
              └─────────────────┘
```

## パターン1: Server Component + SWR

### Server Component (SSR/SSG)

```tsx
// app/profile/page.tsx
export default async function ProfilePage() {
  // Server-side data fetch (optional)
  const initialData = await fetch('http://localhost:3001/api/me/profile')
    .then(res => res.json())
    .catch(() => null);

  return <ProfileClient initialData={initialData} />;
}
```

**メリット:**
- ✅ SEO対応
- ✅ 初回表示が高速 (サーバーでレンダリング)
- ✅ ローディングスピナー不要

### Client Component (SWR)

```tsx
// app/profile/ProfileClient.tsx
'use client';

import { useProfile } from '@/lib/hooks/useProfile';

export function ProfileClient({ initialData }) {
  const { data, error, isLoading, mutate } = useProfile({
    fallbackData: initialData, // Server Componentから受け取った初期データ
  });

  // リアルタイム更新、キャッシュ、再検証が自動で行われる
}
```

**メリット:**
- ✅ リアルタイム更新
- ✅ 自動再検証 (フォーカス時、ネットワーク復帰時)
- ✅ キャッシュによる高速表示
- ✅ Optimistic UI

## パターン2: Client Component Only

```tsx
// app/dashboard/page.tsx
'use client';

import { useProfile } from '@/lib/hooks/useProfile';

export default function DashboardPage() {
  const { data, error, isLoading } = useProfile();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return <Dashboard data={data} />;
}
```

**使い分け:**
- SEO不要、ダッシュボード系 → Client Component Only
- SEO必要、公開ページ → Server Component + SWR

## SWR Hook の作成

```tsx
// lib/hooks/useProfile.ts
import useSWR from 'swr';
import { apiClient } from '@/lib/api';

const fetchProfile = async () => {
  const res = await apiClient.api.me.profile.$get();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function useProfile(config?) {
  return useSWR('/api/me/profile', fetchProfile, {
    revalidateOnFocus: false,  // フォーカス時の再検証を無効化
    revalidateOnReconnect: true, // ネットワーク復帰時に再検証
    dedupingInterval: 10000,     // 10秒間は重複リクエストを防ぐ
    ...config,
  });
}
```

## Optimistic UI Updates

```tsx
const { data, mutate } = useProfile();

const handleUpdate = async () => {
  await mutate(
    async () => {
      // 実際のAPI呼び出し
      await updateProfile({ display_name: 'New Name' });
      // 再検証
      return mutate();
    },
    {
      // 楽観的更新: UIを即座に更新
      optimisticData: {
        ...data,
        user: { ...data.user, display_name: 'New Name' },
      },
      // エラー時にロールバック
      rollbackOnError: true,
    }
  );
};
```

**動作:**
1. ボタンクリック → UI即座に更新 (optimisticData)
2. バックグラウンドでAPI呼び出し
3. 成功 → そのまま
4. 失敗 → 元のデータに戻す (rollback)

## 型安全な更新関数

```tsx
// lib/hooks/useProfile.ts
export async function updateProfile(data: {
  display_name?: string;
  settings?: Record<string, unknown>;
}) {
  const res = await apiClient.api.me.profile.$put({ json: data });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

Hono RPCによって、`data`の型は完全に推論されます。

## SWR Configuration

### グローバル設定

```tsx
// app/layout.tsx
import { SWRConfig } from 'swr';

export default function RootLayout({ children }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 0,           // 自動リフレッシュなし
        revalidateOnFocus: false,     // フォーカス時再検証なし
        revalidateOnReconnect: true,  // ネットワーク復帰時再検証
        dedupingInterval: 5000,       // 5秒間重複リクエスト防止
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### フック単位の設定

```tsx
useProfile({
  refreshInterval: 30000,  // 30秒ごとに自動更新
  revalidateOnMount: true, // マウント時に再検証
});
```

## エラーハンドリング

```tsx
const { data, error, isLoading } = useProfile();

if (error) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={() => mutate()}>Retry</button>
    </div>
  );
}
```

## ベストプラクティス

### 1. Server Component を優先

```tsx
// ✅ GOOD: Server Component でデータフェッチ
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}

// ❌ BAD: Client Component でデータフェッチ (SEO不利)
'use client';
export default function Page() {
  const { data } = useSWR(...);
}
```

### 2. キーは統一する

```tsx
// ✅ GOOD: 同じエンドポイントは同じキー
useSWR('/api/me/profile', fetcher);
useSWR('/api/me/profile', fetcher); // キャッシュを共有

// ❌ BAD: 異なるキー
useSWR('profile', fetcher);
useSWR('/api/me/profile', fetcher); // 別々にキャッシュされる
```

### 3. Mutation は明示的に

```tsx
// ✅ GOOD: 更新後に mutate() で再検証
await updateProfile(data);
await mutate(); // 最新データを取得

// ❌ BAD: 自動再検証に頼る (タイミング不確実)
await updateProfile(data);
// mutate() なし
```

## 参考リンク

- [SWR公式ドキュメント](https://swr.vercel.app/)
- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Hono RPC](https://hono.dev/docs/guides/rpc)
