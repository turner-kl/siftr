/**
 * UserId Value Object
 */

import { type Result, ValidationError, err, ok } from '../../core/result';
import type { UserId } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Create a UserId with validation
 */
export function createUserId(value: string): Result<UserId, ValidationError> {
  const trimmed = value.trim();

  if (!trimmed) {
    return err(new ValidationError('UserIdは必須です'));
  }

  if (!UUID_REGEX.test(trimmed)) {
    return err(new ValidationError('UserIdはUUID形式である必要があります'));
  }

  return ok(trimmed as UserId);
}

/**
 * Generate a new random UserId
 */
export function generateUserId(): UserId {
  return crypto.randomUUID() as UserId;
}

/**
 * Check if two UserIds are equal
 */
export function userIdEquals(a: UserId, b: UserId): boolean {
  return a === b;
}
