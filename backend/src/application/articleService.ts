/**
 * Article Application Service
 * Orchestrates domain logic with repositories
 */

import { NotFoundError, type Result, type ValidationError, err, ok } from '../core/result';
import type {
  AnalysisResult,
  Article,
  UserProfile as ArticleUserProfile,
  CreateArticleParams,
} from '../domain/entities/article';
import {
  calculatePriorityScore,
  createUninitializedArticle,
  isArticleAnalyzed,
  updateAnalysisResult,
} from '../domain/entities/article';
import type { ArticleRepository } from '../domain/repositories/article-repository';
import type { UserRepository } from '../domain/repositories/user-repository';
import type { ArticleId, Category, UserId } from '../domain/types';

/**
 * DTOs for API layer
 */

export interface CreateArticleDto {
  userId: string;
  sourceId: string;
  sourceType: 'rss' | 'twitter' | 'reddit' | 'hackernews' | 'manual';
  url: string;
  title: string;
  author?: string;
  publishedAt?: number;
  contentPreview: string;
  contentS3Key?: string;
  imageUrl?: string;
  language: 'ja' | 'en';
}

export interface UpdateAnalysisDto {
  category: Category;
  subcategories: string[];
  technicalLevel?: 'beginner' | 'intermediate' | 'advanced';
  summaryShort: string;
  summaryDetailed: string;
  keyPoints: string[];
  keywords: string[];
  aiProvider: 'openai' | 'claude';
  aiModel: string;
}

export interface ArticleInfoDto {
  articleId: string;
  userId: string;
  url: string;
  title: string;
  author?: string;
  category: string;
  subcategories: string[];
  technicalLevel?: string;
  priorityScore: number;
  recommendationTag: string;
  summaryShort: string;
  summaryDetailed: string;
  keyPoints: string[];
  keywords: string[];
  collectedAt: number;
  analyzedAt?: number;
  isAnalyzed: boolean;
}

export interface GetArticlesQuery {
  userId: string;
  category?: Category;
  limit?: number;
  cursor?: string;
  priorityMin?: number;
  priorityMax?: number;
}

/**
 * Article Application Service (class-based with DI)
 */
export class ArticleApplicationService {
  constructor(
    private articleRepo: ArticleRepository,
    private userRepo: UserRepository
  ) {}

  /**
   * Create a new uninitialized article
   */
  async createArticle(
    dto: CreateArticleDto
  ): Promise<Result<ArticleInfoDto, ValidationError | NotFoundError>> {
    // 1. Validate user exists
    const userResult = await this.userRepo.findById(dto.userId as UserId);
    if (!userResult.ok) return userResult;
    if (!userResult.value) {
      return err(new NotFoundError('ユーザー', dto.userId));
    }

    // 2. Create article entity (domain logic)
    const articleParams: CreateArticleParams = {
      userId: dto.userId as UserId,
      sourceId: dto.sourceId,
      sourceType: dto.sourceType,
      url: dto.url,
      title: dto.title,
      author: dto.author,
      publishedAt: dto.publishedAt,
      contentPreview: dto.contentPreview,
      contentS3Key: dto.contentS3Key,
      imageUrl: dto.imageUrl,
      language: dto.language,
    };

    const articleResult = createUninitializedArticle(articleParams);
    if (!articleResult.ok) return articleResult;

    // 3. Save to repository
    const saveResult = await this.articleRepo.save(articleResult.value);
    if (!saveResult.ok) return saveResult;

    // 4. Return DTO
    return ok(this.toArticleInfoDto(articleResult.value));
  }

  /**
   * Update article with AI analysis result
   */
  async updateArticleAnalysis(
    articleId: string,
    analysis: UpdateAnalysisDto
  ): Promise<Result<ArticleInfoDto, ValidationError | NotFoundError>> {
    // 1. Find article
    const articleResult = await this.articleRepo.findById(articleId as ArticleId);
    if (!articleResult.ok) return articleResult;
    if (!articleResult.value) {
      return err(new NotFoundError('記事', articleId));
    }

    // 2. Apply domain logic
    const analysisResult: AnalysisResult = {
      category: analysis.category,
      subcategories: analysis.subcategories,
      technicalLevel: analysis.technicalLevel,
      summaryShort: analysis.summaryShort,
      summaryDetailed: analysis.summaryDetailed,
      keyPoints: analysis.keyPoints,
      keywords: analysis.keywords,
      aiProvider: analysis.aiProvider,
      aiModel: analysis.aiModel,
    };

    const updatedArticleResult = updateAnalysisResult(articleResult.value, analysisResult);
    if (!updatedArticleResult.ok) return updatedArticleResult;

    // 3. Save updated article
    const saveResult = await this.articleRepo.save(updatedArticleResult.value);
    if (!saveResult.ok) return saveResult;

    // 4. Return DTO
    return ok(this.toArticleInfoDto(updatedArticleResult.value));
  }

