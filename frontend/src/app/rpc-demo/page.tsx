"use client";

import { useState } from "react";
import { rpcClient } from "@/lib/rpc-client";

type HelloResponse = {
  message: string;
  timestamp: string;
};

type GreetResponse = {
  greeting: string;
  language: string;
  timestamp: string;
};

type EchoResponse = {
  echo: string;
  receivedFrom: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

type ItemResponse = {
  id: string;
  name: string;
  owner: string;
  createdAt: string;
};

type ItemsResponse = {
  items: ItemResponse[];
  total: number;
};

export default function RpcDemoPage() {
  const [helloData, setHelloData] = useState<HelloResponse | null>(null);
  const [greetData, setGreetData] = useState<GreetResponse | null>(null);
  const [echoData, setEchoData] = useState<EchoResponse | null>(null);
  const [itemData, setItemData] = useState<ItemResponse | null>(null);
  const [itemsData, setItemsData] = useState<ItemsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHello = async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (rpcClient.api as any)["rpc-demo"].hello.$get();
      const data = await response.json();
      setHelloData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const fetchGreet = async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (rpcClient.api as any)["rpc-demo"].greet.$get({
        query: {
          name: "Siftr User",
          language: "ja",
        },
      });
      const data = await response.json();
      setGreetData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const fetchEcho = async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (rpcClient.api as any)["rpc-demo"].echo.$post({
        json: {
          message: "Hello from frontend!",
          metadata: {
            timestamp: new Date().toISOString(),
            source: "rpc-demo-page",
          },
        },
      });
      const data = await response.json();
      setEchoData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const fetchItem = async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (rpcClient.api as any)["rpc-demo"].items[
        ":id"
      ].$get({
        param: {
          id: "42",
        },
      });
      const data = await response.json();
      setItemData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (rpcClient.api as any)["rpc-demo"].items.$get();
      const data = await response.json();
      setItemsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Hono RPC Demo</h1>

      <div className="mb-4">
        <p className="text-gray-600 mb-4">
          このページはHono RPCを使用してバックエンドと通信するデモです。
        </p>
        <p className="text-sm text-gray-500 mb-2">
          注意: バックエンドが起動している必要があります（
          <code>cd backend && npm run dev</code>）
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          エラー: {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Hello Endpoint */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            GET /api/rpc-demo/hello
          </h2>
          <button
            type="button"
            onClick={fetchHello}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "Hello を取得"}
          </button>
          {helloData && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(helloData, null, 2)}
            </pre>
          )}
        </div>

        {/* Greet Endpoint */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            GET /api/rpc-demo/greet (with query params)
          </h2>
          <button
            type="button"
            onClick={fetchGreet}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "挨拶を取得"}
          </button>
          {greetData && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(greetData, null, 2)}
            </pre>
          )}
        </div>

        {/* Echo Endpoint */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            POST /api/rpc-demo/echo (with body)
          </h2>
          <button
            type="button"
            onClick={fetchEcho}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "エコーを送信"}
          </button>
          {echoData && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(echoData, null, 2)}
            </pre>
          )}
        </div>

        {/* Item by ID Endpoint */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            GET /api/rpc-demo/items/:id (path params)
          </h2>
          <button
            type="button"
            onClick={fetchItem}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "アイテム (ID: 42) を取得"}
          </button>
          {itemData && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(itemData, null, 2)}
            </pre>
          )}
        </div>

        {/* Items List Endpoint */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            GET /api/rpc-demo/items (array response)
          </h2>
          <button
            type="button"
            onClick={fetchItems}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "アイテム一覧を取得"}
          </button>
          {itemsData && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(itemsData, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div className="mt-8 border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">型安全性について</h2>
        <p className="text-gray-700 mb-2">
          このデモでは、Hono RPCによって以下の型安全性が保証されています：
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>バックエンドのAPIエンドポイント型が自動的に推論される</li>
          <li>
            クエリパラメータ、リクエストボディ、パスパラメータの型チェック
          </li>
          <li>レスポンス型の自動補完とエラー検出</li>
          <li>存在しないエンドポイントへのアクセスはコンパイル時エラー</li>
        </ul>
      </div>
    </div>
  );
}
