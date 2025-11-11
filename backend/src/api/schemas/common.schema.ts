/**
 * Common API Response Schemas
 * Based on RFC 9457 (Problem Details for HTTP APIs)
 */

import { z } from '@hono/zod-openapi';

// ============================================================================
// Success Response
// ============================================================================

/**
 * Generic success response
 */
export const SuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
  })
  .openapi({
    description: '成功レスポンス',
  });

// ============================================================================
// Error Response (RFC 9457 Problem Details)
// ============================================================================

/**
 * RFC 9457 Problem Details for HTTP APIs
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */
export const ProblemDetailsSchema = z
  .object({
    /**
     * A URI reference that identifies the problem type
     * Default: "about:blank"
     */
    type: z.string().url().default('about:blank').openapi({
      description: '問題タイプを識別するURI',
      example: 'https://api.example.com/problems/validation-error',
    }),

    /**
     * A short, human-readable summary of the problem type
     */
    title: z.string().openapi({
      description: '問題の簡潔な要約',
      example: 'バリデーションエラー',
    }),

    /**
     * The HTTP status code
     */
    status: z.number().int().min(100).max(599).optional().openapi({
      description: 'HTTPステータスコード',
      example: 400,
    }),

    /**
     * A human-readable explanation specific to this occurrence
     */
    detail: z.string().optional().openapi({
      description: '問題の詳細説明',
      example: 'メールアドレスの形式が正しくありません',
    }),

    /**
     * A URI reference that identifies the specific occurrence
     */
    instance: z.string().optional().openapi({
      description: '問題発生の特定インスタンスを識別するURI',
      example: '/api/users/123',
    }),

    /**
     * Extension members (additional problem-specific fields)
     */
    errors: z.array(z.record(z.unknown())).optional().openapi({
      description: '詳細なエラー情報',
    }),
  })
  .openapi({
    description: 'RFC 9457準拠のエラーレスポンス',
  });

/**
 * Error response schema (alias for ProblemDetailsSchema)
 */
export const ErrorResponseSchema = ProblemDetailsSchema;
