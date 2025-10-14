/**
 * ArticleId Value Object
 */

import { type Result, ValidationError, err, ok } from '../../core/result';
import type { ArticleId, SourceType } from '../types';

/**
 * Create an ArticleId from source type and URL
 */
export function createArticleId(sourceType: SourceType, url: string): ArticleId {
  const hash = hashString(url);
  return `${sourceType}:${hash}` as ArticleId;
}

/**
 * Validate an ArticleId string
 */
export function validateArticleId(value: string): Result<ArticleId, ValidationError> {
  if (!value || value.trim().length === 0) {
    return err(new ValidationError('ArticleIdは必須です'));
  }

  const parts = value.split(':');
  if (parts.length !== 2) {
    return err(new ValidationError('ArticleIdの形式が不正です (expected: sourceType:hash)'));
  }

  return ok(value as ArticleId);
}

/**
 * Extract source type from ArticleId
 */
export function getSourceTypeFromArticleId(articleId: ArticleId): string {
  return articleId.split(':')[0] || '';
}

/**
 * Hash string helper (simple hash for demo purposes)
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
