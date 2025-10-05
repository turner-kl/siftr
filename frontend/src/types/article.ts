export type Category = 'tech' | 'hr' | 'business';
export type Priority = 'must-read' | 'recommended' | 'reference' | 'skip';
export type Level = 'beginner' | 'intermediate' | 'advanced';

// Badge variants from shadcn/ui
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  category: Category;
  priority: Priority;
  level: Level;
  publishedAt: Date;
  summary: {
    brief: string; // 判断用要約（2-3行）
    detailed: string; // 理解用要約（段落レベル）
  };
  tags: readonly string[]; // 不変性を保証
  trendScore: number; // 0-100
  importance: number; // 0-100
  isRead: boolean;
}

export interface FilterOptions {
  categories: Category[];
  priorities: Priority[];
  searchQuery: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// ラベルマッピング - 中央集約化と型安全性の向上
export const CATEGORY_LABELS = {
  tech: '技術',
  hr: '人事',
  business: 'ビジネス',
} as const satisfies Record<Category, string>;

export const PRIORITY_LABELS = {
  'must-read': '必読',
  'recommended': '推奨',
  'reference': '参考',
  'skip': 'スキップ',
} as const satisfies Record<Priority, string>;

export const LEVEL_LABELS = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
} as const satisfies Record<Level, string>;

// バリアントマッピング - 型安全性の向上
export const CATEGORY_VARIANTS = {
  tech: 'default',
  hr: 'secondary',
  business: 'outline',
} as const satisfies Record<Category, BadgeVariant>;

export const PRIORITY_VARIANTS = {
  'must-read': 'destructive',
  'recommended': 'default',
  'reference': 'secondary',
  'skip': 'outline',
} as const satisfies Record<Priority, BadgeVariant>;

// 型ガード
export function isValidCategory(value: unknown): value is Category {
  return typeof value === 'string' && ['tech', 'hr', 'business'].includes(value);
}

export function isValidPriority(value: unknown): value is Priority {
  return typeof value === 'string' && ['must-read', 'recommended', 'reference', 'skip'].includes(value);
}

export function isValidLevel(value: unknown): value is Level {
  return typeof value === 'string' && ['beginner', 'intermediate', 'advanced'].includes(value);
}

// ユーティリティ型
export type ArticlePreview = Pick<Article, 'id' | 'title' | 'summary' | 'category' | 'priority'>;
export type ArticleMetadata = Omit<Article, 'summary'>;
export type ReadonlyArticle = Readonly<Article>;

// スコアの範囲型
export type Score = number & { readonly __brand: 'Score' }; // 0-100 のブランド型

export function createScore(value: number): Score {
  if (value < 0 || value > 100) {
    throw new Error('Score must be between 0 and 100');
  }
  return value as Score;
}

// フィルター用の型安全なヘルパー
export type FilterPredicate<T> = (item: T) => boolean;

export function createCategoryFilter(categories: readonly Category[]): FilterPredicate<Article> {
  if (categories.length === 0) return () => true;
  return (article) => categories.includes(article.category);
}

export function createPriorityFilter(priorities: readonly Priority[]): FilterPredicate<Article> {
  if (priorities.length === 0) return () => true;
  return (article) => priorities.includes(article.priority);
}

export function createSearchFilter(query: string): FilterPredicate<Article> {
  if (!query) return () => true;
  const lowerQuery = query.toLowerCase();
  return (article) => {
    return (
      article.title.toLowerCase().includes(lowerQuery) ||
      article.summary.brief.toLowerCase().includes(lowerQuery) ||
      article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  };
}
