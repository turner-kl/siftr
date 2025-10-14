import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth';

export const userRouter = new Hono<{ Variables: { user: AuthUser } }>();

// GET /api/user/profile
userRouter.get('/profile', async (c) => {
  const authUser = c.get('user');

  // TODO: Implement user repository call
  // const user = await userRepository.findByCognitoSub(authUser.sub);

  return c.json({
    user: {
      userId: authUser.sub,
      email: authUser.email,
      displayName: authUser['cognito:username'],
    },
    skill_profiles: [],
  });
});

// PUT /api/user/profile
const UpdateProfileSchema = z.object({
  display_name: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

userRouter.put('/profile', async (c) => {
  const bodyResult = UpdateProfileSchema.safeParse(await c.req.json());
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error }, 400);
  }

  // TODO: Implement user update
  // await userRepository.update(...)

  return c.json({ success: true });
});

// PUT /api/user/skill-profiles
const UpdateSkillProfilesSchema = z.object({
  profiles: z.array(
    z.object({
      category: z.enum(['technology', 'hr', 'business']),
      skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
      interests: z.array(z.string()),
    })
  ),
});

userRouter.put('/skill-profiles', async (c) => {
  const bodyResult = UpdateSkillProfilesSchema.safeParse(await c.req.json());
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error }, 400);
  }

  // TODO: Implement skill profiles update
  // await userSkillProfileRepository.upsert(...)

  return c.json({ success: true });
});

// GET /api/user/preferences
userRouter.get('/preferences', async (c) => {
  // TODO: Implement preferences retrieval
  return c.json({
    notification_enabled: true,
    email_digest_frequency: 'daily',
    default_category: 'technology',
    articles_per_page: 20,
    language_preference: 'ja',
  });
});

// PUT /api/user/preferences
const UpdatePreferencesSchema = z.object({
  notification_enabled: z.boolean().optional(),
  email_digest_frequency: z.enum(['daily', 'weekly', 'never']).optional(),
  default_category: z.enum(['technology', 'hr', 'business']).optional(),
  articles_per_page: z.number().int().min(10).max(100).optional(),
  language_preference: z.enum(['ja', 'en', 'both']).optional(),
});

userRouter.put('/preferences', async (c) => {
  const bodyResult = UpdatePreferencesSchema.safeParse(await c.req.json());
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error }, 400);
  }

  // TODO: Implement preferences update
  // await userRepository.updateSettings(...)

  return c.json({ success: true });
});
