import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from 'zod';
import type { AuthUser } from '../../middleware/auth';
import {
  PreferencesResponseSchema,
  UpdatePreferencesSchema,
  UpdateProfileSchema,
  UpdateSkillProfilesSchema,
  UserProfileResponseSchema,
} from './me.schema';
// import { toCamelCase, toSnakeCase } from '../../utils/caseConversion';  // TODO: Enable when implementing

export const meRouter = new Hono<{ Variables: { user: AuthUser } }>()
  // GET /api/me/profile
  .get(
    '/profile',
    describeRoute({
      tags: ['Me'],
      summary: 'ユーザープロフィール取得',
      description: '認証されたユーザーのプロフィール情報を取得します。',
      responses: {
        200: {
          description: 'プロフィール取得に成功',
          content: {
            'application/json': {
              schema: resolver(UserProfileResponseSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      const authUser = c.get('user');

      // TODO: Implement user repository call
      // const user = await userRepository.findByCognitoSub(authUser.sub);
      // if (!user) {
      //   return c.json({ error: 'User not found' }, 404);
      // }
      // Convert Domain (camelCase) → API (snake_case)
      // return c.json(toSnakeCase({ user, profile: user.profile, settings: user.settings }), 200);

      // Temporary mock response (already in snake_case)
      return c.json(
        {
          user: {
            user_id: authUser.sub,
            email: authUser.email,
            display_name: authUser['cognito:username'] || authUser.sub,
          },
          profile: {
            primary_category: 'technology',
            skill_level: 'beginner',
            interests: [],
            skills: [],
          },
          settings: {},
        },
        200
      );
    }
  )
  // PUT /api/me/profile
  .put(
    '/profile',
    describeRoute({
      tags: ['Me'],
      summary: 'プロフィール更新',
      description: 'ユーザープロフィールを更新します。',
      responses: {
        200: {
          description: 'プロフィール更新に成功',
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                })
              ),
            },
          },
        },
        400: {
          description: '不正なリクエスト',
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  error: z.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator('json', UpdateProfileSchema),
    async (c) => {
      // TODO: Implement user update
      // const body = c.req.valid('json');
      // Convert API (snake_case) → Domain (camelCase)
      // const domainParams = toCamelCase(body);
      // const authUser = c.get('user');
      // const user = await userRepository.findByCognitoSub(authUser.sub);
      // if (!user) {
      //   return c.json({ error: 'User not found' }, 404);
      // }
      // const updatedUser = updateUserProfile(user, domainParams);
      // await userRepository.save(updatedUser);

      return c.json({ success: true }, 200);
    }
  )
  // PUT /api/me/skill-profiles
  .put(
    '/skill-profiles',
    describeRoute({
      tags: ['Me'],
      summary: 'スキルプロフィール更新',
      description: 'ユーザーのスキルプロフィールを更新します。',
      responses: {
        200: {
          description: 'スキルプロフィール更新に成功',
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                })
              ),
            },
          },
        },
        400: {
          description: '不正なリクエスト',
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  error: z.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator('json', UpdateSkillProfilesSchema),
    async (c) => {
      // TODO: Implement skill profiles update
      // const body = c.req.valid('json');
      // Convert API (snake_case) → Domain (camelCase)
      // const domainParams = toCamelCase(body);
      // const authUser = c.get('user');
      // const user = await userRepository.findByCognitoSub(authUser.sub);
      // if (!user) {
      //   return c.json({ error: 'User not found' }, 404);
      // }
      // const updatedUser = updateUserProfile(user, domainParams);
      // await userRepository.save(updatedUser);

      return c.json({ success: true }, 200);
    }
  )
  // GET /api/me/preferences
  .get(
    '/preferences',
    describeRoute({
      tags: ['Me'],
      summary: 'ユーザー設定取得',
      description: 'ユーザーの設定を取得します。',
      responses: {
        200: {
          description: '設定取得に成功',
          content: {
            'application/json': {
              schema: resolver(PreferencesResponseSchema),
            },
          },
        },
      },
    }),
    async (c) => {
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
    }
  )
  // PUT /api/me/preferences
  .put(
    '/preferences',
    describeRoute({
      tags: ['Me'],
      summary: 'ユーザー設定更新',
      description: 'ユーザーの設定を更新します。',
      responses: {
        200: {
          description: '設定更新に成功',
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                })
              ),
            },
          },
        },
        400: {
          description: '不正なリクエスト',
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  error: z.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator('json', UpdatePreferencesSchema),
    async (c) => {
      // TODO: Implement preferences update
      // const body = c.req.valid('json');
      // Convert API (snake_case) → Domain (camelCase)
      // const domainParams = toCamelCase(body);
      // const authUser = c.get('user');
      // const user = await userRepository.findByCognitoSub(authUser.sub);
      // if (!user) {
      //   return c.json({ error: 'User not found' }, 404);
      // }
      // const updatedUser = updateUserSettings(user, domainParams);
      // await userRepository.save(updatedUser);

      return c.json({ success: true }, 200);
    }
  );
