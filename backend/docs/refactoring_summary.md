# Backend Refactoring Summary

## Completed Refactoring (ailab DDD Pattern)

### ✅ Core Layer

**Created:**
- `src/core/result.ts` - Result type for error handling without exceptions
  - `ok()` and `err()` helper functions
  - Custom error classes: `ValidationError`, `NotFoundError`, `SystemError`
  - Utility functions: `combine()`, `combineAsync()`, `fromPromise()`, `map()`, `mapErr()`, `andThen()`

### ✅ Domain Layer

**Created:**
1. **Types** (`src/domain/types.ts`)
   - Branded types for IDs: `ArticleId`, `UserId`
   - Enums: `Category`, `TechnicalLevel`, `RecommendationTag`, `SourceType`, `Language`, `AIProvider`
   - Value types: `PriorityScore`, `TrendingScore`
   - Constants for validation

2. **Value Objects**
   - `src/domain/valueObjects/articleId.ts` - ArticleId factory and validation
   - `src/domain/valueObjects/userId.ts` - UserId factory and validation
   - `src/domain/valueObjects/priorityScore.ts` - PriorityScore factory and validation

3. **Domain Models**
   - `src/domain/models/article.ts` - **Refactored from Zod to Result type**
     - Interface-based entity (no class)
     - Pure functions: `createUninitializedArticle()`, `updateAnalysisResult()`, `calculatePriorityScore()`
     - All return `Result<T, ValidationError>` instead of throwing exceptions
     - Immutable updates with spread operator

   - `src/domain/models/user.ts` - **Refactored from Zod to Result type**
     - Interface-based entity
     - Pure functions: `createUser()`, `updateUserProfile()`, `addInterest()`, `removeInterest()`, etc.
     - Immutable updates

4. **Repository Interfaces**
   - `src/domain/repositories/article-repository.ts` - **Updated to ailab pattern**
     - All methods return `Result<T, ValidationError | NotFoundError>`
     - Explicit error types in signatures
     - Interface only (no implementation)

   - `src/domain/repositories/user-repository.ts` - **Created**
     - Follows same pattern as article-repository

**Backed up:**
- `src/domain/models/article.old.ts` - Original Zod-based implementation
- `src/domain/models/user.old.ts` - Original Zod-based implementation

### ✅ Application Layer

**Created:**
- `src/application/articleService.ts` - **Class-based service with DI**
  - Constructor injection of `ArticleRepository` and `UserRepository`
  - Methods: `createArticle()`, `updateArticleAnalysis()`, `calculateArticlePriority()`, `getArticleById()`, `getArticlesByUserId()`, `deleteArticle()`
  - DTO transformations (Entity ↔ DTO)
  - Orchestrates domain logic + repository calls

## Pending Work

### ⏳ Infrastructure Layer

**Needs Update:**
- `src/adapters/db/dynamodb-article-repository.ts`
  - Implement new `ArticleRepository` interface
  - Update method signatures to return `Result<T, ValidationError | NotFoundError>`
  - Remove Zod dependencies
  - Use domain types instead

**Needs Creation:**
- `src/adapters/db/dynamodb-user-repository.ts`
  - Implement `UserRepository` interface
  - DynamoDB-based implementation

**Needs Creation (for testing):**
- `src/adapters/db/inMemoryArticleRepository.ts`
  - In-memory implementation for testing
  - Similar to ailab's pattern

- `src/adapters/db/inMemoryUserRepository.ts`
  - In-memory implementation for testing

### ⏳ API Layer

**Needs Update:**
- `src/api/routes/articles.ts`
  - Update to use `ArticleApplicationService` instead of direct repository access
  - Keep Zod validation for HTTP requests (correct usage)
  - Handle `Result` types and convert to HTTP responses

- `src/api/routes/user.ts`
  - Create user application service
  - Update to use service layer

- `src/api/index.ts`
  - Setup DI for services
  - Inject repositories into services
  - Make services available via Hono context

### ⏳ Tests

**Needs Update:**
- `src/domain/models/article.test.ts`
  - Update tests to work with Result type instead of Zod
  - Test error cases (should return `err()` instead of throwing)

**Needs Creation:**
- `src/domain/models/user.test.ts`
  - Unit tests for user domain functions

- `src/application/articleService.test.ts`
  - Integration tests with mock repositories
  - Test service orchestration logic

- `src/adapters/db/dynamodb-article-repository.test.ts`
  - Integration tests with local DynamoDB

## Key Changes Summary

### Before (Zod-based)

```typescript
// Domain model with Zod
export const ArticleSchema = z.object({ ... });
export type Article = z.infer<typeof ArticleSchema>;

export function createUninitializedArticle(params): Article {
  return ArticleSchema.parse({  // Throws exception!
    ...
  });
}

// Repository
export interface ArticleRepository {
  save(article: Article): Promise<Result<Article>>;  // Generic Error
}
```

### After (Result type pattern)

```typescript
// Domain model with interfaces
export interface Article {
  readonly articleId: ArticleId;
  ...
}

export function createUninitializedArticle(params): Result<Article, ValidationError> {
  // Validation
  if (!params.title.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }

  return ok({ ... });  // No exception
}

// Repository
export interface ArticleRepository {
  save(article: Article): Promise<Result<void, ValidationError>>;  // Explicit error type
  findById(id: ArticleId): Promise<Result<Article | null, ValidationError | NotFoundError>>;
}

// Application Service (NEW!)
export class ArticleApplicationService {
  constructor(
    private articleRepo: ArticleRepository,
    private userRepo: UserRepository
  ) {}

  async createArticle(dto: CreateArticleDto): Promise<Result<ArticleInfoDto, ValidationError | NotFoundError>> {
    // Orchestration logic
  }
}
```

## Layer Dependencies (Verified)

```
API Layer (Zod OK)
    ↓ uses
Application Layer (Classes with DI)
    ↓ uses
Domain Layer (Pure Functions, Interfaces)
    ↓ depends on
Core Layer (Result type only)

Infrastructure Layer
    ↑ implements
Domain Layer (Interfaces)
```

**Rules:**
- ✅ Domain → Core only (NO other dependencies)
- ✅ Application → Domain interfaces only
- ✅ Infrastructure → Implements domain interfaces
- ✅ API → Application services + Zod validation

## Next Steps

1. **Update DynamoDB Repository** - Make it conform to new interface
2. **Create In-Memory Repositories** - For testing
3. **Update API Routes** - Use application services
4. **Setup DI in API** - Inject repositories into services
5. **Update Tests** - Match new patterns
6. **Run All Tests** - Verify refactoring

## Migration Guide

### For New Features

1. **Define domain model** in `domain/models/` (interface + pure functions)
2. **Define repository interface** in `domain/repositories/`
3. **Create application service** in `application/` (class with DI)
4. **Implement repository** in `adapters/db/`
5. **Create API route** in `api/routes/` (Zod validation + service call)
6. **Write tests** (domain → application → integration)

### Error Handling Pattern

```typescript
// Domain/Application layer - Return Result
export function createArticle(...): Result<Article, ValidationError> {
  if (validation fails) {
    return err(new ValidationError('message'));
  }
  return ok(article);
}

// API layer - Convert Result to HTTP response
const result = await articleService.createArticle(dto);
if (!result.ok) {
  if (result.error.name === 'NotFoundError') {
    return c.json({ error: result.error.message }, 404);
  }
  return c.json({ error: result.error.message }, 400);
}
return c.json(result.value, 201);
```

## References

- ailab DDD Pattern Analysis: `docs/ailab_ddd_analysis.md`
- Backend CLAUDE.md: `CLAUDE.md` (updated with new patterns)
