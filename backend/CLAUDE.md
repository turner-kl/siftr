# Backend Development Guide for Claude Code

## Overview

This backend follows **DDD (Domain-Driven Design)** and **TDD (Test-Driven Development)** principles.

**Key Architecture**: Pure function-based domain layer with Result type pattern (NO Zod in domain layer).

## Project Structure

```
src/
├── core/                    # Core utilities (Result type, errors)
│   └── result.ts           # Result<T, E> type and error classes
├── domain/                 # Domain layer (pure functions, NO classes)
│   ├── entities/            # Domain entities (pure functions)
│   │   ├── article.ts     # Article domain logic
│   │   └── user.ts        # User domain logic
│   ├── repositories/      # Repository interfaces (abstract)
│   │   ├── article-repository.ts
│   │   └── user-repository.ts
│   ├── services/          # Domain services (pure functions)
│   ├── valueObjects/      # Value objects with validation
│   └── types.ts           # Branded types (ArticleId, UserId, etc.)
├── infrastructure/         # Infrastructure layer (external dependencies)
│   ├── db/                # Database implementations
│   │   ├── dynamodb-article-repository.ts    # Production DB
│   │   ├── inMemoryArticleRepository.ts      # Testing
│   │   └── inMemoryUserRepository.ts         # Testing
│   ├── api/               # External API clients
│   └── external/          # Other external services
├── application/           # Application layer (use cases)
│   └── articleService.ts  # Class-based service with DI
├── api/                   # Presentation layer (HTTP)
│   ├── index.ts          # Hono app setup + DI
│   ├── middleware/       # Auth, logging, etc.
│   └── routes/           # HTTP route handlers
└── types/                # Shared types
```

## Key Principles

### 1. Result Type Pattern (NO Exceptions)

**Never throw exceptions in domain/application layer. Use Result type:**

```typescript
import { ok, err, type Result, ValidationError, NotFoundError } from '../core/result';

// Domain function returning Result
export function createArticle(params: CreateArticleParams): Result<Article, ValidationError> {
  // Validation
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }

  // Create entity
  const article: Article = {
    articleId: crypto.randomUUID() as ArticleId,
    ...params,
    collectedAt: Date.now(),
  };

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

### 2. NO Zod in Domain Layer

**Domain layer uses pure TypeScript types and manual validation:**

```typescript
// ❌ BAD: Zod in domain layer
export const ArticleSchema = z.object({ ... });
export type Article = z.infer<typeof ArticleSchema>;

// ✅ GOOD: Pure TypeScript types
export interface Article {
  articleId: ArticleId;
  userId: UserId;
  title: string;
  category: Category;
  priorityScore: PriorityScore;
  // ...
}

// ✅ GOOD: Manual validation in factory functions
export function createArticle(params: CreateArticleParams): Result<Article, ValidationError> {
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }
  // ...
  return ok(article);
}
```

**Zod is ONLY used in API layer for HTTP request validation:**

```typescript
// ✅ GOOD: Zod in API layer (routes)
const CreateArticleSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  language: z.enum(['ja', 'en']),
});

articlesRouter.post('/manual', async (c) => {
  const bodyResult = CreateArticleSchema.safeParse(await c.req.json());
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  // ...
});
```

### 3. Pure Functions in Domain Layer

**Domain layer contains ONLY pure functions (no classes, no side effects):**

```typescript
// ✅ GOOD: Pure function
export function calculatePriorityScore(
  article: Article,
  userProfile: UserProfile
): Article {
  let score = 50;

  // Calculate based on category match
  if (article.category === userProfile.category) {
    score += 20;
  }

  // Calculate based on skill level
  if (article.technicalLevel === userProfile.skillLevel) {
    score += 15;
  }

  // Return NEW object (immutable)
  return {
    ...article,
    priorityScore: Math.max(0, Math.min(100, score)) as PriorityScore,
  };
}

// ❌ BAD: Mutation
export function calculatePriorityScore(article: Article): void {
  article.priorityScore = 75; // Mutates input!
}
```

### 4. Repository Pattern

**Domain layer defines interfaces, infrastructure layer implements:**

```typescript
// domain/repositories/article-repository.ts (INTERFACE ONLY)
export interface ArticleRepository {
  findById(id: ArticleId): Promise<Result<Article | null, ValidationError | NotFoundError>>;
  save(article: Article): Promise<Result<void, ValidationError>>;
  delete(id: ArticleId): Promise<Result<void, ValidationError | NotFoundError>>;
  // ...
}

// infrastructure/db/dynamodb-article-repository.ts (IMPLEMENTATION)
export class DynamoDBArticleRepository implements ArticleRepository {
  private client: DynamoDBClient;

