# 🎯 Senior Frontend Engineer — Mock Interview

> **Purpose:** A realistic senior-level mock interview for a frontend engineer with strong React, TypeScript, JavaScript, testing, performance, architecture, and production experience.
>
> **How to use:** Answer each question aloud before opening the model answer. Aim for **60–120 seconds** for conceptual questions and **2–4 minutes** for architecture/scenario questions.

---

## 🧭 Interview Format

| Round | Focus | Approx. Time |
|---|---|---:|
| 1 | Introduction & Experience | 5 min |
| 2 | JavaScript & TypeScript | 10 min |
| 3 | React & State Management | 15 min |
| 4 | Frontend Architecture | 15 min |
| 5 | Performance | 10 min |
| 6 | Testing & Quality | 10 min |
| 7 | Security & Accessibility | 10 min |
| 8 | Production Scenarios | 15 min |
| 9 | Leadership & Behavioral | 10 min |

### Senior-level answering framework

For most questions, structure your answer as:

**Definition → Why → Example → Production concern → Trade-off**

Don't only explain *what* a technology does. Explain **why you would choose it and what can go wrong in production**.

---

# 1. 🎤 Introduction & Experience

## Q1. Tell me about yourself.

### What the interviewer is testing
- Communication
- Career progression
- Technical depth
- Whether your experience matches the role

### Strong answer structure

> "I'm a Senior Frontend Engineer with 8+ years of experience building enterprise-scale web applications. My primary focus is React and TypeScript, with experience across state management, API integration, performance optimization, testing, accessibility, and frontend architecture.
>
> I've worked on data-intensive and enterprise applications where frontend performance, maintainability, and reliability were important. I've worked with technologies such as React, Redux Toolkit, TanStack Query, TypeScript, Vite/Webpack, AG Grid, Playwright, and cloud/containerized environments.
>
> At a senior level, I focus not only on implementing features but also on architecture, identifying performance bottlenecks, improving developer experience, establishing testing strategies, and making technical decisions that scale with the product and team."

### Follow-up
**"What is the most technically challenging frontend problem you solved?"**

A strong answer should cover:

**Problem → Investigation → Options → Decision → Implementation → Result**

---

## Q2. What makes someone a senior frontend engineer?

### Expected answer

A senior engineer should be able to:

- Design maintainable frontend architecture
- Understand browser and React internals
- Make technology decisions based on trade-offs
- Debug production problems systematically
- Think about performance before problems become incidents
- Build reliable testing strategies
- Consider security and accessibility
- Mentor engineers and review code
- Communicate technical decisions clearly
- Understand the impact of frontend decisions on APIs, infrastructure, and users

> **Senior ≠ knowing the most APIs. Senior = making good technical decisions under real-world constraints.**

---

# 2. 🟨 JavaScript & TypeScript

## Q3. Explain the JavaScript event loop.

### Answer

JavaScript execution is primarily single-threaded. The **event loop** coordinates synchronous code, asynchronous callbacks, microtasks, and browser tasks.

Typical flow:

```text
Call Stack
   ↓
Synchronous JavaScript
   ↓
Microtask Queue
   ↓
Task/Macrotask Queue
   ↓
Browser Rendering
```

Promises and `queueMicrotask()` use the **microtask queue**. APIs such as timers and many browser events schedule tasks.

Example:

```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");
```

Output:

```text
A
D
C
B
```

### Senior follow-up

**Why can excessive microtasks affect rendering?**

Because the browser generally drains microtasks before moving on to rendering or the next task. A large chain of microtasks can therefore delay the browser from painting a responsive frame.

---

## Q4. What is the difference between `==` and `===`?

### Answer

- `==` performs type coercion before comparison.
- `===` compares both type and value without implicit coercion.

```javascript
0 == false;   // true
0 === false;  // false

"1" == 1;     // true
"1" === 1;    // false
```

### Production recommendation

Prefer `===` because explicit comparisons are easier to reason about and avoid unexpected coercion.

---

## Q5. Explain closures with a real frontend example.

### Answer

A **closure** occurs when a function retains access to variables from its lexical scope even after the outer function has finished executing.

```javascript
function createCounter() {
  let count = 0;

  return () => ++count;
}

const counter = createCounter();

counter(); // 1
counter(); // 2
```

### React example

Closures are important in:

- Event handlers
- Effects
- Timers
- Subscriptions
- Async callbacks

