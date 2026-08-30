# Interview & Study Guide

useState
Purpose
useState stores information that:
Must survive across renders
Must cause the UI to update when changed
Belongs to one component or a small part of the tree

**useReducer**
Purpose
useReducer manages state through explicit business actions.

**useContext**
Purpose
useContext reads shared information from the nearest provider without passing props through every intermediate component.

**useRef**
Purpose
A ref stores a mutable value across renders without causing a render when changed.

**useImperativeHandle**
Purpose
useImperativeHandle limits or customizes what a parent receives through a ref.

This should be used sparingly because normal React communication is declarative

**useEffect**
Purpose
useEffect synchronizes a React component with an external system. React’s documentation explicitly describes Effects as synchronization with systems outside React and notes that you might not need an Effect if no external system is involved

**useEffectEvent**
Purpose
useEffectEvent separates reactive synchronization from event-like logic inside an Effect.

An Effect Event sees the latest committed props and state without forcing the containing Effect to reconnect. It should be called only from Effects or other Effect Events, not from rendering or ordinary event handlers

**useLayoutEffect**
Purpose
useLayoutEffect runs after DOM changes but before the browser paints.

Use it for DOM measurement or a visual correction that must happen before users see the frame.

**useInsertionEffect**
Purpose
useInsertionEffect runs before layout Effects and is intended primarily for CSS-in-JS library authors inserting styles before layout measurement.

**useInsertionEffect**
Purpose
useInsertionEffect runs before layout Effects and is intended primarily for CSS-in-JS library authors inserting styles before layout measurement.

**useMemo**
Purpose
useMemo caches a calculated value between renders until dependencies change.

**useCallback**
Purpose
useCallback caches a function identity.

**useTransition**
Purpose
useTransition marks an update as non-urgent while keeping urgent interactions responsive.
useDeferredValue
Purpose
useDeferredValue lets one part of the UI temporarily render with an older value while the urgent portion updates immediately.

**useSyncExternalStore**
Purpose
useSyncExternalStore safely subscribes React to information stored outside React

**useActionState**
Purpose
useActionState manages the result and pending state of an Action. The current API returns the state, an Action dispatcher, and an isPending flag.

**useOptimistic**
Purpose
useOptimistic immediately displays an expected successful result while the real operation is pending.

**useFormStatus** from react-dom
useFormStatus is provided by react-dom, not the core react package.
Purpose
A component nested inside a form can read the nearest parent form’s submission status.

**Babel** is a JavaScript compiler/transpiler that converts modern JavaScript, JSX, and some TypeScript syntax into JavaScript that browsers understand.
Your Code
|
v
React JSX
|
v
Babel
|
v
Browser Compatible JS
|
v
Webpack/Vite Bundle
|
v
CDN
|
v
User Browser

**.eslintrc.json** ESLint configuration. Rules here enforce code quality — things TypeScript cannot check (like React hook rules, accessibility, security patterns).

**.prettierrc** Prettier formatting rules. Every team member (or AI) produces identically formatted 

**Synthetic Events** are React’s cross-browser wrapper around native browser events, giving you a consistent API like `onClick={(e) => console.log(e.target)}`; modern React uses delegated native events rather than the old pooled-event system.

**State/props change → React creates/reconciles a new Fiber tree → compares it with the previous Fiber tree (reconciliation) → calculates minimal DOM changes → commits those changes to the real DOM → browser paints the updated UI.**

“**React** compares the **new Fiber** tree with the **previous Fiber tree** during reconciliation (often called diffing) to determine the minimal DOM updates needed.”

**1. Initial Render**
When a component renders, it returns React elements (plain JavaScript objects describing the UI). React builds a Virtual DOM tree from these objects — a lightweight in-memory representation. React then creates the corresponding Real DOM nodes and inserts them into the browser.

**2. State or Props Change**
When state or props change, the component re-renders. React generates a new Virtual DOM tree reflecting the updated UI. This new tree lives only in memory — the Real DOM hasn't changed yet.

**3. Diffing (Reconciliation)**
React compares the new Virtual DOM tree with the previous one using a diffing algorithm. It walks both trees and identifies the minimum set of changes needed. For lists, React uses key props to match elements across renders and avoid unnecessary re-creation.

