/**
 * Article Entity (Domain Model)
 * Pure functions with Result type pattern
 */

import { type Result, ValidationError, err, ok } from '../../core/result';
import type {
  AIProvider,
  ArticleId,
  Category,
  Language,
  PriorityScore,
  RecommendationTag,
  SourceType,
  TechnicalLevel,
  UserId,
} from '../types';
import { TECHNICAL_LEVELS } from '../types';
import { createArticleId } from './articleId.valueObject';
import { normalizeToPriorityScore } from './priorityScore.valueObject';

/**
 * Article Entity Interface
 */
export interface Article {
  readonly articleId: ArticleId;
  readonly userId: UserId;
  readonly collectedAt: number;
  readonly ttl: number;

  // Metadata
  readonly sourceId: string;
  readonly sourceType: SourceType;
  readonly url: string;
  readonly title: string;
  readonly author?: string;
  readonly publishedAt?: number;

  // Content
  readonly contentPreview: string;
  readonly contentS3Key?: string;
  readonly imageUrl?: string;
  readonly language: Language;

  // AI Analysis
  readonly category: Category;
  readonly subcategories: readonly string[];
  readonly technicalLevel?: TechnicalLevel;
  readonly priorityScore: PriorityScore;
  readonly trendingScore: number;

  // Summary
  readonly summaryShort: string;
  readonly summaryDetailed: string;
  readonly keyPoints: readonly string[];
  readonly keywords: readonly string[];

  // Recommendation
  readonly recommendationTag: RecommendationTag;

  // Analysis metadata
  readonly aiProvider?: AIProvider;
  readonly aiModel?: string;
  readonly analyzedAt?: number;
  readonly analysisVersion?: string;
}

/**
 * Parameters for creating an uninitialized article
 */
export interface CreateArticleParams {
  userId: UserId;
  sourceId: string;
  sourceType: SourceType;
  url: string;
  title: string;
  author?: string;
  publishedAt?: number;
  contentPreview: string;
  contentS3Key?: string;
  imageUrl?: string;
  language: Language;
}

/**
 * Create an uninitialized article (before AI analysis)
 */
export function createUninitializedArticle(
  params: CreateArticleParams
): Result<Article, ValidationError> {
  // Validation
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }

  if (!params.url.trim()) {
    return err(new ValidationError('URLは必須です'));
  }

  if (!isValidUrl(params.url)) {
    return err(new ValidationError('無効なURL形式です'));
  }

  if (!params.contentPreview || params.contentPreview.length === 0) {
    return err(new ValidationError('コンテンツプレビューは必須です'));
  }

  if (params.contentPreview.length > 500) {
    return err(new ValidationError('コンテンツプレビューは500文字以内である必要があります'));
  }

  const now = Date.now();
  const articleId = createArticleId(params.sourceType, params.url);

  return ok({
    articleId,
    userId: params.userId,
    collectedAt: now,
    ttl: Math.floor(now / 1000) + 90 * 24 * 60 * 60, // 90 days

    sourceId: params.sourceId,
    sourceType: params.sourceType,
    url: params.url.trim(),
    title: params.title.trim(),
    author: params.author?.trim(),
    publishedAt: params.publishedAt,

    contentPreview: params.contentPreview,
    contentS3Key: params.contentS3Key,
    imageUrl: params.imageUrl,
    language: params.language,

    // Uninitialized AI analysis fields
    category: 'technology', // Default
    subcategories: [],
    priorityScore: 50 as PriorityScore, // Default
    trendingScore: 0,

    summaryShort: '',
    summaryDetailed: '',
    keyPoints: [],
    keywords: [],

    recommendationTag: 'reference', // Default
  });
}

/**
 * Parameters for AI analysis result
 */
export interface AnalysisResult {
  category: Category;
  subcategories: string[];
  technicalLevel?: TechnicalLevel;
  summaryShort: string;
  summaryDetailed: string;
  keyPoints: string[];
  keywords: string[];
  aiProvider: AIProvider;
  aiModel: string;
}

