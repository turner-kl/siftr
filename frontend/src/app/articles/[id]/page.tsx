"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockArticles } from "@/data/mockArticles";
import {
  CATEGORY_LABELS,
  CATEGORY_VARIANTS,
  LEVEL_LABELS,
  PRIORITY_LABELS,
  PRIORITY_VARIANTS,
} from "@/types/article";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const article = mockArticles.find((a) => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4" role="alert">
                記事が見つかりませんでした
              </p>
              <Button onClick={() => router.push("/")} className="min-h-[44px]">
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                ダッシュボードに戻る
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const formattedDate = format(article.publishedAt, "yyyy年MM月dd日", {
    locale: ja,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* 戻るボタン */}
        <nav className="mb-6" aria-label="パンくずナビゲーション">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            ダッシュボードに戻る
          </Button>
        </nav>

        <article>
          <Card>
            <CardContent className="p-6 md:p-8">
              {/* タグとカテゴリ */}
              <div
                className="flex items-center gap-2 mb-4 flex-wrap"
                role="group"
                aria-label="記事のメタデータ"
              >
                <Badge variant={CATEGORY_VARIANTS[article.category]}>
                  {CATEGORY_LABELS[article.category]}
                </Badge>
                <Badge variant={PRIORITY_VARIANTS[article.priority]}>
                  {PRIORITY_LABELS[article.priority]}
                </Badge>
                <Badge variant="secondary">{LEVEL_LABELS[article.level]}</Badge>
              </div>

              {/* タイトル */}
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground leading-tight">
                {article.title}
              </h1>

              {/* メタ情報 */}
              <div
                className="flex items-center gap-6 text-sm text-muted-foreground mb-6 flex-wrap"
                role="group"
                aria-label="記事の詳細情報"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={article.publishedAt.toISOString()}>
                    {formattedDate}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>{article.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  <span>
                    <span className="sr-only">トレンドスコア:</span>
                    トレンド: {article.trendScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <span>
                    <span className="sr-only">重要度スコア:</span>
                    重要度: {article.importance}/100
                  </span>
                </div>
              </div>

              {/* 判断用要約 */}
              <section
                className="bg-accent/50 border-l-4 border-primary p-4 mb-6 rounded-r-md"
                aria-labelledby="brief-summary-heading"
              >
                <div className="flex items-start gap-3">
                  <BookOpen
                    className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h2
                      id="brief-summary-heading"
                      className="font-semibold text-foreground mb-1 text-base"
                    >
                      要約（判断用）
                    </h2>
                    <p className="text-foreground/90 leading-relaxed">
                      {article.summary.brief}
                    </p>
                  </div>
                </div>
              </section>

              <Separator className="my-6" />

              {/* 理解用要約 */}
              <section
                className="mb-6"
                aria-labelledby="detailed-summary-heading"
              >
                <h2
                  id="detailed-summary-heading"
                  className="text-xl font-semibold mb-3 text-foreground"
                >
                  詳細要約
                </h2>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                  {article.summary.detailed}
                </p>
              </section>

              <Separator className="my-6" />

              {/* タグ */}
              <section className="mb-6" aria-labelledby="tags-heading">
                <h2
                  id="tags-heading"
                  className="text-xl font-semibold mb-3 text-foreground"
                >
                  タグ
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      <span aria-label={`タグ: ${tag}`}>#{tag}</span>
                    </Badge>
                  ))}
                </div>
              </section>

              <Separator className="my-6" />

              {/* 元記事へのリンク */}
              <div>
                <Button asChild size="lg" className="min-h-[44px]">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`元記事を読む: ${article.title}`}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" aria-hidden="true" />
                    元記事を読む
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  );
}
