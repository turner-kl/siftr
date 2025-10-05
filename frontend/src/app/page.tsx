'use client';

import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ArticleCard } from '@/components/ArticleCard';
import { FilterBar } from '@/components/FilterBar';
import { mockArticles } from '@/data/mockArticles';
import { Category, Priority, createCategoryFilter, createPriorityFilter, createSearchFilter } from '@/types/article';
import { TrendingUp, BookOpen, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // フィルタリングロジック - 型安全なヘルパーを使用
  const filteredArticles = useMemo(() => {
    const categoryFilter = createCategoryFilter(selectedCategories);
    const priorityFilter = createPriorityFilter(selectedPriorities);
    const searchFilter = createSearchFilter(searchQuery);

    return mockArticles.filter((article) => {
      return (
        categoryFilter(article) &&
        priorityFilter(article) &&
        searchFilter(article)
      );
    });
  }, [selectedCategories, selectedPriorities, searchQuery]);

  // 統計情報
  const stats = useMemo(() => {
    const mustReadCount = filteredArticles.filter((a) => a.priority === 'must-read').length;
    const unreadCount = filteredArticles.filter((a) => !a.isRead).length;
    const avgTrendScore = filteredArticles.length > 0
      ? Math.round(filteredArticles.reduce((sum, a) => sum + a.trendScore, 0) / filteredArticles.length)
      : 0;

    return { mustReadCount, unreadCount, avgTrendScore };
  }, [filteredArticles]);

  // コールバックの最適化
  const handleCategoryChange = useCallback((categories: Category[]) => {
    setSelectedCategories(categories);
  }, []);

  const handlePriorityChange = useCallback((priorities: Priority[]) => {
    setSelectedPriorities(priorities);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main
        className="container mx-auto px-4 py-8"
        role="main"
      >
        {/* 統計情報 */}
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          aria-label="記事統計情報"
        >
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    必読記事
                  </p>
                  <p
                    className="text-2xl font-bold text-destructive"
                    aria-label={`必読記事数: ${stats.mustReadCount}件`}
                  >
                    {stats.mustReadCount}
                  </p>
                </div>
                <Star
                  className="h-8 w-8 text-destructive"
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    未読記事
                  </p>
                  <p
                    className="text-2xl font-bold text-primary"
                    aria-label={`未読記事数: ${stats.unreadCount}件`}
                  >
                    {stats.unreadCount}
                  </p>
                </div>
                <BookOpen
                  className="h-8 w-8 text-primary"
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    平均トレンド
                  </p>
                  <p
                    className="text-2xl font-bold text-chart-2"
                    aria-label={`平均トレンドスコア: ${stats.avgTrendScore}`}
                  >
                    {stats.avgTrendScore}
                  </p>
                </div>
                <TrendingUp
                  className="h-8 w-8 text-chart-2"
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* フィルターエリア */}
          <aside
            className="lg:col-span-1"
            aria-label="フィルターと検索"
          >
            <FilterBar
              selectedCategories={selectedCategories}
              selectedPriorities={selectedPriorities}
              searchQuery={searchQuery}
              onCategoryChange={handleCategoryChange}
              onPriorityChange={handlePriorityChange}
              onSearchChange={handleSearchChange}
            />
          </aside>

          {/* 記事一覧 */}
          <section
            className="lg:col-span-3"
            aria-labelledby="articles-heading"
          >
            <div className="mb-4">
              <h2
                id="articles-heading"
                className="text-xl font-bold text-foreground"
              >
                今日のおすすめ記事
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredArticles.length}件)
                </span>
              </h2>
            </div>

            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p
                    className="text-muted-foreground"
                    role="status"
                  >
                    該当する記事が見つかりませんでした
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div
                className="space-y-4"
                role="feed"
                aria-busy="false"
              >
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
