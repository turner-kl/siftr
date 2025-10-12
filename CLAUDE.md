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

## Branch Strategy

- `main` - Production-ready code
- `001-docs-ai-curator` - Feature branch for initial MVP development

## Japanese Language Note

This project uses Japanese for user-facing content and specifications. Internal documentation and code comments are in English for international collaboration.
