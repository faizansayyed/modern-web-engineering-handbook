# React Advanced Components — Senior Frontend Interview Guide

> A focused senior-level guide covering real-time communication, streaming, server-state management, performance, background processing, uploads, forms, and cross-tab communication.
>
> Each topic contains only what is useful for an interview: **what it is, when to use it, data-flow diagram, a practical React/TypeScript example, and key interview points.**

## Contents

1. [SSE](#1-sse-server-sent-events)
2. [WebSockets](#2-websockets)
3. [Fetch Streams](#3-fetch-streams-and-large-downloads)
4. [TanStack Query](#4-tanstack-query)
5. [Debouncing and Throttling](#5-debouncing-and-throttling)
6. [Web Workers](#6-web-workers)
7. [Chunked / Resumable Upload](#7-chunked-resumable-file-upload)
8. [React Hook Form](#8-react-hook-form)
9. [Service Workers](#9-service-workers)
10. [BroadcastChannel](#10-broadcastchannel)
11. [Storage Events](#11-storage-events)

---

# 1. SSE (Server-Sent Events)

## What is SSE?

**Server-Sent Events (SSE)** allows a server to continuously push text events to a browser over a long-lived HTTP connection.

The browser uses the native `EventSource` API. It is **one-way: server → browser**.

### When to use

- Notifications
- Job/import progress
- Live dashboards
- Log streaming
- Queue status
- Live metrics where the client mainly receives updates

### When not to use

Use WebSocket when the client also needs frequent real-time messages to the server.

## Data flow

```text
React Component
      │
      │ new EventSource("/api/events")
      ▼
Browser EventSource
      │
      │ GET /api/events
      ▼
Backend
      │
      │ text/event-stream
      │
      ├── event: order
      ├── id: 123
      └── data: {...}
             │
             ▼
      EventSource.onmessage
             │
             ▼
        React state
             │
             ▼
             UI

Network failure
      │
      ▼
EventSource reconnects
      │
      ▼
Last-Event-ID can help resume
```

## Example

```tsx
import { useEffect, useState } from "react";

type Order = {
  id: string;
  status: string;
};

export function OrdersStream() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.onmessage = (event) => {
      const order: Order = JSON.parse(event.data);
      setOrders((current) => [order, ...current]);
    };

    source.onerror = () => {
      // EventSource normally reconnects automatically.
      console.log("SSE connection interrupted");
    };

    return () => source.close();
  }, []);

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          {order.id}: {order.status}
        </li>
      ))}
    </ul>
  );
}
```

### Server example

```ts
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const timer = setInterval(() => {
    const event = {
      id: Date.now(),
      status: "processing",
    };

    res.write(`id: ${event.id}\n`);
    res.write(`event: order\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }, 1500);

  req.on("close", () => clearInterval(timer));
});
```

### Senior interview points

- SSE is **server → client**.
- It works over normal HTTP.
- `EventSource` provides built-in reconnect behavior.
- `id` + `Last-Event-ID` can support recovery.
- Use heartbeats where infrastructure may close idle connections.
- For multiple backend instances, shared state/pub-sub may be required.
- Always close the connection when the component unmounts.

[MDN — EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

---

# 2. WebSockets

## What are WebSockets?

WebSockets provide a persistent, **full-duplex** connection between browser and server.

After the initial HTTP upgrade, both sides can send messages whenever required.

### When to use

- Chat
- Multiplayer applications
- Collaborative editing
- Presence
- Real-time commands
- Low-latency bidirectional applications

### When not to use

For simple server-only notifications, SSE is usually simpler.

## Data flow

```text
React Component
      │
      │ new WebSocket(...)
      ▼
HTTP Upgrade
      │
      ▼
WebSocket Connection
      │
      ├──────── Server → Client ───────► onmessage
      │                                      │
      │                                      ▼
      │                                 React state
      │
      └──────── Client → Server ───────► send()
                                             │
                                             ▼
                                          Server

Disconnect
    │
    ▼
onclose
    │
    ▼
Reconnect + resync if required
```

## Example

```tsx
import { useEffect, useRef, useState } from "react";

export function Chat({ roomId }: { roomId: string }) {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket("wss://api.example.com/ws");
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "SUBSCRIBE",
          roomId,
        })
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((current) => [...current, message.text]);
    };

    socket.onerror = () => {
      console.error("WebSocket error");
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => socket.close(1000, "component unmounted");
  }, [roomId]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "MESSAGE", text }));
    }
  };

  return null;
}
```

### Senior interview points

- WebSocket is **bidirectional**.
- `readyState` tells you connection state.
- `bufferedAmount` helps identify outgoing buffer pressure.
- WebSocket does not automatically give you application-level message recovery.
- Production systems often need message IDs, acknowledgements, reconnect, replay/resync, and idempotency.
- Authentication and authorization must be enforced server-side.

[MDN — WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

# 3. Fetch Streams and Large Downloads

## What are Fetch Streams?

The Fetch API can expose the response body as a `ReadableStream`.

Instead of waiting for the complete response, the browser can process data **incrementally as chunks arrive**.

### When to use

- Large downloads
- NDJSON
- AI-generated text
- Log streams
- Progressive processing
- Large response transformation

## Data flow

```text
fetch()
   │
   ▼