/**
 * Update article with AI analysis result
 */
export function updateAnalysisResult(
  article: Article,
  analysis: AnalysisResult
): Result<Article, ValidationError> {
  // Validation
  if (!analysis.summaryShort.trim()) {
    return err(new ValidationError('短い要約は必須です'));
  }

  if (!analysis.summaryDetailed.trim()) {
    return err(new ValidationError('詳細な要約は必須です'));
  }

  if (analysis.keyPoints.length === 0) {
    return err(new ValidationError('キーポイントは最低1つ必要です'));
  }

  // Immutable update
  return ok({
    ...article,
    category: analysis.category,
    subcategories: analysis.subcategories,
    technicalLevel: analysis.technicalLevel,
    summaryShort: analysis.summaryShort.trim(),
    summaryDetailed: analysis.summaryDetailed.trim(),
    keyPoints: analysis.keyPoints,
    keywords: analysis.keywords,
    aiProvider: analysis.aiProvider,
    aiModel: analysis.aiModel,
    analyzedAt: Date.now(),
    analysisVersion: '1.0',
  });
}

/**
 * User profile for priority calculation
 */
export interface UserProfile {
  category: Category;
  skillLevel: TechnicalLevel;
  interests: string[];
}

/**
 * Calculate priority score based on user profile
 */
export function calculatePriorityScore(article: Article, userProfile: UserProfile): Article {
  let score = 50; // Base score

  // Category matching
  if (article.category === userProfile.category) {
    score += 20;
  }

  // Interests matching
  const matchingInterests = article.subcategories.filter((sub) =>
    userProfile.interests.includes(sub)
  );
  score += matchingInterests.length * 5;

  // Skill level matching
  if (article.technicalLevel === userProfile.skillLevel) {
    score += 15;
  } else if (
    article.technicalLevel &&
    isOneLevelAbove(article.technicalLevel, userProfile.skillLevel)
  ) {
    score += 25; // Skill gap opportunity
  }

  // Trending bonus
  score += Math.min(article.trendingScore / 10, 10);

  // Freshness penalty
  const ageInDays = (Date.now() - article.collectedAt) / (1000 * 60 * 60 * 24);
  score -= Math.min(ageInDays * 5, 30);

  // Normalize to 0-100
  const normalizedScore = normalizeToPriorityScore(score);

  // Determine recommendation tag
  const tag = determineRecommendationTag(normalizedScore);

  // Immutable update
  return {
    ...article,
    priorityScore: normalizedScore,
    recommendationTag: tag,
  };
}

/**
 * Determine recommendation tag based on priority score
 */
function determineRecommendationTag(priorityScore: PriorityScore): RecommendationTag {
  if (priorityScore >= 80) return 'must_read';
  if (priorityScore >= 60) return 'recommended';
  if (priorityScore < 30) return 'skip';
  return 'reference';
}

/**
 * Check if article level is one level above user level (skill gap opportunity)
 */
function isOneLevelAbove(articleLevel: TechnicalLevel, userLevel: TechnicalLevel): boolean {
  const articleIdx = TECHNICAL_LEVELS.indexOf(articleLevel);
  const userIdx = TECHNICAL_LEVELS.indexOf(userLevel);
  return articleIdx === userIdx + 1;
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reconstruct article from persistence layer
 */
export function reconstructArticle(data: Article): Result<Article, ValidationError> {
  // Validation for reconstructed data
  if (!data.articleId || !data.userId) {
    return err(new ValidationError('ArticleId and UserId are required'));
  }

  return ok(data);
}

/**
 * Check if article has been analyzed
 */
export function isArticleAnalyzed(article: Article): boolean {
  return article.analyzedAt !== undefined && article.summaryShort.length > 0;
}

/**
 * Check if article is expired (based on TTL)
 */
export function isArticleExpired(article: Article): boolean {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp > article.ttl;
}
