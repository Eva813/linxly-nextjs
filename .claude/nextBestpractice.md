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


  🚫 過度拆分的風險

  - 會造成 prop drilling 問題
  - 增加不必要的 複雜度
  - 降低 開發效率
  - 影響 代碼可讀性