Response
   │
   ▼
response.body
   │
   ▼
ReadableStream
   │
   ▼
getReader()
   │
   ▼
read()
   │
   ├── chunk ──► decode / parse / process
   │                  │
   │                  ▼
   │              application
   │
   └── done ────► finish

Slow consumer
      │
      ▼
Backpressure
```

## Example

```tsx
async function streamDownload(
  signal: AbortSignal,
  onChunk: (text: string) => void
) {
  const response = await fetch("/api/large-file", { signal });

  if (!response.ok || !response.body) {
    throw new Error("Streaming response unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    const text = decoder.decode(value, { stream: true });
    onChunk(text);
  }

  onChunk(decoder.decode());
}
```

### React usage

```tsx
useEffect(() => {
  const controller = new AbortController();

  streamDownload(controller.signal, (chunk) => {
    setOutput((current) => current + chunk);
  });

  return () => controller.abort();
}, []);
```

### Senior interview points

- `response.body` is a `ReadableStream`.
- `getReader()` gives explicit control over reading.
- `TextDecoder` converts bytes into text safely across chunks.
- Streams avoid buffering the entire response before processing.
- `AbortController` is important for cancellation.
- Backpressure matters when the consumer cannot process data as quickly as the producer generates it.

[MDN — Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)  
[MDN — Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

# 4. TanStack Query

## What is TanStack Query?

TanStack Query is primarily a **server-state management and caching library**.

It handles fetching, caching, freshness, background refetching, retries, mutations, and synchronization of remote data.

### When to use

- REST/GraphQL data
- Shared API data
- Pagination
- Infinite queries
- Background refresh
- Optimistic updates
- Server-state caching

### Key idea

```text
Redux / Context
    → application/client state

TanStack Query
    → remote/server state
```

## Data flow

```text
Component
    │
    ▼
useQuery()
    │
    ▼
Query Cache
    │
    ├── Fresh ─────► return cached data
    │
    └── Missing/Stale
             │
             ▼
          queryFn
             │
             ▼
            API
             │
       ┌─────┴─────┐
       ▼           ▼
    success      error
       │           │
       ▼           ▼
 update cache    retry/error
       │
       ▼
   Component
```

### Mutation flow

```text
useMutation()
      │
      ▼
 onMutate()
      │
      ▼
Optimistic cache update
      │
      ▼
    API
   /   \
success  error
  │        │
  ▼        ▼
invalidate rollback
  │
  ▼
refetch
```

## Example

```tsx
const products = useQuery({
  queryKey: ["products", { page, filter }],
  queryFn: ({ signal }) =>
    fetchProducts({ page, filter, signal }),
  staleTime: 30_000,
});
```

### Optimistic mutation

```tsx
const mutation = useMutation({
  mutationFn: updateProduct,

  onMutate: async (product) => {
    await queryClient.cancelQueries({
      queryKey: ["products"],
    });

    const previous = queryClient.getQueryData([
      "products",
      { page, filter },
    ]);

    queryClient.setQueryData(
      ["products", { page, filter }],
      (old) => updateOptimistically(old, product)
    );

    return { previous };
  },

  onError: (_error, _product, context) => {
    queryClient.setQueryData(
      ["products", { page, filter }],
      context?.previous
    );
  },

  onSettled: () => {
    queryClient.invalidateQueries({
      queryKey: ["products"],
    });
  },
});
```

### Senior interview points

- `queryKey` identifies cached data.
- `staleTime` controls how long data is considered fresh.
- `gcTime` controls inactive cache retention.
- Query cancellation can use the `signal` passed to `queryFn`.
- Optimistic updates require rollback handling.
- Query data is not a replacement for all client-side state.
- Query-key design is important for predictable invalidation.

[TanStack Query — React Documentation](https://tanstack.com/query/latest/docs/framework/react)

---

# 5. Debouncing and Throttling

## What are debounce and throttle?

### Debounce

Wait until events stop for a period before executing.

**Example:** Search API after the user stops typing.

### Throttle

Allow execution at most once during a defined interval.

**Example:** Scroll or resize handling.

## Data flow

```text
Debounce

Typing:  a → ab → abc → abcd
          │    │    │     │
          └────┴────┴─────┘
                  │
             wait 300ms
                  │
                  ▼
               API call
```

```text
Throttle

scroll events:  • • • • • • • • •
                │
                ▼
             throttle
                │
                ├── execute
                │
                ├── ignore / limit
                │
                ├── execute
                │
                └── execute
```

## Debounced search example

```tsx
const controllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  const timer = setTimeout(async () => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const result = await searchProducts(query, {
        signal: controller.signal,
      });

      setResults(result);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setError(error);
      }
    }
  }, 300);

  return () => clearTimeout(timer);
}, [query]);
```

## Throttle example

```ts
function throttle(
  fn: () => void,
  wait: number
) {
  let lastRun = 0;

  return () => {
    const now = Date.now();

    if (now - lastRun >= wait) {
      lastRun = now;
      fn();
    }
  };
}
```

### Senior interview points

- Debounce waits for **silence**.
- Throttle limits **frequency**.
- Debounce does not automatically cancel an already-running request.
- Pair search debouncing with `AbortController`.
- For visual updates, `requestAnimationFrame` can be useful.
- `useDeferredValue` changes React rendering priority; it does not reduce the number of source events.

[MDN — setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)  
[React — useDeferredValue](https://react.dev/reference/react/useDeferredValue)

---

# 6. Web Workers

## What is a Web Worker?

A Web Worker runs JavaScript outside the page's main thread.

It is useful when computation is heavy enough to cause long main-thread tasks and UI jank.

### When to use

- Large JSON parsing
- Data aggregation
- Image processing
- Compression
- Client-side search indexing
- CPU-heavy calculations

### When not to use

Do not use a worker merely because code exists. Communication and serialization also have a cost.

## Data flow

```text
Main Thread
    │
    │ postMessage()
    ▼
