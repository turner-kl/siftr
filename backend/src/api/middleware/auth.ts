import type { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Cognito JWT verification
const COGNITO_REGION = process.env.COGNITO_REGION || 'ap-northeast-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

// Cache JWKS
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwksCache) {
    const jwksUrl = `${COGNITO_ISSUER}/.well-known/jwks.json`;
    jwksCache = createRemoteJWKSet(new URL(jwksUrl));
  }
  return jwksCache;
}

export interface AuthUser {
  sub: string;
  email: string;
  email_verified?: boolean;
  'cognito:username'?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  // Skip auth in local development if configured
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    c.set('user', {
      sub: 'local-test-user',
      email: 'test@siftr.local',
      email_verified: true,
    });
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized: No authorization header' }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return c.json({ error: 'Unauthorized: Invalid token format' }, 401);
  }

  try {
    const jwks = getJWKS();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: COGNITO_ISSUER,
      audience: process.env.COGNITO_CLIENT_ID,
    });

    // Validate payload has required fields
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return c.json({ error: 'Unauthorized: Invalid token payload' }, 401);
    }

    const authUser: AuthUser = {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified as boolean | undefined,
      'cognito:username': payload['cognito:username'] as string | undefined,
    };

    c.set('user', authUser);
    return next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}
