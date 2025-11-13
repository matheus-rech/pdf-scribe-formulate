# CLAUDE.md - AI Assistant Guide for PDF Scribe Formulate

## Project Overview

**PDF Scribe Formulate** is an advanced PDF data extraction and annotation tool designed for systematic reviews and research studies. The application enables users to extract structured data from PDF documents using multiple AI models, manual annotations, and validation workflows.

### Key Features
- Multi-model AI extraction (PICOT framework, form steps, sections)
- PDF annotation and highlighting with canvas-based drawing tools
- Citation detection and validation
- Data validation and conflict resolution dashboards
- Batch processing and revalidation
- Export to multiple formats (JSON, CSV, Excel)
- Audit reporting and analytics

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **PDF Processing**: pdf-lib, pdfjs-dist, @react-pdf-viewer
- **Canvas**: Fabric.js for annotations
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Edge Functions**: Deno runtime with TypeScript
- **AI Integration**: Hugging Face Transformers
- **Validation**: Zod for runtime validation

---

## Repository Structure

```
pdf-scribe-formulate/
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components (DO NOT EDIT manually)
│   │   ├── ExtractionForm.tsx
│   │   ├── StudyManager.tsx
│   │   ├── AIReviewComparison.tsx
│   │   └── ... (50+ feature components)
│   ├── pages/             # Route pages
│   │   ├── Index.tsx      # Main application page
│   │   ├── Auth.tsx       # Authentication page
│   │   └── NotFound.tsx   # 404 page
│   ├── hooks/             # Custom React hooks
│   │   ├── use-study-storage.ts
│   │   ├── useAnnotationCanvas.ts
│   │   └── useTextHighlights.ts
│   ├── lib/               # Utility functions and business logic
│   │   ├── pdfChunking.ts
│   │   ├── citationDetector.ts
│   │   ├── dataValidation.ts
│   │   └── exportData.ts
│   ├── types/             # TypeScript type definitions
│   │   └── highlights.ts
│   ├── integrations/      # External service integrations
│   │   └── supabase/
│   │       ├── client.ts  # Supabase client configuration
│   │       └── types.ts   # Auto-generated database types
│   ├── App.tsx            # Root component with providers
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles and Tailwind imports
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── extract-picot/
│   │   ├── extract-form-step/
│   │   ├── multi-model-extract/
│   │   ├── validate-extraction/
│   │   ├── validate-citation/
│   │   ├── batch-extract-section/
│   │   └── ai-table-vision/
│   └── migrations/        # Database schema migrations
├── public/                # Static assets
├── .env                   # Environment variables
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── components.json        # shadcn/ui configuration
└── package.json           # Dependencies and scripts
```

---

## Development Guidelines

### Path Aliases
The project uses TypeScript path aliases for cleaner imports:
```typescript
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMobile } from "@/hooks/use-mobile";
import { exportToExcel } from "@/lib/exportData";
```

**Convention**: Always use `@/` prefix instead of relative paths.

### TypeScript Configuration
```json
{
  "noImplicitAny": false,
  "noUnusedParameters": false,
  "noUnusedLocals": false,
  "strictNullChecks": false,
  "allowJs": true
}
```

**Note**: The project has lenient TypeScript settings. While types are encouraged, the codebase tolerates implicit `any` types. Focus on functional correctness over strict typing.

### Component Patterns

#### 1. Feature Components
Located in `src/components/`, these implement business logic and UI features.

**Example Structure**:
```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ComponentProps {
  studyId: string;
  onComplete?: () => void;
}

export const FeatureComponent = ({ studyId, onComplete }: ComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Component logic here

  return (
    <div className="space-y-4">
      {/* UI elements */}
    </div>
  );
};
```

**Conventions**:
- Use named exports for components
- Define props interface explicitly
- Use `sonner` for toast notifications
- Handle loading states with local state
- Use Tailwind CSS utility classes
- Prefer `space-y-*` and `gap-*` for spacing

#### 2. UI Components (shadcn/ui)
Located in `src/components/ui/`, these are auto-generated from shadcn/ui.

**DO NOT edit these files manually**. Instead:
```bash
npx shadcn@latest add <component-name>
```

To customize styling, use Tailwind classes when consuming the components or modify `tailwind.config.ts` CSS variables.

### Custom Hooks Pattern
```typescript
// src/hooks/use-feature.ts
import { useState, useEffect } from "react";

export const useFeature = (param: string) => {
  const [state, setState] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Effect logic
  }, [param]);

  return { state, isLoading };
};
```

### Supabase Integration

#### Client-Side Usage
```typescript
import { supabase } from "@/integrations/supabase/client";

// Query data
const { data, error } = await supabase
  .from("studies")
  .select("*")
  .eq("user_id", userId);

// Insert data
const { data: newStudy, error } = await supabase
  .from("studies")
  .insert({ title: "New Study", user_id: userId })
  .select()
  .single();

// Update data
const { error } = await supabase
  .from("studies")
  .update({ title: "Updated Title" })
  .eq("id", studyId);
```

**Authentication Context**: The Supabase client automatically includes the user's session. All queries respect Row Level Security (RLS) policies.