**4. Commit Phase**
React applies the identified changes to the Real DOM in a single batch. It updates, inserts, or removes only the specific nodes that changed — not the entire tree.

**5. Why This Matters**
The Virtual DOM makes React declarative: you describe what the UI should look like, and React figures out how to update the DOM efficiently. It batches multiple changes into a single DOM update, reducing layout thrashing and reflows.

**Shadow DOM** is a browser-native technology that creates an isolated DOM tree for a component (styles/DOM encapsulation), while **Virtual DOM** is a JavaScript/in-memory representation React uses to efficiently determine what changes need to be made to the real DOM.

**React Router** is a full routing solution (routes, navigation, params, nested routes, guards), while the **`history`** **library** mainly provides low-level browser history management (`push`, `replace`, `back`, etc.); React Router uses history/navigation APIs internally.

export type RootState = ReturnType\<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

`ReturnType<typeof store.getState>` means **“give me the TypeScript type of whatever** **`store.getState()`** **returns”**, so `RootState` becomes the complete shape of your Redux state.

import type { AppDispatch, RootState } from "./store";

export const useAppDispatch = useDispatch.withTypes\<AppDispatch>();

export const useAppSelector = useSelector.withTypes\<RootState>();
It creates a **typed version of** **`useDispatch`**, so `useAppDispatch()` automatically knows your Redux `AppDispatch` type and gives TypeScript correct action/thunk checking without repeatedly writing types.

Because with `position: fixed`, `inset: 0` means **`top: 0; right: 0; bottom: 0; left: 0`**, so the element is pinned to all four edges of the viewport and therefore fills the entire screen.

Here are \*\*interview questions and answers\*\* covering everything we've discussed — from cross-tab sync to middleware design to security.

—

| **React Query API** | **Simple meaning**                                 |
| ------------------- | -------------------------------------------------- |
| useMutation()       | Perform a server-side change                       |
| mutationFn          | The actual API request                             |
| onMutate            | Before API → optimistically update UI              |
| cancelQueries()     | Stop an ongoing query from overwriting your update |
| getQueryData()      | Read data from cache                               |
| setQueryData()      | Manually change cache                              |
| previous            | Backup of old cache for rollback                   |
| onError             | API failed → restore old cache                     |
| onSettled           | API finished → synchronize with server             |
| invalidateQueries() | Mark cache stale and normally refetch if active    |

\## 🔷 Beginner / Mid-Level

\### Q1: What problem does \`BroadcastChannel\` solve in a Redux app?

