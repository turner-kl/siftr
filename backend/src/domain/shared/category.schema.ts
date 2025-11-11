/**
 * Category Schema (Shared across aggregates)
 * Single Source of Truth using Zod
 */

import { z } from 'zod';

export const CATEGORIES = ['technology', 'hr', 'business'] as const;

export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;
