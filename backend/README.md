# siftr Backend

AI-driven personalized information curation system - Backend API

## Architecture

- **Framework**: Hono with @hono/zod-openapi (Lambda Web Adapter compatible)
- **Language**: TypeScript
- **Database**: DynamoDB (future)
- **Auth**: AWS Cognito
- **Infrastructure**: AWS CDK (future)
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **Type Safety**: Hono RPC client for frontend integration

## Design Principles

This backend follows **Domain-Driven Design (DDD)** and **Test-Driven Development (TDD)** practices.

**Key Architecture**:
- Pure function-based domain layer
- Always-Valid Domain Model pattern
- Schema-First with Zod (Single Source of Truth)
- Result type pattern with neverthrow
- RFC 9457 compliant error responses
- **Hono RPC + Zod OpenAPI** integration for type-safe API with automatic documentation

### Directory Structure

```
backend/
├── src/
│   ├── core/              # Core utilities
│   │   └── errors.ts      # Domain error classes
│   ├── domain/            # Domain layer (pure functions, schemas)
│   │   ├── users/         # User aggregate
│   │   │   ├── user.schema.ts     # Zod schemas (SSOT)
│   │   │   ├── user.entity.ts     # User domain logic
│   │   │   └── user.repository.ts # Repository interface
│   │   └── shared/        # Shared value objects
│   │       ├── category.schema.ts
│   │       └── technicalLevel.schema.ts
│   ├── infrastructure/    # Infrastructure layer
│   │   └── db/           # Database implementations
│   │       └── inMemoryUserRepository.ts  # In-memory (dev/test)
│   └── api/              # Presentation layer (HTTP)
│       ├── index.ts      # Hono app setup
│       ├── middleware/   # Auth, logging, etc.
│       ├── schemas/      # Common API schemas
│       │   └── common.schema.ts  # RFC 9457 error schemas
│       ├── utils/        # API utilities
│       │   └── caseConversion.ts  # camelCase ↔ snake_case conversion
│       └── routes/       # HTTP route handlers
│           └── me/
│               ├── me.route.ts
│               └── me.schema.ts
├── test/                 # Tests (future)
└── package.json
```

### Key Patterns

#### 1. Always-Valid Domain Model

**Form validation** at Application/API layer, **business rules** at Domain layer:

```typescript
// API Layer (form validation)
const parseResult = createUserParamsSchema.safeParse(input);
if (!parseResult.success) {
  return c.json(problemDetails, 400);
}

// Domain Layer (business rules only)
const userResult = createUser(parseResult.data);
if (!userResult.ok) {
  return c.json(problemDetails, 400);
}
```

#### 2. Schema-First with Zod

All types are derived from Zod schemas:

```typescript
// ✅ Zod schema as SSOT
export const userSchema = z.object({
  userId: userIdSchema.brand<'UserId'>(),
  email: z.string().email().transform(s => s.toLowerCase().trim()),
  profile: userProfileSchema,
});

export type User = z.infer<typeof userSchema>;
```

#### 3. Result Type Pattern

Never throw exceptions, use Result type:

```typescript
import { type Result, err, ok } from 'neverthrow';
import { ValidationError } from '../../core/errors';

export function createUser(params: CreateUserParams): Result<User, ValidationError> {
  // Business rules only
  return ok({ ...params, settings: {} });
}
```

#### 4. RFC 9457 Error Responses

Standardized error format for HTTP APIs:

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "バリデーションエラー",
  "status": 400,
  "detail": "メールアドレスの形式が正しくありません",
  "errors": [{"field": "email", "message": "無効です"}]
}
```

#### 5. API/Domain Schema Separation

**API and Domain layers have independent schemas with automatic conversion:**

```typescript
// API Schema (snake_case) - Independent definition
export const UpdateSkillProfilesSchema = z.object({
  primary_category: categorySchema.optional(),
  skill_level: technicalLevelSchema.optional(),
});

// Domain Schema (camelCase) - Business logic SSOT
export const updateUserProfileParamsSchema = z.object({
  primaryCategory: categorySchema.optional(),
  skillLevel: technicalLevelSchema.optional(),
});

// Conversion utilities (camelcase-keys & snakecase-keys)
import { toCamelCase, toSnakeCase } from '../../utils/caseConversion';

