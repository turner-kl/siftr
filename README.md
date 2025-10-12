# siftr

> AI-driven personalized information curation system for engineers and HR consultants

[![Frontend CI](https://github.com/turner-kl/siftr/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/turner-kl/siftr/actions/workflows/frontend-ci.yml)

## Overview

**siftr** is an intelligent information curation platform designed specifically for engineers and HR consultants. It helps professionals stay up-to-date with relevant articles, documentation, and resources by providing AI-powered personalized content filtering and organization.

### Key Features

- 🎯 **Smart Content Curation** - AI-driven article recommendations tailored to your interests
- 📊 **Priority-based Organization** - Categorize and prioritize content for efficient consumption
- 🔍 **Advanced Filtering** - Filter by category, priority, and search across all content
- ♿ **Accessibility First** - WCAG 2.1 AA compliant interface with full keyboard navigation
- 🚀 **Modern Tech Stack** - Built with Next.js 15, React 19, TypeScript, and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/turner-kl/siftr.git
cd siftr

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Development

### Project Structure

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

### Available Commands

All commands should be run from the `frontend/` directory:

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Check for issues with Biome
npm run lint:fix     # Auto-fix issues
npm run format       # Check code formatting
npm run format:fix   # Auto-format code
npm run typecheck    # Run TypeScript type checking
```

### Development Workflow

This project follows **t_wada's TDD (Test-Driven Development)** approach:

1. 🔴 **Red** - Write tests first
2. 🟢 **Green** - Implement code to pass tests
3. 🔵 **Refactor** - Improve code while keeping tests green

**Commit Guidelines:**
- Make small, atomic commits with clear messages
- Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
- Commit after each logical step or completed subtask

### Code Quality Tools

The project uses **Biome** (recommended by Next.js 15.5) for linting and formatting:

- ⚡ Faster than ESLint
- 🎯 Zero configuration needed
- 🔧 Automatic code fixes
- ✅ Next.js and React presets enabled

Configuration: `frontend/biome.json`

## Architecture

### Type-First Development

All domain types are centralized in `frontend/src/types/article.ts`:

- Type-safe constant mappings using `as const satisfies`
- Centralized label constants: `CATEGORY_LABELS`, `PRIORITY_LABELS`
- Type-safe filter functions: `createCategoryFilter()`, `createPriorityFilter()`, `createSearchFilter()`
- Never duplicate label mappings in components

### Component Patterns

1. **shadcn/ui Integration** - All UI components follow shadcn/ui patterns with design tokens
2. **Accessibility First** - WCAG 2.1 AA compliance with proper ARIA attributes
3. **Performance** - Use `useMemo` and `useCallback` for optimizations
4. **Type Safety** - 100% type coverage, no `any` types allowed

See [`frontend/CLAUDE.md`](frontend/CLAUDE.md) for detailed component architecture and patterns.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router and Turbopack
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/) with Radix UI primitives
- **Code Quality:** [Biome](https://biomejs.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

## CI/CD

### GitHub Actions Workflows

**Frontend CI** (`.github/workflows/frontend-ci.yml`):
- Triggers on push/PR to `main` branch when `frontend/**` changes
- Runs linting, formatting, type checking, and production build
- Uploads build artifacts with 7-day retention

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Follow TDD approach** - Write tests before implementation
2. **Follow code style** - Run `npm run lint:fix` and `npm run format:fix`
3. **Ensure type safety** - Run `npm run typecheck` before committing
4. **Make atomic commits** - Use conventional commit format
5. **Read documentation** - Check [`CLAUDE.md`](CLAUDE.md) and [`frontend/CLAUDE.md`](frontend/CLAUDE.md)

### Branch Strategy

- `main` - Production-ready code
- Feature branches - Use descriptive names (e.g., `001-docs-ai-curator`)

## Language Note

This project uses Japanese for user-facing content and specifications. Internal documentation and code comments are in English for international collaboration.

## License

[MIT License](LICENSE) (or specify your license)

## Support

For questions or issues, please [open an issue](https://github.com/turner-kl/siftr/issues) on GitHub.

---

**Built with ❤️ by the siftr team**
