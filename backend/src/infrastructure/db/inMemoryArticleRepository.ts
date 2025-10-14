/**
 * In-Memory Article Repository (for testing)
 */

import { NotFoundError, type Result, type ValidationError, err, ok } from '../../core/result';
import type { Article } from '../../domain/entities/article';
import type {
  ArticleRepository,
  FindArticlesResult,
  FindByUserIdOptions,
  PaginationOptions,
} from '../../domain/repositories/article-repository';
import type { ArticleId, Category, UserId } from '../../domain/types';

export class InMemoryArticleRepository implements ArticleRepository {
  private articles: Map<string, Article> = new Map();

  async findById(
    articleId: ArticleId
  ): Promise<Result<Article | null, ValidationError | NotFoundError>> {
    const article = this.articles.get(articleId);
    return ok(article || null);
  }

  async findByUserId(
    userId: UserId,
    options?: FindByUserIdOptions
  ): Promise<Result<Article[], ValidationError>> {
    let articles = Array.from(this.articles.values()).filter(
      (article) => article.userId === userId
    );

    // Filter by category
    if (options?.category) {
      articles = articles.filter((article) => article.category === options.category);
    }

    // Filter by priority range
    if (options?.priorityMin !== undefined) {
      const priorityMin = options.priorityMin;
      articles = articles.filter((article) => article.priorityScore >= priorityMin);
    }
    if (options?.priorityMax !== undefined) {
      const priorityMax = options.priorityMax;
      articles = articles.filter((article) => article.priorityScore <= priorityMax);
    }

    // Sort
    const sortBy = options?.sortBy || 'collectedAt';
    const sortOrder = options?.sortOrder || 'desc';

    articles.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'priorityScore':
          aValue = a.priorityScore;
          bValue = b.priorityScore;
          break;
        case 'trendingScore':
          aValue = a.trendingScore;
          bValue = b.trendingScore;
          break;
        default:
          aValue = a.collectedAt;
          bValue = b.collectedAt;
          break;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Limit
    if (options?.limit) {
      articles = articles.slice(0, options.limit);
    }

    return ok(articles);
  }

  async findByUserIdAndCategory(
    userId: UserId,
    category: Category,
    options?: PaginationOptions
  ): Promise<Result<FindArticlesResult, ValidationError>> {
    const articles = Array.from(this.articles.values()).filter(
      (article) => article.userId === userId && article.category === category
    );

    const limit = options?.limit || 20;
    const limitedArticles = articles.slice(0, limit);

    return ok({
      articles: limitedArticles,
      hasMore: articles.length > limit,
      cursor: articles.length > limit ? String(limit) : undefined,
    });
  }

  async findByUserIdAndPriorityRange(
    userId: UserId,
    priorityMin: number,
    priorityMax: number,
    options?: PaginationOptions
  ): Promise<Result<FindArticlesResult, ValidationError>> {
    const articles = Array.from(this.articles.values()).filter(
      (article) =>
        article.userId === userId &&
        article.priorityScore >= priorityMin &&
        article.priorityScore <= priorityMax
    );

    const limit = options?.limit || 20;
    const limitedArticles = articles.slice(0, limit);

    return ok({
      articles: limitedArticles,
      hasMore: articles.length > limit,
      cursor: articles.length > limit ? String(limit) : undefined,
    });
  }

  async findByUserIdAndDateRange(
    userId: UserId,
    dateFrom: number,
    dateTo: number
  ): Promise<Result<Article[], ValidationError>> {
    const articles = Array.from(this.articles.values()).filter(
      (article) =>
        article.userId === userId &&
        article.collectedAt >= dateFrom &&
        article.collectedAt <= dateTo
    );

    return ok(articles);
  }

  async findAll(): Promise<Result<Article[], ValidationError>> {
    return ok(Array.from(this.articles.values()));
  }

  async save(article: Article): Promise<Result<void, ValidationError>> {
    // Deep copy to prevent reference issues
    this.articles.set(article.articleId, JSON.parse(JSON.stringify(article)));
    return ok(undefined);
  }

  async delete(articleId: ArticleId): Promise<Result<void, ValidationError | NotFoundError>> {
    if (!this.articles.has(articleId)) {
      return err(new NotFoundError('記事', articleId));
    }
    this.articles.delete(articleId);
    return ok(undefined);
  }

  async exists(articleId: ArticleId): Promise<Result<boolean, ValidationError>> {
    return ok(this.articles.has(articleId));
  }

  async countByUserId(userId: UserId): Promise<Result<number, ValidationError>> {
    const count = Array.from(this.articles.values()).filter(
      (article) => article.userId === userId
    ).length;
    return ok(count);
  }

  // Test helper methods
  clear(): void {
    this.articles.clear();
  }

  seedArticles(articles: Article[]): void {
    for (const article of articles) {
      this.articles.set(article.articleId, JSON.parse(JSON.stringify(article)));
    }
  }
}
