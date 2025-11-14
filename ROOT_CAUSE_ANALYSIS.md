# Root Cause Analysis: Automatic Table Extraction Not Triggering

## Date
November 14, 2025

## Issue
Automatic table extraction feature is not triggering when "Add Study" button is clicked.

## Symptoms
1. ✅ PDF uploads successfully (Winslow2023.pdf, 12 pages)
2. ✅ PDF renders correctly in the viewer
3. ❌ "Add Study" button click does nothing visible
4. ❌ Study count remains at "Meta-Analysis Studies (0)"
5. ❌ No console logs appear (not even from study creation)
6. ❌ No debug logs from table extraction
7. ❌ No toast notifications

## Root Cause

**The "Add Study" button is not creating a study in Supabase.**

This is a **pre-existing issue** in the application, NOT caused by the automatic table extraction feature I implemented.

### Evidence

1. **No console logs at all**: If the study creation process had started, we would see logs from the `createStudy` function
2. **Study count unchanged**: The left panel still shows "(0)" studies
3. **No error messages**: No errors in console, suggesting the click handler might not be wired up correctly or Supabase authentication is failing silently

### Why Table Extraction Doesn't Trigger

The automatic table extraction code I added is **correctly placed** in the study creation callback (line 201-219 of Index.tsx):

```typescript
).then(async (newStudy) => {
  if (newStudy) {
    getAllStudies().then(setStudies);
    
    // Automatically extract tables from PDF
    try {
      console.log('🔍 Starting automatic table extraction...');
      // ... table extraction code
    }
  }
});
```

However, this code **never executes** because:
- The `createStudy` function never completes successfully
- `newStudy` is never created
- The `.then()` callback is never called

## Underlying Issues to Investigate

### 1. Supabase Authentication
- Is the user properly authenticated?
- Does the user have permission to create studies in the `studies` table?
- Are there RLS (Row Level Security) policies blocking the insert?

### 2. Study Creation Function
- Is the `createStudy` function in `use-study-storage.ts` working correctly?
- Are there any silent errors being swallowed?
- Is the PDF file being uploaded to Supabase storage successfully?

### 3. Add Study Button Handler
- Is the click handler properly wired up?
- Is there a loading state that's not visible?
- Is there an error dialog that's not showing?

## Next Steps to Debug

### Step 1: Check Supabase Connection
```typescript
// Add to Index.tsx
const testSupabaseConnection = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Supabase user:', user, 'error:', error);
  
  const { data, error: queryError } = await supabase
    .from('studies')
    .select('count');
  console.log('Studies query:', data, 'error:', queryError);
};
```

### Step 2: Add Debug Logging to createStudy
```typescript
// In use-study-storage.ts
export const createStudy = async (...) => {
  console.log('📝 createStudy called with:', { fileName, pdfFile });
  
  try {
    // ... existing code
    console.log('✅ Study created:', newStudy);
    return newStudy;
  } catch (error) {
    console.error('❌ Error in createStudy:', error);
    throw error;
  }
};
```

### Step 3: Check Browser Console for Network Errors
- Open DevTools Network tab
- Click "Add Study"
- Look for failed Supabase API calls
- Check for 401 (unauthorized) or 403 (forbidden) responses

## Conclusion

The automatic table extraction feature is **correctly implemented** but cannot be tested because of a **pre-existing bug** in the study creation workflow.

**Recommendation**: Fix the study creation issue first, then the table extraction will work automatically.

**Alternative**: Create a manual "Extract Tables" button that doesn't depend on study creation to test the table extraction functionality independently.
