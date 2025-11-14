# PDF Scribe Formulate

A sophisticated **Clinical Study Extraction System** designed for systematic literature reviews and meta-analysis research. This professional web application helps researchers extract structured data from PDF documents of clinical research papers with AI assistance, citation tracking, and multi-reviewer consensus workflows.

## Features

- **AI-Powered Extraction**: Extract structured data from clinical research papers using Google Gemini models
- **Citation Tracking**: Track source provenance for all extracted data with PDF coordinate mapping
- **Multi-Reviewer Workflows**: Implement consensus workflows with conflict resolution
- **Data Validation**: Validate extracted data with AI assistance and cross-step consistency checks
- **Offline Support**: Progressive Web App (PWA) with offline capabilities using IndexedDB
- **Export Capabilities**: Export data in multiple formats (CSV, JSON, Excel, ZIP archives)
- **PDF Annotation**: Draw and highlight directly on PDFs to mark extracted data
- **Figure & Table Extraction**: Automatically detect and extract figures and tables
- **Audit Reports**: Generate comprehensive audit trails for research compliance

## Technology Stack

### Frontend
- **React 18.3** with TypeScript 5.8
- **Vite 5.4** - Fast build tool
- **shadcn/ui** - Beautiful UI components built on Radix UI
- **Tailwind CSS 3.4** - Utility-first CSS
- **TanStack Query 5.8** - Server state management

### Backend & Database
- **Supabase** - PostgreSQL database, authentication, and edge functions
- **15 Deno Edge Functions** - Serverless AI processing

### PDF Processing
- **pdfjs-dist 3.11** - PDF parsing and rendering
- **pdf-lib 1.17** - PDF manipulation
- **fabric 6.9** - Canvas-based annotations

### Testing
- **Vitest 4.0** - Unit and integration testing
- **Playwright 1.56** - End-to-end testing
- **MSW 2.12** - API mocking

## Prerequisites

- **Node.js** 18.x or higher (20.x recommended)
- **npm** 9.x or higher
- **Supabase Account** - For database and authentication

## Installation

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd pdf-scribe-formulate
```

### 2. Install Dependencies

**Important**: Use the `--legacy-peer-deps` flag due to Storybook peer dependency conflicts:

```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

Get these values from your [Supabase project settings](https://app.supabase.com).

### 4. Set Up Supabase

The project includes database migrations in `supabase/migrations/`. To apply them:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

## Building

Build for production:

```bash
npm run build
```

Build for development (with source maps):

```bash
npm run build:dev
```

Preview production build:

```bash
npm run preview
```

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

**Note**: E2E tests require sample PDF files in `e2e/fixtures/`. See `e2e/fixtures/README.md` for details.

## Linting

```bash
npm run lint
```

**Known Issue**: The codebase currently has 351 linting issues (mostly `any` types). These are tracked for gradual improvement.

## Project Structure

```
pdf-scribe-formulate/
├── src/
│   ├── components/          # 70+ React components
│   │   ├── extraction-steps/  # 8-step extraction workflow
│   │   └── ui/                # 77 shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   │   ├── pdfChunking.ts      # PDF text chunking
│   │   ├── citationDetector.ts # Citation detection
│   │   ├── figureExtraction.ts # Figure extraction
│   │   ├── tableParser.ts      # Table parsing
│   │   └── dataValidation.ts   # Data validation
│   ├── pages/               # Page components
│   ├── integrations/        # Supabase integration
│   ├── test/                # Test setup and mocks
│   └── types/               # TypeScript types
├── supabase/
│   ├── functions/           # 15 Edge Functions
│   └── migrations/          # Database migrations
├── e2e/
│   ├── tests/               # E2E test suites
│   ├── fixtures/            # Test data files
│   └── helpers/             # Test utilities
├── public/                  # Static assets
└── docs/                    # Additional documentation
```

## Key Components

### Extraction Workflow

The extraction process is divided into 8 steps:

1. **Study Identification** - Basic study metadata
2. **PICOT Framework** - Population, Intervention, Comparator, Outcomes, Timing
3. **Baseline Characteristics** - Patient demographics and baseline data
4. **Imaging Parameters** - Medical imaging specifications
5. **Interventions** - Treatment interventions
6. **Study Arms** - Experimental and control groups
7. **Outcomes** - Primary and secondary outcomes
8. **Complications** - Adverse events and complications

### AI Edge Functions

- `extract-picot` - Extract PICOT framework
- `extract-form-step` - Extract data for any form step
- `validate-citations-batch` - Batch citation validation
- `multi-model-extract` - Multi-model consensus extraction
- `generate-summary` - Generate study summaries
- `enhance-figure-caption` - Enhance figure captions with AI

## Known Issues

1. **TypeScript Strict Mode**: Currently disabled. Enable gradually for better type safety.
2. **Linting Errors**: 351 linting issues (329 `any` types, 22 React Hook warnings).
3. **E2E Test Fixtures**: Sample PDF files need to be added to `e2e/fixtures/`.
4. **Large Components**: Some components exceed 1,000 lines and could be refactored.
5. **Security Vulnerabilities**: 4 npm vulnerabilities (2 moderate, 2 high) detected by `npm audit`. 
   - **Scope**: All vulnerabilities are currently limited to dev dependencies and do **not** affect production code.
   - **Remediation Plan**: Dependencies will be updated and vulnerabilities resolved in the next release cycle. Track progress in [GitHub Issues](https://github.com/your-org/your-repo/issues).

## Performance Notes

- **Bundle Size**: Main bundle is ~4.5MB (minified). Consider code splitting for optimization.
- **PDF Processing**: Large PDFs (50+ pages) may take several seconds to process.
- **Offline Support**: Uses IndexedDB for offline storage, cache-first strategy for static assets.

## Contributing

### Code Style

- Follow existing code patterns
- Write tests for new features
- Update documentation for API changes
- Use TypeScript for all new code (avoid `any` types)

### Running Storybook

View component documentation:

```bash
npx storybook dev
```

### Git Workflow

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test && npm run lint`
4. Build: `npm run build`
5. Commit with clear messages
6. Push and create a pull request

## Documentation

- **Testing Guide**: `src/test/README.md`
- **E2E Testing**: `e2e/README.md`
- **Component Best Practices**: `docs/SELECT_COMPONENT_BEST_PRACTICES.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

## Deployment

### Using Lovable

Visit the [Lovable Project](https://lovable.dev/projects/717d2f2a-cc04-4d6b-8a40-1a314f4f1a2c) and click Share → Publish.

### Custom Deployment

The project can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **AWS Amplify**: Connect Git repository

Ensure environment variables are configured in your hosting platform.

## License

[Add your license here]

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review the Copilot instructions: `.github/copilot-instructions.md`

## Acknowledgments

Built with [Lovable](https://lovable.dev) - AI-powered web development platform.
