# SOLID Principles & Design Patterns for React / JavaScript

> A simple, interview-friendly guide to writing clean, maintainable React and JavaScript code.

---

## 1. SOLID Principles

**SOLID** is a set of 5 software design principles that help make code **maintainable, reusable, flexible, and easier to test**.

They are not React-specific. They can be used in JavaScript, TypeScript, React, backend code, and UI architecture.

### S — Single Responsibility Principle (SRP)

> **One thing should have one main responsibility.**

#### ❌ Bad

```tsx
function UserPage() {
  // fetch users
  // validate users
  // format users
  // handle authentication
  // render users
}
```

The component is doing too many things.

#### ✅ Better

```tsx
function UserPage() {
  const { users } = useUsers();

  return <UserList users={users} />;
}
```

```tsx
function UserList({ users }) {
  return users.map(user => <UserCard user={user} />);
}
```

```tsx
function useUsers() {
  // fetching/state logic
}
```

Now each part has a clear responsibility:

- `UserPage` → coordinates
- `useUsers` → data/state logic
- `UserList` → list UI
- `UserCard` → individual user UI

**Interview:** SRP means a component, function, or module should have one clear responsibility.

---

### O — Open/Closed Principle (OCP)

> **Code should be open for extension but closed for modification.**

You should be able to add new behavior without constantly changing existing code.

#### Example

```tsx
<Button variant="primary" />
<Button variant="danger" />
<Button variant="success" />
```

The button can support new variants without rewriting its basic structure.

**Interview:** OCP means we should extend existing behavior rather than repeatedly modifying stable code.

---

### L — Liskov Substitution Principle (LSP)

> **A replacement should work wherever the original is expected.**

Suppose your application expects a button:

```tsx
<Button onClick={handleClick}>
  Save
</Button>
```

A replacement such as:

```tsx
<PrimaryButton onClick={handleClick}>
  Save
</PrimaryButton>
```

should still behave like a button and call `onClick` correctly.

If the replacement changes the expected behavior, it violates LSP.

**Interview:** LSP means implementations should be safely replaceable without breaking expected behavior.

---

### I — Interface Segregation Principle (ISP)

> **Don't force something to depend on things it doesn't need.**

This is especially useful with TypeScript props/interfaces.

#### ❌ Too large

```tsx
interface UserProps {
  name: string;
  email: string;
  age: number;
  address: string;
  phone: string;
  avatar: string;
  permissions: string[];
}
```

If a component only needs the name, this is unnecessary.

#### ✅ Focused

```tsx
interface UserNameProps {
  name: string;
}

function UserName({ name }: UserNameProps) {
  return <h2>{name}</h2>;
}
```

**Interview:** ISP means consumers should depend only on the APIs or props they actually need.

---

### D — Dependency Inversion Principle (DIP)

> **High-level code should not depend directly on low-level implementation details.**

#### ❌ Tightly coupled

```tsx
function UserList() {
  const users = await fetch("/api/users");
}
```

The UI directly knows about the API implementation.

#### ✅ Better

```tsx
function UserList({ userService }) {
  const users = await userService.getUsers();
}
```

Now the component doesn't care whether the service uses:

- `fetch`
- Axios
- REST
- GraphQL
- Mock data

This also makes testing easier.

```tsx
const mockUserService = {
  getUsers: () => mockUsers
};
```

**Interview:** DIP means high-level UI/business logic should depend on abstractions rather than concrete implementations.

---

## 2. SOLID in a React Application

A typical structure could look like:

```text
ProductPage
    │
    ├── useProducts()       → data/state logic
    │
    ├── ProductList         → list UI
    │
    ├── ProductCard         → product UI
    │
    └── productService      → API/data access
```

SOLID helps us achieve:

```text
S → Separate responsibilities
O → Extend without constantly modifying existing code
L → Keep interchangeable implementations compatible
I → Keep interfaces/props focused
D → Keep UI independent from concrete implementations
```

---

# 3. Design Patterns

**Design patterns are common, reusable ways to solve recurring software design problems.**

Think of the difference like this:

```text
SOLID
  ↓
Principles
"How should I design my code?"

Design Patterns
  ↓
Reusable solutions
"How can I structure code to solve this common problem?"
```

---

## 4. Custom Hook Pattern

> **Reuse stateful/business logic between React components.**

```tsx
function useUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  return users;
}
```

Now multiple components can use:

```tsx
const users = useUsers();
```

**Use when:** you want to share React logic.

---

## 5. Container / Presentational Pattern

> **Separate data/logic from UI.**

```tsx
function UserContainer() {
  const users = useUsers();

  return <UserList users={users} />;
}
```

```tsx
function UserList({ users }) {
  return users.map(user => <div>{user.name}</div>);
}
```

```text
Container       → data / logic
Presentational  → UI
```

Custom hooks often make this separation cleaner in modern React.

