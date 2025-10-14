/**
 * Shared domain types using branded types for type safety
 */

// Branded type helper
type Brand<K, T> = K & { readonly __brand: T };

// ID types
export type ArticleId = Brand<string, 'ArticleId'>;
export type UserId = Brand<string, 'UserId'>;

// Enums
export type Category = 'technology' | 'hr' | 'business';
export type TechnicalLevel = 'beginner' | 'intermediate' | 'advanced';
export type RecommendationTag = 'must_read' | 'recommended' | 'reference' | 'skip';
export type SourceType = 'rss' | 'twitter' | 'reddit' | 'hackernews' | 'manual';
export type Language = 'ja' | 'en';
export type AIProvider = 'openai' | 'claude';

// Value types
export type PriorityScore = Brand<number, 'PriorityScore'>;
export type TrendingScore = Brand<number, 'TrendingScore'>;

// Constants for validation
export const CATEGORIES: readonly Category[] = ['technology', 'hr', 'business'] as const;
export const TECHNICAL_LEVELS: readonly TechnicalLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
] as const;
export const RECOMMENDATION_TAGS: readonly RecommendationTag[] = [
  'must_read',
  'recommended',
  'reference',
  'skip',
] as const;
export const SOURCE_TYPES: readonly SourceType[] = [
  'rss',
  'twitter',
  'reddit',
  'hackernews',
  'manual',
] as const;
export const LANGUAGES: readonly Language[] = ['ja', 'en'] as const;
export const AI_PROVIDERS: readonly AIProvider[] = ['openai', 'claude'] as const;