\*\*A:\*\* Normally, each browser tab has its own Redux store in memory. If a user adds an item to their cart in Tab 1, Tab 2 has no idea. \`BroadcastChannel\` lets same-origin tabs send messages to each other, so you can sync Redux actions (or custom events) across tabs without a server round-trip.

\---

\### Q2: Why do we check \`typeof window !== "undefined"\` before creating a \`BroadcastChannel\`?

\*\*A:\*\* Because this code might run during server-side rendering (Next.js, etc.) where \`window\` doesn't exist. Without the check, the server would throw a \`ReferenceError\` and crash. We fall back to \`null\` so the middleware silently does nothing on the server.

\---

\### Q3: In the cart sync code, why must we call \`next(action)\` before broadcasting?

\*\*A:\*\* Redux middleware wraps around the dispatch pipeline. \`next(action)\` passes the action to the next middleware or the reducer. We call it first so the \*\*current tab's state updates immediately\*\* before we tell other tabs about it. If we broadcast first and the reducer throws an error, we'd have sent an invalid action to other tabs.

\---

\### Q4: What is the purpose of \`meta: { fromAnotherTab: true }\`?

\*\*A:\*\* It's a \*\*circuit breaker\*\*. When Tab B receives an action from Tab A and re-dispatches it locally, the middleware in Tab B sees this flag and knows: \*"This action already came through the channel. I should NOT broadcast it again."\* Without this flag, tabs would echo actions back and forth forever.

\---

\### Q5: Why does the auth sync code NOT need a \`fromAnotherTab\` flag?

\*\*A:\*\* Because it broadcasts a \*\*different shape\*\* than what the middleware listens for. The middleware watches for \`auth/login/fulfilled\` (a Redux action type), but it broadcasts \`{ kind: "login", sentAt: number }\` (a custom \`AuthEvent\`). The listener dispatches \`fetchCurrentUser()\` — which doesn't match the middleware's conditions — so nothing gets re-broadcasted. The loop is impossible by design.

\---

\## 🔷 Advanced

\### Q6: Why does the auth code use a \`localStorage\` fallback? How does it work?

\*\*A:\*\* Not all browsers support \`BroadcastChannel\` (older Safari, some embedded browsers). \`localStorage\` has a quirk: when you call \`setItem()\`, it fires a \`"storage"\` event in \*\*every other tab\*\* of the same origin, but \*\*not\*\* in the tab that wrote it. This makes it a natural one-way broadcast mechanism. The code writes the \`AuthEvent\` as JSON to a known key, and other tabs listen via \`window\.addEventListener("storage", ...)\`.

\---

\### Q7: Why does the auth code re-verify login with \`fetchCurrentUser()\` but instantly trust logout with \`sessionCleared()\`?

\*\*A:\*\* \*\*Security asymmetry:\*\*

\- \*\*Logout is safe to trust blindly.\*\* If the user clicked logout in another tab, they want to be logged out everywhere. Worst case: we clear state when we didn't need to. No harm.
\- \*\*Login is NOT safe to trust blindly.\*\* A malicious or compromised tab could broadcast a fake login event. Or the user's session might have expired. By calling \`fetchCurrentUser()\` (which hits \`/auth/me\`), the receiving tab independently verifies the cookie/session is still valid before updating state.

\---

\### Q8: What is \`Middleware\` in Redux, and why is the signature \`() => (next) => (action) => {}\`?

\*\*A:\*\* Redux middleware is a \*\*curried function\*\* that forms a pipeline around dispatch. The triple arrow is:

1\. \`store =>\` — receives the store API (or \`getState\`/\`dispatch\`)
2\. \`next =>\` — receives the next middleware in the chain
3\. \`action =>\` — receives the current action

This structure lets middleware inspect, modify, delay, or swallow actions before they reach the reducer. It also lets middleware run code \*\*after\*\* the reducer by calling \`next(action)\` first and then doing post-processing.

\---

\### Q9: What's the difference between \`AnyAction\` and \`UnknownAction\` in Redux, and why is \`AnyAction\` deprecated?

\*\*A:\*\*

\| | \`AnyAction\` | \`UnknownAction\` |
\|---|---|---|
\| Shape | \`{ type: string; [extraProps: string]: any }\` | \`{ type: unknown }\` |
\| Safety | Lets you access any property without checks | Forces you to narrow/type-guard before using |
\| Why deprecated | Hides bugs at compile time. You can do \`action.anything\` and TS won't complain. | Encourages runtime validation + type guards, making reducers safer. |

The modern approach is \`UnknownAction\` + a type guard like \`isCartAction(action)\` that checks \`typeof action.type === "string"\` before letting you access properties.

\---

\### Q10: Why won't \`useSessionRevalidation\` cause an infinite re-render loop?

\*\*A:\*\* Three reasons:

1\. \*\*\`dispatch\` is stable.\*\* In Redux, \`dispatch\` is the same function object across renders. The \`useEffect\` dependency \`[dispatch]\` never changes, so the effect runs \*\*only once\*\* on mount.
2\. \*\*\`visibilitychange\` is a DOM event, not React state.\*\* It fires when the user clicks back into the tab. It doesn't trigger React re-renders by itself.
3\. \*\*\`App\` doesn't subscribe to Redux state.\*\* It only dispatches. Even when \`fetchCurrentUser()\` updates auth state, \`App\` doesn't re-render because it never reads that state with \`useSelector\`.

Even if \`App\` did read auth state, the effect still wouldn't re-run because \`dispatch\` never changes.

\---

\## 🔷 Architecture & Design

\### Q11: When should you sync raw Redux actions vs. custom events across tabs?

\*\*A:\*\*

\| Approach | Best for | Example |
\|---|---|---|
\| \*\*Raw actions\*\* | Simple, deterministic state machines where all tabs should reach the exact same state | Cart add/remove, UI theme toggle |
\| \*\*Custom events\*\* | Complex flows requiring different handling per tab, or security-sensitive operations | Auth login/logout, payment status |
\| \*\*Raw actions\*\* | When you want minimal code and all tabs share the exact same reducer logic | |
\| \*\*Custom events\*\* | When tabs might need to re-fetch, re-verify, or handle the event differently | |

The auth code uses custom events because login requires server re-verification, and logout needs immediate local state clearing — two very different paths.

\---

\### Q12: What happens if a user has 50 tabs open and dispatches a cart action?

\*\*A:\*\* The action is broadcast once, and all 49 other tabs receive it. Each tab re-dispatches it locally, triggering a re-render. For a simple cart, this is fine. But if the reducer is expensive or the component tree is large, you could see performance issues. In practice, browsers handle this well for moderate state updates. For heavy cases, you could debounce or batch broadcasts.

\---

\### Q13: How would you handle non-serializable data in actions when using \`BroadcastChannel\`?

\*\*A:\*\* \`BroadcastChannel\` uses the \*\*Structured Clone Algorithm\*\*, which supports most JS types but NOT functions, \`Symbol\`, \`Map\`, \`Set\`, or DOM nodes. If your action contains these, \`postMessage\` throws a \`DataCloneError\`. The fix is to ensure all actions are serializable (plain objects with JSON-safe values). Redux Toolkit already warns about non-serializable state/actions — follow those warnings.

\---

\### Q14: How would you test \`cartSyncMiddleware\` in a unit test?

\*\*A:\*\*

\`\`\`typescript
import { configureStore } from "@reduxjs/toolkit";

// Mock BroadcastChannel since it's not available in Jest/jsdom
class MockBroadcastChannel {
  postMessage = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}
global.BroadcastChannel = MockBroadcastChannel as any;

test("middleware broadcasts cart actions", () => {
  const store = configureStore({
    reducer: { cart: cartReducer },
    middleware: (getDefault) => getDefault().concat(cartSyncMiddleware),
  });

  store.dispatch({ type: "cart/addItem", payload: { id: 1 } });

  // Assert that postMessage was called with the action
  expect(mockChannel.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: "cart/addItem" })
  );
});

test("middleware does NOT broadcast non-cart actions", () => {
  store.dispatch({ type: "user/updateName", payload: "John" });
  expect(mockChannel.postMessage).not.toHaveBeenCalled();
});
\`\`\`

\---

\### Q15: Why might \`useSessionRevalidation\` dispatch \`fetchCurrentUser()\` on every visibility change, and how could you optimize it?

\*\*A:\*\* It fires every time the user alt-tabs back, which could mean unnecessary API calls. Optimizations:

1\. \*\*Add a time threshold:\*\* Only re-validate if it's been > 5 minutes since the last check.
2\. \*\*Check auth state first:\*\* If the user was already logged out, skip the fetch.
3\. \*\*Abort previous requests:\*\* Use an \`AbortController\` so rapid tab switches don't pile up network requests.

\`\`\`typescript
let lastChecked = 0;

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    const now = Date.now();
    if (now - lastChecked > 5 \* 60 \* 1000) { // 5 min
      lastChecked = now;
      dispatch(fetchCurrentUser());
    }
  }
}
\`\`\`

**SSE** itself is lightweight because idle connections don't continuously consume request CPU, but at enterprise scale the challenge is managing a large number of concurrent long-lived connections. I would consider authentication and tenant-level authorization, connection limits, proxy/load-balancer timeouts, heartbeats, buffering, reconnection and event IDs, duplicate handling, backpressure, and horizontal scaling. If events originate across multiple service instances, I'd typically use Kafka/Redis or another event broker between the business services and the SSE layer.

**WebSocket** starts with an HTTP Upgrade handshake, but then switches to the WebSocket protocol because it needs persistent, full-duplex, message-oriented communication. SSE can remain HTTP because its requirement is only server-to-client streaming; WebSocket needs both client-to-server and server-to-client communication over the same connection
