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


