# AI Rules for PromptBear

PromptBear is a Next.js 14-based prompt management platform that integrates Firebase, TipTap rich text editor, ReactFlow flowchart editor, and supports Chrome extension integration.

## Project Architecture

### Frontend Architecture
- **Next.js 14 App Router** - Main application framework
- **Dual Authentication System** - NextAuth.js (frontend pages) + Custom JWT (API routes)
- **State Management** - Zustand stores with separation of concerns: `auth/`, `prompt/`, `sidebar/`, `loading/`
- **UI Components** - Radix UI + Tailwind CSS + shadcn/ui
- **Rich Text Editing** - TipTap editor with custom form elements support
- **Flow Chart Editing** - ReactFlow drag-and-drop node editor

### Backend Architecture  
- **API Routes** - Unified `/api/v1/` namespace
- **Database** - Firebase/Firestore dual SDK architecture (frontend + Admin)
- **File Structure** - `src/api/` (client-side) + `src/app/api/` (route handlers)
- **Middleware** - Unified JWT authentication and CORS handling

## Key Development Patterns

### 1. Dual Firebase SDK Pattern
```typescript
// Frontend: src/lib/firebase.ts - Client SDK
export const db = getFirestore(app);
export const auth = getAuth(app);

// Backend: src/server/db/firebase.ts - Admin SDK  
export const adminDb = getFirestore(adminApp);
```

### 2. Unified Prompt Ordering System
- Uses `seqNo` field for ordering
- Implements Lazy Migration mechanism for legacy data
- Supports optimized insertion positioning (affects minimal documents)
- Key functions: `src/server/utils/promptUtils.ts`

### 3. Type-Safe API Design
- Shared type definitions in `src/shared/types/`
- Unified `PromptData` interface
- Standardized API response formats

### 4. Multi-Node Type Flow Editor
- Customizable nodes: `TextInputNode`, `AiPromptNode`, `FileUploadNode`, `CustomPromptNode`
- Local storage for flow chart state
- Support for dynamic node creation and position calculation

## Development Workflow

### Build and Run Commands
```bash
npm run dev    # Development server
npm run build  # Build application
npm run lint   # Code linting
```

### Authentication Flow
1. Frontend pages use NextAuth.js (`/login`, `/sign-up`)
2. API routes use custom JWT (`src/lib/auth.ts`)
3. Middleware handles unified authentication (`src/middleware.ts`)

### Folder Structure Conventions
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable UI components
- `src/stores/` - Zustand state management (separated by functionality)
- `src/lib/` - Client-side utilities
- `src/server/` - Server-side logic
- `src/shared/` - Shared frontend/backend code

## Project-Specific Best Practices

### Firebase Operations
- Use `performLazyMigration()` for data migration
- Implement `calculateInsertStrategy()` for optimized insertions
- Transaction operations use `adminDb.runTransaction()`

### Rich Text Editor
- Custom TipTap extensions support form elements
- Use `data-type="formtext"` attributes for dynamic fields
- Implement HTML parsing and sanitization mechanisms

### State Management
- Independent Zustand store for each functional domain
- Use TypeScript strict type checking
- Check `typeof window` before localStorage access

### API Design
- Unified use of `x-user-id` header for user information
- CORS configuration centralized in middleware
- Error handling includes detailed Firebase error messages

### Performance Considerations
- ReactFlow components use `useMemo` for node type optimization
- Large file chunked reading to avoid memory overflow
- Use `useCallback` for event handler optimization

## Integration Points

### Chrome Extension
- Support shortcut-triggered prompt insertion
- Integration with `PromptDialog` component
- Use `usePromptStore` for dialog state management

### File Upload
- Support text file content reading
- Integration with ReactFlow node system
- Use `FileUploadNode` for file operations

## CODING PRACTICES

### Guidelines for SUPPORT_LEVEL

#### SUPPORT_EXPERT

- Favor elegant, maintainable solutions over verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.

### Guidelines for VERSION_CONTROL

#### GIT

- Use conventional commits to create meaningful commit messages
- Use feature branches with descriptive names following established branch naming conventions
- Write meaningful commit messages that explain why changes were made, not just what
- Keep commits focused on single logical changes to facilitate code review and bisection
- Use interactive rebase to clean up history before merging feature branches
- Leverage git hooks to enforce code quality checks before commits and pushes

#### GITHUB

- Use pull request templates to standardize information provided for code reviews
- Implement branch protection rules for main branches to enforce quality checks
- Configure required status checks to prevent merging code that fails tests or linting
- Use GitHub Actions for CI/CD workflows to automate testing and deployment
- Implement CODEOWNERS files to automatically assign reviewers based on code paths
- Use GitHub Projects for tracking work items and connecting them to code changes

