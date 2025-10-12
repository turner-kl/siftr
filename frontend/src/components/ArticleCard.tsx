"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertCircle, Calendar, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type Article,
  CATEGORY_LABELS,
  CATEGORY_VARIANTS,
  LEVEL_LABELS,
  PRIORITY_LABELS,
  PRIORITY_VARIANTS,
} from "@/types/article";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = format(article.publishedAt, "yyyy/MM/dd", {
    locale: ja,
  });

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-200 hover:border-primary/50",
        article.isRead && "opacity-75",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      )}
      role="article"
      aria-labelledby={`article-title-${article.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* タグとカテゴリ */}
            <div
              className="flex items-center gap-2 mb-3 flex-wrap"
              role="group"
              aria-label="記事のメタデータ"
            >
              <Badge
                variant={CATEGORY_VARIANTS[article.category]}
                className="text-xs font-medium"
              >
                {CATEGORY_LABELS[article.category]}
              </Badge>
              <Badge
                variant={PRIORITY_VARIANTS[article.priority]}
                className="text-xs font-medium"
              >
                {PRIORITY_LABELS[article.priority]}
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                {LEVEL_LABELS[article.level]}
              </Badge>
            </div>

            {/* タイトル */}
            <h3
              id={`article-title-${article.id}`}
              className="text-lg font-semibold mb-2 leading-tight"
            >
              <Link
                href={`/articles/${article.id}`}
                className="hover:text-primary transition-colors focus:outline-none focus:underline focus:decoration-2"
              >
                {article.title}
              </Link>
            </h3>

            {/* 判断用要約 */}
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {article.summary.brief}
            </p>

            {/* メタ情報 */}
            <div
              className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap"
              role="group"
              aria-label="記事の詳細情報"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <time dateTime={article.publishedAt.toISOString()}>
                  {formattedDate}
                </time>
              </div>
              <div className="flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{article.source}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  <span className="sr-only">トレンドスコア:</span>
                  トレンド: {article.trendScore}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  <span className="sr-only">重要度スコア:</span>
                  重要度: {article.importance}
                </span>
              </div>
            </div>

            {/* タグ */}
            {article.tags.length > 0 && (
              <div
                className="flex items-center gap-2 mt-3 flex-wrap"
                role="group"
                aria-label="記事のタグ"
              >
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <span aria-label={`タグ: ${tag}`}>#{tag}</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
