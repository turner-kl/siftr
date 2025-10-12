"use client";

import { ExternalLink, Globe, Plus, Rss, Trash2 } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type SourceType = "url" | "rss";

interface Source {
  id: string;
  type: SourceType;
  url: string;
  name: string;
  addedAt: Date;
  isActive: boolean;
}

// モックデータ
const initialSources: Source[] = [
  {
    id: "1",
    type: "rss",
    url: "https://zenn.dev/feed",
    name: "Zenn Tech Feed",
    addedAt: new Date("2025-01-01"),
    isActive: true,
  },
  {
    id: "2",
    type: "rss",
    url: "https://news.ycombinator.com/rss",
    name: "Hacker News",
    addedAt: new Date("2025-01-05"),
    isActive: true,
  },
  {
    id: "3",
    type: "url",
    url: "https://www.reddit.com/r/programming",
    name: "Reddit r/programming",
    addedAt: new Date("2025-01-10"),
    isActive: true,
  },
];

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("rss");

  const handleAddSource = () => {
    if (!newUrl.trim() || !newName.trim()) return;

    const newSource: Source = {
      id: Date.now().toString(),
      type: sourceType,
      url: newUrl.trim(),
      name: newName.trim(),
      addedAt: new Date(),
      isActive: true,
    };

    setSources([...sources, newSource]);
    setNewUrl("");
    setNewName("");
  };

  const handleRemoveSource = (id: string) => {
    setSources(sources.filter((s) => s.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setSources(
      sources.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              データソース管理
            </h1>
            <p className="text-muted-foreground">
              記事を収集するURLやRSSフィードを追加・管理します
            </p>
          </div>

          {/* 新規追加フォーム */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>新しいデータソースを追加</CardTitle>
              <CardDescription>
                URLまたはRSSフィードを追加して、自動的に記事を収集します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* ソースタイプ選択 */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    ソースタイプ
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={sourceType === "rss" ? "default" : "outline"}
                      onClick={() => setSourceType("rss")}
                      className="min-h-[44px]"
                      aria-pressed={sourceType === "rss"}
                    >
                      <Rss className="h-4 w-4 mr-2" aria-hidden="true" />
                      RSS Feed
                    </Button>
                    <Button
                      variant={sourceType === "url" ? "default" : "outline"}
                      onClick={() => setSourceType("url")}
                      className="min-h-[44px]"
                      aria-pressed={sourceType === "url"}
                    >
                      <Globe className="h-4 w-4 mr-2" aria-hidden="true" />
                      URL
                    </Button>
                  </div>
                </div>

                {/* URL入力 */}
                <div>
                  <label
                    htmlFor="source-url"
                    className="text-sm font-medium text-foreground mb-2 block"
                  >
                    {sourceType === "rss" ? "RSS Feed URL" : "ウェブサイトURL"}
                  </label>
                  <Input
                    id="source-url"
                    type="url"
                    placeholder={
                      sourceType === "rss"
                        ? "https://example.com/feed.xml"
                        : "https://example.com"
                    }
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {/* 名前入力 */}
                <div>
                  <label
                    htmlFor="source-name"
                    className="text-sm font-medium text-foreground mb-2 block"
                  >
                    表示名
                  </label>
                  <Input
                    id="source-name"
                    type="text"
                    placeholder="例: Tech Blog"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                <Button
                  onClick={handleAddSource}
                  disabled={!newUrl.trim() || !newName.trim()}
                  className="min-h-[44px] w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  データソースを追加
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 登録済みデータソース一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>
                登録済みデータソース
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({sources.length}件)
                </span>
              </CardTitle>
              <CardDescription>
                アクティブなデータソースから定期的に記事を収集します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  登録されているデータソースがありません
                </p>
              ) : (
                <div className="space-y-4">
                  {sources.map((source, index) => (
                    <div key={source.id}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {source.type === "rss" ? (
                            <Rss
                              className="h-5 w-5 text-primary"
                              aria-hidden="true"
                            />
                          ) : (
                            <Globe
                              className="h-5 w-5 text-primary"
                              aria-hidden="true"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {source.name}
                            </h3>
                            <Badge
                              variant={
                                source.isActive ? "default" : "secondary"
                              }
                            >
                              {source.isActive ? "アクティブ" : "停止中"}
                            </Badge>
                            <Badge variant="outline">
                              {source.type === "rss" ? "RSS" : "URL"}
                            </Badge>
                          </div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 break-all"
                          >
                            {source.url}
                            <ExternalLink
                              className="h-3 w-3 flex-shrink-0"
                              aria-hidden="true"
                            />
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">
                            追加日: {source.addedAt.toLocaleDateString("ja-JP")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(source.id)}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label={source.isActive ? "停止" : "有効化"}
                          >
                            {source.isActive ? "停止" : "有効化"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveSource(source.id)}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label="削除"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      {index < sources.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