Worker Thread
    │
    │ CPU-heavy work
    ▼
Result
    │
    │ postMessage()
    ▼
Main Thread
    │
    ▼
React state / UI

Large ArrayBuffer
    │
    └── transferable object
            ▼
       ownership moves
       instead of copying
```

## React example

```tsx
useEffect(() => {
  const worker = new Worker(
    new URL("./json.worker.ts", import.meta.url),
    { type: "module" }
  );

  worker.onmessage = (event) => {
    setResult(event.data);
  };

  worker.onerror = () => {
    setStatus("Worker failed");
  };

  worker.postMessage({
    type: "PROCESS",
    payload: largeJson,
  });

  return () => worker.terminate();
}, [largeJson]);
```

### Worker example

```ts
self.onmessage = (event) => {
  if (event.data.type === "PROCESS") {
    const result = expensiveAggregation(
      event.data.payload
    );

    self.postMessage({
      type: "DONE",
      result,
    });
  }
};

export {};
```

### Transferable data

```ts
worker.postMessage(buffer, [buffer]);
```

### Senior interview points

- Workers cannot directly access the DOM.
- Communication uses `postMessage`.
- Structured cloning can be expensive for large objects.
- Transferable objects can move ownership of binary data.
- Always terminate workers owned by a component.
- Use a typed message protocol for larger applications.

[MDN — Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

---

# 7. Chunked / Resumable File Upload

## What is chunked upload?

A large file is divided into smaller chunks.

Each chunk can be uploaded independently, retried, tracked, and resumed.

### When to use

- Large files
- Unstable networks
- Mobile uploads
- Long-running uploads
- Cloud object storage

## Data flow

```text
File
 │
 ├── slice() ──► Chunk 0 ──► upload
 │
 ├── slice() ──► Chunk 1 ──► upload
 │
 ├── slice() ──► Chunk 2 ──► retry
 │
 └── slice() ──► Chunk N ──► upload
                         │
                         ▼
                    Server / Object Storage
                         │
                         ▼
                    Persist parts
                         │
                         ▼
              POST /uploads/:id/complete
                         │
                         ▼
                   Final object