#### Edge Functions
Located in `supabase/functions/<function-name>/index.ts`.

**Standard Pattern**:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define input schema
const InputSchema = z.object({
  pdfText: z.string().min(1),
  studyId: z.string().uuid()
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate input
    const validation = InputSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Business logic here

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

**Key Conventions**:
- Always validate inputs with Zod schemas
- Use authenticated Supabase clients (respect RLS)
- Include CORS headers in all responses
- Return consistent error response format
- Log errors to console for debugging

---

## Styling and Theming

### Tailwind CSS Approach
The project uses Tailwind utility classes with a custom design system based on CSS variables.

### Color System
```typescript
// Custom extraction method colors
extraction: {
  manual: "hsl(var(--extraction-manual))",    // Manual text selection
  ai: "hsl(var(--extraction-ai))",            // AI extraction
  image: "hsl(var(--extraction-image))",      // Image/table extraction
  search: "hsl(var(--extraction-search))",    // Search-based extraction
}
```

### Component Styling Pattern
```typescript
<div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
  <Button variant="outline" size="sm">Action</Button>
</div>
```

**Best Practices**:
- Use semantic color tokens (`bg-card`, `text-muted-foreground`)
- Prefer composition with Tailwind utilities over custom CSS
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Maintain consistent spacing (`gap-4`, `space-y-4`, `p-4`)

---

## Data Flow and State Management

### TanStack Query (React Query)
Used for server state management with Supabase:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Query
const { data: studies, isLoading } = useQuery({
  queryKey: ['studies', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('studies')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
});

// Mutation
const queryClient = useQueryClient();
const createStudy = useMutation({
  mutationFn: async (newStudy: Study) => {
    const { data, error } = await supabase
      .from('studies')
      .insert(newStudy)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['studies'] });
    toast.success("Study created successfully");
  }
});
```

### Local Storage
For persistent client-side data, use the custom `use-study-storage` hook:

```typescript
import { useStudyStorage } from "@/hooks/use-study-storage";

const { studies, addStudy, updateStudy, deleteStudy } = useStudyStorage();
```

---

## Key Application Concepts

### Extraction Methods
The application supports multiple extraction methods:

1. **Manual**: User highlights text in PDF
2. **AI**: Automated extraction via edge functions
3. **Image**: OCR and table vision extraction
4. **Region**: Canvas-based area selection
5. **Annotation**: Import from external annotation formats

Each extraction has:
- `fieldName`: The data field being extracted
- `text`: Extracted content
- `page`: PDF page number
- `coordinates`: {x, y, width, height} for visual markers
- `method`: Extraction method identifier
- `confidence_score`: AI confidence (0-1)
- `validation_status`: "pending" | "validated" | "questionable"

### PDF Chunking
Large PDFs are chunked for efficient AI processing:

```typescript
import { chunkPdfBySemantics } from "@/lib/semanticChunking";
import { detectSections } from "@/lib/sectionDetection";

// Semantic chunking with overlap
const chunks = await chunkPdfBySemantics(pdfText, {
  maxChunkSize: 4000,
  overlap: 200
});

// Section-based chunking
const sections = await detectSections(pdfText);
```

### Citation Detection
Automatic citation detection and linking:

```typescript
import { detectCitations } from "@/lib/citationDetector";

const citations = detectCitations(extractedText);
// Returns array of detected citation patterns (Vancouver, Harvard, etc.)
```

---

## Development Workflow

### Running the Application

```bash
# Install dependencies
npm install

# Start development server (http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Environment Variables

Required in `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the browser.

### Adding New Features

#### 1. New Component
```bash
# Create component file
touch src/components/NewFeature.tsx

# Add to page or parent component
import { NewFeature } from "@/components/NewFeature";
```

#### 2. New Route
```typescript
// src/App.tsx
<Routes>
  <Route path="/new-route" element={<NewPage />} />
  {/* Catch-all MUST be last */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

#### 3. New Edge Function
```bash
# Create function directory
mkdir supabase/functions/new-function
touch supabase/functions/new-function/index.ts

# Deploy (requires Supabase CLI)
supabase functions deploy new-function
```

#### 4. New shadcn/ui Component
```bash
npx shadcn@latest add dialog
# This adds src/components/ui/dialog.tsx
```

---

## Database Schema (Supabase)

### Main Tables

**studies**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users) - NOT NULL
- `title` (text)
- `pdf_url` (text)
- `pdf_chunks` (jsonb) - Pre-processed PDF chunks
- `created_at` (timestamp)
- `updated_at` (timestamp)

**extractions**
- `id` (uuid, PK)
- `study_id` (uuid, FK)
- `user_id` (uuid, FK) - NOT NULL
- `field_name` (text)
- `text` (text)
- `page` (integer)
- `coordinates` (jsonb)
- `method` (text)
- `confidence_score` (numeric)
- `validation_status` (text)
- `created_at` (timestamp)

**Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only access their own data (user_id match)
- Edge functions must use authenticated Supabase clients

---

## Common Patterns and Idioms

### Toast Notifications
```typescript
import { toast } from "sonner";

// Success
toast.success("Operation completed successfully");

// Error
toast.error("Failed to save data", {
  description: error.message
});

// Loading
toast.loading("Processing...", { id: "process-id" });
toast.success("Done!", { id: "process-id" }); // Updates the same toast
```

### Conditional Rendering
```typescript
{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : data ? (
  <DataDisplay data={data} />
) : (
  <EmptyState />
)}
```

### Form Handling
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { title: "" }
});