## FRONTEND

### Guidelines for REACT

#### NEXT_JS

- Use App Router and Server Components for improved performance and SEO
- Implement route handlers for API endpoints instead of the pages/api directory
- Use server actions for form handling and data mutations from Server Components
- Leverage Next.js Image component with proper sizing for core web vitals optimization
- Implement the Metadata API for dynamic SEO optimization
- Use React Server Components for data fetching operations to reduce client-side JavaScript
- Implement Streaming and Suspense for improved loading states
- Use the new Link component without requiring a child <a> tag
- Leverage parallel routes for complex layouts and parallel data fetching
- Implement intercepting routes for modal patterns and nested UIs

#### ZUSTAND

- Create separate stores for distinct state domains instead of one large store
- Use immer middleware for complex state updates to maintain immutability when dealing with nested data
- Implement selectors to derive state and prevent unnecessary re-renders
- Leverage the persist middleware for automatic state persistence in localStorage or other storage
- Use TypeScript with strict typing for store definitions to catch errors at compile time
- Prefer shallow equality checks with useShallow for performance optimization in component re-renders
- Combine stores using composition for sharing logic between stores
- Implement subscriptions to react to state changes outside of React components
- Use devtools middleware for Redux DevTools integration in development
- Create custom hooks to encapsulate store access and related business logic

## DATABASE

### Guidelines for NOSQL

#### FIREBASE

- Use security rules to enforce access control at the database level for user roles
- Implement shallow queries to minimize bandwidth usage
- Use offline capabilities for better user experience in mobile apps
- Prefer batch operations for multiple document updates
- Use transactions for atomic operations that affect multiple documents
- Implement proper error handling for Firebase operations
- Use subcollections for hierarchical data structures when appropriate



---
## React & Next.js Development Guidelines & Performance Best Practices

### **React & Next.js Development Guidelines & Performance Best Practices**

**Document Version:** 1.0
**Last Updated:** 2023-10-27

#### **Introduction**
This guide establishes a unified set of development standards for our React and Next.js projects. Its core objective is to enhance application **performance**, **maintainability**, **scalability**, and **Developer Experience (DX)**. All team members are required to understand and adhere to these guidelines to ensure consistent code quality.

#### **Core Development Principles**
Before diving into specific rules, internalize these three foundational principles:
1.  **Performance as a Feature:** Treat performance as a core feature, not an afterthought.
2.  **State Colocation & Minimization:** Keep state as close as possible to where it's needed. Only lift it up when it must be shared.
3.  **Separation of Concerns:** Clearly separate UI rendering, business logic, and state management to improve testability, reusability, and maintainability.

---

### **Chapter 1: Component Performance & Render Optimization**

Unnecessary re-renders are the primary cause of performance issues and must be strictly controlled.

#### **1.1. Memoize Components with `React.memo`**
Components that are pure, have stable props, or are expensive to render **should** be wrapped in `React.memo` to prevent unnecessary re-renders.

*   **Use Cases:** List items, icons, and any component that renders purely based on its props.
*   **Note:** `React.memo` performs a shallow comparison by default. If props are objects or arrays, ensure their references are stable (see 1.2, 1.3, 1.4).

#### **1.2. Stabilize Function References with `useCallback`**
When passing a function as a prop to a memoized component or as a dependency to `useEffect`, it **must** be wrapped in `useCallback` to maintain a stable reference.

```javascript
// Good: The reference to `handleClick` is stable as long as its dependencies don't change,
// preventing unnecessary re-renders of MemoizedButton.
const handleClick = React.useCallback(() => {
  // ...business logic
}, [dependencies]);

return <MemoizedButton onClick={handleClick} />;
```

#### **1.3. Memoize Expensive Computations with `useMemo`**
For computationally expensive operations during render (e.g., filtering or sorting large arrays), you **should** use `useMemo` to cache the result.

```javascript
// Good: `visibleItems` is only recomputed if `items` or `filter` changes.
const visibleItems = React.useMemo(() => {
  return items.filter(item => item.name.includes(filter));
}, [items, filter]);
```

#### **1.4. Avoid Creating New Instances in the Render Phase**
**Do not** define objects, arrays, or functions directly in the render body and pass them as props. This creates new instances on every render and defeats `memo` optimizations.

```javascript
// Bad: The `style` object is new on every render.
<MyComponent style={{ color: 'red' }} />

// Good: Define the object outside the component or use `useMemo`.
const redStyle = { color: 'red' };
<MyComponent style={redStyle} />
```

---

### **Chapter 2: State Management Strategy**

#### **2.1. The Principle of State Hoisting**
Place state in the lowest common ancestor in the component tree that is shared among all components that need it.

