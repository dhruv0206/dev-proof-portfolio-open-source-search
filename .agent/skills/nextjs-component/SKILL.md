---
name: nextjs-component
description: Create Next.js 16 components with TypeScript, Tailwind CSS, and shadcn/ui
---

# Next.js Component Creation Skill

## When to Use
Use this skill when creating new React components for the DevProof web-platform.

## Component Structure

All components should follow this pattern:

```tsx
"use client"; // Only if using hooks, event handlers, or browser APIs

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComponentNameProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function ComponentName({ title, className, children }: ComponentNameProps) {
  const [state, setState] = useState<string>("");

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
```

## File Locations

| Type | Location |
|------|----------|
| Page components | `web-platform/src/app/{route}/page.tsx` |
| Layout | `web-platform/src/app/{route}/layout.tsx` |
| Shared components | `web-platform/src/components/{category}/` |
| UI primitives | `web-platform/src/components/ui/` (shadcn) |

## Styling Guidelines

### Use Tailwind with CSS Variables
```tsx
// ✅ Good - uses design system
<div className="bg-background text-foreground border-border">

// ❌ Bad - hardcoded values
<div className="bg-slate-900 text-white border-gray-700">
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Dark Mode
The app uses class-based dark mode. Use Tailwind's dark mode classes:
```tsx
<div className="bg-white dark:bg-gray-900">
```

## shadcn/ui Components

Available components (already installed):
- Button, Card, Dialog, Dropdown, Input
- Select, Tabs, Toast, Tooltip, Badge
- Avatar, Skeleton, Separator, ScrollArea

### Adding New shadcn Components
```bash
cd web-platform
npx shadcn-ui@latest add [component-name]
```

## State Management

### Server Components (Default)
- Use for static content, data fetching
- Cannot use hooks or event handlers
- Can be async and fetch data directly

### Client Components
Add `"use client"` directive when you need:
- `useState`, `useEffect`, `useContext`
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`)

## Props Pattern

```tsx
interface SearchResultsProps {
  results: Issue[];
  isLoading?: boolean;
  onIssueSelect?: (issue: Issue) => void;
  className?: string;
}

export function SearchResults({ 
  results, 
  isLoading = false,
  onIssueSelect,
  className 
}: SearchResultsProps) {
  // ...
}
```

## Common Patterns

### Loading States
```tsx
import { Skeleton } from "@/components/ui/skeleton";

{isLoading ? (
  <Skeleton className="h-24 w-full" />
) : (
  <ActualContent />
)}
```

### Error Boundaries
```tsx
// In page.tsx or layout.tsx
import { ErrorBoundary } from "@/components/error-boundary";

<ErrorBoundary fallback={<ErrorMessage />}>
  <Component />
</ErrorBoundary>
```

### API Calls from Client
```tsx
const fetchData = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};
```

## Checklist

- [ ] Component uses TypeScript with proper interfaces
- [ ] Uses shadcn/ui components where applicable  
- [ ] Follows mobile-first responsive design
- [ ] Handles loading and error states
- [ ] Uses CSS variables from design system
- [ ] Props have sensible defaults
- [ ] Component is exported correctly