const onSubmit = async (values: z.infer<typeof formSchema>) => {
  // Handle submission
};
```

### Dialog/Modal Pattern
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const [isOpen, setIsOpen] = useState(false);

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## Testing and Quality

### ESLint Configuration
- TypeScript ESLint with recommended rules
- React Hooks rules enforced
- Unused variables warning disabled (lenient mode)

### Code Style
- No strict formatting enforced (no Prettier config)
- Use 2-space indentation
- Prefer arrow functions for components
- Use `const` for all declarations unless reassignment needed

---

## AI Assistant Best Practices

### When Adding Features
1. **Check existing patterns**: Review similar components before creating new ones
2. **Reuse UI components**: Always use shadcn/ui components from `@/components/ui/`
3. **Follow naming**: Components use PascalCase, files match component names
4. **Maintain RLS**: Ensure all database operations respect user_id filters
5. **Validate inputs**: Use Zod schemas for edge function inputs
6. **Handle errors**: Always show user-friendly error messages via toast
7. **Loading states**: Show skeletons or spinners during async operations

### When Debugging
1. **Check browser console**: Frontend errors appear here
2. **Check Supabase logs**: Edge function errors appear in Supabase dashboard
3. **Verify RLS policies**: Authentication issues often relate to RLS
4. **Check network tab**: API calls and responses visible here

### When Refactoring
1. **Don't break UI components**: Avoid editing `src/components/ui/` directly
2. **Update types**: If changing database schema, regenerate types
3. **Test extraction flow**: Core feature is PDF → Extraction → Validation
4. **Maintain backward compatibility**: Consider existing stored data formats

### Code Review Checklist
- [ ] TypeScript types defined (even if using `any` temporarily)
- [ ] Error handling implemented
- [ ] Loading states shown to user
- [ ] Toast notifications for user feedback
- [ ] Responsive design (mobile-friendly)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Authentication checked (RLS, user_id filters)
- [ ] Edge function inputs validated with Zod
- [ ] No hardcoded API keys or secrets

---

## Common Gotchas

### 1. Path Alias Resolution
**Problem**: Import paths don't resolve.
**Solution**: Always use `@/` prefix. Check `tsconfig.json` and `vite.config.ts` for alias configuration.

### 2. Supabase RLS Blocking Queries
**Problem**: Queries return empty results even though data exists.
**Solution**: Ensure `user_id` matches authenticated user. Check RLS policies in Supabase dashboard.

### 3. Edge Function 401/403 Errors
**Problem**: Edge function returns unauthorized.
**Solution**:
- Pass `Authorization` header from client
- Create authenticated Supabase client in edge function
- Verify RLS policies allow the operation

### 4. Large PDF Performance
**Problem**: PDFs crash browser or timeout.
**Solution**:
- Use PDF chunking (`@/lib/pdfChunking.ts`)
- Process in batches with edge functions
- Show progress indicators

### 5. Tailwind Classes Not Applied
**Problem**: Custom classes don't work.
**Solution**:
- Use existing Tailwind utilities
- If custom needed, add to `tailwind.config.ts` theme extension
- Avoid arbitrary values like `w-[123px]` when standard classes exist

---

## Helpful Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Radix UI](https://www.radix-ui.com)

### Project-Specific
- Main application entry: `src/pages/Index.tsx` (~555 lines)
- Core extraction form: `src/components/ExtractionForm.tsx` (~2,242 lines - complex component)
- PDF processing utilities: `src/lib/` directory
- Edge function examples: `supabase/functions/extract-picot/`
- State management context: `src/contexts/ExtractionFormContext.tsx`
- Performance monitoring: `src/lib/performance.ts`

---

## Migration Notes

This project was created with [Lovable](https://lovable.dev), a GPT-powered web app builder. Changes made via Lovable are automatically committed to this repository.

The project ID: `717d2f2a-cc04-4d6b-8a40-1a314f4f1a2c`

---

## Summary

PDF Scribe Formulate is a sophisticated research data extraction tool built with modern web technologies. When working on this codebase:

- **Follow established patterns** for components, hooks, and edge functions
- **Use shadcn/ui** for all UI components (don't reinvent)
- **Respect authentication** and RLS policies in all operations
- **Validate inputs** with Zod schemas
- **Provide user feedback** via toast notifications
- **Handle loading states** to improve UX
- **Maintain type safety** where practical (lenient TypeScript is acceptable)

The codebase prioritizes functionality and user experience over strict architectural patterns. Some files are very large (Index.tsx, ExtractionForm.tsx) - this is intentional for the current development phase. Future refactoring may split these into smaller modules.

For questions or clarifications about specific features, consult the relevant component or edge function implementation.
