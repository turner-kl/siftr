/**
 * Article Repository Interface (Domain Layer)
 */

import type { NotFoundError, Result, ValidationError } from '../../core/result';
import type { Article } from './article.entity';
import type { ArticleId, Category, UserId } from '../types';

/**
 * Article Repository Interface
 * Implementation in infrastructure layer
 */
export interface ArticleRepository {
  /**
   * Find article by ID
   */
  findById(articleId: ArticleId): Promise<Result<Article | null, ValidationError | NotFoundError>>;

  /**
   * Find articles by user ID
   */
  findByUserId(
    userId: UserId,
    options?: FindByUserIdOptions
  ): Promise<Result<Article[], ValidationError>>;

  /**
   * Find articles by user ID and category
   */
  findByUserIdAndCategory(
    userId: UserId,
    category: Category,
    options?: PaginationOptions
  ): Promise<Result<FindArticlesResult, ValidationError>>;

  /**
   * Find articles by user ID and priority range
   */
  findByUserIdAndPriorityRange(
    userId: UserId,
    priorityMin: number,
    priorityMax: number,
    options?: PaginationOptions
  ): Promise<Result<FindArticlesResult, ValidationError>>;

  /**
   * Find articles by user ID and date range
   */
  findByUserIdAndDateRange(
    userId: UserId,
    dateFrom: number,
    dateTo: number
  ): Promise<Result<Article[], ValidationError>>;

  /**
   * Find all articles (for admin/testing)
   */
  findAll(): Promise<Result<Article[], ValidationError>>;

  /**
   * Save article (create or update)
   */
  save(article: Article): Promise<Result<void, ValidationError>>;

  /**
   * Delete article by ID
   */
  delete(articleId: ArticleId): Promise<Result<void, ValidationError | NotFoundError>>;

  /**
   * Check if article exists
   */
  exists(articleId: ArticleId): Promise<Result<boolean, ValidationError>>;

  /**
   * Count articles by user ID
   */
  countByUserId(userId: UserId): Promise<Result<number, ValidationError>>;
}

/**
 * Options for findByUserId
 */
export interface FindByUserIdOptions {
  category?: Category;
  limit?: number;
  cursor?: string;
  priorityMin?: number;
  priorityMax?: number;
  sortBy?: 'collectedAt' | 'priorityScore' | 'trendingScore';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Result with pagination
 */
export interface FindArticlesResult {
  articles: Article[];
  cursor?: string;
  hasMore: boolean;
}
