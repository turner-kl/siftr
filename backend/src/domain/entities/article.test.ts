import { describe, expect, it } from 'vitest';
import type { UserId } from '../types';
import { createArticleId } from '../valueObjects/articleId';
import {
  type Article,
  calculatePriorityScore,
  createUninitializedArticle,
  isArticleAnalyzed,
  isArticleExpired,
  updateAnalysisResult,
} from './article';

describe('Article Domain Model', () => {
  const testUserId = '123e4567-e89b-12d3-a456-426614174000' as UserId;

  describe('createArticleId', () => {
    it('should create unique article ID from source type and URL', () => {
      const id1 = createArticleId('rss', 'https://example.com/article1');
      const id2 = createArticleId('rss', 'https://example.com/article2');
      const id3 = createArticleId('rss', 'https://example.com/article1');

      expect(id1).toMatch(/^rss:/);
      expect(id1).not.toBe(id2);
      expect(id1).toBe(id3); // Same URL should produce same ID
    });
  });

  describe('createUninitializedArticle', () => {
    it('should create article with default AI analysis fields', () => {
      const result = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test Article',
        contentPreview: 'This is a test article preview',
        language: 'ja',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userId).toBe(testUserId);
        expect(result.value.title).toBe('Test Article');
        expect(result.value.category).toBe('technology');
        expect(result.value.priorityScore).toBe(50);
        expect(result.value.summaryShort).toBe('');
        expect(result.value.recommendationTag).toBe('reference');
      }
    });

    it('should return error for empty title', () => {
      const result = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: '   ', // Empty after trim
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe('ValidationError');
        expect(result.error.message).toContain('タイトルは必須です');
      }
    });

    it('should return error for invalid URL', () => {
      const result = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'not-a-valid-url',
        title: 'Test',
        contentPreview: 'Preview',
        language: 'en',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe('ValidationError');
        expect(result.error.message).toContain('無効なURL形式です');
      }
    });

    it('should set TTL to 90 days from now', () => {
      const result = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test Article',
        contentPreview: 'Preview',
        language: 'en',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const expectedTTL = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
        expect(result.value.ttl).toBeCloseTo(expectedTTL, -2); // Within 100 seconds
      }
    });
  });

  describe('updateAnalysisResult', () => {
    it('should update article with AI analysis results', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test Article',
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const updateResult = updateAnalysisResult(createResult.value, {
        category: 'hr',
        subcategories: ['recruitment', 'organization'],
        technicalLevel: 'intermediate',
        summaryShort: 'Short summary',
        summaryDetailed: 'Detailed summary',
        keyPoints: ['Point 1', 'Point 2'],
        keywords: ['keyword1', 'keyword2'],
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
      });

      expect(updateResult.ok).toBe(true);
      if (updateResult.ok) {
        expect(updateResult.value.category).toBe('hr');
        expect(updateResult.value.subcategories).toEqual(['recruitment', 'organization']);
        expect(updateResult.value.summaryShort).toBe('Short summary');
        expect(updateResult.value.aiProvider).toBe('openai');
        expect(updateResult.value.analyzedAt).toBeDefined();
        expect(updateResult.value.analysisVersion).toBe('1.0');
      }
    });

    it('should return error for empty summary', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test Article',
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const updateResult = updateAnalysisResult(createResult.value, {
        category: 'technology',
        subcategories: [],
        summaryShort: '   ', // Empty
        summaryDetailed: 'Detailed',
        keyPoints: ['Point 1'],
        keywords: [],
        aiProvider: 'openai',
        aiModel: 'gpt-4',
      });

      expect(updateResult.ok).toBe(false);
      if (!updateResult.ok) {
        expect(updateResult.error.name).toBe('ValidationError');
        expect(updateResult.error.message).toContain('短い要約は必須です');
      }
    });
  });

  describe('calculatePriorityScore', () => {
    it('should give high score for matching category and interests', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Backend Architecture',
        contentPreview: 'Preview',
        language: 'en',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const updateResult = updateAnalysisResult(createResult.value, {
        category: 'technology',
        subcategories: ['backend', 'cloud'],
        technicalLevel: 'intermediate',
        summaryShort: 'Summary',
        summaryDetailed: 'Detailed',
        keyPoints: ['Point 1'],
        keywords: [],
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
      });

      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      const scored = calculatePriorityScore(updateResult.value, {
        category: 'technology',
        skillLevel: 'intermediate',
        interests: ['backend', 'cloud'],
      });

      // Base(50) + Category(20) + Interests(10) + SkillLevel(15) = 95
      expect(scored.priorityScore).toBeGreaterThan(80);
      expect(scored.recommendationTag).toBe('must_read');
    });

    it('should give bonus for skill gap articles (one level above)', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Advanced Patterns',
        contentPreview: 'Preview',
        language: 'en',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const updateResult = updateAnalysisResult(createResult.value, {
        category: 'technology',
        subcategories: ['architecture'],
        technicalLevel: 'advanced',
        summaryShort: 'Summary',
        summaryDetailed: 'Detailed',
        keyPoints: ['Point 1'],
        keywords: [],
        aiProvider: 'claude',
        aiModel: 'claude-3-5-sonnet',
      });

      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      const scored = calculatePriorityScore(updateResult.value, {
        category: 'technology',
        skillLevel: 'intermediate', // One level below
        interests: [],
      });

      // Should get skill gap bonus (25 instead of 15)
      expect(scored.priorityScore).toBeGreaterThan(70);
    });

    it('should be immutable (not mutate original article)', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test',
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const original = createResult.value;
      const originalScore = original.priorityScore;

      const scored = calculatePriorityScore(original, {
        category: 'technology',
        skillLevel: 'beginner',
        interests: [],
      });

      expect(scored).not.toBe(original); // Different object
      expect(original.priorityScore).toBe(originalScore); // Original unchanged
      expect(scored.priorityScore).not.toBe(originalScore); // Scored changed
    });
  });

  describe('isArticleAnalyzed', () => {
    it('should return false for unanalyzed article', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test',
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      expect(isArticleAnalyzed(createResult.value)).toBe(false);
    });

    it('should return true for analyzed article', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test',
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const updateResult = updateAnalysisResult(createResult.value, {
        category: 'technology',
        subcategories: [],
        summaryShort: 'Summary',
        summaryDetailed: 'Detailed',
        keyPoints: ['Point 1'],
        keywords: [],
        aiProvider: 'openai',
        aiModel: 'gpt-4',
      });

      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      expect(isArticleAnalyzed(updateResult.value)).toBe(true);
    });
  });

  describe('isArticleExpired', () => {
    it('should return false for non-expired article', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test',
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      expect(isArticleExpired(createResult.value)).toBe(false);
    });

    it('should return true for expired article', () => {
      const createResult = createUninitializedArticle({
        userId: testUserId,
        sourceId: '123e4567-e89b-12d3-a456-426614174001',
        sourceType: 'rss',
        url: 'https://example.com/article',
        title: 'Test',
        contentPreview: 'Preview',
        language: 'ja',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      // Set TTL to past
      const expiredArticle: Article = {
        ...createResult.value,
        ttl: Math.floor(Date.now() / 1000) - 100,
      };

      expect(isArticleExpired(expiredArticle)).toBe(true);
    });
  });
});
