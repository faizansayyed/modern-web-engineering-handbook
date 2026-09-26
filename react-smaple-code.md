#  React Interview Sample Code Cheat Sheet

> Practical interview-focused examples for React, TypeScript, APIs,
> performance, architecture, testing, security, and advanced React
> patterns.

------------------------------------------------------------------------

## 1. React Router --- Lazy Routes + Auth Guard + RBAC

Use React Router for client-side navigation. Lazy-load route components
for code splitting and protect routes with authentication/role checks.

``` jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("./Dashboard"));
const Admin = lazy(() => import("./Admin"));
const Login = lazy(() => import("./Login"));

function ProtectedRoute({ roles, children }) {
  const user = getCurrentUser(); // { isAuthenticated, role }

  if (!user?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["user", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
```

**Interview:** Authentication answers "who are you?" and RBAC answers
"what are you allowed to access?"

------------------------------------------------------------------------

## 2. Redux Toolkit --- Global Client State

Use Redux Toolkit when multiple unrelated parts of the application need
shared client-side state.

``` jsx

// Async action
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.name = action.payload.name;
      state.role = action.payload.role;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Component
const { user, loading, error } = useSelector(
  (state) => state.user
);

const dispatch = useDispatch();

useEffect(() => {
  dispatch(fetchUser("123"));
}, [dispatch]);


// Component
const user = useSelector((state) => state.user);
const dispatch = useDispatch();

dispatch(setUser({ name: "Faizan", role: "admin" }));
```

**Key point:** Prefer Redux Toolkit over manually writing Redux
actions/reducers.

------------------------------------------------------------------------

## 3. Context API --- Cross-Cutting Values

Use Context for relatively stable shared values such as theme, locale,
or configuration.

``` jsx
const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Dashboard />
    </ThemeContext.Provider>
  );
}

function Dashboard() {
  const theme = useContext(ThemeContext);

  return <div className={theme}>Dashboard</div>;
}
```

**Redux vs Context:** Context distributes values; Redux provides a
broader state-management architecture with tooling, middleware,
selectors, and predictable updates.

------------------------------------------------------------------------

## 4. TanStack Query --- Query + Mutation + Cache

Use TanStack Query for **server state**: fetching, caching,
synchronization, mutations, and invalidation.

``` jsx
function Users() {
  const queryClient = useQueryClient();

  const { data = [], isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      fetch("/api/users").then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      }),
  });

  const mutation = useMutation({
    mutationFn: (user) =>
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      }).then((res) => res.json()),

    onSuccess: () => {
      // Refresh/invalidate the affected server-state query.
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Failed to load</p>;

  return (
    <>
      {data.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}

      <button onClick={() => mutation.mutate({ name: "John" })}>
        Add User
      </button>
    </>
  );
}
```

**Interview:** Query = read/cache server data. Mutation =
create/update/delete. Invalidation keeps cached data fresh.

------------------------------------------------------------------------

## 5. Custom Hook --- Reusable Stateful Logic

Custom hooks are useful when behavior, not UI, needs to be reused.

``` jsx
function useUsers(search) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/users?search=${encodeURIComponent(search)}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Request failed");

        setUsers(await response.json());
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUsers();

    return () => controller.abort();
  }, [search]);

  return { users, loading };
}
```

Usage:

``` jsx
function UserList() {
  const [search, setSearch] = useState("");
  const { users, loading } = useUsers(search);

  // Render UI...
}
```

**Interview:** The component consumes the behavior without knowing the
API/cancellation implementation.

------------------------------------------------------------------------

# 6. Debounce --- Search

Debounce waits until calls stop for a period before executing.

``` jsx
function useDebounce(value, delay) {
  const [result, setResult] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return result;
}

function Search() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch) {
      searchAPI(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search"
    />
  );
}
```

**Use case:** Search/autocomplete.

------------------------------------------------------------------------

# 7. Throttle --- Scroll / Resize

Throttle limits execution to at most once during a time interval.

``` jsx
function throttle(fn, delay) {
  let lastCall = 0;

  return (...args) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

const handleScroll = throttle(() => {
  console.log(window.scrollY);
}, 200);

window.addEventListener("scroll", handleScroll);
```

**Use case:** Scroll, resize, mouse movement.

**Remember:** Debounce = wait until activity stops. Throttle = run at
controlled intervals.

