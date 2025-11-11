# Backend Development Guide for Claude Code

## Overview

This backend follows **DDD (Domain-Driven Design)** and **TDD (Test-Driven Development)** principles.

**Key Architecture**:
- Pure function-based domain layer
- Always-Valid Domain Model pattern
- Schema-First with Zod (Single Source of Truth)
- Result type pattern with neverthrow
- RFC 9457 compliant error responses

## Project Structure

```
src/
├── core/                    # Core utilities
│   └── errors.ts           # Domain error classes
├── domain/                 # Domain layer (pure functions, schemas)
│   ├── users/             # User aggregate
│   │   ├── user.schema.ts       # Zod schemas (SSOT)
│   │   ├── user.entity.ts       # User domain logic
│   │   └── user.repository.ts   # Repository interface
│   └── shared/            # Shared value objects
│       ├── category.schema.ts
│       └── technicalLevel.schema.ts
├── infrastructure/         # Infrastructure layer
│   └── db/                # Database implementations
│       └── inMemoryUserRepository.ts
├── api/                   # Presentation layer (HTTP)
│   ├── index.ts          # Hono app setup
│   ├── middleware/       # Auth, logging, etc.
│   ├── schemas/          # Common API schemas
│   │   └── common.schema.ts  # RFC 9457 error schemas
│   └── routes/           # HTTP route handlers
│       └── me/
│           ├── me.route.ts
│           └── me.schema.ts
└── types/                # (Reserved for future use)
```

## Key Principles

### 1. Always-Valid Domain Model + Result Type

**Separation of Concerns:**
- **Form validation**: Application layer with Schema (`.safeParse()`)
- **Business rules**: Domain layer with Result type

```typescript
// Application Layer (future implementation)
import { type Result } from 'neverthrow';
import { createUserParamsSchema } from '../domain/users/user.schema';
import { createUser } from '../domain/users/user.entity';

async function createUserUseCase(input: unknown): Promise<Result<User, ValidationError>> {
  // ✅ Form validation with Schema
  const parseResult = createUserParamsSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ValidationError('入力検証エラー'));
  }

  // ✅ Domain logic (business rules only)
  const userResult = createUser(parseResult.data);
  if (!userResult.ok) {
    return userResult;
  }

  await userRepo.save(userResult.value);
  return ok(userResult.value);
}

// Domain Layer
export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // ✅ NO form validation (Schema guarantees validity)
  // ✅ Business rules only (if any)

  const user: User = {
    userId: params.userId,  // Already validated by Schema
    email: params.email,    // Already transformed by Schema
    // ...
  };

  return ok(user);
}
```

### 2. Schema-First with Zod (SSOT)

**All types are derived from Zod schemas using `z.infer`:**

```typescript
// ✅ GOOD: Zod schema as SSOT
import { z } from 'zod';

export const userIdSchema = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof userIdSchema>;  // ✅ Type from schema

export const userSchema = z.object({
  userId: userIdSchema,
  email: z.string().email().transform(s => s.toLowerCase().trim()),
  displayName: z.string().optional(),
  profile: userProfileSchema,
  settings: z.record(z.unknown()),
});

export type User = z.infer<typeof userSchema>;  // ✅ Type from schema
```

**Benefits:**
- ✅ Single Source of Truth
- ✅ Type and validation always in sync
- ✅ No duplication between validation and types

### 3. neverthrow Direct Usage

**Import neverthrow directly (no wrapper):**

```typescript
// ✅ GOOD: Direct import
import { type Result, err, ok } from 'neverthrow';
import { ValidationError } from '../../core/errors';

export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // Business rules
  const user: User = { ...params };
  return ok(user);
}

// ❌ BAD: Don't create wrappers
// import { type Result, err, ok } from '../core/result';  // Removed!
```

**Domain Errors (`core/errors.ts`):**

```typescript
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
```

### 4. Branded Types with Zod

**Use `.brand()` for IDs:**

```typescript
// ✅ GOOD: Branded types for IDs
export const userIdSchema = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof userIdSchema>;

// Helper function
export function generateUserId(): UserId {
  return crypto.randomUUID() as UserId;
}
```

### 5. RFC 9457 Error Responses

**Use Problem Details for HTTP APIs:**

```typescript
// api/schemas/common.schema.ts
export const ProblemDetailsSchema = z.object({
  type: z.string().url().default('about:blank'),
  title: z.string(),
  status: z.number().int().min(100).max(599).optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z.array(z.record(z.unknown())).optional(),
});

// Example response
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "バリデーションエラー",
  "status": 400,
  "detail": "メールアドレスの形式が正しくありません",
  "instance": "/api/users/123",
  "errors": [{ "field": "email", "message": "無効です" }]
}
```