A common production problem is a **stale closure**, where a callback captures an older state value.

---

## Q6. `any` vs `unknown` in TypeScript?

### Answer

`any` disables type checking for that value.

`unknown` means:

> "I don't know the type yet, so you must prove what it is before using it."

```typescript
const value: unknown = getApiResponse();

if (typeof value === "string") {
  console.log(value.toUpperCase());
}
```

Prefer `unknown` for untrusted boundaries such as API responses, parsed JSON, and external libraries.

---

## Q7. What is a discriminated union?

### Answer

A discriminated union represents multiple related types using a common literal property.

```typescript
type RequestState =
  | { status: "loading" }
  | { status: "success"; data: User[] }
  | { status: "error"; error: string };
```

Now TypeScript can narrow safely:

```typescript
function render(state: RequestState) {
  if (state.status === "success") {
    return state.data;
  }

  if (state.status === "error") {
    return state.error;
  }

  return "Loading...";
}
```

This is especially useful for modeling UI states because impossible combinations become harder to represent.

---

# 3. ⚛️ React

## Q8. Explain React rendering.

### Answer

A simplified lifecycle is:

```text
State / Props change
       ↓
Render phase
       ↓
React creates the next element tree
       ↓
Reconciliation
       ↓
Commit phase
       ↓
DOM updates
       ↓
Browser paint
```

The important distinction is:

- **Render:** React determines what the UI should look like.
- **Commit:** React applies required changes to the DOM.

A component rendering does **not** automatically mean the browser's entire DOM is recreated.

---

## Q9. When would you use `useMemo` and `useCallback`?

### `useMemo`

Caches a calculated value.

```typescript
const filteredUsers = useMemo(
  () => users.filter(user => user.active),
  [users]
);
```

### `useCallback`

Caches a function reference.

```typescript
const handleSelect = useCallback(
  (id: string) => selectUser(id),
  [selectUser]
);
```

### Senior answer

Don't add them everywhere.

Use them when:

- A calculation is genuinely expensive
- Referential equality matters
- A memoized child depends on stable props
- A stable dependency is required for an effect or subscription

> Memoization itself has a cost. Measure before optimizing.

---

## Q10. `useTransition` vs `useDeferredValue`

### `useTransition`

You control **which state update** is non-urgent.

```typescript
const [isPending, startTransition] = useTransition();

function handleSearch(value: string) {
  setInput(value);

  startTransition(() => {
    setSearch(value);
  });
}
```

### `useDeferredValue`

You already have a value and want a lower-priority version of it.

```typescript
const deferredSearch = useDeferredValue(search);
```

### Easy interview rule

> **Transition = defer an update.**  
> **Deferred value = defer using a value.**

---

## Q11. When should you use `useEffect`?

### Answer

Use an Effect to synchronize React with an **external system**:

- API/subscription lifecycle
- WebSocket
- Browser event listener
- Timer
- Third-party library
- DOM API

Avoid Effects for simple derived state.

Bad:

```typescript
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Better:

```typescript
const fullName = `${firstName} ${lastName}`;
```

### Senior point

An Effect should generally answer:

> **"What external system am I synchronizing with?"**

---

## Q12. Why are React keys important?

### Answer

Keys give React a stable identity for list elements.

```tsx
users.map(user => (
  <UserRow key={user.id} user={user} />
))
```

Using array indexes can cause incorrect component reuse when items are inserted, removed, or reordered.

This can produce bugs such as:

- Input values appearing under the wrong row
- Incorrect local component state
- Unnecessary DOM work

---

# 4. 🗃️ State Management

## Q13. Redux Toolkit vs TanStack Query — when would you use each?

### Answer

**Redux Toolkit** is useful for client/application state:

- Complex UI state
- Cross-feature state
- Client-side workflows
- Global application state

**TanStack Query** is designed for server state:

- Fetching
- Caching
- Deduplication
- Refetching
- Retry
- Mutation lifecycle
- Stale data management

### Strong senior answer

> "I avoid putting all server data into Redux just because Redux is already available. Server state has different lifecycle requirements, so I prefer a server-state library such as TanStack Query when appropriate."

---

## Q14. Explain optimistic updates.

### Answer

An optimistic update changes the UI immediately before the server confirms the operation.

```text
User action
   ↓
Update UI immediately
   ↓
Send API request
   ↓
