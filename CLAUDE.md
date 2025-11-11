# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**siftr** - An AI-driven personalized information curation system for engineers and HR consultants.

### Repository Structure

```
siftr/
├── frontend/          # Next.js 15 application (main development area)
│   ├── src/
│   │   ├── app/      # Next.js App Router pages
│   │   ├── components/ # React components
│   │   ├── types/    # TypeScript type definitions
│   │   └── data/     # Mock data (temporary)
│   └── CLAUDE.md     # Frontend-specific guidance
├── specs/            # Feature specifications
└── .github/
    └── workflows/    # CI/CD pipelines
```

## Development

### Development Workflow

**IMPORTANT: Follow t_wada's TDD (Test-Driven Development) approach**
- Write tests first before implementing features
- Red → Green → Refactor cycle
- Keep test coverage high and meaningful

**Commit Frequently**
- Make small, atomic commits with clear messages
- Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
- Commit after each logical step or completed subtask

### Development Environment

This is a monorepo-style structure where the frontend is the primary active codebase. All development commands should be run from the `frontend/` directory.

### Quick Start

```bash
cd frontend
npm install
npm run dev  # Starts development server at http://localhost:3000
```

## CI/CD

### GitHub Actions Workflows

**Frontend CI** (`.github/workflows/frontend-ci.yml`):
- Triggers on push/PR to `main` branch when `frontend/**` changes
- Single optimized job that runs:
  1. `npm ci` - Install dependencies (once)
  2. `npm run lint` - Biome linting
  3. `npm run format` - Biome format check
  4. `npm run typecheck` - TypeScript type checking
  5. `npm run build` - Production build
- Uploads build artifacts with 7-day retention

## Code Quality Tools

### Biome (Recommended by Next.js 15.5)

The project uses Biome instead of ESLint for faster linting and formatting:

```bash
cd frontend
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Check formatting
npm run format:fix    # Auto-format code
npm run typecheck     # TypeScript type checking
```

**Configuration**: `frontend/biome.json`
- Next.js and React domain presets enabled
- Accessibility rules configured as warnings
- TailwindCSS custom at-rules allowed

## Architecture Principles

### Type-First Development

All domain types are centralized in `frontend/src/types/article.ts`:
- Use `as const satisfies` for type-safe constant mappings
- Never duplicate label mappings in components
- Import constants like `CATEGORY_LABELS`, `PRIORITY_LABELS`, `CATEGORY_VARIANTS`
- Use type-safe filter functions: `createCategoryFilter()`, `createPriorityFilter()`, `createSearchFilter()`

### Component Patterns

1. **shadcn/ui Integration**: All UI components follow shadcn/ui patterns with design tokens
2. **Accessibility First**: WCAG 2.1 AA compliance with proper ARIA attributes
3. **Performance**: Use `useMemo` and `useCallback` for optimizations
4. **Type Safety**: 100% type coverage, no `any` types allowed

See `frontend/CLAUDE.md` for detailed component architecture and patterns.

## Quality Assurance Workflow

### Pre-Completion Checklist

When you finish implementing a feature or fix, **ALWAYS** run the following verification steps:

#### 1. Backend Verification

```bash
cd backend
npm run lint          # Biome linting
npm run format:fix        # Biome format check
npm run typecheck     # TypeScript type checking
npm test              # Run all tests (TDD requirement)
npm run build         # Verify production build
```

#### 2. Frontend Verification

```bash
cd frontend
npm run lint          # Biome linting
npm run format:fix        # Biome format check
npm run typecheck     # TypeScript type checking
npm run build         # Verify production build
```

#### 3. Code Review with Specialized Agents

After all static analysis passes, request a code review using the appropriate Claude Code agent:

- **Backend changes**: Use the `code-reviewer` agent focusing on:
  - DDD/TDD adherence (pure functions, Result types, no exceptions)
  - Schema-first validation with Zod
  - Repository pattern and dependency injection
  - Immutability and type safety

- **Frontend changes**: Use the `react-specialist` or `ui-designer` agent focusing on:
  - Type-safe filter composition
  - shadcn/ui design token usage (no hardcoded colors)
  - WCAG 2.1 AA accessibility compliance
  - Performance optimization (useMemo, useCallback)

**Example workflow**:
```
1. Implement feature
2. Run all verification commands above
3. If any checks fail, fix issues and re-run
4. Once all checks pass, invoke appropriate review agent
5. Address review feedback
6. Commit changes
```

### Integration with CI/CD

The GitHub Actions workflows (`.github/workflows/`) run the same checks automatically on push/PR. Local verification helps catch issues earlier.

## Branch Strategy

- `main` - Production-ready code
- `001-docs-ai-curator` - Feature branch for initial MVP development

## Japanese Language Note

This project uses Japanese for user-facing content and specifications. Internal documentation and code comments are in English for international collaboration.
