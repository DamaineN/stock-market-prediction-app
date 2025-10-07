# UI Components Guide

## StockSearchDropdown Component

**⭐ This is the STANDARD component for stock search functionality across the application.**

### Overview
The `StockSearchDropdown` component provides a consistent, reusable stock search interface with fuzzy search capabilities, dropdown results, and proper selection handling.

### Usage

```tsx
import StockSearchDropdown from '@/components/ui/StockSearchDropdown'
import { SearchResult } from '@/lib/services/stocks'

function MyComponent() {
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null)
  
  const handleStockSelect = (stock: SearchResult) => {
    setSelectedStock(stock)
    // Do something with the selected stock
  }
  
  return (
    <StockSearchDropdown
      onSelect={handleStockSelect}
      selectedStock={selectedStock}
      onClear={() => setSelectedStock(null)}
      placeholder="Search for a stock..."
      label="Stock Symbol"
      maxResults={5}
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelect` | `(stock: SearchResult) => void` | Required | Callback when stock is selected |
| `placeholder` | `string` | "Search for a stock..." | Input placeholder text |
| `label` | `string` | "Search Stock" | Label text (empty string to hide) |
| `selectedStock` | `SearchResult \| null` | `null` | Currently selected stock |
| `onClear` | `() => void` | Optional | Callback when selection is cleared |
| `className` | `string` | `""` | Additional CSS classes |
| `maxResults` | `number` | `5` | Maximum search results to show |
| `showFullSearch` | `boolean` | `false` | Show search button (for search page) |

### Features

✅ **Auto-search**: Searches as user types (300ms debounce)  
✅ **Fuzzy matching**: Finds stocks by symbol or company name  
✅ **Dropdown results**: Shows formatted results with symbol, name, type, region  
✅ **Selection display**: Shows selected stock in a styled card  
✅ **Clear functionality**: X button to clear selection  
✅ **Loading states**: Shows spinner while searching  
✅ **Error handling**: Falls back to mock data when API fails  
✅ **Click outside**: Closes dropdown when clicking elsewhere  
✅ **Keyboard support**: Enter key triggers search (when showFullSearch=true)  
✅ **Accessible**: Proper ARIA labels and keyboard navigation  

### Current Implementation

This component is currently implemented in:
- **Predictions Page**: For selecting stocks to predict
- **Watchlist Page**: For adding stocks to watchlist  
- **Search Page**: For general stock search

### For Future Pages

**IMPORTANT**: Always use this component for stock search functionality. Do NOT create new custom search inputs.

#### Quick Implementation:
1. Import the component
2. Add state for selected stock
3. Create onSelect handler
4. Add the component to your JSX

#### Example for new page:
```tsx
'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import StockSearchDropdown from '@/components/ui/StockSearchDropdown'
import { SearchResult } from '@/lib/services/stocks'

export default function NewPage() {
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null)
  
  const handleStockSelect = (stock: SearchResult) => {
    setSelectedStock(stock)
    // Your logic here
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <StockSearchDropdown
            onSelect={handleStockSelect}
            selectedStock={selectedStock}
            onClear={() => setSelectedStock(null)}
            placeholder="Search for a stock to analyze..."
            label="Select Stock"
            maxResults={8}
          />
        </div>
        
        {selectedStock && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2>Selected: {selectedStock.symbol}</h2>
            <p>{selectedStock.name}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
```

### Benefits of Standardization

1. **Consistent UX**: Users get familiar interface across all pages
2. **Reduced Code**: No need to reimplement search logic
3. **Better Performance**: Optimized with debouncing and proper state management
4. **Error Handling**: Built-in fallbacks and error states
5. **Accessibility**: Properly implemented ARIA attributes
6. **Maintainability**: Single component to update for improvements

### Customization

The component is designed to be flexible while maintaining consistency:
- Adjust `maxResults` based on context (5 for forms, 10 for search pages)
- Use `showFullSearch=true` only for dedicated search pages
- Customize `placeholder` to match the page context
- Set `label=""` to hide the label if not needed

### API Integration

The component automatically:
- Calls `StocksService.searchStocks()` for live search
- Handles API errors gracefully with fallback data
- Returns `SearchResult` objects with standardized format:
  ```typescript
  {
    symbol: string
    name: string
    type: string
    region: string
    marketOpen: string
    marketClose: string
    timezone: string
    currency: string
  }
  ```