------------------------------------------------------------------------

# 8. Intersection Observer --- Infinite Scroll / Lazy Loading

Detect when an element enters the viewport without continuously handling
scroll events.

``` jsx
function InfiniteList() {
  const loaderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadNextPage();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <UserList />
      <div ref={loaderRef}>Loading more...</div>
    </>
  );
}
```

**Use case:** Infinite scroll, lazy images/components, visibility
tracking.

------------------------------------------------------------------------

# 9. React Hook Form + Zod/Yup Validation

Use React Hook Form for form state and Zod/Yup for schema validation.

``` jsx
const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      <p>{errors.email?.message}</p>

      <input type="password" {...register("password")} />
      <p>{errors.password?.message}</p>

      <button type="submit">Login</button>
    </form>
  );
}

function formReducer(state, action) {
  switch (action.type) {
    case "CHANGE":
      return {
        ...state,
        [action.field]: action.value,
      };

    case "RESET":
      return {
        name: "",
        email: "",
      };

    default:
      return state;
  }
}

function UserForm() {
  const [form, dispatch] = useReducer(formReducer, {
    name: "",
    email: "",
  });

  const handleChange = (e) => {
    dispatch({
      type: "CHANGE",
      field: e.target.name,
      value: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
      />

      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
      />

      <button type="submit">Submit</button>
      <button type="button" onClick={() => dispatch({ type: "RESET" })}>
        Reset
      </button>
    </form>
  );
}
```

**Interview:** Schema validation keeps business rules centralized and
reusable.

------------------------------------------------------------------------

# 10. Axios + Interceptor + Error Handling + Cancellation

Centralize API configuration and authentication headers.

``` jsx
const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function getUsers(signal) {
  try {
    const response = await api.get("/users", { signal });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) return;

    // Let a shared error handler or caller decide the UI response.
    throw error;
  }
}

function Users() {
  useEffect(() => {
    const controller = new AbortController();

    getUsers(controller.signal).catch(console.error);

    return () => controller.abort();
  }, []);

  return null;
}
```

**Interview:** Interceptors handle cross-cutting concerns;
AbortController prevents unnecessary work and helps avoid stale
requests.

------------------------------------------------------------------------

# 11. Pagination

Keep page state and request the corresponding server page.

``` jsx
import { useEffect, useState } from "react";

function Users() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/users?page=${page}&limit=20`);
        const data = await res.json();
        setUsers(data);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page]);

  return (
    <>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <UserList users={users} />
      )}

      <button
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
      >
        Previous
      </button>

      <button onClick={() => setPage((p) => p + 1)}>
        Next
      </button>
    </>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

function Users() {
  const [page, setPage] = useState(1);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: async () => {
      const res = await fetch(`/api/users?page=${page}&limit=20`);
      return res.json();
    },
    placeholderData: (prevData) => prevData, // keep previous page data
  });

  return (
    <>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <UserList users={users} />
      )}

      <button
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
      >
        Previous
      </button>

      <button onClick={() => setPage((p) => p + 1)}>
        Next
      </button>
    </>
  );
}
```

With TanStack Query, use `["users", page]` as the query key so pages can
be cached separately.

------------------------------------------------------------------------

# 12. Search + Filter + Sort

Keep the source data unchanged and derive the displayed list.

``` jsx
function Users({ users }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState("name");

  const result = useMemo(() => {
    return users
      .filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((user) =>
        role === "all" ? true : user.role === role
      )
      .toSorted((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : b.age - a.age
      );
  }, [users, search, role, sort]);

  return (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select onChange={(e) => setRole(e.target.value)}>
        <option value="all">All</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>

      <select onChange={(e) => setSort(e.target.value)}>
        <option value="name">Name</option>
        <option value="age">Age</option>
      </select>

      {result.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </>
  );
}
```

**Interview:** For large datasets, consider server-side
filtering/sorting/pagination or virtualization rather than processing
everything in the browser.

------------------------------------------------------------------------

# 13. Modal / Toast / Drawer

These are variations of the same UI-state pattern: **controlled
components**.

``` jsx
function Overlay({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="overlay">
      <button onClick={onClose}>Close</button>
      {children}
    </div>
  );
}

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>

      <Overlay open={open} onClose={() => setOpen(false)}>
        Content
      </Overlay>
    </>
  );
}
```

**Interview:** Keep visibility controlled by state and make the UI
component reusable.

------------------------------------------------------------------------

# 14. Error Boundary --- Modern Usage

React still does not provide a function-component API for creating an
Error Boundary. In modern apps, `react-error-boundary` avoids writing
the class boilerplate.

``` jsx
import { ErrorBoundary } from "react-error-boundary";

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={(error) => console.error(error)}
    >
      <Dashboard />
    </ErrorBoundary>
  );
}
```

**Important:** Error boundaries catch rendering/lifecycle errors, not
arbitrary event-handler or normal async errors.

------------------------------------------------------------------------

# 15. JWT + Refresh Token + RBAC

Typical flow:

``` text
Login
  ↓
