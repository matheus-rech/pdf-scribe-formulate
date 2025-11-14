# GitHub Copilot Instructions for PDF Scribe Formulate

## Project Overview

This is a React/TypeScript application for systematic literature review and PDF data extraction. The application helps researchers extract structured data from PDF documents, with features for citation tracking, multi-reviewer consensus, and AI-powered extraction.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **PDF Processing**: pdf-lib, pdfjs-dist, @react-pdf-viewer
- **Testing**: 
  - Unit/Integration: Vitest + React Testing Library
  - E2E: Playwright
  - API Mocking: MSW (Mock Service Worker)
- **Linting**: ESLint with TypeScript support

## Development Setup

### Prerequisites
- Node.js 20+ (managed via nvm)
- npm (package manager)

### Installation
```bash
npm install --legacy-peer-deps
```

Note: Use `--legacy-peer-deps` flag due to Storybook version conflicts.

### Running the Application
```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Testing

### Unit and Integration Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test textChunkIndexing.test.ts
```

**Test Locations:**
- Unit tests: `src/lib/*.test.ts`
- Component tests: `src/components/*.test.tsx`
- Integration tests: `src/test/integration/*.test.tsx`
- Test utilities: `src/test/mocks/handlers.ts`, `src/test/setup.ts`

**Coverage Goals:**
- Core libraries: >90%
- Components: >80%
- Hooks: >85%

### E2E Tests (Playwright)
```bash
# First-time setup
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

**E2E Test Files:**
- Location: `e2e/tests/*.spec.ts`
- Helpers: `e2e/helpers/test-utils.ts`
- Fixtures: `e2e/fixtures/*.pdf`

**E2E Workflows Covered:**
1. PDF upload and processing
2. Multi-step data extraction workflow
3. Citation detection and validation
4. Multi-reviewer consensus

## Linting and Code Quality

```bash
# Run ESLint
npm run lint
```

**Note:** There are existing linting warnings (mainly `@typescript-eslint/no-explicit-any`). When making changes:
- Don't introduce new `any` types unless absolutely necessary
- Follow existing patterns in the codebase
- Address linting issues only in code you modify

## Code Style and Conventions

### TypeScript
- Use explicit types where possible (avoid `any`)
- Leverage type inference for simple cases
- Define interfaces for data structures
- Use Zod schemas for runtime validation (especially in Supabase functions)

### React Components
- Use functional components with hooks
- Prefer named exports over default exports
- Use TypeScript for props (interface or type)
- Follow shadcn/ui patterns for component composition

### File Organization
```
src/
├── components/        # React components (shadcn/ui based)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and core logic
├── pages/            # Page components (Auth, Index, NotFound)
├── integrations/     # Third-party integrations (Supabase)
├── types/            # TypeScript type definitions
└── test/             # Test setup and mocks
```

### Import Aliases
Use `@/` alias for absolute imports:
```typescript
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
```

### Styling
- Use Tailwind utility classes
- Follow shadcn/ui theming system
- Use CSS variables for colors (defined in `index.css`)
- Prefer composition over creating new styled components

## Testing Guidelines

### Writing Tests
**DO:**
- Test user-visible behavior, not implementation details
- Use descriptive test names (`should render citation badge when data is valid`)
- Follow Arrange-Act-Assert pattern
- Mock external dependencies (APIs, localStorage)
- Test edge cases and error states
- Use React Testing Library queries (getByRole, getByText)

**DON'T:**
- Test internal state or private functions
- Rely on test execution order
- Use `any` type in tests
- Skip cleanup between tests
- Test third-party library internals

### MSW Mocking
API mocks are defined in `src/test/mocks/handlers.ts`:
```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/rest/v1/extractions', () => {
    return HttpResponse.json([...mockData])
  })
]
```

### Common Test Patterns
```typescript
// Component test
import { render, screen, fireEvent } from '@testing-library/react'

it('should call onClick when clicked', () => {
  const onClick = vi.fn()
  render(<CitationBadge citationIndex={5} onClick={onClick} />)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledWith(5)
})

// Hook test
import { renderHook } from '@testing-library/react'

it('should return expected value', () => {
  const { result } = renderHook(() => useCustomHook())
  expect(result.current.value).toBe(expected)
})
```

## Project-Specific Patterns

### PDF Processing
- Text extraction: `src/lib/textChunkIndexing.ts`
- Table extraction: `src/lib/pdfTableExtraction.ts`
- Figure detection: Uses pdf.js viewport and annotations
- Citation tracking: Maps extracted text to PDF page/position

### Data Extraction Workflow
- Multi-step form with validation
- AI-powered extraction via Supabase Edge Functions
- Citation validation with confidence scores
- Support for multiple reviewers and consensus calculation

### Supabase Integration
- Client setup: `src/integrations/supabase/client.ts`
- Edge Functions: `supabase/functions/*/index.ts`
- Database types: Auto-generated from schema
- Use TanStack Query for data fetching with proper caching

### State Management
- Use TanStack Query for server state
- Use React hooks (useState, useReducer) for local state
- Avoid prop drilling; use composition and context when needed

## CI/CD

### GitHub Actions Workflows
- **Tests**: `.github/workflows/test.yml` - Runs on push/PR to main
- **E2E Tests**: `.github/workflows/e2e-tests.yml` - Runs Playwright tests

### What to Check Before Committing
1. Run tests: `npm test`
2. Run linting: `npm run lint`
3. Build succeeds: `npm run build`
4. E2E tests pass (for significant changes): `npm run test:e2e`

## Common Tasks

### Adding a New Component
1. Create component in `src/components/` using shadcn/ui patterns
2. Add TypeScript types for props
3. Write component tests in `*.test.tsx`
4. Export from component file (named export)
5. Document usage with JSDoc if complex

### Adding a New Utility Function
1. Add to appropriate file in `src/lib/`
2. Add TypeScript types for parameters and return value
3. Write unit tests in `*.test.ts`
4. Export from module

### Modifying Database Schema
1. Update Supabase schema (outside Copilot scope)
2. Regenerate types: `npx supabase gen types typescript`
3. Update queries and mutations
4. Update MSW handlers for tests

### Adding Dependencies
- Prefer using existing libraries in the stack
- Check for shadcn/ui components before adding new UI libraries
- Use `npm install --legacy-peer-deps` for installation
- Update tests to mock new external dependencies

## Debugging

### Common Issues
- **"Cannot find module"**: Check import paths use `@/` alias
- **"window is not defined"**: Add mock to `src/test/setup.ts`
- **Test timeout**: Increase timeout or check for unresolved promises
- **MSW handler not working**: Verify URL matches exactly, server started in `beforeAll`
- **Playwright test fails**: Use `--headed` flag, check selectors, verify auth state

### Helpful Commands
```bash
# Watch mode for iterative development
npm run test:watch

