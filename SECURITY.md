# Security Policy

## Known Vulnerabilities and Mitigations

### High Priority - PDF.js Vulnerability

**Issue**: `pdfjs-dist` versions <= 4.1.392 have a vulnerability (GHSA-wgrm-67xf-hhpq) that allows arbitrary JavaScript execution when opening malicious PDFs.

**Current Status**:
- Using `pdfjs-dist@3.11.174` via `@react-pdf-viewer/core`
- No fix currently available in the @react-pdf-viewer ecosystem

**Mitigation Strategy**:
1. **User Education**: Only open PDFs from trusted sources
2. **Content Security Policy**: Implement strict CSP headers
3. **Sandboxing**: Consider running PDF processing in isolated worker contexts
4. **Monitoring**: Watch for @react-pdf-viewer updates to pdfjs-dist 4.2+

**Tracking**:
- Upstream issue: https://github.com/mozilla/pdf.js/security/advisories
- Alternative: Consider migrating to `react-pdf` library which has better maintenance

### Moderate Priority - esbuild Vulnerability

**Issue**: esbuild <= 0.24.2 allows websites to send requests to dev server (GHSA-67mh-4wv8-2f99)

**Impact**: Development environment only - not a production concern

**Mitigation**:
- Only run dev server on localhost
- Don't expose dev server to public networks
- Will be resolved with Vite 7.x upgrade (breaking changes)

## Security Best Practices

### For Developers

1. **Authentication**: All Supabase queries use Row Level Security (RLS)
2. **Input Validation**: All edge functions validate inputs with Zod schemas
3. **CORS**: Properly configured CORS headers on all edge functions
4. **Environment Variables**: Never commit `.env` files

### For Users

1. **PDF Sources**: Only upload PDFs from trusted sources
2. **Authentication**: Use strong passwords and enable MFA if available
3. **Data Privacy**: All data is user-scoped via RLS policies

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainers directly rather than creating a public issue.

## Update Schedule

- **Dependencies**: Reviewed monthly
- **Security Patches**: Applied within 48 hours of availability
- **Vulnerability Scans**: Automated via `npm audit` in CI/CD

Last Updated: 2025-11-13
