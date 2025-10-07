# Text Styling Guide

## Overview
This project uses consistent dark text colors across all pages to ensure readability. The global CSS automatically applies dark text colors to prevent light or hard-to-read text.

## Automatic Dark Text
- All pages automatically inherit dark text colors through global CSS
- The `page-container` class is applied to the main Layout component
- Text utilities are imported globally in `globals.css`

## Available CSS Classes

### Primary Text Classes
```css
.text-primary     /* #111827 - Very dark gray for headings */
.text-secondary   /* #374151 - Dark gray for body text */
.text-muted       /* #6b7280 - Medium gray for less important text */
.text-accent      /* #1d4ed8 - Blue for links and accents */
```

### Status Text Classes
```css
.text-error       /* #dc2626 - Red for errors */
.text-success     /* #059669 - Green for success messages */
.text-warning     /* #d97706 - Orange for warnings */
```

### Container Classes
```css
.page-container   /* Applies dark text to all child elements */
.card-container   /* For card components */
.force-dark-text  /* Force dark text on any element */
```

### Form Classes
```css
.form-input       /* Dark text with white background for inputs */
```

## For New Pages

### Option 1: Automatic (Recommended)
New pages created within the Layout component automatically get dark text styling. No additional action needed.

### Option 2: Manual Override
If creating standalone components, add the `page-container` class:
```jsx
<div className="page-container">
  <h1>Your heading will be dark</h1>
  <p>Your text will be readable</p>
</div>
```

### Option 3: Individual Classes
For fine-grained control:
```jsx
<h1 className="text-primary">Main Heading</h1>
<p className="text-secondary">Body text</p>
<span className="text-muted">Less important text</span>
<a href="#" className="text-accent">Link text</a>
```

## Important Notes

1. **Global Overrides**: The global CSS uses `!important` to ensure text is always readable
2. **Button Colors**: Buttons with colored backgrounds (blue, green, red) keep their white text
3. **Form Inputs**: All form inputs automatically have dark text on white backgrounds
4. **Preserve Existing Design**: Navigation and branded elements keep their intended colors

## Troubleshooting

If you encounter light/unreadable text:
1. Add the `force-dark-text` class to the parent element
2. Or use specific utility classes like `text-primary` or `text-secondary`
3. Check if the element has conflicting inline styles

## File Locations
- Global CSS: `src/app/globals.css`
- Text utilities: `src/styles/text-utils.css`
- Layout component: `src/components/Layout.tsx`