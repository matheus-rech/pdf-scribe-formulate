# E2E Test Fixtures

This directory contains test data files used by Playwright E2E tests.

## PDF Sample Files

Place sample PDF files here for testing:

- `sample-study.pdf` - Standard research paper (5-10 pages)
- `large-study.pdf` - Large document (50+ pages) for performance testing
- `complex-tables.pdf` - Document with multiple complex tables
- `many-figures.pdf` - Document with numerous figures and images

## Creating Test PDFs

You can create test PDFs using:

1. **Real anonymized research papers** (remove any sensitive data)
2. **Generated PDFs** using tools like:
   - LaTeX documents
   - LibreOffice/Word exports
   - Python libraries (reportlab, fpdf)

## Test PDF Requirements

Sample PDFs should include:
- Multiple pages (at least 5)
- Text content (for text extraction)
- At least one table
- At least one figure/image
- Standard research paper structure (Abstract, Methods, Results, etc.)

## File Size Guidelines

- `sample-study.pdf`: < 5MB
- `large-study.pdf`: 10-20MB
- Keep total fixture size under 50MB for CI/CD

## Adding New Fixtures

When adding new PDF fixtures:

1. Add the file to this directory
2. Update test files to reference the new fixture
3. Document any special characteristics in this README
4. Ensure the file is included in `.gitignore` if it contains sensitive data