  async findById(articleId: ArticleId): Promise<Result<Article | null, ValidationError | NotFoundError>> {
    try {
      const result = await this.client.send(new QueryCommand({ ... }));
      if (!result.Items || result.Items.length === 0) {
        return ok(null);
      }
      const article = this.fromDBItem(unmarshall(result.Items[0]));
      return ok(article);
    } catch (error) {
      return err(new ValidationError(`記事の取得に失敗しました: ${error.message}`));
    }
  }

  // ...
}
```

### 5. Application Services with Dependency Injection

**Application layer uses class-based services with constructor injection:**

```typescript
// application/articleService.ts
export class ArticleApplicationService {
  constructor(
    private articleRepo: ArticleRepository,
    private userRepo: UserRepository
  ) {}

  async createArticle(dto: CreateArticleDto): Promise<Result<ArticleInfoDto, ValidationError | NotFoundError>> {
    // 1. Validate user exists
    const userResult = await this.userRepo.findById(dto.userId as UserId);
    if (!userResult.ok) return userResult;
    if (!userResult.value) {
      return err(new NotFoundError('ユーザー', dto.userId));
    }

    // 2. Create article entity (domain logic)
    const articleResult = createUninitializedArticle(params);
    if (!articleResult.ok) return articleResult;

    // 3. Save to repository
    const saveResult = await this.articleRepo.save(articleResult.value);
    if (!saveResult.ok) return saveResult;

    // 4. Return DTO
    return ok(this.toArticleInfoDto(articleResult.value));
  }
}
```

**DI setup in API layer:**

```typescript
// api/index.ts
// Initialize repositories
const articleRepository = useInMemory
  ? new InMemoryArticleRepository()
  : new DynamoDBArticleRepository();

const userRepository = new InMemoryUserRepository();

// Initialize services
const articleService = new ArticleApplicationService(articleRepository, userRepository);

// Inject into Hono context
app.use('*', async (c, next) => {
  c.set('articleService', articleService);
  await next();
});
```

### 6. Layer Dependencies

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

**Rules:**
- ✅ Domain layer has NO dependencies (only pure functions and interfaces)
- ✅ Application layer depends on domain interfaces
- ✅ Infrastructure implements domain interfaces
- ✅ API layer uses application services
- ❌ Domain layer NEVER imports from infrastructure
- ❌ Domain layer NEVER uses Zod (API layer only)

## Development Workflow

### Adding a New Feature

1. **Define Domain Types and Functions**
   ```typescript
   // src/domain/entities/article.ts
   export interface Article {
     articleId: ArticleId;
     title: string;
     // ...
   }

   export function createArticle(params: CreateArticleParams): Result<Article, ValidationError> {
     // Validation logic
     if (!params.title.trim()) {
       return err(new ValidationError('タイトルは必須です'));
     }
     return ok({ ...params, articleId: crypto.randomUUID() });
   }
   ```

2. **Write Tests (TDD)**
   ```typescript
   // src/domain/entities/article.test.ts
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

3. **Define Repository Interface**
   ```typescript
   // src/domain/repositories/article-repository.ts
   export interface ArticleRepository {
     save(article: Article): Promise<Result<void, ValidationError>>;
     findById(id: ArticleId): Promise<Result<Article | null, ValidationError>>;
   }
   ```

4. **Implement Repository**
   ```typescript
   // src/infrastructure/db/inMemoryArticleRepository.ts
   export class InMemoryArticleRepository implements ArticleRepository {
     private articles = new Map<string, Article>();

     async findById(id: ArticleId): Promise<Result<Article | null, ValidationError>> {
       return ok(this.articles.get(id) || null);
     }

     async save(article: Article): Promise<Result<void, ValidationError>> {
       this.articles.set(article.articleId, article);
       return ok(undefined);
     }
   }
   ```

5. **Create Application Service**
   ```typescript
   // src/application/articleService.ts
   export class ArticleApplicationService {
     constructor(private articleRepo: ArticleRepository) {}

     async createArticle(dto: CreateArticleDto): Promise<Result<ArticleDto, ValidationError>> {
       const articleResult = createArticle(dto);
       if (!articleResult.ok) return articleResult;

       const saveResult = await this.articleRepo.save(articleResult.value);
       if (!saveResult.ok) return saveResult;

       return ok(this.toDto(articleResult.value));
     }
   }
   ```

6. **Add API Route**
   ```typescript
   // src/api/routes/articles.ts
   const CreateArticleSchema = z.object({
     title: z.string().min(1),
     url: z.string().url(),
   });

   articlesRouter.post('/manual', async (c) => {
     const articleService = c.get('articleService');

     const bodyResult = CreateArticleSchema.safeParse(await c.req.json());
     if (!bodyResult.success) {
       return c.json({ error: 'Invalid request body' }, 400);
     }

     const result = await articleService.createArticle(bodyResult.data);
     if (!result.ok) {
       return c.json({ error: result.error.message }, 400);
     }

     return c.json({ article: result.value }, 201);
   });
   ```

## Testing

### Unit Tests (Domain)