---

## 6. Compound Component Pattern

> **Multiple components work together as one flexible component API.**

```tsx
<Tabs>
  <Tabs.List>
    <Tabs.Tab>Profile</Tabs.Tab>
    <Tabs.Tab>Settings</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel>
    Profile content
  </Tabs.Panel>
</Tabs>
```

Common examples:

- Tabs
- Accordion
- Dropdown
- Modal
- Menu

**Use when:** you want a flexible component API where child components share state.

---

## 7. HOC — Higher-Order Component

> **A function that takes a component and returns an enhanced component.**

```tsx
function withAuth(Component) {
  return function ProtectedComponent(props) {
    if (!isLoggedIn) {
      return <Login />;
    }

    return <Component {...props} />;
  };
}
```

Usage:

```tsx
const ProtectedDashboard = withAuth(Dashboard);
```

**Note:** HOCs are important to understand, especially for older React codebases, but custom hooks are generally preferred for sharing logic in modern React.

---

## 8. Strategy Pattern

> **Choose between different behaviors without changing the main code.**

```tsx
const strategies = {
  price: products => sortByPrice(products),
  name: products => sortByName(products),
  rating: products => sortByRating(products)
};

function sortProducts(products, type) {
  return strategies[type](products);
}
```

Usage:

```tsx
sortProducts(products, "price");
sortProducts(products, "rating");
```

**Use when:** there are multiple ways to perform the same operation.

Examples:

- Sorting
- Filtering
- Payment methods
- Validation rules
- Pricing algorithms

---

## 9. Adapter Pattern

> **Convert one interface/data format into another format your application understands.**

Suppose an API returns:

```js
{
  first_name: "Faizan",
  user_email: "faizan@test.com"
}
```

But your UI expects:

```js
{
  name: "Faizan",
  email: "faizan@test.com"
}
```

Create an adapter:

```tsx
function userAdapter(apiUser) {
  return {
    name: apiUser.first_name,
    email: apiUser.user_email
  };
}
```

Now the UI doesn't need to know the API's structure.

**Use when:** integrating APIs, libraries, or services with different interfaces/data formats.

---

## 10. Facade Pattern

> **Hide complicated logic behind a simple interface.**

Instead of making components deal with:

```text
login()
validateToken()
refreshToken()
getUser()
updateSession()
```

provide:

```tsx
auth.login();
auth.logout();
auth.getCurrentUser();
```

The facade hides the underlying complexity.

**Use when:** a subsystem has many complicated operations and you want a simple API.

---

## 11. Observer Pattern

> **When something changes, notify everyone interested in that change.**

Example:

```text
WebSocket
    ↓
  Event
    ↓
Subscribers
 ├── Notification UI
 ├── Chat UI
 └── Message Counter
```

Common in:

- WebSockets
- Event systems
- Subscriptions
- State management

**Use when:** many parts of the application need to react to the same event/change.

---

## 12. Provider Pattern

> **Make shared state or services available to a component tree.**

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

Then inside the tree:

```tsx
const { user } = useAuth();
```

Common examples:

```text
AuthProvider
ThemeProvider
QueryClientProvider
Redux Provider
```

**Use when:** many components need access to shared state, configuration, or services.

---

# 13. Quick Interview Cheat Sheet

| Concept | Simple meaning | React example |
|---|---|---|
| **SRP** | One responsibility | `UserList` only handles list UI |
| **OCP** | Extend without changing existing code | Button variants |
| **LSP** | Replacement should preserve behavior | `PrimaryButton` behaves like `Button` |
| **ISP** | Keep interfaces focused | Small prop interfaces |
| **DIP** | Depend on abstractions | Component → `userService` |
| **Custom Hook** | Reuse logic | `useUsers()` |
| **Container/Presentational** | Separate logic and UI | `UserContainer` → `UserList` |
| **Compound Components** | Components work together | `Tabs.List`, `Tabs.Panel` |
| **HOC** | Enhance a component | `withAuth()` |
| **Strategy** | Swap behavior | Different sorting strategies |
| **Adapter** | Convert interfaces/data | API model → UI model |
| **Facade** | Hide complexity | `auth.login()` |
| **Observer** | Notify subscribers | WebSocket events |
| **Provider** | Share state/services | `AuthProvider` |

---

# 14. Most Important for a React Developer

You don't need to memorize every design pattern equally.

Prioritize:

```text
★★★★★  SOLID principles
★★★★★  Custom Hooks
★★★★★  Compound Components
★★★★☆  Strategy
★★★★☆  Adapter
★★★★☆  Provider
★★★☆☆  Container / Presentational
★★★☆☆  HOC
★★★☆☆  Facade
★★★☆☆  Observer
```

### One-line summary

> **SOLID gives you design principles; design patterns give you proven structures; together they help you build React applications that are easier to maintain, extend, reuse, and test.**