Success → keep optimistic state
Failure → rollback previous state
```

Typical TanStack Query flow:

```typescript
onMutate
  → cancelQueries
  → snapshot previous data
  → update cache

onError
  → restore previous data

onSettled
  → invalidate/refetch
```

### Production concerns

Consider:

- Rollback
- Duplicate mutations
- Concurrent updates
- Server-generated values
- Error feedback
- Cache invalidation

---

# 5. 🏗️ Frontend Architecture

## Q15. How would you structure a large React application?

### Strong answer

I would organize around **business/domain boundaries**, rather than putting everything into folders such as `components`, `hooks`, and `utils`.

Example:

```text
src/
├── app/
│   ├── store/
│   ├── router/
│   └── providers/
│
├── features/
│   ├── authentication/
│   ├── users/
│   ├── portfolio/
│   └── reporting/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utilities/
│   └── types/
│
└── infrastructure/
    ├── api/
    ├── analytics/
    └── configuration/
```

The goal is:

- Clear ownership
- Low coupling
- High cohesion
- Testability
- Independent feature evolution

---

## Q16. When would you choose Micro Frontends?

### Answer

Micro Frontends make sense when independently owned teams need to develop and deploy parts of a large frontend independently.

They can help with:

- Team autonomy
- Independent deployments
- Large organizational boundaries
- Gradual migration of legacy applications

But they also introduce complexity:

- Dependency duplication
- Shared state
- Routing
- Authentication
- Version compatibility
- Cross-application communication
- Observability
- Deployment complexity

### Senior answer

> "I wouldn't introduce Micro Frontends simply because the application is large. I'd introduce them when organizational and deployment boundaries justify the additional technical complexity."

---

## Q17. Explain Module Federation.

### Answer

Module Federation allows separately built applications to consume modules from another application at runtime.

Conceptually:

```text
Host Application
       ↓
Remote Application
       ↓
Remote Component / Module
```

It can enable independently deployed frontend modules.

### Production concerns

Think about:

- Shared dependency versions
- React singleton configuration
- Remote availability
- Runtime failures
- Version compatibility
- Error boundaries
- Caching
- Rollback strategy

---

# 6. ⚡ Performance

## Q18. A React page became slow after adding a large data grid. How would you debug it?

### Strong answer

I would avoid immediately adding `useMemo` everywhere.

First:

```text
Reproduce
   ↓
Measure
   ↓
Profile
   ↓
Find bottleneck
   ↓
Optimize
   ↓
Measure again
```

I would investigate:

1. React Profiler
2. Browser Performance panel
3. Network waterfall
4. JavaScript execution time
5. Rendering/painting
6. Memory usage
7. Number of DOM nodes
8. Grid configuration
9. Unnecessary React renders
10. Large synchronous calculations

Potential solutions:

- Virtualization
- Server-side pagination
- Lazy loading
- Memoization where justified
- Debouncing
- Request cancellation
- Web Workers for CPU-heavy work
- Smaller payloads
- Code splitting

---

## Q19. Explain Core Web Vitals.

### Answer

Important user-facing performance metrics include:

- **LCP — Largest Contentful Paint:** how quickly the main content becomes visible.
- **INP — Interaction to Next Paint:** how responsive the page is to user interactions.
- **CLS — Cumulative Layout Shift:** how much visible content unexpectedly moves.

### Senior approach

Don't treat Lighthouse as the whole story.

Use:

```text
Lab data
+
Real User Monitoring (RUM)
+
Browser Performance
+
Application telemetry
```

to understand production performance.

---

## Q20. How would you improve a slow search experience?

### Answer

I would separate the **urgent interaction** from the **expensive work**.

Possible strategy:

```text
User types
   ↓
Update input immediately
   ↓
Debounce API request
   ↓
Cancel obsolete request
   ↓
Cache previous results
   ↓
Render large result set efficiently
```

Depending on the problem, I might use:

- Debouncing
- `useDeferredValue`
- `useTransition`
- TanStack Query caching
- `AbortController`
- Virtualized lists
- Server-side filtering

---

# 7. 🧪 Testing

## Q21. Unit vs Integration vs E2E testing?

| Type | Tests | Example |
|---|---|---|
| Unit | Small isolated logic | Utility function |
| Integration | Multiple units working together | Form + validation + API mock |
| E2E | Complete user workflow | Login → search → submit |

### Senior principle

Don't try to test everything with E2E tests.

A healthy test pyramid usually has:

```text
       E2E
      /   \
 Integration
   /       \
    Unit