### 6. No Audit Fields in Domain

**Keep domain models pure (no DB concerns):**

```typescript
// ✅ GOOD: Pure domain model
export const userSchema = z.object({
  userId: userIdSchema,
  email: emailSchema,
  profile: userProfileSchema,
  settings: z.record(z.unknown()),
  // NO createdAt, updatedAt
});

// Infrastructure layer handles audit info (future)
interface UserRecord {
  user: User;
  createdAt: number;
  updatedAt: number;
}
```

### 7. API/Domain Schema Separation

**API and Domain layers have independent schemas:**

**Principle:**
- API layer: snake_case (REST convention)
- Domain layer: camelCase (TypeScript convention)
- Conversion: camelcase-keys & snakecase-keys

**Domain Schema (SSOT for business logic):**

```typescript
// domain/users/user.schema.ts
export const updateUserProfileParamsSchema = z.object({
  primaryCategory: categorySchema.optional(),
  skillLevel: technicalLevelSchema.optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(userSkillSchema).optional(),
});

export type UpdateUserProfileParams = z.infer<typeof updateUserProfileParamsSchema>;
```

**API Schema (independent, snake_case):**

```typescript
// api/routes/me/me.schema.ts
export const UpdateSkillProfilesSchema = z.object({
  primary_category: categorySchema.optional(),
  skill_level: technicalLevelSchema.optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(UserSkillApiSchema).optional(),
}).openapi({ description: 'スキルプロフィール更新' });
```

**Conversion Utilities:**

```typescript
// api/utils/caseConversion.ts
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

export function toCamelCase<T>(obj: T): T {
  return camelcaseKeys(obj, { deep: true }) as T;
}

export function toSnakeCase<T>(obj: T): T {
  return snakecaseKeys(obj, { deep: true }) as T;
}
```

**Usage in Routes:**

```typescript
// api/routes/me/me.route.ts
import { toCamelCase, toSnakeCase } from '../../utils/caseConversion';

// GET endpoint: Domain → API (toSnakeCase)
meRouter.openapi(getUserProfileRoute, async (c) => {
  const user = await userRepository.find(...);
  return c.json(toSnakeCase({ user, profile: user.profile }), 200);
});

// PUT endpoint: API → Domain (toCamelCase)
meRouter.openapi(updateProfileRoute, async (c) => {
  const body = c.req.valid('json');
  const domainParams = toCamelCase(body);
  const updatedUser = updateUserProfile(user, domainParams);
  await userRepository.save(updatedUser);
  return c.json({ success: true }, 200);
});
```

**Benefits:**
- ✅ Clean separation of concerns (API vs Domain)
- ✅ Independent evolution (API versioning, domain refactoring)
- ✅ REST conventions respected (snake_case in API)
- ✅ TypeScript conventions respected (camelCase in Domain)

## Development Workflow

### 1. Define Domain Schema (SSOT)

```typescript
// domain/users/user.schema.ts
export const createUserParamsSchema = z.object({
  userId: userIdSchema,
  email: emailSchema,
  displayName: z.string().optional(),
  primaryCategory: categorySchema,
  skillLevel: technicalLevelSchema,
});

export type CreateUserParams = z.infer<typeof createUserParamsSchema>;
```

### 2. Write Domain Logic

```typescript
// domain/users/user.entity.ts
export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // Business rules only (no form validation)
  const user: User = {
    userId: params.userId,
    email: params.email,
    profile: {
      primaryCategory: params.primaryCategory,
      skillLevel: params.skillLevel,
      interests: [],
      skills: [],
    },
    settings: {},
  };

  return ok(user);
}
```

### 3. Write Tests (TDD)

```typescript
// domain/users/user.entity.test.ts
describe('createUser', () => {
  it('should create user with valid params', () => {
    const params: CreateUserParams = {
      userId: 'uuid' as UserId,
      email: 'test@example.com',
      // ...
    };

    const result = createUser(params);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.userId).toBe(params.userId);
    }
  });
});
```

### 4. API Layer (future)

