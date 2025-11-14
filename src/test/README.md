# Testing Guide

## Overview

This project uses **Vitest** for unit and integration testing, **React Testing Library** for component testing, and **MSW (Mock Service Worker)** for API mocking.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test textChunkIndexing.test.ts

# Run tests matching a pattern
npm test -- --grep "citation"
```

## Test Structure

### Unit Tests
Location: `src/lib/*.test.ts`

Test individual functions and utilities in isolation with mock data.

**Example:**
```typescript
// src/lib/textChunkIndexing.test.ts
import { buildCitationMap } from './textChunkIndexing'

it('should create a citation map from chunks', () => {
  const chunks = [
    { chunkIndex: 0, text: 'First.', pageNum: 1, ... }
  ]
  const map = buildCitationMap(chunks)
  expect(map[0].text).toBe('First.')
})
```

### Component Tests
Location: `src/components/*.test.tsx`

Test React components with user interactions using Testing Library.

**Example:**
```typescript
// src/components/CitationBadge.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CitationBadge } from './CitationBadge'

it('should call onClick when clicked', () => {
  const onClick = vi.fn()
  render(<CitationBadge citationIndex={5} onClick={onClick} />)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledWith(5)
})
```

### Integration Tests
Location: `src/test/integration/*.test.tsx`

Test complete workflows with MSW mocking Supabase API calls.

**Example:**
```typescript
// src/test/integration/citationWorkflow.test.tsx
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

const server = setupServer(...handlers)

it('should load and display extractions', async () => {
  render(<SourceProvenancePanel studyId="test" />)
  await waitFor(() => {
    expect(screen.getByText('study_design')).toBeInTheDocument()
  })
})
```

### Hook Tests
Location: `src/hooks/*.test.ts`

Test custom React hooks using `renderHook` from Testing Library.

**Example:**
```typescript
// src/hooks/useBoundingBoxVisualization.test.ts
import { renderHook } from '@testing-library/react'

it('should render citation chunks', () => {
  const { result } = renderHook(() => useBoundingBox(canvas, 1))
  result.current.renderCitationChunks([0], map, 2.0)
  expect(mockContext.fillRect).toHaveBeenCalled()
})
```

## API Mocking with MSW

Mock Supabase API calls in `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/rest/v1/extractions', () => {
    return HttpResponse.json([
      { id: '1', field_name: 'study_design', text: 'RCT' }
    ])
  })
]
```

## Writing Good Tests

### ✅ DO

- Test user-visible behavior, not implementation details
- Use descriptive test names that explain what is being tested
- Arrange-Act-Assert pattern for clarity
- Mock external dependencies (APIs, localStorage, etc.)
- Test edge cases and error states

### ❌ DON'T

- Test internal state or private functions
- Rely on test execution order
- Use `any` type unnecessarily
- Skip cleanup between tests
- Test third-party library internals

## Coverage Goals

- **Core libraries**: >90% coverage
- **Components**: >80% coverage
- **Integration**: Key workflows covered
- **Hooks**: >85% coverage

## CI/CD

Tests run automatically on every push via GitHub Actions (`.github/workflows/test.yml`).

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Debug specific test
npm test -- --grep "should render citation" --reporter=verbose

# Run with UI debugger
npm run test:ui
```

## Common Issues

### "Cannot find module"
- Check path aliases in `vitest.config.ts`
- Ensure imports use `@/` prefix

### "ReferenceError: window is not defined"
- Add mock to `src/test/setup.ts`
- Check that `environment: 'jsdom'` is set

### "Test timeout"
- Increase timeout in test: `it('...', { timeout: 10000 })`
- Check for unresolved promises

### "MSW handler not working"
- Verify URL matches exactly
- Check that server is started in `beforeAll`
- Ensure handlers are reset in `afterEach`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