Access Token + Refresh Token
  ↓
API Request with Access Token
  ↓
401
  ↓
Refresh Token
  ↓
New Access Token
  ↓
Retry Original Request
```

Typical storage model:

``` text
Access Token
→ short-lived
→ sent with API requests

Refresh Token
→ longer-lived
→ preferably Secure + HttpOnly cookie
→ used to obtain a new access token
```

RBAC:

``` jsx
function ProtectedRoute({ roles, children }) {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" />;

  if (!roles.includes(user.role)) {
    return <Navigate to="/forbidden" />;
  }

  return children;
}
```

**Interview:** Authentication identifies the user; authorization
determines permissions.

------------------------------------------------------------------------

# 16. Performance --- React.memo / useMemo / useCallback

### React.memo

Prevents a child from rendering when its props are unchanged.

``` jsx
const UserCard = React.memo(function UserCard({ user }) {
  return <div>{user.name}</div>;
});
```

### useMemo

Memoizes an expensive derived value.

``` jsx
const filteredUsers = useMemo(
  () => expensiveFilter(users, search),
  [users, search]
);
```

### useCallback

Preserves a function reference when that matters for memoized
children/effects.

``` jsx
const handleSelect = useCallback((id) => {
  setSelectedId(id);
}, []);
```

**Important:** Don't add memoization everywhere. First identify a real
rendering or computation cost.

------------------------------------------------------------------------

# 17. useTransition --- Non-Urgent UI Updates

Useful when an update is expensive and should not block urgent
interactions.

``` jsx
function SearchResults() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    const value = e.target.value;

    setQuery(value); // Urgent update

    startTransition(() => {
      updateLargeResultList(value); // Non-urgent update
    });
  }

  return (
    <>
      <input onChange={handleChange} />

      {isPending && <span>Updating...</span>}
    </>
  );
}
```

**Interview:** `useTransition` lets React prioritize urgent updates over
non-urgent rendering work.

------------------------------------------------------------------------

# 18. useDeferredValue --- Defer Expensive Rendering

Useful when the input should remain responsive while a derived UI
catches up.

``` jsx
function Search({ query }) {
  const deferredQuery = useDeferredValue(query);

  return <LargeResultsList query={deferredQuery} />;
}
```

**Difference:** `useTransition` marks an update as non-urgent;
`useDeferredValue` gives you a deferred version of an existing value.

------------------------------------------------------------------------

# 19. useRef --- DOM + Mutable Value

``` jsx
function SearchInput() {
  const inputRef = useRef(null);

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}
```

**Key point:** Updating `ref.current` does not cause a re-render.

------------------------------------------------------------------------

# 20. useImperativeHandle

Expose a controlled imperative API from a child.

``` jsx
const Input = forwardRef(function Input(props, ref) {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => {
      inputRef.current.value = "";
    },
  }));

  return <input ref={inputRef} />;
});
```

Parent:

``` jsx
const ref = useRef();

<Input ref={ref} />

ref.current.focus();
```

**Use sparingly:** Prefer declarative props/state unless imperative
behavior is genuinely required.

------------------------------------------------------------------------

# 21. useSyncExternalStore

Use it when React needs to subscribe safely to an external store.

``` jsx
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);

      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine
  );
}
```

**Interview:** It provides a React-safe subscription mechanism for
external mutable sources.

------------------------------------------------------------------------

# 22. Modern Effect Thinking

A common senior-level question is: **"When should you use useEffect?"**

Use effects primarily to synchronize React with an **external system**:

``` text
React
  ↓
