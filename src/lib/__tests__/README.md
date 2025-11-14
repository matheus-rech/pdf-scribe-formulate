# Test Suite

## Current Status

Testing infrastructure is set up with Vitest and React Testing Library. Some initial tests have been created but need to be updated to match the actual function signatures.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Priority Tests to Write

### High Priority (Core Business Logic)

1. **PDF Chunking** (`src/lib/pdfChunking.ts`)
   - Test semantic chunking with different text sizes
   - Test chunk overlap functionality
   - Test chunk search functionality

2. **Citation Detection** (`src/lib/citationDetector.ts`)
   - Test detection with mock PDF files
   - Test different citation styles (Vancouver, Harvard, etc.)
   - Test fuzzy matching

3. **Data Validation** (`src/lib/dataValidation.ts`)
   - Test table validation
   - Test numeric range validation for clinical data
   - Test column type detection

4. **Section Detection** (`src/lib/sectionDetection.ts`)
   - Test section boundary detection
   - Test section classification

### Medium Priority (Utilities)

5. **Export Functions** (`src/lib/exportData.ts`)
   - Test JSON export
   - Test CSV export
   - Test Excel export

6. **Annotation Parsing** (`src/lib/annotationParser.ts`)
   - Test different annotation formats
   - Test field matching

7. **Table Parsing** (`src/lib/tableParser.ts`)
   - Test table detection in PDFs
   - Test cell extraction

### Low Priority (Components)

8. **UI Components**
   - ConfidenceBadge
   - ValidationSummary
   - ExtractionPreview

## Test Helpers Needed

Create mock factories in `src/test/factories/`:
- `createMockPDF()` - Generate mock PDF File objects
- `createMockExtraction()` - Generate mock extraction entries
- `createMockStudy()` - Generate mock study data
- `createMockTableData()` - Generate mock parsed tables

## Current Test Files

- `utils.test.ts` - ✅ PASSING
- `citationDetector.test.ts` - ❌ NEEDS UPDATE (requires PDF mock)
- `dataValidation.test.ts` - ❌ NEEDS UPDATE (wrong function signatures)
- `ConfidenceBadge.test.tsx` - ❌ NEEDS UPDATE (component structure)

## Notes

- All tests should mock Supabase client (already configured in `src/test/setup.ts`)
- Use `vi.mock()` for complex dependencies
- Aim for >70% code coverage
- Focus on business logic over UI testing