```typescript
describe('calculatePriorityScore', () => {
  it('should increase score for matching category', () => {
    const article = createTestArticle({ category: 'technology' });
    const profile = { category: 'technology', skillLevel: 'intermediate' };

    const scored = calculatePriorityScore(article, profile);

    expect(scored.priorityScore).toBeGreaterThan(50);
  });

  it('should return Result error for invalid input', () => {
    const result = createArticle({ title: '' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('ValidationError');
    }
  });
});
```

### Integration Tests (Repository)

```typescript
describe('InMemoryArticleRepository', () => {
  let repository: ArticleRepository;

  beforeEach(() => {
    repository = new InMemoryArticleRepository();
  });

  it('should save and retrieve article', async () => {
    const article = createTestArticle();

    const saveResult = await repository.save(article);
    expect(saveResult.ok).toBe(true);

    const findResult = await repository.findById(article.articleId);
    expect(findResult.ok).toBe(true);
    expect(findResult.value).toMatchObject(article);
  });
});
```

## Common Patterns

### Factory Functions (Domain)

```typescript
export function createUninitializedArticle(
  params: CreateArticleParams
): Result<Article, ValidationError> {
  // Validation
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }
  if (!params.url.trim()) {
    return err(new ValidationError('URLは必須です'));
  }

  // Create entity
  const article: Article = {
    articleId: crypto.randomUUID() as ArticleId,
    userId: params.userId,
    sourceId: params.sourceId,
    sourceType: params.sourceType,
    url: params.url,
    title: params.title,
    contentPreview: params.contentPreview,
    language: params.language,
    collectedAt: Date.now(),
    ttl: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
    category: 'technology', // Default
    subcategories: [],
    priorityScore: 50 as PriorityScore,
    trendingScore: 0,
    summaryShort: '',
    summaryDetailed: '',
    keyPoints: [],
    keywords: [],
    recommendationTag: 'new',
  };

  return ok(article);
}
```

### Update Functions (Domain)

```typescript
export function updateAnalysisResult(
  article: Article,
  analysis: AnalysisResult
): Result<Article, ValidationError> {
  // Validation
  if (!analysis.summaryShort.trim()) {
    return err(new ValidationError('要約は必須です'));
  }

  // Return NEW object (immutable)
  return ok({
    ...article,
    category: analysis.category,
    subcategories: analysis.subcategories,
    technicalLevel: analysis.technicalLevel,
    summaryShort: analysis.summaryShort,
    summaryDetailed: analysis.summaryDetailed,
    keyPoints: analysis.keyPoints,
    keywords: analysis.keywords,
    aiProvider: analysis.aiProvider,
    aiModel: analysis.aiModel,
    analyzedAt: Date.now(),
    analysisVersion: '1.0.0',
  });
}
```

### Error Handling

```typescript
// Core error types
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

// Usage in HTTP handlers
const result = await articleService.createArticle(dto);
if (!result.ok) {
  if (result.error.name === 'NotFoundError') {
    return c.json({ error: result.error.message }, 404);
  }
  return c.json({ error: result.error.message }, 400);
}
```

## References

- **[mizchi/ailab](https://github.com/mizchi/ailab)**: DDD/TDD patterns, Result types, pure functions
- **Hono**: Fast web framework for TypeScript
- **Zod**: TypeScript-first schema validation (API layer only)

## Important Notes for Claude Code

### ✅ DO:
- Always write tests first (TDD)
- Use Result type for ALL error handling
- Keep domain layer pure (only functions, no classes)
- Use immutable updates (return new objects)
- Use Zod ONLY in API layer for HTTP validation
- Define repository interfaces in domain layer
- Implement repositories in infrastructure layer
- Use class-based services with DI in application layer
- Use branded types for IDs (ArticleId, UserId, etc.)

### ❌ DON'T:
- Never throw exceptions in domain/application layers
- Never use Zod in domain layer
- Never mutate objects (always return new ones)
- Never import infrastructure in domain layer
- Never use `any` type (use `unknown` and type guards)
- Never use classes in domain layer (pure functions only)
- Never put business logic in API handlers (use application services)

## Code Style

```typescript
// ✅ GOOD: Pure function with Result type
export function createArticle(params: CreateArticleParams): Result<Article, ValidationError> {
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }
  return ok({ ...params, articleId: crypto.randomUUID() as ArticleId });
}

// ❌ BAD: Throwing exceptions
export function createArticle(params: CreateArticleParams): Article {
  if (!params.title.trim()) {
    throw new Error('タイトルは必須です'); // Don't throw!
  }
  return { ...params, articleId: crypto.randomUUID() };
}

// ❌ BAD: Mutation
export function updateArticle(article: Article, title: string): void {
  article.title = title; // Don't mutate!
}

// ✅ GOOD: Immutable update
export function updateArticle(article: Article, title: string): Article {
  return { ...article, title }; // Return new object
}
```
