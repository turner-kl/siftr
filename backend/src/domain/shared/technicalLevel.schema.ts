/**
 * TechnicalLevel Schema (Shared across aggregates)
 * Single Source of Truth using Zod
 * Used for both article difficulty level and user skill level
 */

import { z } from 'zod';

export const TECHNICAL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const technicalLevelSchema = z.enum(TECHNICAL_LEVELS);
export type TechnicalLevel = z.infer<typeof technicalLevelSchema>;
