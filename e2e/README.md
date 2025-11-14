# End-to-End (E2E) Tests

This directory contains Playwright E2E tests for the PDF systematic review application.

## Structure

```
e2e/
├── tests/                    # Test files
│   ├── pdf-upload.spec.ts           # PDF upload and processing tests
│   ├── extraction-workflow.spec.ts  # Data extraction workflow tests
│   ├── citation-validation.spec.ts  # Citation detection and validation tests
│   └── multi-reviewer.spec.ts       # Multi-reviewer consensus tests
├── helpers/                  # Test utilities
│   └── test-utils.ts        # Reusable helper functions
├── fixtures/                 # Test data
│   └── *.pdf                # Sample PDF files for testing
├── .auth/                   # Authentication state (generated)
└── screenshots/             # Test screenshots (generated)
```

## Running E2E Tests

### Prerequisites

```bash
# Install Playwright browsers (first time only)
npx playwright install
```

### Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test pdf-upload

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on mobile
npx playwright test --project=mobile-chrome
```

### Viewing Test Results

```bash
# Show HTML report
npx playwright show-report

# View trace for failed tests
npx playwright show-trace test-results/.../trace.zip
```

## Test Workflows

### 1. PDF Upload & Processing
**File:** `tests/pdf-upload.spec.ts`

Tests:
- Successful PDF upload
- PDF metadata extraction (page count, figures, tables)
- Invalid file type rejection
- Large file handling
- Text chunk extraction
- Figure and table detection
- PDF navigation

### 2. Data Extraction Workflow
**File:** `tests/extraction-workflow.spec.ts`

Tests:
- Study identification extraction
- PICOT element extraction
- Baseline characteristics extraction
- Multi-step form navigation
- Save and resume functionality
- Field validation
- Data export

### 3. Citation Detection & Validation
**File:** `tests/citation-validation.spec.ts`

Tests:
- Automatic citation detection
- Citation badge display
- Citation details panel
- Navigation to PDF source
- Multiple citations per field
- Batch validation
- Confidence score display
- Citation revalidation
- Validation status filtering

### 4. Multi-Reviewer Consensus
**File:** `tests/multi-reviewer.spec.ts`

Tests:
- Reviewer configuration
- Multi-reviewer extraction
- Consensus dashboard
- Conflict identification and resolution
- Reviewer-specific confidence scores
- Automatic consensus calculation
- Human review workflow
- Consensus report export

## Helper Functions

The `helpers/test-utils.ts` file provides reusable utilities:

- `uploadPDF()` - Upload a PDF file
- `waitForPDFProcessing()` - Wait for processing to complete
- `navigateToExtractionStep()` - Navigate through extraction steps
- `fillExtractionField()` - Fill in extraction fields
- `triggerAIExtraction()` - Trigger AI-powered extraction
- `verifyCitationExists()` - Verify citation with source
- `viewCitationSource()` - Click citation to view source
- `exportData()` - Export data in various formats

## Test Fixtures

Place sample PDF files in `fixtures/` directory:

- `sample-study.pdf` - Standard research paper (5-10 pages)
- `large-study.pdf` - Large document (50+ pages)
- `complex-tables.pdf` - Document with complex tables
- `many-figures.pdf` - Document with many figures

See `fixtures/README.md` for detailed fixture requirements.

## Debugging Tests

### Visual Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Run with UI mode (best for debugging)
npx playwright test --ui

# Pause execution at specific point
await page.pause()
```

### Screenshots and Videos

```bash
# Take screenshot
await page.screenshot({ path: 'screenshot.png' })

# Take full page screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true })

# Videos are automatically recorded on failure
# Find them in test-results/ directory
```

### Trace Viewer

```bash
# View trace for failed test
npx playwright show-trace test-results/.../trace.zip
```

## CI/CD Integration

E2E tests run automatically on GitHub Actions:

- On every push to `main` branch
- On every pull request
- Test reports uploaded as artifacts
- Screenshots uploaded on failure

See `.github/workflows/e2e-tests.yml` for configuration.

## Best Practices

1. **Use Page Object Model** - Group related interactions
2. **Wait for Elements** - Use `waitFor` methods, not fixed timeouts
3. **Use Data Attributes** - Add `data-testid` for stable selectors
4. **Keep Tests Independent** - Each test should work in isolation
5. **Clean Up State** - Use `beforeEach` to reset state
6. **Use Descriptive Names** - Test names should explain what they verify
7. **Take Screenshots** - Capture evidence on complex visual tests
8. **Mock External APIs** - Don't rely on external services

## Common Issues

### Browser Not Installed
```bash
npx playwright install chromium
```

### Tests Timing Out
- Increase timeout in test: `test.setTimeout(60000)`
- Check network conditions
- Verify selectors are correct

### Authentication Failing
- Check `e2e/auth.setup.ts` configuration
- Verify credentials are correct
- Ensure auth state is being saved

### Flaky Tests
- Add proper waits (`waitForSelector`, `waitForLoadState`)
- Avoid fixed timeouts (`page.waitForTimeout`)
- Use retry logic for network-dependent operations

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)
