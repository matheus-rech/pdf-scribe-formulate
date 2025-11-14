# Bugs To Fix - PDF Scribe Formulate

Based on comprehensive testing, here are the **actual bugs** that need fixing, separated from design limitations and code quality issues:

## ✅ Already Fixed

1. **Tables Tab Empty State** - Added helpful instructions (UX improvement)
2. **Vite Config** - Updated to allow external host access

## 🐛 Actual Bugs To Fix

### Bug #1: Page Navigation in PDF Viewer Not Working
**Severity**: MEDIUM  
**File**: Likely in PDF viewer component  
**Issue**: Entering a page number in the input field doesn't navigate to that page  
**Fix**: Need to connect page input change handler to PDF.js page navigation

### Bug #2: Quality Score Not Updating Immediately
**Severity**: LOW  
**File**: Quality score calculation component  
**Issue**: Quality score doesn't update immediately after accepting AI-extracted fields  
**Fix**: Trigger quality score recalculation after field updates

## ⚠️ Design Limitations (Not Bugs)

1. **Step 7 Numerical Data Extraction** - AI extracts outcome definitions, not table data (requires manual entry or Region tool)
2. **Figures Not Auto-Extracted** - Figures require manual extraction using Image tool
3. **Tables Tab Click** - Tab works correctly, just shows empty state when no tables extracted

## 📋 Code Quality Issues (Separate from Bugs)

1. **356 Linting Warnings** - Should be addressed but doesn't affect functionality
2. **23 Security Vulnerabilities** - Mostly in dev dependencies, documented in README

## 🎯 Priority Fixes

**High Priority**:
- None (all high-priority "bugs" were design limitations)

**Medium Priority**:
- Fix page navigation in PDF viewer

**Low Priority**:
- Fix quality score update timing

## Conclusion

Most issues identified were **design limitations** or **code quality concerns**, not actual bugs. The application is fundamentally sound with only 2 minor bugs to fix.