```

## Resume flow

```text
User reconnects
      │
      ▼
GET /uploads/:id
      │
      ▼
Uploaded parts = [0, 1, 3]
      │
      ▼
Upload missing part 2
      │
      ▼
Complete upload
```

## Client example

```tsx
const CHUNK_SIZE = 5 * 1024 * 1024;

async function uploadFile(file: File) {
  const init = await api("/uploads/initiate", {
    method: "POST",
    body: JSON.stringify({
      name: file.name,
      size: file.size,
    }),
  });

  for (
    let index = 0;
    index < init.totalChunks;
    index++
  ) {
    const start = index * CHUNK_SIZE;
    const chunk = file.slice(
      start,
      start + CHUNK_SIZE
    );

    await retry(() =>
      api(
        `/uploads/${init.uploadId}/parts/${index}`,
        {
          method: "PUT",
          body: chunk,
        }
      )
    );
  }

  return api(
    `/uploads/${init.uploadId}/complete`,
    { method: "POST" }
  );
}
```

### Production API

```text
POST   /uploads/initiate
       → uploadId, chunkSize, uploadedParts

PUT    /uploads/:id/parts/:index
       → store one part idempotently

GET    /uploads/:id
       → return completed parts

POST   /uploads/:id/complete
       → verify and finalize

DELETE /uploads/:id
       → abort and clean up
```

### Senior interview points

- Make part uploads idempotent.
- Use checksums/integrity validation.
- Limit concurrent uploads rather than uploading every chunk simultaneously.
- Retry with exponential backoff and jitter.
- Persist upload state so the operation can resume.
- In production, cloud multipart upload or a proven resumable protocol may be preferable.
- Never trust client-reported file type, size, or checksum without server-side validation.

---

# 8. React Hook Form

## What is React Hook Form?

React Hook Form manages form state and validation while minimizing unnecessary rerenders.

It is particularly useful for large enterprise forms with dynamic fields and complex validation.

### When to use

- Large forms
- Multi-step forms
- Dynamic field arrays
- Nested data
- Schema validation
- Reusable form sections
- Controlled third-party inputs

## Data flow

```text
useForm()
    │
    ├── register()
    │      │
    │      ▼
    │   Native input
    │
    ├── Controller
    │      │
    │      ▼
    │ Controlled component
    │
    ├── useWatch()
    │      │
    │      ▼
    │ Specific field subscription
    │
    ├── useFieldArray()
    │      │
    │      ▼
    │ Dynamic rows
    │
    └── resolver
           │
           ▼
       validation
           │
           ▼
     handleSubmit()
        /       \
     valid     invalid
       │          │
       ▼          ▼
      API       errors
       │
       ▼
   setError()
```

## Example

```tsx
type OrderForm = {
  email: string;
  items: {
    name: string;
  }[];
};

const form = useForm<OrderForm>({
  defaultValues: {
    email: "",
    items: [{ name: "" }],
  },
  mode: "onBlur",
});

const items = useFieldArray({
  control: form.control,
  name: "items",
});

const submit = form.handleSubmit(async (values) => {
  try {
    await saveOrder(values);
  } catch {
    form.setError("email", {
      type: "server",
      message: "Email is already registered",
    });
  }
});

return (
  <form onSubmit={submit}>
    <input {...form.register("email")} />

    {form.formState.errors.email?.message}

    {items.fields.map((field, index) => (
      <input
        key={field.id}
        {...form.register(`items.${index}.name`)}
      />
    ))}

    <button type="submit">Save</button>
  </form>
);
```

### Senior interview points

- Prefer `register` for native inputs.
- Use `Controller` for controlled third-party components.
- `useWatch` helps isolate subscriptions.
- `useFieldArray` handles dynamic collections.
- Use `field.id` as the React key for field-array rows.
- Server validation errors should be mapped back into the form.
- Accessibility must be considered: labels, errors, keyboard behavior, focus management, and semantic controls.

[React Hook Form — Documentation](https://react-hook-form.com/docs)

---

# 9. Service Workers

## What is a Service Worker?

A Service Worker is a browser worker that can sit between the page and the network.

It can intercept requests and enable caching, offline experiences, background capabilities, and push-related workflows.

### When to use

- PWA/offline support
- Static asset caching
- Network fallback
- Offline pages
- Push notifications
- Background synchronization

### Web Worker vs Service Worker

```text
Web Worker
→ CPU / background computation