```

Use the cheapest test that gives sufficient confidence.

---

## Q22. How would you test a React application?

### Unit

**Jest/Vitest**

For pure logic:

```typescript
expect(calculateTotal(items)).toBe(100);
```

### Component/Integration

**React Testing Library**

Test behavior:

```typescript
render(<LoginForm />);

await user.type(screen.getByLabelText(/email/i), "user@test.com");
await user.click(screen.getByRole("button", { name: /login/i }));
```

### E2E

**Playwright**

```typescript
await page.goto("/login");

await page.getByLabel("Email").fill("user@test.com");
await page.getByRole("button", { name: "Login" }).click();

await expect(page).toHaveURL(/dashboard/);
```

### Senior point

Prefer testing **user-visible behavior** over implementation details.

---

## Q23. A Playwright test is flaky in CI but passes locally. How do you debug it?

### Answer

I would investigate:

1. Trace viewer
2. Screenshots/video
3. Console logs
4. Network failures
5. Race conditions
6. Arbitrary sleeps
7. Test data collisions
8. Environment differences
9. Authentication/session state
10. Parallel execution

Avoid:

```typescript
await page.waitForTimeout(5000);
```

Prefer waiting for an actual condition:

```typescript
await expect(page.getByRole("heading", {
  name: "Dashboard"
})).toBeVisible();
```

### Senior principle

> A flaky test is usually a synchronization or isolation problem, not a problem that should be solved with a bigger timeout.

---

# 8. 🔐 Security

## Q24. How do you protect a React application against XSS?

### Answer

Key practices:

- Avoid injecting untrusted HTML
- Escape/sanitize user-controlled content
- Avoid unsafe `dangerouslySetInnerHTML`
- Use a strong Content Security Policy
- Validate data at trust boundaries
- Keep dependencies updated
- Avoid putting secrets in frontend code

Important:

> Anything shipped to the browser should be considered accessible to the user. Frontend environment variables are not secret storage.

---

## Q25. JWT vs HttpOnly cookie?

### Answer

A JWT is a token format; an HttpOnly cookie is a browser storage/transport mechanism.

For browser authentication, HttpOnly secure cookies can reduce exposure to JavaScript-based token theft because JavaScript cannot directly read an HttpOnly cookie.

Important cookie settings include:

```text
HttpOnly
Secure
SameSite
```

The final design depends on the authentication architecture and CSRF protections.

---

# 9. ♿ Accessibility

## Q26. How do you make a React application accessible?

### Answer

Start with semantic HTML:

```html
<button>Save</button>
```

instead of:

```html
<div onClick={save}>Save</div>
```

Key areas:

- Keyboard navigation
- Focus management
- Semantic HTML
- Labels for form controls
- Accessible names
- Screen-reader announcements
- Color contrast
- ARIA only when necessary

Example:

```html
<label for="email">Email</label>
<input id="email" type="email" />
```

### Senior point

Accessibility should be part of component design, testing, and definition of done—not a final cleanup step.

---

# 10. 🚨 Production Scenarios

## Q27. Production page is suddenly taking 8 seconds to load. What do you do?

### Strong answer

First, determine whether the problem is:

```text
Network
JavaScript
Rendering
Backend/API
Third-party scripts
```

Then compare:

- Current vs previous deployment
- RUM metrics
- Browser/network timing
- Bundle size
- API latency
- Error rate
- CDN/cache behavior

If caused by a recent release:

```text
Detect
 ↓
Mitigate / rollback
 ↓
Investigate
 ↓
Fix
 ↓
Verify
 ↓
Prevent recurrence
```

A senior engineer prioritizes **user impact and mitigation first**, then root-cause analysis.

---

## Q28. API response sometimes arrives out of order. How would you solve it?

Example:

```text
Request A → search="rea"
Request B → search="react"
```

If A finishes after B, stale data can overwrite newer results.

Solutions:

### Abort previous request

```typescript
const controller = new AbortController();

fetch(url, {
  signal: controller.signal
});

