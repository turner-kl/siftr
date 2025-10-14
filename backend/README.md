# siftr Backend

AI-driven personalized information curation system - Backend API

## Architecture

- **Framework**: Hono (Lambda Web Adapter compatible)
- **Language**: TypeScript
- **Database**: DynamoDB
- **Storage**: S3
- **Auth**: AWS Cognito
- **Infrastructure**: AWS CDK (in `/cdk` directory at project root)

## Design Principles

This backend follows **Domain-Driven Design (DDD)** and **Test-Driven Development (TDD)** practices inspired by [mizchi/ailab](https://github.com/mizchi/ailab).

**Key Architecture**: Pure function-based domain layer with Result type pattern (NO Zod in domain layer).

### Directory Structure

```
backend/
├── src/
│   ├── core/              # Core utilities (Result type, errors)
│   │   └── result.ts      # Result<T, E> type and error classes
│   ├── domain/            # Domain layer (pure functions, NO classes)
│   │   ├── entities/      # Domain entities (pure functions)
│   │   │   ├── article.ts # Article domain logic
│   │   │   └── user.ts    # User domain logic
│   │   ├── repositories/  # Repository interfaces (abstract)
│   │   ├── services/      # Domain services (pure functions)
│   │   ├── valueObjects/  # Value objects with validation
│   │   └── types.ts       # Branded types (ArticleId, UserId, etc.)
│   ├── infrastructure/    # Infrastructure layer (external dependencies)
│   │   ├── db/           # Database implementations
│   │   │   ├── dynamodb-article-repository.ts  # Production DB
│   │   │   ├── inMemoryArticleRepository.ts    # Testing
│   │   │   └── inMemoryUserRepository.ts       # Testing
│   │   ├── api/          # External API clients
│   │   └── external/     # Other external services
│   ├── application/       # Application layer (use cases)
│   │   └── articleService.ts  # Class-based service with DI
│   └── api/              # Presentation layer (HTTP)
│       ├── index.ts      # Hono app setup + DI
│       ├── middleware/   # Auth, logging, etc.
│       └── routes/       # HTTP route handlers
├── test/                 # Tests
├── scripts/              # Utility scripts
├── docker-compose.yml    # Local development environment
└── Dockerfile.dev        # Development container
```

### Key Patterns

#### 1. Result Type Pattern (NO Exceptions)

Never throw exceptions in domain/application layer. Use Result type:

```typescript
import { ok, err, type Result, ValidationError } from '../core/result';

// Domain function returning Result
export function createArticle(params: CreateArticleParams): Result<Article, ValidationError> {
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }
  return ok(article);
}

// Consuming Result
const result = createArticle(params);
if (!result.ok) {
  console.error(result.error.message);
  return;
}
const article = result.value; // Type-safe!
```

#### 2. NO Zod in Domain Layer

Domain layer uses pure TypeScript types and manual validation:

```typescript
// ✅ GOOD: Pure TypeScript types in domain
export interface Article {
  articleId: ArticleId;
  title: string;
  category: Category;
  // ...
}

// ✅ GOOD: Manual validation in factory functions
export function createArticle(params: CreateArticleParams): Result<Article, ValidationError> {
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }
  return ok(article);
}
```

**Zod is ONLY used in API layer for HTTP request validation:**

```typescript
// ✅ GOOD: Zod in API layer (routes)
const CreateArticleSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
});

articlesRouter.post('/manual', async (c) => {
  const bodyResult = CreateArticleSchema.safeParse(await c.req.json());
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  // ...
});
```

#### 3. Pure Functions in Domain Layer

Domain layer contains ONLY pure functions (no classes, no side effects):

```typescript
// ✅ GOOD: Pure function
export function calculatePriorityScore(
  article: Article,
  userProfile: UserProfile
): Article {
  let score = 50;
  // Calculate...

  // Return NEW object (immutable)
  return {
    ...article,
    priorityScore: Math.max(0, Math.min(100, score)) as PriorityScore,
  };
}
```

#### 4. Repository Pattern with DI

Domain layer defines interfaces, infrastructure layer implements:

```typescript
// domain/repositories/article-repository.ts (INTERFACE)
export interface ArticleRepository {
  findById(id: ArticleId): Promise<Result<Article | null, ValidationError>>;
  save(article: Article): Promise<Result<void, ValidationError>>;
}

// infrastructure/db/dynamodb-article-repository.ts (IMPLEMENTATION)
export class DynamoDBArticleRepository implements ArticleRepository {
  async findById(articleId: ArticleId): Promise<Result<Article | null, ValidationError>> {
    // Implementation
  }
}

// api/index.ts (DI SETUP)
const articleRepository = useInMemory
  ? new InMemoryArticleRepository()
  : new DynamoDBArticleRepository();

const articleService = new ArticleApplicationService(articleRepository, userRepository);

app.use('*', async (c, next) => {
  c.set('articleService', articleService);
  await next();
});
```

## Local Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- AWS CLI (for LocalStack)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Start local infrastructure:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - DynamoDB Local (port 8000)
   - DynamoDB Admin UI (port 8001)
   - LocalStack (S3, Secrets Manager) (port 4566)

4. Start development server:
   ```bash
   npm run dev
   ```

   API will be available at http://localhost:3001

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting (Biome)
npm run lint
npm run lint:fix

# Build
npm run build
```

## API Endpoints

### Health Check

```
GET /health
```

### Articles

```
GET    /api/articles                        # List articles (with filters)
GET    /api/articles/:id                    # Get article details
POST   /api/articles/manual                 # Add manual article
POST   /api/articles/:id/calculate-priority # Calculate priority
POST   /api/articles/:id/interact           # Record interaction
DELETE /api/articles/:id                    # Delete article
```

### User

```
GET    /api/user/profile          # Get user profile
PUT    /api/user/profile          # Update profile
PUT    /api/user/skill-profiles   # Update skill profiles
GET    /api/user/preferences      # Get preferences
PUT    /api/user/preferences      # Update preferences
```

## Authentication

The API uses AWS Cognito JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

For local development, you can skip auth by setting:
```bash
SKIP_AUTH=true
NODE_ENV=development
```

## Deployment

### Prerequisites

1. Bootstrap CDK (first time only):
   ```bash
   cd ../cdk
   npm install
   npm run cdk:bootstrap
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy infrastructure:
   ```bash
   cd ../cdk
   npm run cdk:deploy
   ```

### Environment Variables

Production environment variables are managed via:
- **Secrets Manager**: API keys, database credentials
- **Parameter Store**: Configuration values
- **Environment Variables**: Non-sensitive runtime config

## Testing Strategy

Following TDD principles from [mizchi/ailab](https://github.com/mizchi/ailab):

1. **Write Types First**: Define pure TypeScript types
2. **Write Tests**: Comprehensive test cases before implementation
3. **Implement**: Code to pass the tests (using Result type)
4. **Refactor**: Improve code while keeping tests green

### Test Coverage Goals

- **Domain Entities**: 100% coverage (pure functions)
- **Repositories**: >90% coverage (integration tests)
- **API Routes**: >80% coverage (E2E tests)
- **Overall**: >85% coverage

### Example Test

```typescript
describe('createArticle', () => {
  it('should create article with valid params', () => {
    const result = createArticle({ title: 'Test', ... });
    expect(result.ok).toBe(true);
  });

  it('should return error for empty title', () => {
    const result = createArticle({ title: '', ... });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('タイトルは必須です');
    }
  });
});
```

## Architecture Principles

### Layer Dependencies

```
┌─────────────────┐
│   API Layer     │  ← HTTP handlers, Zod validation
└────────┬────────┘
         │ depends on
┌────────▼────────┐
│  Application    │  ← Use cases, orchestration (classes with DI)
└────────┬────────┘
         │ depends on
┌────────▼────────┐
│    Domain       │  ← Business logic (pure functions, interfaces)
└─────────────────┘
         ▲
         │ implements
┌────────┴────────┐
│ Infrastructure  │  ← DB, external APIs (implementations)
└─────────────────┘
```

### Rules

- ✅ Domain layer has NO dependencies (only pure functions and interfaces)
- ✅ Application layer depends on domain interfaces
- ✅ Infrastructure implements domain interfaces
- ✅ API layer uses application services
- ❌ Domain layer NEVER imports from infrastructure
- ❌ Domain layer NEVER uses Zod (API layer only)
- ❌ Domain layer NEVER uses classes (pure functions only)
- ❌ Never throw exceptions (use Result type)

## References

This implementation was inspired by:

1. **[mizchi/ailab](https://github.com/mizchi/ailab)** - DDD/TDD patterns:
   - Result type for error handling (no exceptions)
   - Pure function-based domain layer
   - Test-first development workflow
   - Domain-driven design structure
   - Type-safe repository pattern

2. **Lambda Web Adapter**:
   - Runs standard HTTP servers on Lambda
   - Compatible with Hono, Express, Fastify
   - No code changes needed for Lambda deployment

3. **Hono Framework**:
   - Fast, lightweight web framework
   - Built-in middleware support
   - TypeScript-first design

## Development Guide

For detailed development guide including code patterns and examples, see [CLAUDE.md](./CLAUDE.md).

## License

See LICENSE file at project root.
