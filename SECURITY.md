# Security Vulnerabilities Report

## Current Status

As of the last security audit, the following vulnerabilities have been identified:

### 🔴 High Severity (21 vulnerabilities)

#### 1. PDF.js Arbitrary JavaScript Execution
- **Package**: `pdfjs-dist@3.11.174`
- **Advisory**: [GHSA-wgrm-67xf-hhpq](https://github.com/advisories/GHSA-wgrm-67xf-hhpq)
- **Description**: PDF.js vulnerable to arbitrary JavaScript execution upon opening a malicious PDF
- **Vulnerable Version**: ≤ 4.1.392
- **Current Version**: 3.11.174
- **Impact**: HIGH - Core functionality, all @react-pdf-viewer packages depend on this
- **Status**: ⚠️ **REQUIRES MANUAL UPGRADE**
- **Mitigation Plan**:
  - Upgrade to `pdfjs-dist@4.2.x` or later (breaking changes expected)
  - Test all PDF viewing functionality after upgrade
  - Update all `@react-pdf-viewer` packages to compatible versions
  - Estimated effort: 2-4 hours
- **Current Mitigation Strategy** (temporary):
  1. **User Education**: Only open PDFs from trusted sources
  2. **Content Security Policy**: Implement strict CSP headers
  3. **Sandboxing**: Consider running PDF processing in isolated worker contexts
  4. **Monitoring**: Watch for @react-pdf-viewer updates to pdfjs-dist 4.2+
- **Tracking**:
  - Upstream issue: https://github.com/mozilla/pdf.js/security/advisories
  - Alternative: Consider migrating to `react-pdf` library which has better maintenance

#### 2. SheetJS (xlsx) Vulnerabilities
- **Package**: `xlsx@0.18.5`
- **Advisories**:
  - [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) - Prototype Pollution
  - [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9) - Regular Expression DoS (ReDoS)
- **Current Version**: 0.18.5
- **Impact**: MEDIUM - Used for Excel export functionality only
- **Status**: ⚠️ **REQUIRES MANUAL UPGRADE OR REPLACEMENT**
- **Mitigation Options**:
  1. Upgrade to latest `xlsx` version (may have breaking changes)
  2. Consider alternative: Switch to `exceljs` package
  3. Sanitize all input before processing with xlsx
- **Files Affected**:
  - `src/lib/exportData.ts`
  - `src/lib/zipExport.ts`
- **Estimated effort**: 1-2 hours

### 🟡 Moderate Severity (2 vulnerabilities)

#### 3. esbuild Development Server SSRF
- **Package**: `esbuild@0.21.5` (via `vite@5.4.19`)
- **Advisory**: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- **Description**: esbuild enables any website to send requests to development server
- **Vulnerable Version**: ≤ 0.24.2
- **Current Version**: 0.21.5 (via Vite)
- **Impact**: LOW - Development environment only, not a production concern
- **Status**: ⚠️ **REQUIRES VITE UPGRADE**
- **Mitigation Plan**:
  - Upgrade to `vite@6.x` or `vite@7.x` (major version upgrade)
  - Test all build tooling and dev server
  - Update Vitest to v5.x for compatibility
  - Estimated effort: 1-2 hours
- **Workaround**:
  - Only run dev server on localhost
  - Don't expose dev server to public networks
  - Not exploitable in production builds

## Recommended Action Plan

### Phase 1: Immediate (Low Risk, Dev Only)
1. ✅ Document vulnerabilities (this file)
2. Add security audit to CI/CD pipeline
3. Implement Content Security Policy (CSP) headers

### Phase 2: High Priority (2-3 days)
1. **Upgrade PDF.js** (CRITICAL)
   ```bash
   npm install pdfjs-dist@latest
   npm install @react-pdf-viewer/core@latest @react-pdf-viewer/default-layout@latest --legacy-peer-deps
   ```
   - Test PDF viewing functionality
   - Update worker configuration if needed

2. **Replace or Upgrade xlsx**
   ```bash
   npm install exceljs
   # OR
   npm install xlsx@latest
   ```
   - Update export functions
   - Add input sanitization

### Phase 3: Lower Priority (1 week)
1. **Upgrade Vite** (Dev environment only)
   ```bash
   npm install vite@^7.0.0 vitest@^5.0.0 --legacy-peer-deps
   ```
   - Test dev server
   - Test build process
   - Update Storybook if needed

## Monitoring

- Run `npm audit` weekly
- Subscribe to GitHub security advisories
- Monitor Dependabot alerts
- Review dependency updates monthly

## Security Best Practices

### For Developers

1. **Never open untrusted PDFs** in the development environment
2. **Validate all user input** before processing with xlsx
3. **Use Content Security Policy** to prevent XSS
4. **Regular dependency updates** via Dependabot or Renovate
5. **Authentication**: All Supabase queries use Row Level Security (RLS)
6. **Input Validation**: All edge functions validate inputs with Zod schemas
7. **CORS**: Properly configured CORS headers on all edge functions
8. **Environment Variables**: Never commit `.env` files

### For Users

1. **Only upload PDFs from trusted sources**
2. **Review extracted data** for unexpected content
3. **Report suspicious behavior** immediately
4. **Use strong passwords and enable MFA** if available
5. **Data Privacy**: All data is user-scoped via RLS policies

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email the maintainers directly rather than creating a public issue
3. Provide: Steps to reproduce, impact assessment, suggested fix

## Update Schedule

- **Dependencies**: Reviewed monthly
- **Security Patches**: Applied within 48 hours of availability
- **Vulnerability Scans**: Automated via `npm audit` in CI/CD

## Changelog

- **2025-11-14**: Initial security audit completed
  - 23 vulnerabilities identified (21 high, 2 moderate)
  - pdfjs-dist upgrade required (HIGH priority)
  - xlsx replacement/upgrade required (MEDIUM priority)
  - Vite upgrade required (LOW priority - dev only)
- **2025-11-13**: Security policy established and documented

Last Updated: 2025-11-14
