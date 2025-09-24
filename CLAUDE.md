# React Project Guidelines

## Core Principles
Act as Kent C. Dodds - prioritize **simple, maintainable, and testable code**. Every decision should make the codebase easier to understand and modify.

## File Structure & Naming
```
src/
├── components/           # Reusable UI components
├── pages/ or routes/    # Page/route components
├── hooks/               # Custom hooks
├── utils/               # Pure utility functions
├── services/            # API calls and external services
├── types/               # TypeScript type definitions
└── __tests__/           # Test files (or co-located)
```

- Use **PascalCase** for components: `UserProfile.tsx`
- Use **camelCase** for hooks: `useUserData.ts`
- Use **kebab-case** for utilities: `format-date.ts`
- Co-locate tests: `UserProfile.test.tsx` next to `UserProfile.tsx`

## Component Architecture

### Single Responsibility & Composition
- One component = one responsibility
- Compose complex UIs from simple components
- Extract logic into custom hooks when components get complex
- **Lift state up** only when multiple components need it

### Props Interface
```tsx
// ✅ Explicit interface
interface UserProfileProps {
  userId: string
  showAvatar?: boolean
  onUserClick?: (user: User) => void
}

export function UserProfile({ userId, showAvatar = true, onUserClick }: UserProfileProps) {
  // ...
}
```

## State Management

### Local State First
- Start with `useState` - don't reach for external state immediately
- Use `useReducer` for complex state logic
- **Server state** (React Query/SWR) ≠ **Client state** (Zustand/Context)

### State Lifting Rules
- Keep state **as local as possible**
- Only lift state when **2+ components** need it
- Use Context sparingly - prefer prop drilling for 2-3 levels

```tsx
// ✅ Good - Local state
function SearchForm() {
  const [query, setQuery] = useState('')
  // ...
}

// ❌ Avoid - Premature global state
const SearchContext = createContext()
```

## Data Fetching Patterns

### Use React Query/TanStack Query
```tsx
// ✅ Server state with React Query
function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId
  })
}

// ✅ Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId)
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <div>User not found</div>
  
  return <div>{user.name}</div>
}
```

## Performance

### Avoid Premature Optimization
- **Don't** wrap everything in `memo()`, `useMemo()`, or `useCallback()`
- **Do** optimize when you have **measured performance issues**
- Use React DevTools Profiler to identify real bottlenecks

### When to Optimize
```tsx
// ✅ Good - memo for expensive list items
const ExpensiveListItem = memo(function ExpensiveListItem({ item }: { item: Item }) {
  return <div>{/* expensive rendering */}</div>
})

// ✅ Good - useMemo for expensive calculations
function DataVisualization({ data }: { data: number[] }) {
  const processedData = useMemo(() => 
    expensiveDataTransformation(data), [data]
  )
  return <Chart data={processedData} />
}
```

## Error Handling

### Error Boundaries + Graceful Degradation
```tsx
// ✅ Create error boundaries for route boundaries
function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
```

## Testing Philosophy

### Test Behavior, Not Implementation
```tsx
// ✅ Good - test user behavior
test('shows loading state while fetching user', async () => {
  render(<UserProfile userId="123" />)
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})

// ❌ Avoid - testing implementation details
test('calls useState with empty string', () => {
  // Don't test React internals
})
```

## Code Quality Rules

### TypeScript
- Use **strict mode**: `"strict": true`
- Prefer **interfaces** over types for object shapes
- Use **type** for unions, primitives, and computed types
- No `any` - use `unknown` if you must

### Imports & Exports
```tsx
// ✅ Named exports for components
export function UserProfile() {}

// ✅ Default exports only for pages/routes
export default function HomePage() {}

// ✅ Group imports: external, internal, relative
import React from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui'
import { useUser } from '@/hooks'

import './UserProfile.css'
```

### Don't Do
- ❌ No inline styles objects (use CSS modules or styled-components)
- ❌ No logic in JSX - extract to variables or functions
- ❌ No massive component files (>200 lines = time to split)
- ❌ No `useEffect` for derived state (use useMemo instead)
- ❌ No prop drilling beyond 3 levels (use Context or lift state)

## Accessibility
- Every interactive element needs proper ARIA labels
- Use semantic HTML first, ARIA second
- Test with keyboard navigation
- Maintain color contrast ratios

---

**Remember**: Simple solutions first. Complex patterns only when complexity is unavoidable. Make it work, make it right, then make it fast.