/**
 * Case Conversion Utilities
 * Handles camelCase ↔ snake_case conversion between API and Domain layers
 */

import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

/**
 * Convert object keys from snake_case to camelCase
 * Used when receiving API requests (snake_case) → Domain layer (camelCase)
 *
 * @param obj - Object with snake_case keys
 * @returns Object with camelCase keys
 */
export function toCamelCase<T extends Record<string, unknown>>(obj: T): T {
  return camelcaseKeys(obj, { deep: true }) as T;
}

/**
 * Convert object keys from camelCase to snake_case
 * Used when sending API responses (snake_case) ← Domain layer (camelCase)
 *
 * @param obj - Object with camelCase keys
 * @returns Object with snake_case keys
 */
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): T {
  return snakecaseKeys(obj, { deep: true }) as T;
}