  /**
   * Calculate and update priority score for an article
   */
  async calculateArticlePriority(
    articleId: string,
    userId: string
  ): Promise<Result<ArticleInfoDto, ValidationError | NotFoundError>> {
    // 1. Find article
    const articleResult = await this.articleRepo.findById(articleId as ArticleId);
    if (!articleResult.ok) return articleResult;
    if (!articleResult.value) {
      return err(new NotFoundError('記事', articleId));
    }

    // 2. Find user profile
    const userResult = await this.userRepo.findById(userId as UserId);
    if (!userResult.ok) return userResult;
    if (!userResult.value) {
      return err(new NotFoundError('ユーザー', userId));
    }

    // 3. Apply domain logic (calculate priority)
    const userProfile: ArticleUserProfile = {
      category: userResult.value.profile.primaryCategory,
      skillLevel: userResult.value.profile.skillLevel,
      interests: Array.from(userResult.value.profile.interests),
    };

    const scoredArticle = calculatePriorityScore(articleResult.value, userProfile);

    // 4. Save updated article
    const saveResult = await this.articleRepo.save(scoredArticle);
    if (!saveResult.ok) return saveResult;

    // 5. Return DTO
    return ok(this.toArticleInfoDto(scoredArticle));
  }

  /**
   * Get article by ID
   */
  async getArticleById(
    articleId: string
  ): Promise<Result<ArticleInfoDto | null, ValidationError | NotFoundError>> {
    const articleResult = await this.articleRepo.findById(articleId as ArticleId);
    if (!articleResult.ok) return articleResult;
    if (!articleResult.value) {
      return ok(null);
    }

    return ok(this.toArticleInfoDto(articleResult.value));
  }

  /**
   * Get articles for a user
   */
  async getArticlesByUserId(
    query: GetArticlesQuery
  ): Promise<Result<ArticleInfoDto[], ValidationError | NotFoundError>> {
    // Validate user exists
    const userResult = await this.userRepo.findById(query.userId as UserId);
    if (!userResult.ok) return userResult;
    if (!userResult.value) {
      return err(new NotFoundError('ユーザー', query.userId));
    }

    // Find articles
    const articlesResult = await this.articleRepo.findByUserId(query.userId as UserId, {
      category: query.category,
      limit: query.limit,
      cursor: query.cursor,
      priorityMin: query.priorityMin,
      priorityMax: query.priorityMax,
      sortBy: 'priorityScore',
      sortOrder: 'desc',
    });

    if (!articlesResult.ok) return articlesResult;

    // Convert to DTOs
    const dtos = articlesResult.value.map((article) => this.toArticleInfoDto(article));

    return ok(dtos);
  }

  /**
   * Delete article
   */
  async deleteArticle(articleId: string): Promise<Result<void, ValidationError | NotFoundError>> {
    return await this.articleRepo.delete(articleId as ArticleId);
  }

  /**
   * Convert Article entity to DTO
   */
  private toArticleInfoDto(article: Article): ArticleInfoDto {
    return {
      articleId: article.articleId,
      userId: article.userId,
      url: article.url,
      title: article.title,
      author: article.author,
      category: article.category,
      subcategories: Array.from(article.subcategories),
      technicalLevel: article.technicalLevel,
      priorityScore: article.priorityScore,
      recommendationTag: article.recommendationTag,
      summaryShort: article.summaryShort,
      summaryDetailed: article.summaryDetailed,
      keyPoints: Array.from(article.keyPoints),
      keywords: Array.from(article.keywords),
      collectedAt: article.collectedAt,
      analyzedAt: article.analyzedAt,
      isAnalyzed: isArticleAnalyzed(article),
    };
  }
}