API / WebSocket / DOM / browser API / subscription
```

Avoid using `useEffect` just to calculate derived values:

``` jsx
// Usually unnecessary
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Prefer:

``` jsx
const fullName = `${firstName} ${lastName}`;
```

**Interview:** "If something can be calculated during render, I
generally don't need an effect."

------------------------------------------------------------------------

# 23. Race Conditions in Search/API Calls

Problem:

``` text
Request A → slow
Request B → fast

B returns first
A returns later

A can overwrite B
```

Solution: cancellation or request identity.

``` jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${query}`, {
    signal: controller.signal,
  })
    .then((res) => res.json())
    .then(setResults)
    .catch((error) => {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    });

  return () => controller.abort();
}, [query]);
```

**Interview:** Cancellation prevents stale responses from updating the
UI.

------------------------------------------------------------------------

# 24. Virtualization

For thousands of rows, don't render everything at once.

``` text
10,000 rows
     ↓
Virtualized List
     ↓
Only ~20-50 visible rows rendered
```

Typical libraries:

``` text
react-window
TanStack Virtual
```

**Interview:** Virtualization improves rendering and DOM performance by
rendering only the visible portion of a large collection.

------------------------------------------------------------------------

# 25. Code Splitting

``` jsx
const Reports = lazy(() => import("./Reports"));

<Suspense fallback={<Spinner />}>
  <Reports />
</Suspense>
```

**Interview:** Split large bundles so users don't download code they
don't immediately need.

------------------------------------------------------------------------

# 26. React 19 --- Actions / Form Actions

Modern React supports actions that simplify async form mutations.

Conceptually:

``` jsx
function Form() {
  async function submit(formData) {
    await saveUser(formData);
  }

  return (
    <form action={submit}>
      <input name="email" />
      <button type="submit">Save</button>
    </form>
  );
}
```

**Interview:** React 19 introduced improvements around actions and form
handling, reducing some manual pending/error state management for
supported patterns.

------------------------------------------------------------------------

# 27. Server Components

Server Components allow some components to execute on the server rather
than being sent as client-side JavaScript.

``` text
Server Component
      ↓
Fetch data on server
      ↓
Send rendered result
      ↓
Client Component only where interactivity is required
```

**Interview:** They can reduce client JavaScript and allow server-side
data access, but the exact model depends on the framework, such as
Next.js.

------------------------------------------------------------------------

# 28. SSR + Streaming + Hydration

Typical flow:

``` text
Request
  ↓
Server renders HTML
  ↓
HTML streams to browser
  ↓
Browser displays content
  ↓
JavaScript loads
  ↓
Hydration
  ↓
Interactive React application
```

**Hydration mismatch:** Server HTML and the initial client render don't
match.

Common causes:

``` text
Date/time generated differently
Random values
window/document used during server render
Different conditional rendering
Browser-only APIs
```

**Interview:** "For hydration issues, I first identify the component
whose server and client output differs, then remove non-deterministic
rendering or move browser-only logic to the client/effect boundary."

------------------------------------------------------------------------

# 29. Suspense

Suspense provides a declarative loading boundary.

``` jsx
<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```

Common uses:

``` text
Lazy-loaded components
Streaming UI
Framework-supported async rendering
```

**Interview:** Suspense is a rendering coordination mechanism, not
simply an API-loading library.

------------------------------------------------------------------------

# 30. Web Workers

Move CPU-heavy work away from the main UI thread.

``` text
Main Thread
    |
    | message
    ↓
Web Worker
    |
    | heavy calculation
    ↓
Result
    |
    ↓
Main Thread
```

Example:

``` jsx
const worker = new Worker(
  new URL("./worker.js", import.meta.url)
);

worker.postMessage(largeDataset);

worker.onmessage = (event) => {
  setResult(event.data);
};
```

**Use case:** Large calculations, parsing, transformations, data
processing.

------------------------------------------------------------------------

# 31. Accessibility

Prefer semantic HTML first:

``` jsx
<button onClick={save}>
  Save
</button>
```

instead of:

``` jsx
<div onClick={save}>
  Save
</div>
```

For accessible form relationships:

``` jsx
<label htmlFor="email">Email</label>
<input
  id="email"
  aria-describedby="email-error"