// Usage in routes
const body = c.req.valid('json');
const domainParams = toCamelCase(body);  // API → Domain
// ...
return c.json(toSnakeCase(result), 200);  // Domain → API
```

## Hono RPC + Zod OpenAPI Integration

This project combines **Hono RPC** for type-safe API calls with **@hono/zod-openapi** for automatic OpenAPI documentation.

### Benefits

1. ✅ **Full Type Safety**: Frontend gets complete type inference from backend
2. ✅ **Automatic Documentation**: OpenAPI spec + Swagger UI
3. ✅ **Single Source of Truth**: Zod schemas for validation and types
4. ✅ **Status Code Type Inference**: Different response types per status code

### Quick Examples

**Backend Route Definition:**
```typescript
import { createRoute } from '@hono/zod-openapi';

const route = createRoute({
  method: 'get',
  path: '/profile',
  responses: {
    200: { content: { 'application/json': { schema: ProfileSchema } } },
    404: { content: { 'application/json': { schema: ErrorSchema } } },
  },
});

meRouter.openapi(route, async (c) => {
  if (!user) return c.json({ error: 'Not found' }, 404); // ✅ Explicit 404
  return c.json({ user }, 200); // ✅ Explicit 200
});
```

**Frontend RPC Client:**
```typescript
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/api';

const apiClient = hc<AppType>('http://localhost:3001');

// Type-safe API call with status handling
const res = await apiClient.api.me.profile.$get();
if (res.status === 404) {
  const error = await res.json(); // Type: { error: string }
}
if (res.ok) {
  const data = await res.json(); // Type: ProfileResponse
}
```

### Documentation URLs

- **Swagger UI**: http://localhost:3001/ui
- **OpenAPI JSON**: http://localhost:3001/doc

### Full Guide

See `docs/hono-rpc-openapi-integration.md` for comprehensive documentation and best practices.

## Local Development

### Prerequisites

- Node.js 20+

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

   API will be available at http://localhost:3001

### Running Tests

```bash
# Run all tests (currently no tests)
npm test

# Type checking
npm run typecheck

# Linting (Biome)
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:fix

# Build
npm run build
```

## API Endpoints

### Health Check

```
GET /health
```

### User Profile (/me endpoints)

```
GET    /api/me/profile          # Get user profile
PUT    /api/me/profile          # Update profile
PUT    /api/me/skill-profiles   # Update skill profiles
GET    /api/me/preferences      # Get preferences
PUT    /api/me/preferences      # Update preferences
```

## Authentication

The API uses AWS Cognito JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

For local development, authentication middleware will return 401 if no token is provided.

## Architecture Principles

### Layer Dependencies

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

### Rules

- ✅ Domain layer: Zod schemas (SSOT), pure functions, Result type
- ✅ Application layer: `.safeParse()` for form validation
- ✅ API layer: HTTP, RFC 9457 errors, no business logic
- ✅ Infrastructure: implements domain interfaces
- ❌ Domain NEVER imports from infrastructure
- ❌ Domain NEVER does form validation (Schema handles it)
- ❌ Never throw exceptions (use Result type)
- ❌ Never use `.parse()` in domain (use `.safeParse()` in API)

## Testing Strategy

Following TDD principles:

1. **Write Types First**: Define Zod schemas
2. **Write Tests**: Comprehensive test cases before implementation
3. **Implement**: Code to pass the tests (using Result type)
4. **Refactor**: Improve code while keeping tests green

### Example Test (future)

```typescript
describe('createUser', () => {
  it('should create user with valid params', () => {
    const result = createUser(validParams);
    expect(result.ok).toBe(true);
  });

  it('should return error for business rule violation', () => {
    const result = createUser(invalidParams);
    expect(result.ok).toBe(false);
  });
});
```

## References

This implementation is inspired by:

1. **[mizchi/ailab](https://github.com/mizchi/ailab)** - DDD/TDD patterns
2. **Always-Valid Domain Model** - Schema-First validation
3. **[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)** - Problem Details for HTTP APIs

## Development Guide

For detailed development guide including code patterns and examples, see [CLAUDE.md](./CLAUDE.md).

## License

See LICENSE file at project root.