Service Worker
→ network interception / browser application lifecycle
```

## Data flow

```text
Browser / React
      │
      │ register("/sw.js")
      ▼
Service Worker
      │
      ├── install
      │      └── cache app shell
      │
      ├── activate
      │      └── remove old caches
      │
      └── fetch
             │
             ├── cache HIT ──► cached response
             │
             └── cache MISS
                    │
                    ▼
                  Network
                    │
                    ▼
               cache response
```

## React registration

```tsx
useEffect(() => {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js")
    .catch(console.error);
}, []);
```

### Service Worker example

```js
const CACHE_NAME = "app-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL)
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          caches.match("/offline.html")
        )
      );
    })
  );
});
```

### Senior interview points

- Service Workers require a secure context in normal production use.
- They have their own lifecycle: install → activate → fetch/message.
- Cache strategy must match the resource: cache-first, network-first, stale-while-revalidate, etc.
- Be careful with cache invalidation and application versioning.
- A Service Worker is not a replacement for WebSocket or SSE.
- Test update behavior carefully because an old worker may remain active during an update.

[MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

# 10. BroadcastChannel

## What is BroadcastChannel?

`BroadcastChannel` allows browser contexts on the **same origin** to communicate through a named channel.

It is useful for communication between tabs, windows, iframes, and workers.

### When to use

- Cross-tab logout
- Theme synchronization
- Cart synchronization
- Cache invalidation
- Application events

## Data flow

```text
Tab A
  │
  │ postMessage({ type: "LOGOUT" })
  ▼
BroadcastChannel("app-events")
  │
  ├──────────────► Tab B
  │                  │
  │                  ▼
  │             message event
  │                  │
  │                  ▼
  │             clear state
  │
  └──────────────► Tab C
                     │
                     ▼
                 clear state
```

## React example

```tsx
useEffect(() => {
  const channel = new BroadcastChannel("app-events");

  const handleMessage = (
    event: MessageEvent
  ) => {
    if (event.data?.type === "LOGOUT") {
      queryClient.clear();
      setUser(null);
      navigate("/login");
    }
  };

  channel.addEventListener(
    "message",
    handleMessage
  );

  return () => {
    channel.removeEventListener(
      "message",
      handleMessage
    );
    channel.close();
  };
}, []);
```

### Send an event

```ts
const channel = new BroadcastChannel("app-events");

channel.postMessage({
  type: "LOGOUT",
});

channel.close();
```

### TanStack Query example

Broadcast an invalidation signal instead of a large dataset:

```ts
channel.postMessage({
  type: "PRODUCTS_CHANGED",
});
```

Receiver:

```ts
if (event.data?.type === "PRODUCTS_CHANGED") {
  queryClient.invalidateQueries({
    queryKey: ["products"],
  });
}
```

### Senior interview points

- Same-origin browser communication.
- It does not require a server connection.
- It is not a durable message queue.
- Validate incoming message structures.
- Close channels during cleanup.
- Avoid rebroadcast loops.
- For important data, treat the broadcast as an **invalidation signal**, not the source of truth.

### BroadcastChannel vs WebSocket

```text
BroadcastChannel
Browser context ↔ browser context

WebSocket
Browser ↔ server
```

[MDN — BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

---

# 11. Storage Events

## What is the `storage` event?

The `storage` event allows one browser document to detect a Web Storage change made by **another document**.

The most common example is using `localStorage` for simple cross-tab coordination.

### Important rule

The document that calls `localStorage.setItem()` does **not** receive its own `storage` event.

## Data flow

```text
Tab A
  │
  │ localStorage.setItem(
  │   "auth-event",
  │   "LOGOUT"
  │ )
  ▼
Browser Web Storage
  │
  ├──────────────► Tab B
  │                  │
  │                  ▼
  │             storage event
  │                  │
  │                  ▼
  │             clear auth
  │
  └──────────────► Tab C
                     │
                     ▼
                 clear auth

Tab A
  └── does NOT receive its own storage event