# UI debugger for tests
npm run test:ui

# Playwright UI mode (best for E2E debugging)
npm run test:e2e:ui

# View test coverage
npm run test:coverage
```

## Security and Privacy

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Supabase credentials are in `.env` (gitignored)
- Follow principle of least privilege for database policies
- Validate all user inputs (especially in Edge Functions)
- Use Zod schemas for runtime validation

## Documentation

- Main README: `README.md`
- Testing guide: `src/test/README.md`
- E2E testing guide: `e2e/README.md`
- Component-specific docs: `docs/` directory

## Best Practices for Copilot Tasks

### Good Task Candidates
- Bug fixes in existing components
- Adding new components following existing patterns
- Writing tests for untested code
- Implementing form validation
- Refactoring utilities
- Documentation updates
- Adding accessibility improvements

### Tasks Requiring Human Review
- Database schema changes
- Authentication/authorization logic
- Complex business logic changes
- API contract changes
- Major refactoring across multiple files
- Security-sensitive code
- Production environment configurations

### When Working on Issues
1. Read the full issue description and acceptance criteria
2. Review related code and tests
3. Make minimal, focused changes
4. Write or update tests for your changes
5. Ensure linting passes for changed files
6. Run full test suite before finishing
7. Document non-obvious decisions in code comments

## Additional Notes

- This is a Lovable.dev project (https://lovable.dev)
- Changes can be made via Lovable, local IDE, or GitHub
- The project uses path aliases (`@/`) - configure your IDE accordingly
- Some dependencies have peer dependency warnings - this is expected
- E2E test fixtures (PDF files) should be in `e2e/fixtures/`
- Component library uses Radix UI primitives wrapped by shadcn/ui