#### **2.2. Trade-offs between Prop Drilling and the Context API**
When state hoisting leads to prop drilling through more than 2-3 levels of unrelated components, you **should** consider using the React Context API.

*   **Use Cases:** For "global" data that doesn't change frequently, such as theme, user authentication status, or language settings.
*   **Performance Warning:** **Avoid** placing frequently updated state (e.g., form inputs) in a Context. Updates to the Context will cause all consuming components to re-render, leading to significant performance issues.

#### **2.3. When to Use a State Management Library**
When application state becomes complex, or when multiple components need to share and update state frequently and in a granular way, you **should** adopt a dedicated state management library.

*   **Recommended Options:**
    *   **Zustand / Jotai:** Lightweight and unopinionated with a simple API. Excellent for most small to medium-sized projects.
    *   **Redux (with Redux Toolkit):** Mature, robust, and provides a predictable state management pattern. Ideal for large, complex applications.

---

### **Chapter 3: Data Fetching**

#### **3.1. Adopt `TanStack Query` (React Query) or `SWR`**
For all data fetching related to server state, it is **highly recommended** to use `TanStack Query` or `SWR`. **Avoid** manual fetching inside `useEffect`.

*   **Core Advantages:**
    *   **Automation:** Built-in caching, background refetching, request deduplication, and error retries.
    *   **Simplified State:** Reduces complex request states (loading, error, data, fetching...) into simple, easy-to-use hooks.
    *   **Enhanced UX:** Provides out-of-the-box `stale-while-revalidate` logic, showing users cached data instantly while refetching in the background.

---

### **Chapter 4: Core Next.js Practices**

#### **4.1. Default to React Server Components (RSC)**
In the Next.js App Router, you **must** prioritize the use of Server Components.

*   **The Rule:**
    *   By default, all components are **Server Components** (no directive needed). They render on the server and do not ship JavaScript to the client.
    *   Only when a component needs interactivity (e.g., `useState`, `useEffect`, `onClick`), convert it to a **Client Component** by adding the `"use client"` directive at the top of the file.

#### **4.2. Use `next/dynamic` for Code Splitting**
For large components or UI elements that are only rendered conditionally, you **should** use `next/dynamic` for lazy loading to reduce the initial JavaScript bundle size.

```javascript
import dynamic from 'next/dynamic';

const HeavyChartComponent = dynamic(() => import('@/components/HeavyChart'), {
  ssr: false, // If the component only works on the client-side
  loading: () => <p>Loading...</p>
});
```

#### **4.3. Use `<Image>` for Image Optimization**
All images in the project **must** be rendered using the Next.js `<Image>` component. This provides automatic image optimization, lazy loading, and prevents Cumulative Layout Shift (CLS).

---

### **Chapter 5: Architecture & Component Design Patterns**

#### **5.1. Encapsulate Logic with Custom Hooks**
Any non-rendering logic that is shared across components (e.g., API calls, form handling, event listeners) **must** be extracted into a custom hook. This drastically improves logic reusability, testability, and component clarity.

#### **5.2. Favor Composition over Configuration**
**Prefer** using the `children` prop to build flexible components instead of configuring them with a large number of props.

```javascript
// Good: A flexible Card component built with composition
<Card>
  <Card.Header>...</Card.Header>
  <Card.Body>...</Card.Body>
</Card>
```

---

### **Chapter 6: Project Quality & Developer Experience (DX)**

#### **6.1. Enforce TypeScript**
All new projects **must** use TypeScript. It provides type safety, better autocompletion, and safer refactoring, which is critical for the long-term health of any sizable project.

#### **6.2. Configure Path Aliases**
Configure path aliases in `tsconfig.json` to **forbid** deep relative imports (`../../../`).

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/lib/*": ["src/lib/*"]
    }
  }
}
```

#### **6.3. Conduct Regular Bundle Analysis**
You **should** periodically use `@next/bundle-analyzer` to inspect the application's bundle size, identifying and optimizing any oversized dependencies.

---

### **Chapter 7: Enforcement & Tooling**

1.  **Code Review:** This guide serves as the core checklist for code reviews. Reviewers are responsible for identifying and flagging code that violates these principles.
2.  **ESLint & Prettier:** The project is configured with strict ESLint rules (especially `eslint-plugin-react-hooks`) and Prettier. All code **must** pass linting and formatting checks before being merged.
3.  **Performance Analysis Tools:**
    *   **React DevTools Profiler:** When encountering performance issues during development, use the Profiler to analyze component render times and counts.
    *   **Lighthouse:** Periodically run Lighthouse audits on critical pages to monitor Core Web Vitals.