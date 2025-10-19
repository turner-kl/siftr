import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { AuthUser } from '../../middleware/auth';
import {
  ErrorResponseSchema,
  PreferencesResponseSchema,
  SuccessResponseSchema,
  UpdatePreferencesSchema,
  UpdateProfileSchema,
  UpdateSkillProfilesSchema,
  UserProfileResponseSchema,
} from './me.schema';

export const meRouter = new OpenAPIHono<{ Variables: { user: AuthUser } }>();

// ============================================================================
// Routes
// ============================================================================

// GET /api/me/profile
const getUserProfileRoute = createRoute({
  method: 'get',
  path: '/profile',
  tags: ['Me'],
  summary: 'ユーザープロフィール取得',
  description: '認証されたユーザーのプロフィール情報を取得します。',
  responses: {
    200: {
      description: 'プロフィール取得に成功',
      content: {
        'application/json': {
          schema: UserProfileResponseSchema,
        },
      },
    },
  },
});

meRouter.openapi(getUserProfileRoute, async (c) => {
  const authUser = c.get('user');

  // TODO: Implement user repository call
  // const user = await userRepository.findByCognitoSub(authUser.sub);

  return c.json(
    {
      user: {
        userId: authUser.sub,
        email: authUser.email,
        displayName: authUser['cognito:username'] || authUser.sub,
      },
      skill_profiles: [],
    },
    200
  );
});

// PUT /api/me/profile
const updateProfileRoute = createRoute({
  method: 'put',
  path: '/profile',
  tags: ['Me'],
  summary: 'プロフィール更新',
  description: 'ユーザープロフィールを更新します。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateProfileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'プロフィール更新に成功',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

meRouter.openapi(updateProfileRoute, async (c) => {
  // TODO: Implement user update
  // await userRepository.update(...)

  return c.json({ success: true }, 200);
});

// PUT /api/me/skill-profiles
const updateSkillProfilesRoute = createRoute({
  method: 'put',
  path: '/skill-profiles',
  tags: ['Me'],
  summary: 'スキルプロフィール更新',
  description: 'ユーザーのスキルプロフィールを更新します。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateSkillProfilesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'スキルプロフィール更新に成功',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

meRouter.openapi(updateSkillProfilesRoute, async (c) => {
  // TODO: Implement skill profiles update
  // await userSkillProfileRepository.upsert(...)

  return c.json({ success: true }, 200);
});

// GET /api/me/preferences
const getPreferencesRoute = createRoute({
  method: 'get',
  path: '/preferences',
  tags: ['Me'],
  summary: 'ユーザー設定取得',
  description: 'ユーザーの設定を取得します。',
  responses: {
    200: {
      description: '設定取得に成功',
      content: {
        'application/json': {
          schema: PreferencesResponseSchema,
        },
      },
    },
  },
});

meRouter.openapi(getPreferencesRoute, async (c) => {
  // TODO: Implement preferences retrieval
  return c.json(
    {
      notification_enabled: true,
      email_digest_frequency: 'daily',
      default_category: 'technology',
      articles_per_page: 20,
      language_preference: 'ja',
    } as const,
    200
  );
});

// PUT /api/me/preferences
const updatePreferencesRoute = createRoute({
  method: 'put',
  path: '/preferences',
  tags: ['Me'],
  summary: 'ユーザー設定更新',
  description: 'ユーザーの設定を更新します。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdatePreferencesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '設定更新に成功',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: '不正なリクエスト',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

meRouter.openapi(updatePreferencesRoute, async (c) => {
  // TODO: Implement preferences update
  // await userRepository.updateSettings(...)

  return c.json({ success: true }, 200);
});
