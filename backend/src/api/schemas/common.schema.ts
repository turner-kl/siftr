/**
 * Common API Response Schemas
 * Based on RFC 9457 (Problem Details for HTTP APIs)
 */

import { z } from 'zod';

// ============================================================================
// Success Response
// ============================================================================

/**
 * Generic success response
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

// ============================================================================
// Error Response (RFC 9457 Problem Details)
// ============================================================================

/**
 * RFC 9457 Problem Details for HTTP APIs
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */
export const ProblemDetailsSchema = z.object({
  /**
   * A URI reference that identifies the problem type
   * Default: "about:blank"
   */
  type: z.string().url().default('about:blank'),

  /**
   * A short, human-readable summary of the problem type
   */
  title: z.string(),

  /**
   * The HTTP status code
   */
  status: z.number().int().min(100).max(599).optional(),

  /**
   * A human-readable explanation specific to this occurrence
   */
  detail: z.string().optional(),

  /**
   * A URI reference that identifies the specific occurrence
   */
  instance: z.string().optional(),

  /**
   * Extension members (additional problem-specific fields)
   */
  errors: z.array(z.record(z.string(), z.unknown())).optional(),
});

/**
 * Error response schema (alias for ProblemDetailsSchema)
 */
export const ErrorResponseSchema = ProblemDetailsSchema;
