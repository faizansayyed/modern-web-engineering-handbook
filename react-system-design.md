# Senior Frontend Engineer — System Design Interview Guide

> **Target:** Senior Frontend Engineer / Frontend Architect  
> **Experience:** ~9.3 years  
> **Focus:** Production-grade frontend system design, architecture, scalability, performance, reliability, security, accessibility, testing, observability, and enterprise engineering.

This guide goes beyond technologies you have personally used. It covers the system-design areas expected from a senior frontend engineer who can **design, defend, evolve, and operate large frontend systems**.

---

## Table of Contents

1. [System Design Approach](#1-system-design-approach)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Modular Architecture](#3-modular-architecture)
4. [Microfrontends](#4-microfrontends)
5. [Module Federation](#5-module-federation)
6. [State Management](#6-state-management)
7. [Server State & Data Fetching](#7-server-state--data-fetching)
8. [CSR, SSR, SSG, ISR & RSC](#8-csr-ssr-ssg-isr--rsc)
9. [Browser Rendering](#9-browser-rendering)
10. [Performance & Core Web Vitals](#10-performance--core-web-vitals)
11. [Scalability](#11-scalability)
12. [Caching](#12-caching)
13. [API & BFF](#13-api--bff)
14. [Real-Time Systems](#14-real-time-systems)
15. [Large Data & Data Grids](#15-large-data--data-grids)
16. [Security](#16-security)
17. [Authentication & Authorization](#17-authentication--authorization)
18. [Accessibility](#18-accessibility)
19. [Reliability & Resilience](#19-reliability--resilience)
20. [Observability](#20-observability)
21. [Testing](#21-testing)
22. [CI/CD & Deployment](#22-cicd--deployment)
23. [Docker, Kubernetes & Cloud](#23-docker-kubernetes--cloud)
24. [Design Systems](#24-design-systems)
25. [Internationalization](#25-internationalization)
26. [Offline & PWA](#26-offline--pwa)
27. [Feature Flags](#27-feature-flags)
28. [Multi-Tenant Applications](#28-multi-tenant-applications)
29. [Files & Export Systems](#29-files--export-systems)
30. [Search](#30-search)
31. [Long-Running Jobs](#31-long-running-jobs)
32. [Data Consistency](#32-data-consistency)
33. [Advanced Trade-Offs](#33-advanced-trade-offs)
34. [Production Scenarios](#34-production-scenarios)
35. [Full System Design Problems](#35-full-system-design-problems)
36. [Senior Rapid-Fire](#36-senior-rapid-fire)

---

# 1. System Design Approach

## Q1. How do you approach a frontend system-design interview?

### Answer

Do not start by drawing React components.

Use this sequence:

```text
Requirements
    ↓
Scale & constraints
    ↓
High-level architecture
    ↓
Rendering strategy
    ↓
Data/API architecture
    ↓
State management
    ↓
Caching
    ↓
Performance
    ↓
Security
    ↓
Accessibility
    ↓
Reliability
    ↓
Observability
    ↓
Testing
    ↓
Deployment
    ↓
Trade-offs & evolution
```

A senior answer explains **why** each decision was made.

---

## Q2. What requirements should you clarify first?

### Answer

Ask about:

- Users and major workflows
- Public vs authenticated application
- SEO requirements
- Expected traffic and concurrency
- Data volume
- Real-time requirements
- Performance targets
- Accessibility requirements
- Browser/device support
- Security/compliance requirements
- Deployment frequency
- Availability requirements

Example:

> "Before choosing the architecture, I would clarify whether the application is public or internal, whether SEO is important, how much data users will handle, how many concurrent users we expect, and whether teams need independent deployments."

---

## Q3. What non-functional requirements matter most in frontend system design?

### Answer

The major ones are:

```text
Performance
Scalability
Availability
Reliability
Security
Accessibility
SEO
Maintainability
Observability
Testability
Cost
Internationalization
Compliance
```

A senior engineer should make these explicit instead of treating them as afterthoughts.

---

## Q4. How do you estimate frontend scale?

### Answer

Frontend scale is more than requests per second.

Estimate:

- Daily active users
- Concurrent users
- Requests per session
- Payload size
- DOM size
- Number of rendered rows
- WebSocket connections
- Bundle size
- Number of microfrontends
- Frequency of real-time updates

Example:

```text
100,000 users/day
× 20 API requests/session
= ~2 million API requests/day
```

For a data-heavy UI:

```text
100,000 records
× 20 columns
≠ 2 million DOM cells

Instead:
Server-side querying
+
Virtualization
+
Visible-window rendering
```

---

# 2. Frontend Architecture

## Q5. How would you architect a large React application?

### Answer

Prefer feature/domain-oriented boundaries:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   ├── config/
│   └── store/
│
├── features/
│   ├── authentication/
│   ├── search/
│   ├── dashboard/
│   ├── reports/
│   └── portfolio/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── services/
│   ├── api/
│   ├── auth/
│   └── analytics/
│
├── hooks/
├── types/
└── utils/
```

Keep dependency direction predictable:

```text
UI
 ↓
Feature
 ↓
Domain / Service
 ↓
Infrastructure
```

Avoid letting every component directly access every service.

---

## Q6. How do you prevent a large frontend from becoming tightly coupled?

### Answer

Use:

- Feature boundaries
- Stable public APIs
- Dependency inversion
- Shared contracts
- Limited global state
- Clear ownership
- Design-system primitives
- API abstractions
- Architectural lint rules

Avoid:

```text
Feature A → Feature B → Feature C → Feature A
```

Prefer:

```text
Feature A ──┐
            ↓
       Shared Domain
            ↑
Feature B ──┘
```

---

## Q7. How would you handle circular dependencies?

### Answer

Move shared concepts into a lower-level module.

```text
Feature A ──┐
            ↓
      Shared Domain
            ↑
Feature B ──┘
```

Do not solve circular dependencies by creating a giant `utils` or `common` module that becomes another dependency dump.

---

# 3. Modular Architecture

## Q8. How do you define boundaries between frontend modules?

### Answer

Define:

- Ownership
- Public APIs
- Internal implementation
- Dependencies
- Events/contracts
- Shared types
- Authentication boundaries
- Error boundaries

Example:

```text
Shell
 ├── Search
 ├── Research
 ├── Portfolio
 └── Reports
```

Each module should expose only what consumers actually need.

---

## Q9. Modular monolith or microfrontend?

### Answer

Start with a **modular monolith** unless independent deployment or organizational boundaries justify microfrontends.

### Modular monolith

Pros:

- Simpler development
- Easier debugging
- Lower operational complexity
- Easier shared state
- Better developer experience

### Microfrontends

Pros:

- Independent deployment
- Team ownership
- Separate release cycles
- Useful for large organizations

Costs:

- Dependency duplication
- Runtime integration
- Version compatibility
- Cross-app communication
- Performance overhead
- More complicated debugging

> **Senior insight:** Microfrontends primarily solve **organizational and deployment problems**, not simply "large UI" problems.

---

# 4. Microfrontends

## Q10. When should you use microfrontends?

### Answer

Use them when there is a genuine need for:

- Independent deployments
- Independent team ownership
- Different release cycles
- Legacy migration
- Strong domain boundaries

Do not introduce them just because the application has many components.

---

## Q11. How should microfrontends communicate?

### Answer

Prefer explicit contracts.

Possible mechanisms:

```text
URL / route
Custom browser events
Shared service
Minimal shared state
postMessage
Backend
```

Prefer the least-coupled mechanism.

Example:

```js
window.dispatchEvent(
  new CustomEvent("user:updated", {
    detail: { userId: "123" }
  })
);
```

---

## Q12. Should microfrontends share Redux state?

### Answer

Usually, no.

Shared global state creates coupling.

Reasonable shared information might include:

```text
Authenticated user
Tenant
Permissions
Theme
Locale
```

Keep domain-specific state inside the owning microfrontend.

---

## Q13. How would you handle a failed microfrontend?

### Answer

One remote should not bring down the shell.

Use:

```text
Error boundary
+
Timeout
+
Retry
+
Fallback UI
+
Monitoring
```

Example:

```jsx
<ErrorBoundary fallback={<RemoteUnavailable />}>
  <Suspense fallback={<Loading />}>
    <RemoteApp />
  </Suspense>
</ErrorBoundary>
```

---

# 5. Module Federation

## Q14. How would you design Module Federation for an enterprise?

### Answer

```text
                    CDN
                     │
                     ↓
                   Shell
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Search     Reports    Portfolio
          │          │          │
          └──────────┼──────────┘
                     ↓
                Shared APIs
```

Consider:

- React version compatibility
- Shared dependency strategy
- Remote loading failures
- Cache invalidation
- Contract testing
- Runtime monitoring
- Deployment independence
- Rollback
- Security

---

## Q15. What happens if a remote has an incompatible dependency?

### Answer

Define dependency-sharing policy.

For critical shared dependencies:

```text
React
React DOM
Design system
Core utilities
```

Use compatible versions and controlled upgrades.

Avoid allowing every remote to silently ship conflicting versions of foundational libraries.

---

# 6. State Management

## Q16. What belongs in Redux?

### Answer

Good candidates:

```text
Global UI preferences
Authentication context
Feature flags
Cross-feature client state
Workflow state
Global filters
```

Poor candidates:

```text
Input values
Local modal state
Temporary loading state
Server cache
Component-only state
```

---

## Q17. Why shouldn't all server data go into Redux?

### Answer

Server data needs:

- Caching
- Staleness
- Refetching
- Deduplication
- Retry
- Invalidation

A query/cache solution such as TanStack Query is often a better abstraction for server state.

Keep Redux focused on client-owned state.

---

## Q18. How would you deal with a huge Redux store?

### Answer

Treat it as an architecture problem.

Separate:

```text
Client state
Server state
Derived state
Cached state
```

Move server-owned data into an appropriate cache/query layer.

Avoid storing huge API responses globally when only one feature needs them.

---

# 7. Server State & Data Fetching

## Q19. How would you design data fetching for a large React application?

### Answer

Use a consistent data-access layer.

```text
Component
   ↓
Feature hook
   ↓
Query/cache layer
   ↓
API client
   ↓
BFF/API
```

The API client should centralize:

- Headers
- Authentication
- Error normalization
- Request cancellation
- Timeouts
- Telemetry

---

## Q20. How do you avoid request waterfalls?

### Answer

Identify dependent and independent requests.

Bad:

```text
Request A
   ↓
Request B
   ↓
Request C
```

If independent:

```text
Request A ──┐
Request B ──┼── parallel
Request C ──┘
```

Also consider server-side aggregation or a BFF when the browser would otherwise make many calls.

---

# 8. CSR, SSR, SSG, ISR & RSC

## Q21. When would you use CSR, SSR, SSG or ISR?

### Answer

| Strategy | Good fit |
|---|---|
| CSR | Highly interactive authenticated applications |
| SSR | Dynamic pages where initial HTML matters |
| SSG | Mostly static content |
| ISR | Static-like content requiring regeneration |

Choose based on:

```text
SEO
Initial load
Data freshness
Personalization
Interactivity
Server cost
Caching
```

---

## Q22. What causes hydration mismatches?

### Answer

The server and client produce different initial output.

Common causes:

```text
Date/time generated during render
Random values
window/localStorage
Browser-only APIs
Different server/client data
Non-deterministic rendering
```

Bad:

```jsx
const now = new Date();

return <div>{now.toLocaleString()}</div>;
```

The server and client can generate different values.

---

## Q23. How would you design streaming SSR?

### Answer

Render the important shell first and progressively stream slower content.

```text
Request
  ↓
Server
  ├── HTML shell
  ├── Header
  ├── Navigation
  ├── Critical content
  │
  └── Suspense boundaries
          ↓
       Slower content
```

The goal is to deliver useful content quickly without waiting for every backend dependency.

---

## Q24. When are React Server Components useful?

### Answer

They are useful for moving suitable rendering/data work to the server and reducing unnecessary client-side JavaScript.

Good candidates include:

- Data-heavy server-rendered UI
- Server-only logic
- Components that do not need browser interactivity

Interactive components still need client-side execution.

---

# 9. Browser Rendering

## Q25. Explain the browser rendering pipeline.

### Answer

A simplified model:

```text
HTML
 ↓
DOM

CSS
 ↓
CSSOM

DOM + CSSOM
 ↓
Render Tree
 ↓
Layout
 ↓
Paint
 ↓
Composite
```

A senior engineer should know which changes can trigger layout, paint, or compositing.

---

## Q26. Why is transform often preferable to top/left for animations?

### Answer

Changing layout-related properties can invalidate layout.

```css
/* Often more expensive */
.panel {
  left: 100px;
}
```

Prefer:

```css
.panel {
  transform: translateX(100px);
}
```

`transform` and `opacity` can often be handled efficiently by the compositor.

The important point is not "everything goes to the GPU"; it is to minimize expensive main-thread layout and paint work.

---

# 10. Performance & Core Web Vitals

## Q27. How would you optimize Core Web Vitals?

### Answer

### LCP

Focus on:

- TTFB
- Critical resources
- Hero image loading
- Fonts
- Render-blocking resources
- Server/CDN performance

### INP

Focus on:

- Long tasks
- Event-handler cost
- Large renders
- Synchronous computation
- Third-party scripts

### CLS

Focus on:

- Explicit image dimensions
- Reserved space
- Stable fonts
- Avoiding layout-changing injections

---

## Q28. How do you reduce JavaScript bundle size?

### Answer

Use:

- Code splitting
- Dynamic imports
- Tree shaking
- Route-level splitting
- Dependency analysis
- Removal of unused libraries
- Modern build targets

Example:

```jsx
const Reports = lazy(() => import("./Reports"));
```

Do not lazy-load everything blindly; every split has network and loading trade-offs.

---

## Q29. How would you debug a slow React page?

### Answer

Measure before changing code.

Investigate:

```text
Network waterfall
Bundle size
React renders
Long tasks
API latency
DOM size
Layout/paint
Third-party scripts
```

Typical tools:

```text
Chrome DevTools
React Profiler
Lighthouse
WebPageTest
RUM
Performance APIs
Datadog
```

---

## Q30. When would you use a Web Worker?

### Answer

Use a Worker when CPU-heavy work would block the main thread.

Examples:

```text
Large JSON processing
CSV parsing
Complex calculations
Data transformation
Search indexing
Image processing
```

```text
Main Thread
     │
     │ postMessage()
     ↓
Web Worker
     │
     │ postMessage()
     ↓
Main Thread
```

Workers do not directly manipulate the DOM.

---

# 11. Scalability

## Q31. What does frontend scalability mean?

### Answer

A scalable frontend handles growth in:

```text
Users
Features
Teams
Data
API traffic
Deployment frequency
Browser complexity
```

It therefore includes both:

```text
Technical scalability
+
Organizational scalability
```

---

## Q32. How would you scale development across 20+ frontend engineers?

### Answer

Establish:

- Feature ownership
- Architecture guidelines
- Design system
- Shared tooling
- CI standards
- Testing standards
- Dependency policies
- API contracts
- Code ownership
- Observability standards
- Documentation

The goal is to reduce coordination cost while preserving consistency.

---

# 12. Caching

## Q33. What caching layers exist in a frontend system?

### Answer

```text
Browser Cache
      ↓
Service Worker
      ↓
CDN
      ↓
BFF/API Cache
      ↓
Backend Cache
      ↓
Database
```

Each layer has different:

- TTL
- Scope
- Invalidation
- Consistency
- Storage characteristics

---

## Q34. How would you cache static frontend assets?

### Answer

Use content hashing:

```text
app.abc123.js
app.def456.js
```

Then static assets can have long cache lifetimes.

A changed file gets a new filename, avoiding stale deployment artifacts.

---

# 13. API & BFF

## Q35. When should you introduce a Backend-for-Frontend?

### Answer

A BFF is useful when the browser must otherwise orchestrate many backend services.

Without BFF:

```text
Browser
 ├── User API
 ├── Portfolio API
 ├── Permissions API
 ├── Research API
 └── Notification API
```

With BFF:

```text
Browser
   ↓
  BFF
   ├── User
   ├── Portfolio
   ├── Permissions
   ├── Research
   └── Notifications
```

The BFF can aggregate requests and expose a frontend-oriented contract.

---

## Q36. REST or GraphQL?

### Answer

Choose according to requirements.

### REST

Good for:

- Resource-oriented APIs
- Simple contracts
- HTTP caching
- Straightforward services

### GraphQL

Good for:

- Complex client requirements
- Multiple consumers
- Avoiding over-fetching
- Flexible data selection

GraphQL adds complexity around:

- Query cost
- Caching
- Authorization
- Observability

---

# 14. Real-Time Systems

## Q37. How would you design a real-time dashboard?

### Answer

```text
Backend Events
      ↓
WebSocket / SSE
      ↓
Connection Layer
      ↓
Client Cache / State
      ↓
Selective UI Updates
```

Handle:

- Reconnection
- Backoff
- Authentication
- Heartbeats
- Event ordering
- Duplicate events
- Missed events
- Backpressure
- Memory cleanup

---

## Q38. WebSocket or SSE?

### Answer

| WebSocket | SSE |
|---|---|
| Bidirectional | Server → client |
| Flexible | Simpler |
| Collaboration/chat | Dashboards/notifications |
| More connection complexity | HTTP-based |

Use WebSocket when the client needs bidirectional real-time communication.

---

# 15. Large Data & Data Grids

## Q39. How would you render 100,000 rows?

### Answer

Never create 100,000 DOM rows unnecessarily.

Use:

```text
Server-side pagination/filtering
+
Virtualization
+
Efficient rendering
```

Conceptually:

```text
100,000 records
       ↓
Visible window
       ↓
~50 DOM rows
```

---

## Q40. Client-side or server-side filtering?

### Answer

### Client-side

Use when:

- Dataset is reasonably small
- Data is already loaded
- Filtering is cheap

### Server-side

Use when:

- Dataset is large
- Queries are expensive
- Data changes frequently
- Authorization must be enforced
- Network transfer is expensive

---

## Q41. How would you design a high-performance AG Grid-style enterprise grid?

### Answer

Consider:

```text
Virtualization
Server-side row model
Column virtualization
Memoized renderers
Efficient filters
Debounced requests
Request cancellation
Stable column definitions
Minimal global state
```

Avoid recreating expensive grid configuration on every render.

---

# 16. Security

## Q42. How would you secure a frontend application?

### Answer

Think in layers:

```text
Browser
 ↓
Frontend
 ↓
BFF/API
 ↓
Services
 ↓
Database
```

Important controls include:

- CSP
- XSS prevention
- Secure authentication
- CSRF protection
- Dependency security
- Secure cookies
- Output encoding
- Trusted Types where appropriate
- No secrets in frontend bundles

---

## Q43. How do you prevent XSS?

### Answer

Treat user input as untrusted.

Prefer:

```js
element.textContent = userInput;
```

instead of:

```js
element.innerHTML = userInput;
```

If rich HTML must be rendered, sanitize it with an appropriate sanitizer.

Also consider CSP and Trusted Types.

---

## Q44. Can frontend code safely contain a secret API key?

### Answer

No.

Anything delivered to the browser should be considered accessible to the user.

Never ship:

```text
Database credentials
Private API secrets
Cloud credentials
Signing secrets
```

Use a backend/BFF for privileged operations.

---

# 17. Authentication & Authorization

## Q45. How would you design enterprise authentication?

### Answer

A common architecture is:

```text
Browser
   ↓
Identity Provider
   ↓
Authorization Code + PKCE
   ↓
Application / BFF
   ↓
Session
   ↓
APIs
```

Consider:

- OIDC/OAuth2
- SSO
- MFA
- Session expiration
- Refresh strategy
- Logout
- Scopes
- Roles
- Permission claims

---

## Q46. Authentication vs authorization?

### Answer

Authentication answers:

> **Who are you?**

Authorization answers:

> **What are you allowed to do?**

Example:

```text
Authenticated:
User is logged in.

Authorized:
✓ View reports
✓ Export reports
✗ Delete reports
```

Frontend authorization improves UX, but backend authorization is mandatory for security.

---

# 18. Accessibility

## Q47. How should accessibility influence system design?

### Answer

Accessibility should be an architectural requirement.

Design for:

- Semantic HTML
- Keyboard navigation
- Screen readers
- Focus management
- Contrast
- Reduced motion
- Accessible forms
- Error messaging
- Modal behavior
- Appropriate ARIA

---

## Q48. How would you design an accessible modal?

### Answer

```text
Open modal
   ↓
Move focus into modal
   ↓
Trap focus
   ↓
Allow Escape
   ↓
Prevent inappropriate background interaction
   ↓
Restore focus
```

Also provide an accessible name and correct dialog semantics.

---

# 19. Reliability & Resilience

## Q49. How should a frontend handle API failures?

### Answer

Classify failures:

```text
401 → Authentication
403 → Authorization
404 → Missing resource
409 → Conflict
429 → Rate limit
5xx → Server failure
Network → Connectivity
Timeout → Dependency unavailable/slow
```

Then choose:

```text
Retry
Fallback
Cached data
User action
Redirect
Partial rendering
```

---

## Q50. How do you design a resilient frontend?

### Answer

Use:

- Error boundaries
- Timeouts
- Retry with backoff
- Request cancellation
- Graceful degradation
- Feature flags
- Fallback UI
- Monitoring
- Offline support where required

---

# 20. Observability

## Q51. What should you monitor in production?

### Answer

### Performance

```text
LCP
INP
CLS
TTFB
Long tasks
Bundle size
API latency
```

### Reliability

```text
JavaScript errors
Failed requests
Unhandled rejections
Remote-module failures
Crash-free sessions
```

### Business

```text
Search success
Report generation
Export completion
Feature adoption
Conversion
```

---

## Q52. Logs vs metrics vs traces vs RUM?

### Answer

| Signal | Purpose |
|---|---|
| Logs | Detailed events |
| Metrics | Aggregated measurements |
| Traces | Request journey |
| RUM | Real user experience |

For frontend applications, RUM is particularly useful because real devices and networks vary significantly.

---

# 21. Testing

## Q53. What testing strategy would you use for a large frontend?

### Answer

```text
              E2E
             /         Integration
        /             Unit    Component
```

### Unit

Test isolated logic.

### Integration

Test multiple pieces working together.

### E2E

Test critical user journeys.

Example:

```text
Unit:
formatCurrency()

Integration:
Search + filters + results

E2E:
Login → Search → Open result → Export
```

---

## Q54. What should not automatically be an E2E test?

### Answer

Do not use E2E for every tiny behavior.

Use unit/integration tests for:

```text
Utility functions
Small component states
Business calculations
Simple rendering logic
```

Reserve E2E for high-value workflows.

---

# 22. CI/CD & Deployment

## Q55. What should a mature frontend CI/CD pipeline look like?

### Answer

```text
Commit
 ↓
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Build
 ↓
Security Checks
 ↓
Integration Tests
 ↓
E2E Tests
 ↓
Container Build
 ↓
Staging
 ↓
Smoke Tests
 ↓
Progressive Production Release
 ↓
Monitoring
```

---

## Q56. Blue-green vs canary deployment?

### Answer

### Blue-green

```text
Blue  = Current
Green = New
```

Switch traffic between environments.

### Canary

```text
1%
 ↓
5%
 ↓
25%
 ↓
50%
 ↓
100%
```

Canary reduces blast radius and allows production validation.

---

# 23. Docker, Kubernetes & Cloud

## Q57. How would you deploy a React application with Docker and Kubernetes?

### Answer

```text
Developer
   ↓
CI/CD
   ↓
Docker Image
   ↓
Container Registry
   ↓
Kubernetes
   ↓
Ingress / Load Balancer
   ↓
CDN
   ↓
Browser
```

For a static React build:

```text
Node build stage
      ↓
Static assets
      ↓
Nginx container
```

Use a CDN when appropriate for static assets.

---

## Q58. What belongs in Kubernetes versus the frontend?

### Answer

Kubernetes handles:

```text
Deployment
Scaling
Service discovery
Health checks
Rolling updates
Resource limits
```

Frontend handles:

```text
Rendering
Interaction
Client state
Data fetching
Browser behavior
```

Keep responsibilities separated.

---

# 24. Design Systems

## Q59. How would you design a design system for many teams?

### Answer

Use layers:

```text
Design Tokens
      ↓
Primitives
      ↓
Components
      ↓
Patterns
      ↓
Product Features
```

Example:

```text
Tokens
 ├── Colors
 ├── Spacing
 ├── Typography
 └── Elevation

Components
 ├── Button
 ├── Input
 ├── Modal
 └── Data Grid
```

Consider versioning, accessibility, documentation, theming, adoption, and breaking changes.

---

# 25. Internationalization

## Q60. What should an enterprise i18n architecture consider?

### Answer

Consider:

- Translation loading
- Locale detection
- Number formatting
- Date/time formatting
- Currency
- RTL
- Text expansion
- Pluralization
- Dynamic content
- SEO where relevant

Do not assume translated text will have the same length as English.

---

# 26. Offline & PWA

## Q61. How would you design an offline-capable application?

### Answer

```text
Application
    ↓
Service Worker
    ↓
Cache
    ↓
IndexedDB
    ↓
Sync Queue
```

Offline writes require a conflict strategy:

```text
Offline write
 ↓
Local queue
 ↓
Reconnect
 ↓
Sync
 ↓
Conflict resolution
```

---

# 27. Feature Flags

## Q62. How would you safely release a new feature?

### Answer

Use progressive rollout:

```text
Internal users
     ↓
1%
     ↓
10%
     ↓
50%
     ↓
100%
```

Monitor:

- Error rate
- Performance
- API failures
- Business metrics

Every flag should ideally have an owner and removal plan.

---

# 28. Multi-Tenant Applications

## Q63. How would you architect a multi-tenant frontend?

### Answer

```text
Authentication
      ↓
Tenant Resolution
      ↓
Permissions
      ↓
Feature Flags
      ↓
Configuration
      ↓
Features
```

Tenant-specific configuration can include:

```text
Branding
Features
Permissions
Localization
Business rules
```

Never rely on client-supplied tenant information for backend authorization.

---

# 29. Files & Export Systems

## Q64. How would you design large file uploads?

### Answer

Prefer direct object-storage uploads.

```text
Browser
   ↓
Request signed upload URL
   ↓
Backend
   ↓
Signed URL
   ↓
Object Storage
```

For large files:

```text
Multipart upload
+
Progress
+
Retry failed chunks
```

---

## Q65. How would you export millions of records?

### Answer

Do not generate a huge export in the browser.

Use an asynchronous job:

```text
User requests export
       ↓
POST /exports
       ↓
Job ID
       ↓
Background processing
       ↓
Object Storage
       ↓
Polling / SSE
       ↓
Download
```

This avoids freezing the browser and allows server-side processing.

---

# 30. Search

## Q66. How would you design an enterprise search UI?

### Answer

```text
Search Input
    ↓
Debounce
    ↓
Cancel Previous Request
    ↓
BFF / Search API
    ↓
Search Engine
    ↓
Ranked Results
    ↓
Virtualized UI
```

Consider:

- URL synchronization
- Pagination
- Ranking
- Search history
- Empty states
- Error states
- Accessibility
- Analytics

---

## Q67. How do you prevent stale search results?

### Answer

Use cancellation and latest-request-wins semantics.

```js
const controller = new AbortController();

fetch(`/api/search?q=${query}`, {
  signal: controller.signal
});
```

When a newer request starts, cancel the previous one.

Also ensure an old response cannot overwrite newer state.

---

# 31. Long-Running Jobs

## Q68. How would you design a long-running operation?

### Answer

Avoid keeping one HTTP request open indefinitely unless streaming is intentional.

Prefer:

```text
POST /jobs
   ↓
Job ID
   ↓
Background processing
   ↓
Polling / SSE / WebSocket
   ↓
Completed / Failed
```

Model the state explicitly:

```text
Queued
  ↓
Processing
  ↓
Completed
  ↓
Failed
```

---

# 32. Data Consistency

## Q69. How do you design optimistic updates?

### Answer

```text
User action
   ↓
Update UI immediately
   ↓
API request
   ├── Success → Keep
   └── Failure → Rollback
```

Use optimistic updates when:

- The action is likely to succeed
- Rollback is well-defined
- Temporary inconsistency is acceptable

---

## Q70. How do you handle request race conditions?

### Answer

Possible approaches:

```text
AbortController
Request IDs
Query libraries
Latest-request-wins
State machines
```

Example:

```text
Request A starts
Request B starts

B finishes first
→ Apply B

A finishes later
→ Ignore A
```

---

# 33. Advanced Trade-Offs

## Q71. When should you use virtualization?

### Answer

When the dataset is large enough that rendering every item creates unnecessary DOM and rendering work.

Virtualization should be combined with appropriate data loading rather than used as an excuse to download millions of records to the browser.

---

## Q72. Pagination vs infinite scrolling vs virtualization?

### Answer

| Technique | Best fit |
|---|---|
| Pagination | Search, enterprise tables, URL-addressable results |
| Infinite scroll | Feeds and discovery |
| Virtualization | Large rendered collections |

They can be combined.

---

## Q73. When should you use memoization?

### Answer

Use memoization when:

- A calculation is expensive
- Inputs are stable
- Profiling shows repeated work

Avoid:

```jsx
useMemo(() => a + b, [a, b]);
```

for trivial calculations unless there is a demonstrated reason.

Measure first.

---

## Q74. How do you decide whether architectural complexity is justified?

### Answer

Ask:

```text
What problem does it solve?
What happens without it?
Who owns it?
What is the operational cost?
Can we remove it later?
```

This is more important than choosing a fashionable technology.

---

# 34. Production Scenarios

## Q75. Production suddenly becomes 3 seconds slower. What do you do?

### Answer

Do not immediately rewrite React components.

Compare before vs after deployment.

Investigate:

```text
Bundle size
API latency
TTFB
LCP resource
Third-party scripts
React rendering
Dependency changes
Server performance
```

Use production measurements to isolate the regression.

---

## Q76. Users report random UI freezes. How do you investigate?

### Answer

Look for main-thread long tasks.

Investigate:

- Large JSON parsing
- Expensive calculations
- Large renders
- Synchronous loops
- Data-grid processing
- Third-party scripts

Move CPU-heavy work to a Web Worker where appropriate.

---

## Q77. An API returns 10 MB for one screen. What would you do?

### Answer

Ask whether the browser actually needs all of it.

Consider:

```text
Field selection
Pagination
Server filtering
Compression
Streaming
Aggregation
Incremental loading
```

Fix the data contract rather than simply giving the browser more memory.

---

## Q78. A dashboard has 20 widgets and every widget calls an API. How would you improve it?

### Answer

Consider a dashboard-oriented BFF:

```text
Browser
   ↓
Dashboard BFF
   ↓
┌────┬────┬────┬────┐
API1 API2 API3 API4 ...
```

The BFF can aggregate independent backend calls while widgets maintain independent loading/error states.

---

## Q79. A microfrontend frequently breaks production. What would you change?

### Answer

Introduce:

```text
Remote health monitoring
+
Timeout
+
Error boundary
+
Fallback
+
Contract/version checks
+
Canary deployment
+
Rollback
```

The shell should remain usable when a remote fails.

---

## Q80. Search API is fast, but search UI feels slow. Why?

### Answer

Measure the complete path:

```text
Input
 ↓
Debounce
 ↓
Network
 ↓
JSON parsing
 ↓
State update
 ↓
React render
 ↓
DOM update
 ↓
Paint
```

The bottleneck could be:

- Excessive debounce
- Large payload
- JSON parsing
- Expensive client filtering
- Large result rendering
- Main-thread blocking

---

# 35. Full System Design Problems

For these problems, practice answering for **30–45 minutes**. Do not jump directly to implementation details.

## Q81. Design an enterprise investment research platform.

### Requirements to discuss

```text
SSO
RBAC
Dataset discovery
Search
Query builder
Long-running workflows
Notebook integration
Large datasets
Data visualization
Large tables
Exports
Notifications
Audit logging
Observability
Security
```

### Possible high-level architecture

```text
                    Identity Provider
                           │
                           ↓
Browser → CDN → Frontend Shell
                    │
          ┌─────────┼──────────┐
          ↓         ↓          ↓
       Search    Research    Reports
          │         │          │
          └─────────┼──────────┘
                    ↓
                   BFF
                    ↓
       ┌────────────┼─────────────┐
       ↓            ↓             ↓
    Search       Dataset       Job Service
    Service       Service          │
                                   ↓
                              Object Storage
```

Discuss how you prevent millions of records from entering browser memory.

---

## Q82. Design a large analytics dashboard.

### Requirements

```text
20 widgets
Real-time updates
Configurable layout
Large datasets
Export
RBAC
```

Discuss:

```text
Widget isolation
API aggregation
Caching
WebSockets/SSE
Virtualization
State ownership
Lazy loading
Error isolation
Observability
```

---

## Q83. Design an enterprise e-commerce frontend.

### Cover

```text
Product discovery
Search
Filters
Product details
Cart
Checkout
Authentication
Payments
Orders
Recommendations
Analytics
SEO
Caching
Accessibility
Security
```

Explain where you would use:

```text
SSR
SSG
ISR
CSR
```

and why.

---

## Q84. Design a real-time collaboration application.

### Cover

```text
WebSocket architecture
Presence
Conflict resolution
Optimistic updates
Offline support
Reconnection
Event ordering
State synchronization
Persistence
Notifications
```

---

## Q85. Design a frontend platform used by 50 teams.

### Cover

```text
Design system
Microfrontends
Module Federation
Shared tooling
CI/CD
Versioning
Ownership
API contracts
Observability
Security
Accessibility
Governance
```

The interviewer is testing whether you can design a **platform**, not just an application.

---

# 36. Senior Rapid-Fire

## Q86. What is the most important frontend system-design principle?

**Answer:** Keep boundaries clear and make data flow predictable.

---

## Q87. What is usually the biggest frontend bottleneck?

**Answer:** The main thread. Excessive JavaScript, rendering, parsing, or synchronous computation can block interaction.

---

## Q88. What is the biggest frontend architecture mistake?

**Answer:** Adding complexity before understanding the actual problem.

---

## Q89. What should never be trusted from the frontend?

**Answer:** Authorization decisions, secrets, and other security-sensitive decisions.

---

## Q90. What should not automatically become global state?

**Answer:** Every UI value and every server response.

---

## Q91. What is the best performance optimization?

**Answer:** Avoid unnecessary work before trying to make necessary work faster.

---

## Q92. What separates a senior frontend engineer from a mid-level engineer in system design?

### Answer

A mid-level engineer may focus primarily on:

```text
Components
Hooks
Libraries
APIs
```

A senior engineer also considers:

```text
Scale
Boundaries
Failure modes
Security
Performance
Accessibility
Observability
Deployment
Team ownership
Cost
Migration
Long-term maintainability
```

---

# Senior Interview Answer Framework

For almost every system-design question, use this structure:

```text
1. Clarify requirements
2. State assumptions
3. Estimate scale
4. Identify constraints
5. Draw high-level architecture
6. Explain frontend boundaries
7. Explain rendering strategy
8. Explain API/data flow
9. Explain state ownership
10. Explain caching
11. Explain performance
12. Explain security
13. Explain accessibility
14. Explain reliability/failures
15. Explain observability
16. Explain testing
17. Explain deployment
18. Explain trade-offs
19. Explain future evolution
```

## The senior-level mindset

Do not answer:

> "I would use React + Redux + TanStack Query + AWS + Kubernetes."

Answer:

> "I would first separate client-owned state from server-owned data. Server data needs caching, invalidation, and synchronization, so I would use a query/cache layer rather than putting large responses into Redux. For large datasets, I would use server-side filtering and virtualization. If multiple teams require independent releases, I would evaluate microfrontends; otherwise I would prefer a modular monolith to avoid unnecessary runtime complexity."

That demonstrates **architecture thinking rather than technology familiarity**.

---

# Final Checklist

Before finishing a system-design answer, verify:

### Requirements
- [ ] Functional requirements
- [ ] Non-functional requirements
- [ ] Scale
- [ ] Constraints

### Architecture
- [ ] Clear boundaries
- [ ] Ownership
- [ ] Data flow
- [ ] Dependency direction

### Rendering
- [ ] CSR / SSR / SSG / ISR
- [ ] Hydration
- [ ] Browser rendering

### Data
- [ ] API strategy
- [ ] Server vs client state
- [ ] Caching
- [ ] Pagination
- [ ] Virtualization

### Performance
- [ ] Bundle size
- [ ] Core Web Vitals
- [ ] Main-thread work
- [ ] Network waterfall
- [ ] Large data handling

### Security
- [ ] Authentication
- [ ] Authorization
- [ ] XSS
- [ ] CSP
- [ ] CSRF
- [ ] Secrets

### Accessibility
- [ ] Semantic HTML
- [ ] Keyboard
- [ ] Screen readers
- [ ] Focus management
- [ ] WCAG

### Reliability
- [ ] Timeouts
- [ ] Retry/backoff
- [ ] Error boundaries
- [ ] Graceful degradation
- [ ] Failure isolation

### Operations
- [ ] CI/CD
- [ ] Monitoring
- [ ] RUM
- [ ] Logging
- [ ] Rollback
- [ ] Feature flags

### Senior-level thinking
- [ ] Alternatives considered
- [ ] Trade-offs explained
- [ ] Cost considered
- [ ] Migration path
- [ ] Long-term evolution