```typescript
// api/routes/users/users.route.ts
import { createUserParamsSchema } from '../../../domain/users/user.schema';
import { createUser } from '../../../domain/users/user.entity';

router.post('/users', async (c) => {
  // Schema validation
  const parseResult = createUserParamsSchema.safeParse(await c.req.json());
  if (!parseResult.success) {
    return c.json({
      type: 'https://api.example.com/problems/validation-error',
      title: 'バリデーションエラー',
      status: 400,
      errors: parseResult.error.errors,
    }, 400);
  }

  // Domain logic
  const userResult = createUser(parseResult.data);
  if (!userResult.ok) {
    return c.json({
      type: 'https://api.example.com/problems/business-rule-error',
      title: 'ビジネスルールエラー',
      status: 400,
      detail: userResult.error.message,
    }, 400);
  }

  return c.json({ user: userResult.value }, 201);
});
```

## Testing

### Unit Tests (Domain)

```typescript
describe('User entity', () => {
  it('should create user with business rules', () => {
    const result = createUser(validParams);
    expect(result.ok).toBe(true);
  });

  it('should return error for business rule violation', () => {
    const result = someBusinessRuleFunction(invalidParams);
    expect(result.ok).toBe(false);
  });
});
```

## Common Patterns

### Factory Functions

```typescript
export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // Business rules validation
  // NO form validation (handled by Schema)

  const user: User = {
    userId: params.userId,
    email: params.email,
    profile: {
      primaryCategory: params.primaryCategory,
      skillLevel: params.skillLevel,
      interests: params.interests || [],
      skills: params.skills || [],
    },
    settings: {},
  };

  return ok(user);
}
```

### Update Functions

```typescript
export function updateUserProfile(
  user: User,
  updates: UpdateUserProfileParams
): Result<User, ValidationError> {
  // Business rules validation

  const updated: User = {
    ...user,
    profile: {
      ...user.profile,
      primaryCategory: updates.primaryCategory ?? user.profile.primaryCategory,
      skillLevel: updates.skillLevel ?? user.profile.skillLevel,
      interests: updates.interests ?? user.profile.interests,
      skills: updates.skills ?? user.profile.skills,
    },
  };

  return ok(updated);
}
```

## Layer Dependencies

```
┌─────────────────┐
│   API Layer     │  ← HTTP, .safeParse(), RFC 9457 errors
└────────┬────────┘
         │ depends on
┌────────▼────────┐
│  Application    │  ← Use cases (future)
└────────┬────────┘
         │ depends on
┌────────▼────────┐
│    Domain       │  ← Business logic (pure functions, Result type)
└─────────────────┘
         ▲
         │ implements
┌────────┴────────┐
│ Infrastructure  │  ← DB, external APIs
└─────────────────┘
```

**Rules:**
- ✅ Domain layer: Zod schemas (SSOT), pure functions, Result type
- ✅ Application layer: `.safeParse()` for form validation, orchestration
- ✅ API layer: HTTP, RFC 9457 errors, no business logic
- ✅ Infrastructure: implements domain interfaces
- ❌ Domain NEVER imports from infrastructure
- ❌ Domain NEVER does form validation (Schema handles it)

## Important Notes for Claude Code

### ✅ DO:
- Always write tests first (TDD)
- Use Result type for business rule validation
- Use `.safeParse()` for form validation (Application/API layer)
- Keep domain layer pure (only functions)
- Use Zod schemas as SSOT with `z.infer`
- Use `.brand()` for IDs
- Import neverthrow directly
- Use RFC 9457 for error responses
- Return new objects (immutable)

### ❌ DON'T:
- Never throw exceptions in domain/application layers
- Never use `.parse()` in domain layer (use `.safeParse()` in API layer)
- Never duplicate validation logic
- Never mutate objects
- Never put business logic in API handlers
- Never use `any` type
- Never add `createdAt`/`updatedAt` to domain models

## Code Style

```typescript
// ✅ GOOD: Schema-First with Always-Valid Domain Model
// Schema (SSOT)
export const createUserParamsSchema = z.object({
  userId: userIdSchema,
  email: emailSchema,
  displayName: z.string().optional(),
});
export type CreateUserParams = z.infer<typeof createUserParamsSchema>;

// Domain (business rules only)
export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // No form validation - Schema guarantees validity
  return ok({ ...params, settings: {} });
}

// API (form validation)
const parseResult = createUserParamsSchema.safeParse(input);
if (!parseResult.success) {
  return c.json(problemDetails, 400);
}
const userResult = createUser(parseResult.data);
```

## TODO

- [ ] Implement Application layer services
- [ ] Add camelCase ↔ snake_case conversion (ts-case-convert or radash)
- [ ] Migrate all routes to use ProblemDetailsSchema
- [ ] Add comprehensive domain tests
- [ ] Implement DynamoDB repositories
