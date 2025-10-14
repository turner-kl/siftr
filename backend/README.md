# siftr Backend

AI-driven personalized information curation system - Backend API

## Architecture

- **Framework**: Hono (Lambda Web Adapter compatible)
- **Language**: TypeScript
- **Database**: Aurora Serverless v2 (PostgreSQL), DynamoDB
- **Storage**: S3
- **Auth**: AWS Cognito
- **Infrastructure**: AWS CDK (in `/cdk` directory at project root)

## Design Principles

This backend follows **Domain-Driven Design (DDD)** and **Test-Driven Development (TDD)** practices, inspired by [mizchi/ailab](https://github.com/mizchi/ailab).

### Directory Structure

```
backend/
├── src/
│   ├── domain/           # Domain layer (business logic)
│   │   ├── models/       # Entities and value objects (with Zod schemas)
│   │   ├── repositories/ # Repository interfaces
│   │   └── services/     # Domain services
│   ├── application/      # Application layer (use cases)
│   ├── adapters/         # Adapter layer
│   │   ├── db/          # Database implementations
│   │   ├── api/         # External API clients
│   │   └── external/    # External service integrations
│   ├── api/             # Presentation layer (Hono routes)
│   │   ├── routes/      # API route handlers
│   │   └── middleware/  # Middleware (auth, validation, etc.)
│   ├── lib/             # Shared utilities
│   └── types/           # Shared type definitions
├── test/                # Integration tests
├── scripts/             # Utility scripts
├── docker-compose.yml   # Local development environment
└── Dockerfile          # Production container (with Lambda Web Adapter)
```

### Key Patterns

1. **Result Type**: Error handling without exceptions
   ```typescript
   type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
   ```

2. **Zod Schemas**: Runtime validation with TypeScript type inference
   ```typescript
   export const ArticleSchema = z.object({ ... });
   export type Article = z.infer<typeof ArticleSchema>;
   ```

3. **Repository Pattern**: Abstract data access
   ```typescript
   export interface ArticleRepository {
     save(article: Article): Promise<Result<Article>>;
     // ...
   }
   ```

4. **Test-First**: Write tests before implementation
   - Domain models have comprehensive unit tests
   - Adapters have integration tests with local DynamoDB/PostgreSQL

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
   ./scripts/setup-local.sh
   ```

   This will start:
   - PostgreSQL (port 5432)
   - DynamoDB Local (port 8000)
   - DynamoDB Admin UI (port 8001)
   - LocalStack (S3, Secrets Manager) (port 4566)
   - pgAdmin (port 5050)

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

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:fix
```

## API Endpoints

### Health Check

```
GET /health
```

### Articles

```
GET    /api/articles              # List articles (with filters)
GET    /api/articles/:id          # Get article details
POST   /api/articles/:id/interact # Record interaction
POST   /api/articles/manual       # Add manual article
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
```

## Deployment

### Prerequisites

1. Bootstrap CDK (first time only):
   ```bash
   cd ../cdk
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

1. **Write Types First**: Define Zod schemas and TypeScript types
2. **Write Tests**: Comprehensive test cases before implementation
3. **Implement**: Code to pass the tests
4. **Refactor**: Improve code while keeping tests green

### Test Coverage Goals

- **Domain Models**: 100% coverage
- **Repositories**: >90% coverage (integration tests)
- **API Routes**: >80% coverage (E2E tests)
- **Overall**: >85% coverage

## References

This implementation was inspired by:

1. **[mizchi/ailab](https://github.com/mizchi/ailab)** - TDD/DDD patterns:
   - Result type for error handling
   - Zod schemas for runtime validation
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

## License

See LICENSE file at project root.