```

## Basic example

```ts
window.addEventListener(
  "storage",
  (event) => {
    if (event.key === "theme") {
      console.log(
        "Theme changed:",
        event.newValue
      );
    }
  }
);
```

From another tab:

```ts
localStorage.setItem("theme", "dark");
```

## Cross-tab logout

### Sender

```ts
localStorage.setItem(
  "auth-event",
  JSON.stringify({
    type: "LOGOUT",
    timestamp: Date.now(),
  })
);
```

### Receiver

```tsx
useEffect(() => {
  const handleStorage = (
    event: StorageEvent
  ) => {
    if (
      event.key !== "auth-event" ||
      !event.newValue
    ) {
      return;
    }

    const message = JSON.parse(event.newValue);

    if (message.type === "LOGOUT") {
      queryClient.clear();
      setUser(null);
      navigate("/login");
    }
  };

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () =>
    window.removeEventListener(
      "storage",
      handleStorage
    );
}, []);
```

## Storage event vs BroadcastChannel

| Requirement | Better choice |
|---|---|
| Simple cross-tab state notification | `storage` |
| Rich structured messages | `BroadcastChannel` |
| Need `oldValue` / `newValue` | `storage` |
| Frequent application messages | `BroadcastChannel` |
| Persist a small current value | `localStorage` |
| Server communication | HTTP / SSE / WebSocket |
| Durable server-side events | Server event log / message broker |

## Important interview points

- `localStorage` values are strings.
- `localStorage` is synchronous.
- Avoid large frequent reads/writes on hot UI paths.
- The initiating document does not receive its own storage event.
- `storage` is not a message queue.
- Do not store highly sensitive secrets in `localStorage`.
- For authentication, prefer an architecture using appropriately protected credentials, such as secure `HttpOnly` cookies where applicable.

### Production pattern

Instead of storing an entire product response:

```ts
localStorage.setItem(
  "products",
  JSON.stringify(hugeProductList)
);
```

use a small invalidation signal:

```ts
localStorage.setItem(
  "products-version",
  String(Date.now())
);
```

Then:

```ts
window.addEventListener(
  "storage",
  (event) => {
    if (event.key === "products-version") {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    }
  }
);
```

This keeps the server/TanStack Query cache as the source of truth.

[MDN — Window: storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)  
[MDN — Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

---

# Senior-Level Quick Decision Map

```text
What problem are you solving?
             │
             ├── Server continuously pushes updates
             │       └── SSE
             │
             ├── Browser ↔ server real-time communication
             │       └── WebSocket
             │
             ├── Incrementally consume a large HTTP response
             │       └── Fetch Streams
             │
             ├── Cache / synchronize API data
             │       └── TanStack Query
             │
             ├── Wait until user stops typing
             │       └── Debounce
             │
             ├── Limit execution during continuous events
             │       └── Throttle
             │
             ├── Heavy CPU work in browser
             │       └── Web Worker
             │
             ├── Large unreliable file upload
             │       └── Chunked / resumable upload
             │
             ├── Complex business form
             │       └── React Hook Form
             │
             ├── Cross-tab application messaging
             │       └── BroadcastChannel
             │
             └── Simple cross-tab storage notification
                     └── storage event
```

# Senior Interview Answer Pattern

For any of these topics, answer in this order:

1. **What problem does it solve?**
2. **Why did you choose it?**
3. **How does data flow?**
4. **What happens on failure or cancellation?**
5. **How does it behave at production scale?**

Example:

> "I would use SSE because the requirement is server-to-client progress updates. The browser opens one long-lived HTTP connection and receives events through EventSource. I would close it on unmount, rely on reconnect behavior, and use event IDs for recovery. At scale, I would consider connection limits, gateway buffering, heartbeats, shared pub/sub, observability, and authorization."

# Final Comparison

| Topic | Direction | Best use case |
|---|---|---|
| SSE | Server → Browser | Notifications / progress |
| WebSocket | Browser ↔ Server | Real-time bidirectional apps |
| Fetch Streams | Server → Browser | Incremental large responses |
| TanStack Query | Browser ↔ API | Server-state caching |
| Debounce | Event → delayed action | Search / autosave |
| Throttle | Events → limited actions | Scroll / resize |
| Web Worker | Main thread ↔ Worker | CPU-heavy computation |
| Chunked upload | Browser → Server/Storage | Large reliable uploads |
| React Hook Form | UI ↔ Form state | Complex forms |
| Service Worker | Browser ↔ Network | Offline / caching |
| BroadcastChannel | Browser context ↔ context | Cross-tab messaging |
| Storage event | Storage → other documents | Simple cross-tab notification |

# Reference Links

- [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [MDN Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [MDN Storage Event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
- [TanStack Query React](https://tanstack.com/query/latest/docs/framework/react)
- [React Hook Form](https://react-hook-form.com/docs)
- [React Hooks](https://react.dev/reference/react/hooks)
