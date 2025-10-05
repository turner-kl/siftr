# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**siftr** - An AI-driven personalized information curation system for engineers and HR consultants. The frontend is a Next.js 15 application using TypeScript, shadcn/ui, and Tailwind CSS.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

Development server runs at http://localhost:3000

## Architecture & Design Patterns

### Type System Architecture

**Central Type Definitions** (`src/types/article.ts`):
- All domain types, constants, and helper functions are centralized here
- Uses `as const satisfies` pattern for type-safe constant mappings
- Exports `CATEGORY_LABELS`, `PRIORITY_LABELS`, `LEVEL_LABELS` for UI consistency
- Exports `CATEGORY_VARIANTS`, `PRIORITY_VARIANTS` for shadcn/ui Badge components
- Provides type-safe filter functions: `createCategoryFilter()`, `createPriorityFilter()`, `createSearchFilter()`
- Type guards: `isValidCategory()`, `isValidPriority()`, `isValidLevel()`

**Key Pattern**: Never duplicate label mappings or badge variants in components. Always import from `src/types/article.ts`.

### Component Architecture

**shadcn/ui Integration**:
- Configuration: `components.json` with "new-york" style
- UI components in `src/components/ui/`
- Use design tokens (not hardcoded colors): `bg-background`, `text-foreground`, `text-muted-foreground`, etc.
- All interactive elements have minimum 44x44px touch targets

**Custom Components**:
- `Header.tsx` - Navigation with ARIA attributes
- `ArticleCard.tsx` - Article display with semantic HTML and accessibility
- `FilterBar.tsx` - Filter UI with ARIA labels and keyboard support
- All components use React hooks (`useMemo`, `useCallback`) for performance optimization

### State Management Pattern

State is managed at the page level with type-safe filter composition:

```typescript
const filteredArticles = useMemo(() => {
  const categoryFilter = createCategoryFilter(selectedCategories);
  const priorityFilter = createPriorityFilter(selectedPriorities);
  const searchFilter = createSearchFilter(searchQuery);

  return mockArticles.filter((article) =>
    categoryFilter(article) &&
    priorityFilter(article) &&
    searchFilter(article)
  );
}, [selectedCategories, selectedPriorities, searchQuery]);
```

### Accessibility Standards

**WCAG 2.1 AA Compliance**:
- Semantic HTML with proper landmark roles (`role="banner"`, `role="main"`, `role="navigation"`)
- ARIA attributes on all interactive elements
- Screen reader support with `sr-only` utility class for context
- Keyboard navigation with visible focus states
- `aria-pressed` for toggle buttons, `aria-current` for active pages
- `aria-labelledby` and `aria-describedby` for contextual information

### Styling Conventions

**Always use design tokens**:
- Background: `bg-background`, `bg-card`, `bg-accent`
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`
- Borders: `border-input`, `border-primary`
- Never use hardcoded colors like `text-blue-600`, `bg-white`

**Responsive Design**:
- Mobile-first approach
- Breakpoints: `md:`, `lg:` for tablet and desktop
- Touch targets: `min-h-[44px]`, `min-w-[44px]`

### Data Layer

Mock data is in `src/data/mockArticles.ts`:
- Exported as `readonly Article[]` for immutability
- Uses `as const` assertion
- Will be replaced with API calls in future

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Using TypeScript 5 with Next.js 15 plugin
- Never use `any` type - use proper typing or type guards

## Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

Components will be added to `src/components/ui/` with proper configuration.

## Code Quality Standards

- **Type Safety**: 100% type coverage, no `any` types
- **DRY Principle**: Constants and types centralized in `src/types/`
- **Accessibility**: WCAG 2.1 AA compliance required
- **Performance**: Use `useMemo` for expensive computations, `useCallback` for event handlers
- **Immutability**: Use `readonly` for arrays that shouldn't be modified

## Next.js Specific

- App Router with `src/app/` directory structure
- Client components marked with `'use client'`
- Dynamic routes: `src/app/articles/[id]/page.tsx`
- Uses Turbopack for faster builds and hot reloading