controller.abort();
```

### Request identity

Track the latest request and ignore stale responses.

### Server-state library

Use a library such as TanStack Query when its request/cache lifecycle fits the problem.

---

## Q29. Users report that the UI freezes when processing a large dataset. What would you do?

### Answer

Determine whether the main thread is blocked by CPU-heavy JavaScript.

If yes:

- Reduce the amount of work
- Process incrementally
- Virtualize UI
- Move CPU-heavy work to a Web Worker
- Avoid unnecessary serialization
- Reduce data transferred to the client

Conceptually:

```text
Main Thread
   │
   ├── UI
   │
   └── Worker
          ↓
      Heavy computation
```

A Web Worker is useful for CPU-heavy work that doesn't need direct DOM access.

---

## Q30. SSE vs WebSocket — which would you choose?

### SSE

Server → client streaming over HTTP.

Good for:

- Notifications
- Live dashboards
- Progress updates
- Server-generated events

### WebSocket

Full-duplex communication.

Good for:

- Chat
- Collaborative editing
- Interactive real-time systems
- Client ↔ server messaging

### Interview rule

> If communication is primarily **server → client**, SSE can be simpler. If you need **two-way real-time communication**, WebSocket is usually more appropriate.

---

# 11. 🧠 Architecture Challenge

## Q31. Design a real-time enterprise dashboard.

### Requirements

- React frontend
- Thousands of users
- Large datasets
- Live updates
- Role-based access
- Multiple teams
- Auditability
- High availability

### Strong architecture

```text
                    ┌───────────────┐
                    │ React Client  │
                    └───────┬───────┘
                            │
                 ┌──────────┴──────────┐
                 │ API / Gateway       │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
        REST / Query                 SSE / WS
              │                           │
        Backend Services             Event Layer
              │                           │
              └─────────────┬─────────────┘
                            │
                      Event Broker
```

### Frontend considerations

- TanStack Query for server state
- Redux Toolkit for appropriate client state
- Virtualized tables
- Pagination/server-side filtering
- Error boundaries
- Loading/error/empty states
- Reconnection handling
- Duplicate event handling
- Authorization checks
- Observability
- Performance monitoring

### Senior follow-up

**"What happens when the SSE connection drops?"**

A good answer includes:

- Reconnect strategy
- Backoff
- Connection state
- Event IDs/cursors where supported
- Duplicate-event handling
- Resynchronization from the API
- Authentication expiry handling

---

# 12. 👥 Leadership & Behavioral

## Q32. Tell me about a technical disagreement with another engineer.

### Good structure

Use:

**Situation → Technical disagreement → Evidence → Decision → Outcome**

Avoid blaming the other engineer.

A senior answer should demonstrate:

- Listening
- Technical reasoning
- Data/evidence
- Trade-off analysis
- Team alignment
- Willingness to change your mind

---

## Q33. How do you handle code review?

### Answer

I review for:

1. Correctness
2. Maintainability
3. Security
4. Performance
5. Accessibility
6. Testing
7. Error handling
8. Architecture consistency

I distinguish between:

- **Blocking issues**
- **Suggestions**
- **Personal preferences**

The goal is to improve the code, not win an argument.

---

## Q34. A junior engineer introduces a bug in production. What do you do?

### Strong answer

First, focus on restoring the service and understanding the impact.

Then:

- Avoid blame
- Investigate the root cause
- Fix the issue
- Add appropriate test coverage
- Improve review/process/tooling if necessary
- Share the learning with the team

> A strong engineering culture fixes systems, not just individuals.

---

# 13. 🔥 Rapid-Fire Senior Questions

Answer each in **30–45 seconds**.

### Q35. `useRef` vs `useState`?

`useState` stores data that affects rendering. `useRef` stores mutable data that persists across renders without triggering a render when changed.

### Q36. Context vs Redux?

Context is primarily dependency/value propagation. Redux is a structured state-management solution with predictable updates, middleware, tooling, and scalable patterns.

### Q37. `useEffect` vs `useLayoutEffect`?

`useEffect` runs after the browser has had an opportunity to paint. `useLayoutEffect` runs after DOM mutation but before paint and is mainly useful for DOM measurement or visual synchronization.

### Q38. Debounce vs throttle?

**Debounce:** run after activity stops.

**Throttle:** run at most once within a defined interval.

### Q39. CSR vs SSR?

**CSR:** browser builds the UI primarily after JavaScript loads.

**SSR:** server generates HTML for the initial response, after which the client hydrates and becomes interactive.

### Q40. What causes hydration mismatch?

The server-rendered HTML differs from what React expects on the client.

Common causes:

- `Date.now()`
- Random values
- Browser-only APIs during render
- Different data between server and client
- Invalid HTML nesting
- Environment-dependent rendering

### Q41. What is code splitting?

Breaking the JavaScript bundle into smaller chunks that can be loaded when needed.

### Q42. What is tree shaking?

Removing unused statically analyzable code during bundling.

### Q43. What is virtualization?

Rendering only the visible portion of a large list/table instead of creating DOM nodes for every item.

### Q44. What is an Error Boundary?

A React mechanism for catching rendering errors in a component subtree and displaying fallback UI instead of allowing the entire UI to fail.

---

# 14. 🧩 Final System-Design Challenge

## Q45. Design a large investment research application.

### Requirements

You are building a platform where researchers can:

- Search large datasets
- Create complex queries
- Display millions of rows
- Run long-running jobs
- Monitor job progress
- Export results
- Collaborate across teams
- Receive real-time status updates

### Interviewer asks

1. How would you structure the frontend?
2. What belongs in Redux?
3. What belongs in TanStack Query?
4. How would you render millions of rows?
5. How would you handle long-running jobs?
6. How would you cancel a job?
7. How would you stream job progress?
8. How would you handle reconnects?
9. How would you secure the application?
10. How would you test it?
11. How would you monitor frontend performance?
12. What would you do if the page became slow after a new release?

### Strong solution themes

```text
React + TypeScript
        │
        ├── Feature-based architecture
        │
        ├── Redux Toolkit
        │      └── Client/application state
        │
        ├── TanStack Query
        │      └── Server state/cache
        │
        ├── Virtualized data grid
        │
        ├── REST/HTTP APIs
        │
        ├── SSE/WebSocket for live status
        │
        ├── Web Workers for CPU-heavy processing
        │
        ├── Playwright + integration/unit tests
        │
        └── RUM + logs + metrics + tracing
