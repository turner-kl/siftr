/**
 * Result type for error handling without exceptions
 * Inspired by Rust's Result<T, E> and neverthrow library
 */

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Create a success result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Custom error classes
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(entityName: string, id: string) {
    super(`${entityName}が見つかりません: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class SystemError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'SystemError';
  }
}

/**
 * Utility functions
 */

/**
 * Combine multiple results into a single result of an array
 * If any result is an error, return the first error
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
}

/**
 * Similar to combine, but for async results
 */
export async function combineAsync<T, E>(
  results: Promise<Result<T, E>>[]
): Promise<Result<T[], E>> {
  const resolvedResults = await Promise.all(results);
  return combine(resolvedResults);
}

/**
 * Convert a Promise<T> that may throw into Promise<Result<T, Error>>
 */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Map the value of a result if it's ok
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (!result.ok) {
    return result;
  }
  return ok(fn(result.value));
}

/**
 * Map the error of a result if it's an error
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (result.ok) {
    return result;
  }
  return err(fn(result.error));
}

/**
 * Chain results (flatMap/andThen)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (!result.ok) {
    return result;
  }
  return fn(result.value);
}