/>
<p id="email-error">Invalid email</p>
```

**Interview:** Accessibility includes semantic HTML, keyboard
navigation, focus management, labels, ARIA where needed, and WCAG
principles.

------------------------------------------------------------------------

# 32. Testing Strategy

### Unit --- Vitest/Jest

``` jsx
expect(add(2, 3)).toBe(5);
```

### Component --- React Testing Library

``` jsx
render(<Login />);

expect(
  screen.getByRole("button", { name: /login/i })
).toBeInTheDocument();
```

### E2E --- Playwright

``` jsx
await page.goto("/login");

await page.getByLabel("Email").fill("test@test.com");
await page.getByLabel("Password").fill("password");
await page.getByRole("button", { name: "Login" }).click();

await expect(page).toHaveURL("/dashboard");
```

**Interview:** Test behavior and user outcomes rather than
implementation details.

------------------------------------------------------------------------

# 33. Micro Frontends + Module Federation

Architecture:

``` text
                Host / Shell
                     |
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    Product MFE   Reports MFE  Portfolio MFE
```

Example:

``` jsx
const Product = lazy(
  () => import("product/Product")
);
```

**Interview:** Module Federation allows independently built remote
modules to be consumed by a host application at runtime. Pay attention
to shared dependencies, contracts, versioning, failure isolation, and
deployment strategy.

------------------------------------------------------------------------

# 34. Feature-Based Architecture

Prefer organizing large applications around business capabilities.

``` text
src/
├── features/
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── userSlice.ts
│   │
│   └── products/
│       ├── components/
│       ├── hooks/
│       └── api/
│
├── shared/
└── app/
```

**Interview:** Related UI, state, API and business logic stay close to
the feature, improving ownership and maintainability.

------------------------------------------------------------------------

# 35. Design System

Reusable components provide consistency across teams.

``` jsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
```

A design system typically includes:

``` text
Components
Design tokens
Typography
Spacing
Colors
Accessibility rules
Interaction patterns
```

**Interview:** It prevents every feature/team from reinventing common UI
patterns.

------------------------------------------------------------------------

# 36. Important Design Patterns

### Compound Components

``` jsx
<Select>
  <Select.Trigger />
  <Select.Options />
</Select>
```

Useful when multiple components share internal state.

### Provider Pattern

``` jsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

Useful for cross-cutting configuration/state.

### Strategy Pattern

``` jsx
const strategies = {
  card: renderCard,
  table: renderTable,
  list: renderList,
};

strategies[viewType](data);
```

Useful when behavior varies based on configuration.

### Adapter Pattern

``` jsx
function adaptUser(apiUser) {
  return {
    id: apiUser.user_id,
    name: apiUser.display_name,
  };
}
```

Useful when the API model differs from the UI model.

### Container / Presentational

``` text
Container
   ↓
Business/data logic
   ↓
Presentational Component
   ↓
UI
```

Still useful conceptually, although custom hooks have reduced the need
for strict separation.

------------------------------------------------------------------------

# 37. Frontend System Design

For a senior interview, don't describe frontend system design as only
"components."

Think about:

``` text
Requirements
     ↓
Architecture
     ↓
Data Flow
     ↓
State Management
     ↓
API / Caching
     ↓
Performance
     ↓
Accessibility
     ↓
Security
     ↓
Observability
     ↓
Testing
     ↓
Deployment
```

Key questions:

``` text
Where does state live?
What is client state vs server state?
How is data cached?
How does the UI behave with slow APIs?
How do we handle failures?
How do we scale large lists?
How do teams own features?
How do we monitor production?
```

------------------------------------------------------------------------

# 38. Frontend Performance Checklist

``` text
Code splitting
Lazy loading
Memoization where justified
Virtualization
Image optimization
Caching
TanStack Query
Debouncing
Throttling
Intersection Observer
Web Workers for CPU-heavy work
Bundle analysis
Core Web Vitals
Avoid unnecessary renders
```

Think in terms of:

``` text
FCP  → First Contentful Paint
LCP  → Largest Contentful Paint
INP  → Interaction to Next Paint
CLS  → Cumulative Layout Shift
```

------------------------------------------------------------------------

# 39. Frontend Observability

For enterprise applications:

``` text
User
 ↓
React App
 ↓
API
 ↓
Backend
```

Capture:

``` text
Errors
Performance
API failures
User/session context
Core Web Vitals
Important business events
```

Typical tools can include:

``` text
Datadog
Sentry
OpenTelemetry
Browser Performance APIs
```

