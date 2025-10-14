/**
 * PriorityScore Value Object
 */

import { type Result, ValidationError, err, ok } from '../../core/result';
import type { PriorityScore } from '../types';

/**
 * Create a PriorityScore with validation
 */
export function createPriorityScore(value: number): Result<PriorityScore, ValidationError> {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return err(new ValidationError('PriorityScoreは数値である必要があります'));
  }

  if (value < 0 || value > 100) {
    return err(new ValidationError('PriorityScoreは0から100の範囲である必要があります'));
  }

  return ok(value as PriorityScore);
}

/**
 * Normalize a raw score to 0-100 range
 */
export function normalizeToPriorityScore(rawScore: number): PriorityScore {
  const normalized = Math.max(0, Math.min(100, rawScore));
  return normalized as PriorityScore;
}

/**
 * Compare two priority scores
 */
export function isPriorityScoreHigher(a: PriorityScore, b: PriorityScore): boolean {
  return a > b;
}