```

### Senior-level trade-offs to mention

Don't only describe the architecture.

Discuss:

- Client vs server processing
- Pagination vs virtualization
- SSE vs WebSocket
- Redux vs server-state cache
- Optimistic vs pessimistic updates
- Microfrontend vs modular monolith
- Browser memory limits
- API payload size
- Failure and retry behavior
- Security boundaries
- Observability

---

# 🏆 Self-Evaluation Scorecard

Score yourself from **1–5**.

| Area | Score |
|---|---:|
| Communication | /5 |
| JavaScript | /5 |
| TypeScript | /5 |
| React | /5 |
| State Management | /5 |
| Architecture | /5 |
| Performance | /5 |
| Testing | /5 |
| Security | /5 |
| Accessibility | /5 |
| Production Debugging | /5 |
| System Design | /5 |
| Leadership | /5 |

### Score interpretation

**55–65:** Strong senior-level readiness

**45–54:** Good senior foundation; strengthen weak areas

**35–44:** Intermediate-to-senior transition; focus on architecture and production scenarios

**Below 35:** Strengthen fundamentals before focusing heavily on system design

---

# 🎯 Final Senior Interview Checklist

Before the interview, make sure you can confidently explain:

- [ ] JavaScript event loop
- [ ] Closures and stale closures
- [ ] Promises and async/await
- [ ] TypeScript generics and narrowing
- [ ] `unknown` vs `any`
- [ ] React rendering and reconciliation
- [ ] React Hooks and Effect lifecycle
- [ ] `useMemo` / `useCallback`
- [ ] `useTransition` / `useDeferredValue`
- [ ] Redux Toolkit architecture
- [ ] TanStack Query and caching
- [ ] Optimistic updates
- [ ] Microfrontends / Module Federation
- [ ] SSR / hydration
- [ ] Core Web Vitals
- [ ] Performance profiling
- [ ] Virtualization
- [ ] Web Workers
- [ ] Unit / integration / E2E testing
- [ ] Playwright CI debugging
- [ ] XSS / CSRF / CSP
- [ ] Authentication and authorization
- [ ] WCAG / accessibility
- [ ] SSE / WebSocket
- [ ] Production incident debugging
- [ ] Frontend system design
- [ ] Technical leadership

> **Golden rule:** For senior interviews, don't stop at **"what is it?"**
>
> Explain **why it exists → when you use it → how it works → what can fail → how you would handle it in production → what trade-off you made.**