**Interview:** Observability helps answer not just "did it fail?" but
"where, why, for whom, and how often?"

------------------------------------------------------------------------

# 40. Enterprise React Architecture --- Putting It Together

``` text
                         React App
                            |
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
       Router             State             UI
          |                 |                 |
   Lazy Routes       Redux / Context     Design System
   Auth Guards       TanStack Query      Accessibility
   RBAC              Server State
          |                 |
          └────────┬────────┘
                   ↓
                API Layer
                   |
       Axios / Fetch / Interceptors
       JWT / Refresh / Error Handling
       AbortController
                   |
                   ↓
              Performance
                   |
      Debounce / Throttle
      Intersection Observer
      Memoization
      Virtualization
      Web Workers
                   |
                   ↓
                Testing
                   |
      Unit → RTL → Playwright
                   |
                   ↓
              Architecture
                   |
     Feature Modules / MFE
     Module Federation
     Design Patterns
                   |
                   ↓
             Observability
                   |
      Errors / RUM / Web Vitals
```

------------------------------------------------------------------------

# Senior React Interview --- Quick Definitions

  -----------------------------------------------------------------------
  Topic                               One-line answer
  ----------------------------------- -----------------------------------
  Debounce                            Execute after activity stops for a
                                      specified period

  Throttle                            Limit execution to a controlled
                                      frequency

  Intersection Observer               Detect when an element
                                      enters/leaves the viewport

  Redux                               Centralized client-state management

  Context                             Share values without prop drilling

  TanStack Query                      Server-state fetching, caching and
                                      synchronization

  Custom Hook                         Reusable stateful React logic

  React.memo                          Skip child render when props are
                                      unchanged

  useMemo                             Memoize a calculated value

  useCallback                         Memoize a function reference

  useTransition                       Mark updates as non-urgent

  useDeferredValue                    Defer a value used by expensive UI

  useRef                              Persist mutable values / access DOM
                                      without re-render

  useSyncExternalStore                Safely subscribe to external stores

  Suspense                            Declarative rendering/loading
                                      boundary

  Lazy Loading                        Load code only when needed

  Virtualization                      Render only visible items in large
                                      lists

  AbortController                     Cancel fetch/API work

  Error Boundary                      Catch rendering errors and show
                                      fallback UI

  JWT                                 Token-based API authentication

  Refresh Token                       Obtain a new access token

  RBAC                                Restrict access based on user role

  SSR                                 Render initial HTML on the server

  Hydration                           Attach React behavior to
                                      server-rendered HTML

  Server Components                   Components rendered on the server
                                      in supported frameworks

  Web Worker                          Run CPU-heavy JavaScript off the
                                      main thread

  Micro Frontend                      Split a frontend into independently
                                      owned/deployed applications

  Module Federation                   Share/consume modules between
                                      separately built applications

  Design System                       Shared UI components, tokens and
                                      interaction rules

  Feature Architecture                Organize code around business
                                      capabilities

  Observability                       Understand production errors,
                                      performance and behavior
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# Final Interview Mental Model

When asked **"How would you build a large React application?"**,
structure your answer like this:

``` text
1. Routing
   → Lazy loading + protected routes + RBAC

2. State
   → Redux/Context for client state
   → TanStack Query for server state

3. API
   → Axios/Fetch
   → Interceptors
   → JWT/refresh
   → Error handling
   → Cancellation

4. UI
   → Design system
   → Forms + validation
   → Accessibility

5. Performance
   → Code splitting
   → Memoization
   → Debounce/throttle
   → Virtualization
   → Intersection Observer
   → Web Workers when required

6. Reliability
   → Error boundaries
   → Loading/error/empty states
   → Observability

7. Testing
   → Unit
   → RTL
   → Playwright

8. Architecture
   → Feature-based structure
   → Design patterns
   → Micro frontends / Module Federation when justified

9. Rendering
   → CSR / SSR
   → Streaming
   → Hydration
   → Suspense
   → Server Components where supported

10. System Design
    → Scalability
    → Team ownership
    → Data flow
    → Performance
    → Security
    → Reliability
    → Observability
```

**Core principle:** Don't just explain *what* a React API does. For
senior interviews, explain **why you would use it, what problem it
solves, its trade-offs, and how it fits into the larger application
architecture.**
