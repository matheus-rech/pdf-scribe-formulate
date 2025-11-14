# Select Component Best Practices

## ✅ Correct Usage Patterns

### Pattern 1: Basic Select with Value
```tsx
<Select value={selectedValue} onValueChange={handleChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Pattern 2: Select with Default Value
```tsx
<Select value={value || 'default'} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="default">Default Option</SelectItem>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Pattern 3: Optional Select with Nullable State
```tsx
// Good: Use "null" or "none" as string value for empty state
<Select 
  value={value || 'null'} 
  onValueChange={(val) => onChange(val === 'null' ? null : val)}
>
  <SelectTrigger>
    <SelectValue placeholder="Select or leave unknown" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="null">Unknown</SelectItem>
    <SelectItem value="yes">Yes</SelectItem>
    <SelectItem value="no">No</SelectItem>
  </SelectContent>
</Select>
```

### Pattern 4: Dynamic Options
```tsx
<Select value={selected} onValueChange={setSelected}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {options.map(option => (
      <SelectItem key={option.id} value={option.id}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## ❌ Anti-Patterns (DO NOT USE)

### ❌ Empty String Value
```tsx
// WRONG: Causes runtime error
<SelectContent>
  <SelectItem value="">Select...</SelectItem>  {/* ❌ ERROR */}
  <SelectItem value="option1">Option 1</SelectItem>
</SelectContent>
```

**Why it fails:** Radix UI's Select uses empty string internally to clear selections. Using `value=""` conflicts with this mechanism.

**Fix:** Remove the empty value item and use `SelectValue`'s `placeholder` prop instead:

```tsx
// ✅ CORRECT
<SelectTrigger>
  <SelectValue placeholder="Select..." />
</SelectTrigger>
<SelectContent>
  <SelectItem value="option1">Option 1</SelectItem>
  <SelectItem value="option2">Option 2</SelectItem>
</SelectContent>
```

### ❌ Placeholder as SelectItem
```tsx
// WRONG: Don't use SelectItem for placeholders
<SelectContent>
  <SelectItem value="placeholder" disabled>-- Select an option --</SelectItem>
  <SelectItem value="option1">Option 1</SelectItem>
</SelectContent>
```

**Fix:** Use `SelectValue`'s `placeholder` prop:

```tsx
// ✅ CORRECT
<SelectTrigger>
  <SelectValue placeholder="-- Select an option --" />
</SelectTrigger>
```

### ❌ Missing Placeholder with Optional Select
```tsx
// WRONG: No visual indication of empty state
<Select value={optionalValue} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue />  {/* No placeholder! */}
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

**Fix:** Always provide a placeholder for optional selects:

```tsx
// ✅ CORRECT
<Select value={optionalValue} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option (optional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

## 🎯 Implementation Checklist

When implementing a Select component:

- [ ] **Never use `value=""`** on SelectItem components
- [ ] **Always provide a `placeholder`** in SelectValue for optional selects
- [ ] **Use string literals** like `"null"`, `"none"`, or `"unknown"` for empty states
- [ ] **Provide unique, non-empty values** for all SelectItem components
- [ ] **Handle nullable states** in the `onValueChange` handler, not in SelectItem values
- [ ] **Add proper labels** using Label component for accessibility
- [ ] **Test keyboard navigation** (Arrow keys, Enter, Escape)
- [ ] **Verify dropdown visibility** with `z-index` if inside dialogs/popovers

---

## 📋 Code Review Checklist

Before merging code with Select components, verify:

```bash
# Search for potential issues
grep -r 'SelectItem value=""' src/
grep -r 'SelectItem value={}' src/
grep -r 'SelectItem value={""' src/
```

All results should be **zero** (no empty values found).

---

## 🔍 Real-World Examples from Codebase

### ✅ Good: Boolean Select with "Unknown" State
**File:** `src/components/extraction-steps/Step4Imaging.tsx`

```tsx
<Select
  value={formData.brainstemInvolvement || 'null'}
  onValueChange={(value) => onUpdate({ brainstemInvolvement: value })}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="null">Unknown</SelectItem>
    <SelectItem value="true">Yes</SelectItem>
    <SelectItem value="false">No</SelectItem>
  </SelectContent>
</Select>
```

**Why it's good:**
- Uses `"null"` as string value for unknown state
- Has proper fallback with `|| 'null'`
- No empty string values

### ✅ Good: Model Selection with Descriptions
**File:** `src/components/ReviewerSettingsDialog.tsx`

```tsx
<Select value={reviewer.model} onValueChange={(value) => handleFieldChange(reviewer.id, 'model', value)}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="google/gemini-2.5-pro">
      <div className="flex flex-col items-start">
        <span className="font-medium">Gemini 2.5 Pro</span>
        <span className="text-xs text-muted-foreground">Best quality, slower</span>
      </div>
    </SelectItem>
    {/* More options... */}
  </SelectContent>
</Select>
```

**Why it's good:**
- Rich content in SelectItem (nested components allowed)
- Valid, descriptive string values
- Clear visual hierarchy

### ✅ Good: Dynamic Options with Fallback
**File:** `src/components/ABTestDialog.tsx`

```tsx
<Select
  value={variant.template_id || "none"}
  onValueChange={(value) => {
    const newVariants = [...variants];
    newVariants[index].template_id = value === "none" ? null : value;
    setVariants(newVariants);
  }}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Default</SelectItem>
    {templates.map(template => (
      <SelectItem key={template.id} value={template.id}>
        {template.template_name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Why it's good:**
- Uses `"none"` string for null state
- Converts between null and string in handler
- Provides clear default option

---

## 🚨 Error Messages to Watch For

If you see this error, you have an empty value:

```
Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear 
the selection and show the placeholder.
```

**Quick Fix:**
1. Find the `<SelectItem value="">` in your code
2. Either remove it entirely, or use a string like `"none"`, `"null"`, `"default"`
3. Add a placeholder to `<SelectValue placeholder="..." />`

---

## 🎨 Styling Best Practices

### Dropdown Z-Index in Dialogs/Popovers
```tsx
<SelectContent className="z-50">
  {/* Ensures dropdown appears above dialog overlays */}
</SelectContent>
```

### Dropdown Background for Visibility
```tsx
<SelectContent className="bg-card border-border">
  {/* Ensures dropdown isn't transparent */}
</SelectContent>
```

### Compact Selects
```tsx
<SelectTrigger className="h-8 w-20">
  <SelectValue />
</SelectTrigger>
```

---

## 📚 References

- [Radix UI Select Documentation](https://www.radix-ui.com/primitives/docs/components/select)
- [Shadcn Select Component](https://ui.shadcn.com/docs/components/select)
- Error location: `@radix-ui/react-select` validation in SelectItem component

---

## ✨ Summary

**Golden Rule:** Never use empty strings as SelectItem values. Always use meaningful string literals like `"null"`, `"none"`, `"unknown"`, or `"default"` for empty/optional states.

**Remember:**
- Empty string = Placeholder (handled by SelectValue)
- Non-empty string = Valid option (handled by SelectItem)
- Separation of concerns keeps the Select component stable and predictable
