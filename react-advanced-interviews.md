# React Advanced Components: Senior Interview Q&A and Production Guide

## Contents

- [1. SSE](#1-sse)
- [2. WebSockets](#2-websockets)
- [3. Fetch Streams](#3-fetch-streams)
- [4. TanStack Query](#4-tanstack-query)
- [5. Debouncing and throttling](#5-debouncing-and-throttling)
- [6. Web Workers](#6-web-workers)
- [7. Chunked uploads](#7-chunked-uploads)
- [8. React Hook Form](#8-react-hook-form)
- [9. Service Workers](#9-service-workers)
- [10. Broadcasting Events](#10-broadcasting-events)
- [11. Storage Events](#11-storage-events)


> Scope: SSE, WebSockets, Fetch Streams, TanStack Query, debouncing/throttling, Web Workers, resumable file upload, React Hook Form, Service Workers, Broadcasting Events, and Storage Events.
>
> This guide is designed for hands-on interview preparation. Each chapter moves from fundamentals to architecture and senior-level decisions. Code is intentionally concise and should be adapted with authentication, validation, observability, and tests before production use.

### Senior interview answer framework

For most questions, answer in this order:

1. **Problem:** What does this solve?
2. **Choice:** Why this approach over the nearest alternative?
3. **Implementation:** How does it work in React/browser terms?
4. **Failure:** What happens on cancellation, retry, disconnect, or bad input?
5. **Production:** What changes at scale?

The generic concerns—cleanup, security, backpressure, observability, testing, and horizontal scaling—are consolidated later instead of being repeated in every chapter.


## How to use this guide

1. Read the mental model and draw the architecture from memory.
2. Implement the minimum example without copying.
3. Answer every question aloud in two minutes or less.
4. Add failure handling, security, tests, and observability.
5. Practice the scenario questions as design discussions, not trivia.

## API cheat sheet

| Topic | Main APIs to know | Mental model |
|---|---|---|
| SSE | `EventSource`, `onopen`, `onmessage`, `addEventListener`, `onerror`, `close`, `readyState`, `Last-Event-ID`, `retry`, `text/event-stream` | Server → browser |
| WebSocket | `WebSocket`, `onopen`, `onmessage`, `onerror`, `onclose`, `send`, `readyState`, `bufferedAmount` | Browser ↔ server |
| Fetch Streams | `fetch`, `Response.body`, `ReadableStream`, `getReader`, `read`, `TextDecoder`, `AbortController`, `WritableStream`, `pipeTo` | Read incrementally |
| TanStack Query | `QueryClient`, `useQuery`, `useMutation`, `queryKey`, `queryFn`, `staleTime`, `gcTime`, `invalidateQueries`, `setQueryData`, `cancelQueries` | Server-state cache |
| Debounce/Throttle | `setTimeout`, `clearTimeout`, `Date.now`, `useEffect`, `useRef`, `useCallback`, `AbortController` | Control event frequency |
| Web Workers | `Worker`, `postMessage`, `onmessage`, `onerror`, `terminate`, structured clone, transferable objects | Main thread ↔ worker |
| Service Workers | `navigator.serviceWorker`, `register`, `install`, `activate`, `fetch`, `caches`, `respondWith`, `waitUntil`, `skipWaiting`, `clients.claim`, `postMessage`, `PushManager`, `SyncManager` | Browser network/background layer |
| Chunked upload | `File`, `Blob.slice`, `fetch`, `AbortController`, chunk index, checksum, idempotency, multipart upload | Reliable large transfer |
| React Hook Form | `useForm`, `register`, `Controller`, `useWatch`, `useFormState`, `useFieldArray`, `resolver`, `setError`, `reset`, `trigger` | Form state + validation |
| Broadcasting Events | `BroadcastChannel`, `postMessage`, `message`, `messageerror`, `close` | Tab/window → tab/window |
| Storage Events | `localStorage`, `sessionStorage`, `storage`, `setItem`, `removeItem`, `clear` | Cross-tab storage notification |

## Cross-topic decision map

| Need | Primary choice | Why |
|---|---|---|
| Server continuously pushes text updates | SSE | Simple one-way HTTP stream and native reconnection |
| True two-way real-time channel | WebSocket | Full-duplex communication |
| Incrementally consume one large response | Fetch Streams | Chunk-by-chunk processing and backpressure-aware sinks |
| Cache and synchronize remote server state | TanStack Query | Purpose-built query cache and mutation lifecycle |
| Wait until typing stops | Debounce | Collapses a burst into a final action |
| Limit work while events continue | Throttle | Caps execution rate |
| CPU-heavy browser work | Web Worker | Moves computation away from the main thread |
| Reliable large upload | Chunked upload | Independent retry, pause, resume, and integrity |
| Complex dynamic business form | React Hook Form | Registration, validation, arrays, and isolated subscriptions |
| Cross-tab application messaging | BroadcastChannel | Structured same-origin messages without server involvement |
| Simple cross-tab state notification | Storage event | Browser-native notification when localStorage changes in another document |

## Shared production architecture

```text
React UI
  ├─ presentation components
  ├─ feature hooks and state machines
  ├─ API/transport adapters
  ├─ validation and domain types
  └─ telemetry and error boundaries
          │
          ▼
Edge / API gateway
  ├─ TLS, authentication, authorization
  ├─ CORS / CSRF policy
  ├─ rate limits and quotas
  ├─ request IDs and tracing
  └─ buffering / timeout configuration
          │
          ▼
Application services
  ├─ stateless HTTP APIs
  ├─ real-time connection service
  ├─ cache / database
  ├─ message broker or pub/sub
  └─ object storage and asynchronous workers
```

## Shared interview principle

A senior answer should cover: requirement, data direction, consistency, lifecycle, cancellation, backpressure, failure recovery, security boundary, horizontal scaling, observability, and measurable trade-offs.


# 1. SSE (Server-Sent Events)

## Mental model

The server maintains a persistent HTTP connection and pushes discrete text messages—formatted as `text/event-stream `—to the browser whenever new data is available. The browser's native `EventSource` API consumes this stream, providing built-in connection lifecycle, reconnection, and event parsing.

**Use it for:** notifications, job progress, live dashboards, queue updates, and log tails where the browser mainly listens.

**Do not use it when:** the client must send frequent real-time messages, binary frames are central, or bidirectional latency is required.

## Important concepts, APIs, hooks, and configuration

- `EventSource`
- `text/event-stream`
- `onopen`
- `onmessage`
- `addEventListener`
- `onerror`
- `close`
- `readyState`
- `Last-Event-ID`
- `retry`
- `heartbeat`
- `useEffect`
- `useRef`
- `useState`


## SSE API flow — know this sequence

```text
React component
    │
    │ new EventSource("/api/events")
    ▼
EventSource
    │
    │ GET /api/events
    ▼
Server
    │
    │ Content-Type: text/event-stream
    │
    ├── event: order
    ├── id: 123
    ├── retry: 5000
    ├── data: {...}
    └── blank line  → event dispatched
             │
             ▼
       onopen / onmessage
       addEventListener("order", ...)
             │
             ▼
       React state update
             │
             ├── network error → onerror → browser reconnects
             │                         using retry / Last-Event-ID
             │
             └── component unmount → close()
```

### Complete client example

```tsx
function OrdersStream() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.onopen = () => setStatus("connected");

    source.onmessage = (event) => {
      setOrders(prev => [JSON.parse(event.data), ...prev]);
    };

    source.addEventListener("order", (event) => {
      const order = JSON.parse((event as MessageEvent).data);
      setOrders(prev => [order, ...prev]);
    });

    source.onerror = () => {
      // EventSource normally reconnects automatically.
      setStatus(
        source.readyState === EventSource.CONNECTING
          ? "reconnecting"
          : "error"
      );
    };

    return () => source.close();
  }, []);

  return <div>{status}</div>;
}
```

### SSE server format

```ts
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

res.write(`retry: 5000\n`);
res.write(`id: ${eventId}\n`);
res.write(`event: order\n`);
res.write(`data: ${JSON.stringify(order)}\n\n`);
```

**Interview point:** `retry` tells the browser how long to wait before reconnecting. `id` lets the browser send `Last-Event-ID` on a later connection so the server can resume from a known position.

## Setup from scratch

Install no client library. Create an HTTP endpoint that keeps the response open, sets SSE headers, emits correctly delimited events, and cleans timers on disconnect. In React, create `EventSource` inside an effect or custom hook and close it during cleanup.

### Client example

```tsx
useEffect(() => {
  const source = new EventSource('/api/events');
  source.addEventListener('order', e => setOrders(x => [JSON.parse(e.data), ...x]));
  source.onerror = () => setStatus('reconnecting');
  return () => source.close();
}, []);
```

### Server or companion example

```ts
app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const timer = setInterval(() => res.write(`event: order\nid: ${Date.now()}\ndata: ${JSON.stringify(makeOrder())}\n\n`), 1500);
  req.on('close', () => clearInterval(timer));
});
```

## Choosing the approach

**SSE vs WebSocket vs polling:** choose SSE for one-way text push and simple HTTP behavior; WebSocket for bidirectional low-latency interaction; polling for low-frequency, cache-friendly updates where persistent connections are unnecessary.

## Interview Q&A

### Q13 [Intermediate] Why are blank lines important in the SSE wire format?

**Answer:** An event ends with a blank line. Fields such as `event`, `id`, `retry`, and one or more `data` lines belong to the same event until that delimiter. A missing delimiter can make the browser wait indefinitely.

**Likely follow-up:** How are multiple `data:` lines combined?

### Q14 [Advanced] How do reconnection and missed-event recovery differ?

**Answer:** Native EventSource reconnects automatically, but recovery requires durable event IDs. The server reads `Last-Event-ID`, replays events after it, and then switches to live delivery. Reconnection without replay can lose updates.

**Likely follow-up:** Where would you retain replayable events and for how long?

### Q15 [Senior] Design SSE for thousands of dashboard clients.

**Answer:** Use HTTP/2 where appropriate, disable proxy buffering, set idle timeouts above heartbeat intervals, publish domain events through a broker, give each node a bounded client registry, batch noisy updates, and protect slow consumers. Resume tokens need a durable event log.

**Likely follow-up:** How do you deploy without dropping all clients at once?

### Q16 [Scenario] A customer sees duplicate orders after reconnecting. What do you do?

**Answer:** Treat event IDs as deduplication keys, make client reducers idempotent, investigate overlapping old/new connections, and verify replay boundaries. At-least-once delivery is safer than silently losing an order, so duplicates must be harmless.

**Likely follow-up:** Would you deduplicate in transport, client state, or both?

# 2. WebSockets

## Mental model

After an initial HTTP handshake, the connection upgrades to the WebSocket protocol (ws:// or wss://), establishing a persistent TCP socket that stays open for the duration of the session. Unlike standard HTTP, both the client and server can transmit messages across this single connection at any time without waiting for the other party to initiate a request.

**Use it for:** chat, multiplayer interaction, collaborative editing, device control, presence, and low-latency bidirectional systems.

**Do not use it when:** communication is request-response, updates are infrequent, or one-way HTTP streaming is sufficient.

## Important concepts, APIs, hooks, and configuration

- `WebSocket`
- `ws`
- `wss`
- `open`
- `message`
- `error`
- `close`
- `send`
- `readyState`
- `bufferedAmount`
- `ping/pong`
- `close codes`
- `subprotocols`
- `useEffect`
- `useRef`


## WebSocket API flow — know this sequence

```text
React component
    │
    │ new WebSocket("wss://api.example.com/ws")
    ▼
HTTP Upgrade handshake
    │
    ▼
WebSocket connection
    │
    ├── open → onopen
    │
    ├── server → client → message → onmessage
    │
    ├── client → server → send()
    │
    ├── error → onerror
    │
    ├── close → onclose
    │
    └── bufferedAmount → outgoing queue pressure
             │
             ▼
       React state / UI
             │
             └── unmount → close()
```

### Complete client example

```tsx
useEffect(() => {
  const ws = new WebSocket("wss://api.example.com/ws");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "SUBSCRIBE", roomId }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    setMessages(prev => [...prev, message]);
  };

  ws.onerror = () => {
    setStatus("error");
  };

  ws.onclose = (event) => {
    setStatus(`closed: ${event.code}`);
  };

  return () => ws.close(1000, "component unmounted");
}, [roomId]);
```

### Sending safely

```ts
if (ws.readyState === WebSocket.OPEN) {
  ws.send(JSON.stringify(message));
}

console.log(ws.bufferedAmount);
```

**Interview point:** WebSocket gives you `send()` in both directions, but reliability is your application responsibility: use message IDs, acknowledgements, replay/resync, and idempotent handlers when required.

## Setup from scratch

Choose a server implementation, configure the HTTP upgrade path, TLS termination, authentication handshake, heartbeat, close codes, schema validation, and reconnect policy. Keep transport code in a hook/service rather than presentation components.

### Client example

```tsx
useEffect(() => {
  const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://host/ws`);
  socket.onmessage = e => dispatch(JSON.parse(e.data));
  return () => socket.close(1000, 'component unmounted');
}, []);
```

### Server or companion example

```ts
wss.on('connection', (socket, request) => {
  socket.on('message', raw => {
    const message = parseAndValidate(raw);
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(handle(message)));
  });
});
```

## Choosing the approach

WebSocket vs SSE: WebSocket is full-duplex and supports binary frames, but requires explicit reconnect/state recovery and connection infrastructure. SSE is simpler for server-only push. WebRTC is peer-oriented and solves a different topology.

## Interview Q&A

### Q13 [Intermediate] Why is a WebSocket connection not automatically reliable application messaging?

**Answer:** TCP preserves bytes for one connection, but application messages can still be lost across disconnects. Add message IDs, acknowledgements, replay or resync, ordering rules, and idempotent handlers where delivery matters.

**Likely follow-up:** How do you distinguish delivered from processed?

### Q14 [Advanced] How do you design reconnection?

**Answer:** Use exponential backoff with jitter, stop on intentional close, refresh expired authentication safely, resubscribe after opening, and resynchronize state from a version or cursor instead of assuming no messages were missed.

**Likely follow-up:** How do you prevent a reconnect storm?

### Q15 [Senior] How do WebSockets scale behind a load balancer?

**Answer:** "WebSocket connections are long-lived, so the load balancer needs to support the HTTP upgrade and have idle timeouts aligned with application heartbeats. Each connection stays attached to one WebSocket server, so I avoid relying on in-memory state; if affinity is useful I can use sticky sessions, but shared room and presence state should generally be externalized. For cross-node communication, I use Pub/Sub so an event received by Server A can reach clients connected to Server B. Finally, clients need reconnection with backoff and state resynchronization using versions or cursors so they can recover messages missed during disconnects."

**Likely follow-up:** When is sticky routing acceptable?

### Q16 [Scenario] A slow browser makes server memory grow.

**Answer:** Track `bufferedAmount` or equivalent server queue size, impose per-connection limits, coalesce disposable state updates, pause producers when possible, and disconnect clients that cannot recover. Never permit an unbounded per-socket queue.

**Likely follow-up:** Which messages may be dropped and which require durability?

# 3. Fetch Streams and large downloads

## Mental model

The client processes an HTTP response chunk-by-chunk via `ReadableStream` as bytes arrive from the network, without waiting for the complete payload to buffer in memory. This enables real-time processing of large or continuous data streams—such as video, logs, or generated text—while keeping memory usage low and constant regardless of total response size

**Use it for:** large downloads, streamed API output, NDJSON, AI token output, media transformation, and progressive processing.

**Do not use it when:** the payload is small, the API must be supported by older browsers without fallback, or a normal navigation download already satisfies UX.

## Important concepts, APIs, hooks, and configuration

- `fetch`
- `Response.body`
- `ReadableStream`
- `getReader`
- `read`
- `Uint8Array`
- `TextDecoder`
- `AbortController`
- `Content-Length`
- `Content-Range`
- `Range`
- `WritableStream`
- `pipeTo`
- `backpressure`


## Fetch Streams API flow — know this sequence

```text
fetch(url)
   │
   ▼
Response
   │
   └── response.body
          │
          ▼
    ReadableStream
          │
          ▼
      getReader()
          │
          ▼
       read()
       ┌──┴──────────────┐
       │                 │
   value chunk         done=true
       │                 │
       ▼                 ▼
 TextDecoder /        close / finish
 parser / sink
       │
       ▼
 WritableStream
       │
       ▼
  await write()
  → backpressure
```

### Complete streaming example

```tsx
async function download(signal: AbortSignal) {
  const response = await fetch("/api/large-file", { signal });

  if (!response.ok || !response.body) {
    throw new Error("Streaming response unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let received = 0;

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    received += value.byteLength;

    const text = decoder.decode(value, { stream: true });
    processChunk(text);

    console.log(`received: ${received} bytes`);
  }

  processChunk(decoder.decode());
}
```

### Key interview distinction

`response.body` gives you a stream; `getReader()` lets you pull chunks; `read()` returns `{ value, done }`; `TextDecoder` handles byte-to-text conversion; and a writable sink can provide backpressure instead of accumulating the whole response in memory.

## Setup from scratch

Expose a streaming endpoint, fixed or discoverable total size, cancellation, and range semantics if resume is required. On the client validate `response.ok` and `response.body`, read incrementally, and stream to a bounded sink.

### Client example

```tsx
const response = await fetch('/api/files/large', { signal });
if (!response.ok || !response.body) throw new Error('Stream unavailable');
const reader = response.body.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  await writable.write(value);
  received += value.byteLength;
}
await writable.close();
```

### Server or companion example

```ts
app.get('/api/files/large', async (req, res) => {
  res.set({ 'Content-Type': 'application/octet-stream', 'Content-Length': String(total) });
  while (sent < total && !res.destroyed) {
    if (!res.write(nextChunk())) await once(res, 'drain');
  }
  res.end();
});
```

## Choosing the approach

**Streams vs `response.blob()`:** streams allow incremental handling, while Blob waits in memory. Browser navigation download is simplest if custom progress, processing, destination control, or cancellation is unnecessary.

## Interview Q&A

### Q13 [Intermediate] Does `fetch()` streaming automatically mean zero memory?

**Answer:** No. Memory depends on what the application does with chunks. Accumulating chunks into an array and constructing a Blob still buffers the complete payload. A truly bounded path needs a streaming sink such as a file writer or incremental parser.

**Likely follow-up:** How would you prove memory remains bounded?

### Q14 [Advanced] How do you decode streamed text safely?

**Answer:** Use one `TextDecoder` with `{ stream: true }`, preserve partial records between chunks, and parse only complete delimiters. Network chunks do not align with UTF-8 characters or JSON records.

**Likely follow-up:** Why can `JSON.parse` on each chunk fail?

### Q15 [Senior] Design resumable downloads.

**Answer:** Use stable file versions, byte `Range` requests, `Content-Range`, ETag or checksum validation, persisted progress, temporary destination files, and atomic finalization. Reject resume if the remote version changed.

**Likely follow-up:** How do you handle CDN compression and byte ranges?

### Q16 [Scenario] Progress is stuck at zero although bytes arrive.

**Answer:** The server may omit `Content-Length`, use chunked transfer, or pass through compression. Show indeterminate progress while tracking bytes, or expose trusted total metadata separately.

**Likely follow-up:** Why must client code not trust total size for security?

# 4. TanStack Query

## Mental model

It acts as a smart cache between your UI and remote APIs, automatically handling fetching, background synchronization, and stale-while-revalidate updates so components always reflect the latest server truth. By treating server data as a cacheable, synchronizable resource rather than one-off fetch results, it eliminates manual request state management and ensures mutations intelligently invalidate related queries to keep the client and server in sync.

**Use it for:** REST or GraphQL server state shared by components, caching, pagination, background refresh, mutations, and optimistic UX.

**Do not use it when:** pure local UI state, a tiny one-off request with no caching value, or data ownership belongs entirely to a client-state machine.

## Important concepts, APIs, hooks, and configuration

- `QueryClient`
- `QueryClientProvider`
- `useQuery`
- `useMutation`
- `useInfiniteQuery`
- `queryKey`
- `queryFn`
- `staleTime`
- `gcTime`
- `enabled`
- `select`
- `placeholderData`
- `invalidateQueries`
- `setQueryData`
- `cancelQueries`
- `prefetchQuery`
- `dehydrate`
- `hydrate`


## TanStack Query API flow — know this sequence

```text
QueryClient
     │
     ▼
QueryClientProvider
     │
     ▼
useQuery({ queryKey, queryFn })
     │
     ├── cache lookup
     │
     ├── fresh? ── yes → return cached data
     │
     └── stale/missing → queryFn()
                         │
                         ▼
                    API request
                         │
                  ┌──────┴──────┐
                  ▼             ▼
                success        error
                  │             │
                  ▼             ▼
             cache data      retry/error
                  │
                  ▼
              component

Mutation flow:
useMutation → onMutate → optimistic cache
                    │
             ┌──────┴──────┐
             ▼             ▼
          success         error
             │             │
       invalidate       rollback
             │
             ▼
          refetch
```

### Query + mutation example

```tsx
const query = useQuery({
  queryKey: ["products", { page, filter }],
  queryFn: ({ signal }) =>
    fetchProducts({ page, filter, signal }),
  staleTime: 30_000,
});

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

**Interview point:** `staleTime` answers “when should this data be considered stale?” while `gcTime` controls retention of inactive cache data. They solve different problems.

## Setup from scratch

Install `@tanstack/react-query`, create one `QueryClient`, wrap the app with `QueryClientProvider`, define typed API functions and query-key factories, then add queries, mutations, invalidation, Devtools, and SSR hydration only as required.

### Client example

```tsx
const products = useQuery({
  queryKey: ['products', { page, filters }],
  queryFn: ({ signal }) => fetchProducts({ page, filters, signal }),
  staleTime: 30_000,
  placeholderData: keepPreviousData,
});
```

### Server or companion example

```ts
const update = useMutation({
  mutationFn: patchProduct,
  onMutate: async next => {
    await client.cancelQueries({ queryKey: ['products'] });
    const previous = client.getQueriesData({ queryKey: ['products'] });
    optimisticallyUpdate(next);
    return { previous };
  },
  onError: (_e, _v, context) => rollback(context?.previous),
  onSettled: () => client.invalidateQueries({ queryKey: ['products'] }),
});
```

## Choosing the approach

TanStack Query vs Redux: Query owns asynchronous server state and freshness; Redux owns explicit client application state. They can coexist. SWR offers a smaller stale-while-revalidate model; framework loaders may be better when routing and SSR own data lifecycle.

## Interview Q&A

### Q13 [Intermediate] What is stale versus garbage-collected data?

**Answer:** Stale controls when data is eligible for refetch. Garbage collection controls how long inactive cached data stays before removal. Freshness and cache retention are separate decisions.

**Likely follow-up:** How would you choose values for a product catalog versus trading prices?

### Q14 [Advanced] What makes a good query key?

**Answer:** It is serializable, stable, and includes every variable used by the query function. Structure it from broad resource to detail, such as `products`, filters, and page. Central key factories reduce invalidation mistakes.

**Likely follow-up:** What bug occurs if a filter is omitted?

### Q15 [Advanced] How do optimistic updates stay correct?

**Answer:** Cancel relevant queries, snapshot all affected cache entries, apply an immutable optimistic patch, rollback every affected entry on error, and invalidate on settle. For high-contention data, prefer server confirmation or version-aware patches.

**Likely follow-up:** What happens when two optimistic mutations overlap?

### Q16 [Senior] Should WebSocket messages update TanStack Query cache?

**Answer:** Yes when they represent server-state changes. Validate the event, update exact cache entries with `setQueryData`, or invalidate broader keys. Maintain event versions so older messages cannot overwrite newer cache state.

**Likely follow-up:** When is invalidation safer than a manual cache patch?

### Q17 [Scenario] Users report refetch loops.

**Answer:** Check unstable query keys, changing object identities, effects that invalidate after every render, query functions that mutate state, and retry/focus/reconnect settings. Use Devtools and network traces to identify the trigger.

**Likely follow-up:** How would you reproduce the loop deterministically?

# 5. Debouncing and throttling

## Mental model

Debounce accumulates rapid-fire events and executes the handler only after a specified interval of silence has elapsed, ensuring a single response to a completed burst of activity—like triggering a search only once the user pauses typing. Throttle guarantees execution at most once within a fixed time window, allowing the first event through immediately and dropping subsequent calls until the cooldown expires, which keeps high-frequency streams like scroll or resize events performant without backlog.

**Use it for:** debounced search/autosave/validation and throttled scroll, resize, pointer, telemetry, or expensive visual updates.

**Do not use it when:** every event is semantically required, immediate correctness depends on every update, or the underlying issue is expensive rendering that needs virtualization.

## Important concepts, APIs, hooks, and configuration

- `setTimeout`
- `clearTimeout`
- `Date.now`
- `useEffect`
- `useRef`
- `useCallback`
- `AbortController`
- `leading edge`
- `trailing edge`
- `maxWait`
- `stable callback`
- `cleanup`


## Debounce / throttle API flow — know this sequence

```text
User events:  a b c d e f g
               │ │ │ │ │ │
               ▼ ▼ ▼ ▼ ▼ ▼
             debounce
               │
               └────── wait for quiet period ────► API call

User events:  a b c d e f g
               │ │ │ │ │ │
               ▼ ▼ ▼ ▼ ▼ ▼
              throttle
               │
               └── execute at most once / interval

Visual events:
scroll → throttle / requestAnimationFrame → render
```

### Debounced search with cancellation

```tsx
const controllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  const id = setTimeout(async () => {
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

  return () => clearTimeout(id);
}, [query]);
```

### Throttle concept

```ts
let lastRun = 0;

function throttled(fn: () => void, wait: number) {
  const now = Date.now();

  if (now - lastRun >= wait) {
    lastRun = now;
    fn();
  }
}
```

**Interview point:** debounce reduces the number of executions by waiting for silence; throttle limits execution frequency while activity continues. Debounce alone does not cancel an already-running request.

## Setup from scratch

Implement reusable hooks with timer cleanup, explicit leading/trailing semantics, latest-callback handling, and tests with fake timers. Pair debounced network work with cancellation and throttled visual work with profiling.

### Client example

```tsx
function useDebouncedValue<T>(value: T, delay: number) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return result;
}
```

### Server or companion example

```ts
function useThrottle<T extends (...args: any[]) => void>(fn: T, wait: number) {
  const last = useRef(0);
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - last.current >= wait) {
      last.current = Date.now();
      fn(...args);
    }
  }, [fn, wait]);
}
```

## Choosing the approach

Debounce vs throttle vs `useDeferredValue`: debounce and throttle reduce callback frequency; `useDeferredValue` lets React deprioritize rendering without reducing source events. `requestAnimationFrame` aligns visual updates to paint.

## Interview Q&A

### Q13 [Beginner] Explain debounce versus throttle in one sentence.

**Answer:** Debounce runs after a quiet period; throttle runs at most once per interval while events continue.

**Likely follow-up:** What are leading and trailing executions?

### Q14 [Advanced] Why must debounced search also cancel requests?

**Answer:** Debouncing reduces request count but cannot prevent an older request from finishing after a newer one. Abort stale requests or associate responses with a request sequence before committing state.

**Likely follow-up:** What if the server has already completed the cancelled request?

### Q15 [Advanced] How do you preserve the newest callback?

**Answer:** Store the callback in a ref updated by an effect, or ensure dependencies recreate the wrapper intentionally. Otherwise a timer may invoke a closure holding old props or state.

**Likely follow-up:** When does recreation itself break debouncing?

### Q16 [Scenario] Scroll feels janky even after throttling.

**Answer:** Profile first. The bottleneck may be layout reads/writes, expensive React rendering, images, or too much DOM. Use passive listeners where appropriate, `requestAnimationFrame` for visual work, virtualization, and avoid forced synchronous layout.

**Likely follow-up:** When is `requestAnimationFrame` better than time-based throttle?

# 6. Web Workers

## Mental model

Web Workers spawn an isolated JavaScript execution environment on a separate OS thread, freeing the main thread from heavy computation so the UI remains responsive. They exchange data with the main thread exclusively through asynchronous message passing (postMessage/onmessage), since they have no direct access to the DOM or main thread's memory space.

**Use it for:** CPU-heavy parsing, aggregation, image processing, compression, cryptography, search indexing, and calculations that would create long main-thread tasks.

**Do not use it when:** work is small, DOM access is required, the task is network-bound, or message-copy overhead exceeds computation savings.

## Important concepts, APIs, hooks, and configuration

- `Worker`
- `DedicatedWorkerGlobalScope`
- `postMessage`
- `onmessage`
- `messageerror`
- `terminate`
- `structured clone`
- `transferable objects`
- `SharedArrayBuffer`
- `Atomics`
- `import.meta.url`
- `Comlink`


## Web Worker API flow — know this sequence

```text
Main thread
   │
   │ new Worker(...)
   ▼
Worker thread
   │
   │ onmessage
   ▼
CPU-heavy processing
   │
   │ postMessage()
   ▼
Main thread
   │
   ├── onmessage → update React state
   │
   └── terminate() → stop owned worker
   │
Large ArrayBuffer?
   └── postMessage(data, [buffer])
          → transfer ownership instead of copying
```

### Main thread

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
    setStatus("worker failed");
  };

  worker.postMessage({
    type: "PROCESS",
    payload: largeJson,
  });

  return () => worker.terminate();
}, [largeJson]);
```

### Worker

```ts
self.onmessage = (event) => {
  if (event.data.type === "PROCESS") {
    const result = expensiveAggregation(event.data.payload);

    self.postMessage({
      type: "DONE",
      result,
    });
  }
};

export {};
```

### Transferable buffer

```ts
worker.postMessage(buffer, [buffer]);
```

**Interview point:** Workers remove CPU-heavy JavaScript from the main thread, but communication has a cost. Structured cloning can still be expensive, so transfer large binary buffers when appropriate.

## Setup from scratch

Create a module worker with `new Worker(new URL(..., import.meta.url), { type: "module" })`, define a typed message protocol, move CPU work into the worker, transfer large buffers where possible, handle errors, and terminate owned workers.

### Client example

```tsx
const worker = new Worker(new URL('./json.worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ type: 'PROCESS', json });
worker.onmessage = e => setResult(e.data);
// cleanup
worker.terminate();
```

### Server or companion example

```ts
self.onmessage = event => {
  const rows = JSON.parse(event.data.json);
  const result = aggregate(rows);
  self.postMessage({ type: 'DONE', result });
};
export {};
```

## Choosing the approach

Web Worker vs Service Worker: a Web Worker performs background computation for a page; a Service Worker intercepts network requests and supports offline/push workflows. Server-side jobs are better for trusted, durable, very heavy, or centralized computation.

## Interview Q&A

### Q13 [Intermediate] What crosses a worker boundary?

**Answer:** Messages use the structured clone algorithm. Transferable objects such as an `ArrayBuffer` can transfer ownership rather than copy. DOM nodes and functions cannot be sent.

**Likely follow-up:** What happens to a transferred buffer on the sender?

### Q14 [Advanced] Can moving `JSON.parse` to a worker remove all UI cost?

**Answer:** It moves parsing and aggregation, but generating a huge JSON string and structured-cloning results can still cost main-thread time and memory. Fetch and parse inside the worker or transfer binary data when possible.

**Likely follow-up:** How would you measure clone overhead separately?

### Q15 [Senior] How do you create a worker pool?

**Answer:** Bound worker count near available CPU, queue jobs with priorities and cancellation, avoid oversubscription, transfer large buffers, recycle workers, isolate crashes, and report queue delay separately from execution time.

**Likely follow-up:** When is one long-lived worker better than a pool?

### Q16 [Scenario] A worker produces results after the component unmounts.

**Answer:** Terminate it or mark the request generation, ignore stale messages, and release event handlers. Resource ownership should be tied to the feature lifecycle.

**Likely follow-up:** How do you cancel a single job without killing a shared worker?

# 7. Chunked, resumable file upload

## Mental model

A large file is sliced into smaller, self-contained chunks that are uploaded to the server in parallel or sequentially, with each chunk tracked individually for progress and verified via checksums. If the connection drops, only the failed or missing chunks are retried upon resuming, and once all parts arrive intact, the server reassembles them into the original file.

**Use it for:** large files, unreliable networks, mobile users, cloud object storage, and uploads that must survive interruption.

**Do not use it when:** files are consistently small, a managed upload SDK already solves the problem, or the backend cannot guarantee idempotent chunk handling.

## Important concepts, APIs, hooks, and configuration

- `File`
- `Blob.slice`
- `FormData`
- `fetch`
- `XMLHttpRequest upload progress`
- `AbortController`
- `uploadId`
- `chunk index`
- `checksum`
- `idempotency`
- `retry`
- `exponential backoff`
- `multipart upload`
- `presigned URL`


## Chunked upload API flow — know this sequence

```text
File
 │
 ├── slice() ──► chunk 0 ──► upload
 │                chunk 1 ──► upload
 │                chunk 2 ──► retry
 │                ...
 │
 ▼
POST /uploads/initiate
 │
 ▼
uploadId + chunkSize + uploadedParts
 │
 ▼
PUT /uploads/:id/parts/:index
 │
 ▼
persist part + checksum
 │
 ├── failure → retry with backoff
 │
 └── success → next/more parallel chunks
 │
 ▼
POST /uploads/:id/complete
 │
 ▼
verify manifest → finalize object
```

### Client example

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

  for (let index = 0; index < init.totalChunks; index++) {
    const start = index * CHUNK_SIZE;
    const chunk = file.slice(start, start + CHUNK_SIZE);

    await retry(() =>
      api(`/uploads/${init.uploadId}/parts/${index}`, {
        method: "PUT",
        body: chunk,
      })
    );
  }

  return api(`/uploads/${init.uploadId}/complete`, {
    method: "POST",
  });
}
```

### Resume

```text
refresh/reconnect
      ↓
GET /uploads/:id
      ↓
completed parts = [0, 1, 3]
      ↓
upload only missing part 2
      ↓
complete
```

**Interview point:** The server must make part upload and completion idempotent. A retry must not create duplicate bytes or assemble the final object twice.

## Setup from scratch

Create initiate, part-status, upload-part, complete, and abort endpoints. Make parts and completion idempotent, validate size/type/checksums server-side, persist progress, and use object-storage multipart uploads in production.

### Client example

```tsx
for (let index = nextChunk; index < totalChunks; index++) {
  if (paused.current) break;
  const chunk = file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
  await retry(() => uploadChunk({ uploadId, index, chunk, checksum }));
  setProgress(Math.round(((index + 1) / totalChunks) * 100));
}
```

### Server or companion example

```ts
POST /uploads/initiate       -> uploadId, chunkSize, uploadedParts
PUT  /uploads/:id/parts/:index -> idempotently store/check one part
GET  /uploads/:id              -> uploaded part indexes
POST /uploads/:id/complete     -> verify manifest and finalize
DELETE /uploads/:id            -> abort and clean temporary data
```

## Choosing the approach

Sequential chunks simplify ordering and control; limited parallel chunks improve throughput but need concurrency limits. Tus or cloud multipart SDKs are preferable when a proven protocol/vendor implementation already meets requirements.

## Interview Q&A

### Q13 [Intermediate] Why should chunk APIs be idempotent?

**Answer:** Networks and clients retry. Re-sending the same upload ID and part index must not append duplicate bytes. Store by deterministic part key and return the existing verified result.

**Likely follow-up:** Which idempotency key would you use?

### Q14 [Advanced] What does true resume after refresh require?

**Answer:** Persist upload ID and file fingerprint, ask the server for completed parts, let the user reselect the same file when browser permissions require it, verify metadata, and continue only missing chunks. In-memory indexes alone are session pause, not durable resume.

**Likely follow-up:** How do you detect that a same-named file changed?

### Q15 [Senior] How do you upload directly to object storage?

**Answer:** The API authenticates and initiates multipart upload, returns short-lived presigned part URLs, the browser uploads parts, and the API validates the manifest before completing. Keep storage credentials off the client.

**Likely follow-up:** Where do checksums and malware scanning fit?

### Q16 [Scenario] Completion succeeds but the client times out and retries.

**Answer:** Make completion idempotent. Repeating it should return the same final object metadata rather than assemble twice or fail ambiguously. Store finalization state transactionally.

**Likely follow-up:** How do you reconcile orphaned multipart uploads?

# 8. Forms at scale with React Hook Form

## Mental model

Scalable form state, validation, dynamic fields, controlled-component adapters, and isolated subscriptions.

**Use it for:** large business forms, nested data, dynamic rows, reusable field components, schema validation, wizards, and strong TypeScript models.

**Do not use it when:** a form has one or two trivial inputs, server-rendered native forms are sufficient, or adopting a library adds more complexity than value.

## Important concepts, APIs, hooks, and configuration

- `useForm`
- `register`
- `handleSubmit`
- `formState`
- `errors`
- `Controller`
- `useController`
- `FormProvider`
- `useFormContext`
- `useWatch`
- `useFormState`
- `useFieldArray`
- `resolver`
- `setError`
- `clearErrors`
- `reset`
- `trigger`


## React Hook Form API flow — know this sequence

```text
useForm()
   │
   ├── register() ──────► native/uncontrolled input
   │
   ├── Controller ──────► controlled 3rd-party input
   │
   ├── useWatch() ──────► subscribe to specific values
   │
   ├── useFormState() ──► subscribe to specific form state
   │
   ├── useFieldArray() ─► dynamic rows
   │
   ├── resolver ────────► schema validation
   │
   └── handleSubmit()
             │
        ┌────┴────┐
        ▼         ▼
     valid      invalid
        │         │
        ▼         ▼
      API       errors
        │
        ▼
   setError() for server-side errors
```

### Large-form example

```tsx
const methods = useForm<OrderForm>({
  defaultValues,
  resolver: zodResolver(schema),
  mode: "onBlur",
});

const items = useFieldArray({
  control: methods.control,
  name: "items",
});

const email = useWatch({
  control: methods.control,
  name: "email",
});

const submit = methods.handleSubmit(async (values) => {
  try {
    await saveOrder(values);
  } catch (error) {
    methods.setError("email", {
      type: "server",
      message: "Email is already registered",
    });
  }
});

return (
  <FormProvider {...methods}>
    <form onSubmit={submit}>
      <input {...methods.register("email")} />

      {items.fields.map((field, index) => (
        <input
          key={field.id}
          {...methods.register(`items.${index}.name`)}
        />
      ))}

      <button type="submit">Save</button>
    </form>
  </FormProvider>
);
```

**Interview point:** Prefer `register` for native/uncontrolled inputs, `Controller` for controlled third-party components, `useWatch` for narrow subscriptions, and `useFieldArray` for dynamic collections. Use the generated `field.id` as the React key.

## Setup from scratch

Install `react-hook-form`, define the domain type and validation schema, initialize `useForm`, register native fields, adapt controlled widgets, use `useFieldArray` for dynamic rows, isolate subscriptions, map server errors, and test accessibility.

### Client example

```tsx
const form = useForm<OrderForm>({ mode: 'onBlur', resolver: zodResolver(schema), defaultValues });
const items = useFieldArray({ control: form.control, name: 'items' });
return <form onSubmit={form.handleSubmit(save)}>
  <input {...form.register('email')} />
  {form.formState.errors.email?.message}
</form>;
```

### Server or companion example

```ts
<FormProvider {...methods}>
  <CustomerSection />
  <AddressSection />
  <ItemsSection />
  <ReviewSection />
</FormProvider>
```

## Choosing the approach

React Hook Form vs controlled state: RHF favors registration and isolated subscriptions; fully controlled state is simple for small forms but can create broad rerenders. Formik is another abstraction; native forms are excellent when complexity is low.

## Interview Q&A

### Q13 [Intermediate] When do you use `register` versus `Controller`?

**Answer:** Use `register` for compatible native or uncontrolled inputs. Use `Controller` or `useController` for third-party controlled widgets whose value and change contract must be adapted.

**Likely follow-up:** Why is wrapping every input in Controller unnecessary?

### Q14 [Advanced] How do you prevent a giant form from rerendering on every change?

**Answer:** Avoid broad root `watch()`, colocate field components, use `useWatch` and `useFormState` for narrow subscriptions, keep stable field-array keys, and virtualize carefully while preserving registration semantics.

**Likely follow-up:** How would you profile field rendering?

### Q15 [Advanced] How do client and server validation work together?

**Answer:** Client validation improves feedback but is not a security boundary. The server validates the same domain contract, returns structured field and form errors, and the client maps them with `setError`.

**Likely follow-up:** How do you handle a cross-record uniqueness failure?

### Q16 [Senior] How do you design a multi-step enterprise form?

**Answer:** Use one typed domain model, explicit step metadata, schema-per-step plus final schema, draft persistence, versioned payloads, idempotent submission, route guards, accessible error summaries, and analytics that avoid sensitive values.

**Likely follow-up:** Would you mount all steps or unregister hidden fields?

### Q17 [Scenario] Removing a dynamic row updates the wrong input.

**Answer:** Use the generated field ID as the React key, not the array index. Confirm backend item IDs are separate from UI keys and avoid stacking multiple field-array actions in one render.

**Likely follow-up:** How do you preserve server IDs during reorder?

# 9. Service Workers

## Mental model

A Service Worker is a background browser worker that sits between the web page and the network. It can intercept requests, serve cached responses, support offline experiences, receive push events, and coordinate background browser capabilities.

**Use it for:** offline/PWA experiences, caching strategies, network fallbacks, push notifications, background synchronization, and controlling how a web app responds to network conditions.

**Do not use it when:** you only need CPU-heavy computation (use a Web Worker), a normal API request is enough, or the requirement needs direct DOM access.

## Important concepts, APIs, hooks, and configuration

- `navigator.serviceWorker`
- `serviceWorker.register()`
- `ServiceWorkerRegistration`
- `install`
- `activate`
- `fetch`
- `message`
- `ServiceWorkerGlobalScope`
- `clients`
- `caches`
- `CacheStorage`
- `caches.open()`
- `cache.match()`
- `cache.put()`
- `cache.addAll()`
- `event.respondWith()`
- `event.waitUntil()`
- `skipWaiting()`
- `clients.claim()`
- `postMessage()`
- `PushManager`
- `Notification`
- `SyncManager`
- HTTPS / secure context

## Service Worker API flow — know this sequence

```text
React / Browser
      │
      │ navigator.serviceWorker.register("/sw.js")
      ▼
Service Worker
      │
      ├── install
      │      │
      │      └── caches.open() → cache.addAll()
      │
      ├── activate
      │      │
      │      ├── delete old caches
      │      └── clients.claim()
      │
      ├── fetch
      │      │
      │      ├── cache.match()
      │      │       ├── HIT  → return cached response
      │      │       └── MISS → fetch(request)
      │      │                         │
      │      │                         └── cache.put()
      │      │
      │      └── event.respondWith(response)
      │
      └── message
             │
             └── page ↔ worker communication
```

## Setup from scratch

### Register from React

```tsx
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed", error);
      });
  }
}, []);
```

### Service Worker

```js
const CACHE_NAME = "app-v1";
const APP_SHELL = ["/", "/index.html", "/offline.html"];

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
        fetch(event.request).then((response) => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });

          return response;
        }).catch(() => caches.match("/offline.html"))
      );
    })
  );
});
```

### Page ↔ Service Worker communication

```tsx
navigator.serviceWorker.ready.then((registration) => {
  registration.active?.postMessage({
    type: "CLEAR_CACHE",
  });
});
```

```js
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME)
    );
  }
});
```

## Choosing the approach

**Service Worker vs Web Worker:** a Web Worker is primarily for CPU-heavy JavaScript; a Service Worker is primarily a network/application lifecycle worker that can intercept requests and support offline/PWA capabilities.

**Service Worker vs SSE/WebSocket:** Service Workers are not a replacement for a persistent real-time connection. They are mainly a network interception and background browser capability layer.

## Interview Q&A

### Q1 [Beginner] What problem does a Service Worker solve?

**Answer:** It gives the browser a programmable background layer that can intercept network requests, cache resources, provide offline fallbacks, and support capabilities such as push and background synchronization.

**Likely follow-up:** Why can't a normal React component do the same thing?

### Q2 [Beginner] What are the Service Worker lifecycle stages?

**Answer:** The important lifecycle stages are `install`, `activate`, and normal event handling such as `fetch` and `message`. Installation is commonly used to prepare caches; activation is commonly used for cleanup and taking control.

**Likely follow-up:** Why do we use `skipWaiting()` and `clients.claim()`?

### Q3 [Intermediate] What does `event.respondWith()` do?

**Answer:** It tells the browser that the Service Worker will provide the response for the intercepted request, allowing you to implement cache-first, network-first, stale-while-revalidate, or other strategies.

**Likely follow-up:** What happens if `respondWith()` is not called?

### Q4 [Intermediate] What does `event.waitUntil()` do?

**Answer:** It extends the lifetime of an install, activate, or other supported event until the supplied promise settles, so asynchronous work such as cache preparation or cleanup can finish.

**Likely follow-up:** Why is this important for cache initialization?

### Q5 [Advanced] How would you design a cache strategy?

**Answer:** Choose per resource type. Static versioned assets can use cache-first; frequently changing API data may use network-first; some content can use stale-while-revalidate. Avoid blindly caching authenticated or highly dynamic responses.

**Likely follow-up:** How do you invalidate old caches?

### Q6 [Advanced] How do you communicate between React and a Service Worker?

**Answer:** Use `postMessage()` and message events. Keep the protocol typed/versioned and make commands idempotent where retries or repeated messages are possible.

**Likely follow-up:** How would you notify all open tabs after an update?

### Q7 [Advanced] How do you handle Service Worker updates?

**Answer:** Version caches, install the new worker, remove obsolete caches during activation, and deliberately decide when the new worker should take control. Avoid forcing an update without considering in-progress application work.

**Likely follow-up:** What can go wrong if you call `skipWaiting()` aggressively?

### Q8 [Senior] What are the production/security concerns?

**Answer:** Service Workers require a secure context in normal production use, should be scoped deliberately, must not cache sensitive responses accidentally, and should use explicit cache names and invalidation policies. Treat intercepted requests and cached data as part of the security boundary.

**Likely follow-up:** Would you cache authenticated API responses?

### Q9 [Senior] How would you test it?

**Answer:** Test installation and activation, cache population, cache invalidation, offline behavior, network failures, update transitions, message communication, multiple tabs, and browser-specific behavior using real browser integration tests.

**Likely follow-up:** What behavior would a unit test fail to prove?

### Q10 [Scenario] Users still receive an old JavaScript bundle after deployment.

**Answer:** Check Service Worker registration scope, cache versioning, activation state, whether the old worker still controls the page, and whether HTML is cached with an overly aggressive strategy. Inspect the browser's Service Worker and Cache Storage state before changing code.

**Likely follow-up:** How would you roll out a safe Service Worker update?

## Hands-on exercise

1. Register a Service Worker.
2. Cache the application shell during `install`.
3. Delete old cache versions during `activate`.
4. Implement cache-first for static assets.
5. Implement network-first for one API endpoint.
6. Add an offline fallback page.
7. Add React ↔ Service Worker messaging.
8. Test update behavior with two browser tabs.


# 10. Broadcasting Events

## Mental model

The **Broadcast Channel API** lets browser contexts on the same origin communicate through named channels. A page, tab, iframe, or worker can publish a message with `postMessage()`, and other contexts listening to the same channel receive a `message` event.

Think of it as a lightweight **browser-level pub/sub channel**:

```text
Tab A                         Tab B
  │                              │
  │ new BroadcastChannel("app")  │
  │                              │
  │ postMessage({ type: "..." }) │
  ├─────────────────────────────►│
  │                              │
  │                         message event
  │                              │
  │                         update local state
```

**Use it for:** cross-tab logout, cart synchronization, theme changes, notification badges, cache invalidation signals, and coordination between browser contexts.

**Do not use it when:** communication must cross different origins, messages must reach users on different devices, durable delivery is required, or a server needs to be involved. Use WebSocket/SSE or another server-side mechanism for those cases.

## Important concepts, APIs, hooks, and configuration

- `BroadcastChannel`
- `new BroadcastChannel(name)`
- `postMessage()`
- `message`
- `messageerror`
- `close()`
- structured clone
- same-origin restriction
- `useEffect`
- `useRef`
- cleanup
- message schema/versioning
- deduplication
- loop prevention

## Broadcasting API flow — know this sequence

```text
Tab A
  │
  │ new BroadcastChannel("app-events")
  ▼
Broadcast channel
  │
  │ postMessage({
  │   type: "LOGOUT"
  │ })
  ├──────────────────────────────► Tab B
  │                                │
  │                                ▼
  │                           "message" event
  │                                │
  │                                ▼
  │                           clear auth state
  │
  └──────────────────────────────► Tab C
                                   │
                                   ▼
                              clear auth state
```

### Complete client example

```tsx
import { useEffect } from "react";

type AppEvent =
  | { type: "LOGOUT" }
  | { type: "CART_UPDATED"; version: number }
  | { type: "THEME_CHANGED"; theme: "light" | "dark" };

export function useAppBroadcast(onEvent: (event: AppEvent) => void) {
  useEffect(() => {
    const channel = new BroadcastChannel("app-events");

    const handleMessage = (event: MessageEvent<AppEvent>) => {
      onEvent(event.data);
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [onEvent]);
}
```

### Sending an event

```ts
const channel = new BroadcastChannel("app-events");

channel.postMessage({
  type: "LOGOUT",
});

channel.close();
```

### Cross-tab logout example

```tsx
useEffect(() => {
  const channel = new BroadcastChannel("auth");

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === "LOGOUT") {
      queryClient.clear();
      setUser(null);
      navigate("/login");
    }
  };

  channel.addEventListener("message", handleMessage);

  return () => {
    channel.removeEventListener("message", handleMessage);
    channel.close();
  };
}, []);
```

When the user logs out from one tab:

```ts
authChannel.postMessage({ type: "LOGOUT" });
```

Other tabs receive the event and can immediately clear their local application state.

## BroadcastChannel vs `window.postMessage`

These are related but solve different problems.

| API | Typical purpose |
|---|---|
| `BroadcastChannel` | Same-origin communication between multiple browser contexts |
| `window.postMessage` | Communication with a specific window/frame, commonly across origins |
| `ServiceWorker.postMessage` | Page ↔ Service Worker communication |
| WebSocket | Browser ↔ server real-time communication |
| SSE | Server → browser real-time communication |

**Interview point:** `BroadcastChannel` is local to the browser environment. It does not create a server connection and does not provide durable delivery.

## Failure and lifecycle considerations

### 1. Always close the channel

A React component that creates a channel should close it during cleanup:

```tsx
return () => channel.close();
```

Otherwise, long-lived pages and frequently mounted components can accumulate listeners/resources.

### 2. Treat messages as untrusted input

Even though the message comes from another context of the same origin, validate its structure before acting on it:

```ts
function isAppEvent(value: unknown): value is AppEvent {
  if (!value || typeof value !== "object") return false;

  const event = value as Record<string, unknown>;

  return (
    event.type === "LOGOUT" ||
    event.type === "CART_UPDATED" ||
    event.type === "THEME_CHANGED"
  );
}
```

### 3. Prevent message loops

If Tab A receives a message and broadcasts the same message again, tabs can create an event loop.

Prefer:

```text
Tab A → BroadcastChannel → Tab B
                         → Tab C
```

rather than:

```text
Tab A → Tab B → Tab C → Tab A → ...
```

Only rebroadcast when the architecture explicitly requires it.

### 4. Do not treat it as durable messaging

If Tab B is closed when an event is sent, you should not design the system assuming Tab B will later receive that event.

For important state:

```text
Broadcast event
      ↓
"Something changed"
      ↓
Read authoritative state
      ↓
API / IndexedDB / application state
```

The broadcast should often be treated as an **invalidation or wake-up signal**, not the source of truth.

## Using BroadcastChannel with TanStack Query

A strong production pattern is to broadcast an invalidation signal and let each tab refresh its own server state:

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

This is often safer than broadcasting an entire large dataset because each tab obtains the authoritative state from the server.

## Interview Q&A

### Q1 [Beginner] What is BroadcastChannel?

**Answer:** `BroadcastChannel` is a browser API that allows same-origin browser contexts such as tabs, windows, iframes, and workers to exchange messages through a named channel.

**Likely follow-up:** Does it communicate with your backend?

### Q2 [Intermediate] What is a practical use case?

**Answer:** Cross-tab logout is a common example. When one tab logs out, it broadcasts a `LOGOUT` event and other tabs clear their authentication-related state.

**Likely follow-up:** What if the other tab was not open?

### Q3 [Advanced] Should you broadcast the complete updated application state?

**Answer:** Usually no. For important server state, broadcast a small invalidation message such as `PRODUCTS_CHANGED`, then let each tab refetch the authoritative state. This avoids large messages and stale payloads.

**Likely follow-up:** When would broadcasting the actual value be acceptable?

### Q4 [Senior] How do you design cross-tab synchronization safely?

**Answer:** Define a typed/versioned message protocol, validate incoming messages, keep payloads small, make handlers idempotent, close channels during cleanup, prevent rebroadcast loops, and treat the server or durable browser storage as the source of truth for important state.

**Likely follow-up:** How would you handle two tabs updating the same resource simultaneously?

### Q5 [Scenario] A logout event sometimes does not appear to work.

**Answer:** Verify that all tabs use the same channel name and origin, confirm the listener is registered before the event is emitted, check cleanup and browser support, and verify that logout state is actually cleared locally. For critical authentication guarantees, do not rely on the broadcast alone; enforce token/session invalidation server-side.

**Likely follow-up:** Why should BroadcastChannel not be the security boundary?

## Hands-on exercise

1. Open the same application in three tabs.
2. Create a `BroadcastChannel("app-events")`.
3. Broadcast a `LOGOUT` event.
4. Clear local auth state in every receiving tab.
5. Broadcast a `CART_UPDATED` invalidation.
6. Connect it to TanStack Query.
7. Add runtime message validation.
8. Add cleanup and verify no duplicate listeners after remounting.

# 11. Storage Events

## Mental model

The browser's **`storage` event** lets one document learn that another document changed Web Storage. It is most commonly used with `localStorage` to notify other tabs or windows of a state change.

The key interview detail is:

> The `storage` event is fired in **other documents**, not in the document that made the `localStorage` change.

Example:

```text
Tab A
  │
  │ localStorage.setItem("theme", "dark")
  │
  ├──────────────────────────► Tab B
  │                              │
  │                              ▼
  │                         storage event
  │
  └──────────────────────────► Tab C
                                 │
                                 ▼
                            storage event
```

**Use it for:** simple cross-tab synchronization, logout notifications, theme preferences, selected workspace IDs, and lightweight cache invalidation signals.

**Do not use it when:** you need rich messaging, guaranteed delivery, large payloads, high-frequency events, or server-side communication. `BroadcastChannel` is generally a better fit for application messaging.

## Important concepts, APIs, hooks, and configuration

- `localStorage`
- `sessionStorage`
- `storage`
- `StorageEvent`
- `setItem()`
- `getItem()`
- `removeItem()`
- `clear()`
- `key`
- `newValue`
- `oldValue`
- `storageArea`
- `url`
- `window.addEventListener()`
- `window.removeEventListener()`
- JSON serialization
- same-origin behavior
- cleanup

## Storage event API flow — know this sequence

```text
Tab A
  │
  │ localStorage.setItem(
  │   "app-event",
  │   JSON.stringify({ type: "LOGOUT" })
  │ )
  ▼
Browser Web Storage
  │
  ├──────────────────────────────► Tab B
  │                                │
  │                                ▼
  │                           "storage" event
  │                                │
  │                                ▼
  │                           handle event
  │
  └──────────────────────────────► Tab C
                                   │
                                   ▼
                              handle event

Tab A does NOT receive its own storage event.
```

### Basic example

```ts
window.addEventListener("storage", (event) => {
  if (event.key === "theme") {
    console.log("Theme changed:", event.newValue);
  }
});
```

From another tab:

```ts
localStorage.setItem("theme", "dark");
```

The receiving tab gets:

```ts
event.key       // "theme"
event.oldValue  // previous value or null
event.newValue  // "dark"
event.url       // URL of the document that changed storage
```

### Cross-tab logout example

Sender:

```ts
localStorage.setItem(
  "auth-event",
  JSON.stringify({
    type: "LOGOUT",
    timestamp: Date.now(),
  })
);
```

Receiver:

```tsx
useEffect(() => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== "auth-event" || !event.newValue) {
      return;
    }

    const message = JSON.parse(event.newValue);

    if (message.type === "LOGOUT") {
      queryClient.clear();
      setUser(null);
      navigate("/login");
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}, []);
```

## `localStorage` vs `sessionStorage`

| Feature | `localStorage` | `sessionStorage` |
|---|---|---|
| Lifetime | Persists across browser restarts until removed | Usually tied to a page session |
| Scope | Same origin | Same origin + browser tab/page session |
| Typical use | Preferences, lightweight persistent state | Temporary tab-specific state |
| Storage event | Changes can notify other documents sharing the storage area | Behavior is more limited and tied to the page/session model |

**Interview point:** Do not say "`storage` is just an event for localStorage." The event is related to Web Storage, and its exact propagation depends on which storage area changed.

## Important storage-event behavior

### 1. The initiating tab does not receive the event

This surprises many developers.

```ts
localStorage.setItem("status", "ready");
```

The tab executing that line does not get its own `storage` event.

If the same tab needs to react immediately, update local state directly:

```ts
setStatus("ready");
localStorage.setItem("status", "ready");
```

Other tabs receive the event.

### 2. It is not a message queue

Do not treat `localStorage` as a durable event stream.

A later tab can read the current value:

```ts
const value = localStorage.getItem("status");
```

but it cannot automatically reconstruct every historical change.

### 3. Values are strings

Web Storage stores strings:

```ts
localStorage.setItem("user", JSON.stringify(user));
```

Read it with:

```ts
const user = JSON.parse(
  localStorage.getItem("user") ?? "null"
);
```

For application protocols, validate parsed values before using them.

### 4. Storage is synchronous

`localStorage` APIs are synchronous. Avoid repeatedly reading/writing large values during hot UI paths such as scroll, pointer movement, or every keystroke.

Bad:

```ts
window.addEventListener("scroll", () => {
  localStorage.setItem("scroll", String(window.scrollY));
});
```

Better:

```ts
// throttle/debounce the write or persist only meaningful changes
```

## Storage events vs BroadcastChannel

This is an important senior-level comparison:

| Requirement | Better choice |
|---|---|
| Simple cross-tab state notification | `storage` event |
| Rich structured messaging | `BroadcastChannel` |
| Need to know old/new storage values | `storage` event |
| High-frequency application messages | `BroadcastChannel` |
| Need persistence of the current value | `localStorage` |
| Need server communication | WebSocket/SSE/HTTP |
| Need durable server-side events | Server-side event log/message broker |

A useful mental model:

```text
storage event
    = "another document changed this stored value"

BroadcastChannel
    = "another browser context sent me this message"
```

## Security considerations

Do not store highly sensitive secrets in `localStorage simply because it is convenient. JavaScript running in the origin can generally access Web Storage, so an XSS vulnerability can expose stored values.

For authentication, prefer an architecture where sensitive session credentials are protected appropriately, commonly using secure, `HttpOnly` cookies where applicable, while using storage/broadcast mechanisms only for coordination.

For example:

```text
Server session / secure cookie
          │
          ▼
     authentication
          │
          ▼
local browser coordination
    ├── storage event
    └── BroadcastChannel
```

The coordination mechanism should not become the security boundary.

## Production pattern: storage as an invalidation signal

Instead of putting a complete server response into localStorage:

```ts
localStorage.setItem(
  "products",
  JSON.stringify(hugeProductList)
);
```

prefer a small signal:

```ts
localStorage.setItem(
  "products-version",
  String(Date.now())
);
```

Other tabs receive the change:

```ts
window.addEventListener("storage", (event) => {
  if (event.key === "products-version") {
    queryClient.invalidateQueries({
      queryKey: ["products"],
    });
  }
});
```

This keeps TanStack Query/server data as the source of truth while using storage only for cross-tab coordination.

## Interview Q&A

### Q1 [Beginner] What is the `storage` event?

**Answer:** It is a browser event that notifies other relevant documents when Web Storage changes, commonly when one tab changes `localStorage`.

**Likely follow-up:** Does the same tab receive the event?

### Q2 [Intermediate] Why does logout synchronization often use `storage`?

**Answer:** One tab can write a small logout marker to `localStorage`, and other tabs receive the `storage` event and clear their local application state.

**Likely follow-up:** Why not store the authentication token there?

### Q3 [Intermediate] Why is `storage` different from BroadcastChannel?

**Answer:** Storage events are tied to changes in Web Storage, while `BroadcastChannel` is designed for direct structured messaging between browser contexts. BroadcastChannel is generally cleaner for richer application events.

**Likely follow-up:** Which would you choose for 100 messages per second?

### Q4 [Advanced] Why should you avoid large localStorage writes?

**Answer:** Web Storage operations are synchronous and can add main-thread work. Large serialized values also create parsing, serialization, memory, and quota pressure.

**Likely follow-up:** What would you use for larger client-side data?

### Q5 [Senior] How would you synchronize TanStack Query across tabs?

**Answer:** Use a lightweight cross-tab invalidation mechanism such as BroadcastChannel or a storage signal. Each tab then invalidates the relevant query and fetches authoritative data rather than copying the complete cache through localStorage.

**Likely follow-up:** How do you avoid refetch storms?

### Q6 [Scenario] A developer says "the storage event is broken because it doesn't fire."

**Answer:** First check whether they are testing the event in the same tab that called `setItem()`. The initiating document does not receive the event. Test from a second same-origin tab or window and verify the listener, storage key, and browser context.

**Likely follow-up:** What happens if the value is set to the same string again?

## Hands-on exercise

1. Open the application in two tabs.
2. Add a `storage` listener.
3. Synchronize a theme preference.
4. Implement cross-tab logout coordination.
5. Confirm the initiating tab does not receive its own event.
6. Add a small query-invalidation signal.
7. Avoid storing the complete server response.
8. Compare the implementation with `BroadcastChannel`.

## Quick interview distinction

```text
Need to send a message?
        │
        ├── Same-origin browser contexts
        │       └── BroadcastChannel
        │
        ├── Simple "storage changed" notification
        │       └── storage event
        │
        └── Server must participate
                ├── SSE
                └── WebSocket
```

# Cross-topic production checklist

Use this checklist across all topics rather than memorizing the same checklist eight times:

- [ ] Clear requirement and data-flow direction
- [ ] Explicit source of truth and consistency model
- [ ] Runtime validation at trust boundaries
- [ ] Authentication and authorization
- [ ] Cleanup and cancellation
- [ ] Bounded memory, queues, retries, and payload sizes
- [ ] Idempotency where retries can repeat business work
- [ ] Reconnect/resume strategy where applicable
- [ ] Backpressure or slow-consumer strategy where applicable
- [ ] Horizontal scaling and shared-state strategy
- [ ] Correlation IDs, metrics, logs, and traces
- [ ] Unit, integration, browser, failure, and load tests
- [ ] Accessibility and useful user-facing failure states

# Cross-topic senior system-design questions

## 1. Design a live product-import dashboard

**Strong answer:** Upload the source file through multipart object-storage upload; track durable import state by job ID; process CPU-heavy validation on server workers; push job progress through SSE; expose result pages through TanStack Query; use Web Workers only for optional client previews; debounce filter input; use React Hook Form for import settings. Explain why WebSocket is unnecessary unless the browser sends frequent real-time control messages.

**Follow-ups:** How is progress recovered after reconnect? How is duplicate submission prevented? What is the source of truth? How do multiple app nodes broadcast the same job?

## 2. Design a collaborative operations console

**Strong answer:** Use WebSocket for commands, presence, and live changes; message IDs, versions, acknowledgement, reconnect, and snapshot resync; TanStack Query for initial snapshots and cache synchronization; throttling for pointer/presence updates; SSE only for server-only audit feeds; role-based authorization for every command.

**Follow-ups:** How do you handle conflicting edits? Which messages can be dropped? How does a user reconnect to a different node?

## 3. Design a 10 GB upload on unstable mobile networks

**Strong answer:** Initiate a multipart upload, choose server-advertised chunk size, upload a bounded number in parallel, checksum every part, persist the upload ID and completed parts, use short-lived presigned URLs, retry with jitter, resume by querying server/storage status, complete idempotently, scan asynchronously, and clean abandoned uploads.

**Follow-ups:** How do you avoid storing cloud credentials? What happens when the file changes? How is progress calculated when parts run concurrently?

## 4. Design a large onboarding form

**Strong answer:** Use a typed domain model and schema, React Hook Form with isolated sections, field arrays for repeating records, draft persistence with version migration, server validation, idempotent final submission, step-level accessibility, and analytics without captured field values. TanStack Query may fetch reference data but should not own every keystroke.

**Follow-ups:** How are server validation errors mapped? How do you handle conditional steps? How do you resume a draft created with an older schema?

# Testing blueprint

```text
Unit
  Pure reducers, parsers, retry/backoff, validation, chunk math, query-key factories

Integration
  API headers, protocol messages, upload idempotency, range requests, schema errors

Browser
  mount/unmount cleanup, reconnect, pause/resume, dynamic fields, accessibility

Fault injection
  disconnect, slow consumer, stale response, duplicate event, corrupt part, 503, timeout

Load
  concurrent sockets/SSE clients, cache pressure, upload throughput, worker queue depth

Observability verification
  correlation IDs, error classification, cancellation, retry count, completion metrics
```

# Final rapid-revision questions

1. What is the direction of data flow?
2. Who owns the source of truth?
3. What is cached, and when is it stale?
4. How is work cancelled?
5. What happens when the network disconnects?
6. Can a retry duplicate business work?
7. Where can memory grow without a bound?
8. What happens when the consumer is slower than the producer?
9. What must be validated at runtime?
10. How is authorization enforced per resource or message?
11. How does the design scale across multiple nodes?
12. What is the recovery source after reconnect or refresh?
13. Which metrics prove the feature is healthy?
14. How do you test lifecycle cleanup?
15. Why is the nearest alternative not a better fit?

# Reference links

- [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [MDN Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [TanStack Query React documentation](https://tanstack.com/query/latest/docs/framework/react)
- [React Hook Form API](https://react-hook-form.com/docs)
- [React built-in hooks](https://react.dev/reference/react/hooks)

# Practice plan

- Day 1: SSE and WebSocket, including reconnect and scaling.
- Day 2: Fetch Streams and resumable upload, including backpressure and integrity.
- Day 3: TanStack Query, including query keys, freshness, optimistic updates, and SSR hydration.
- Day 4: Debounce, throttle, and Web Workers, including profiling and cancellation.
- Day 5: React Hook Form, dynamic fields, schema validation, and accessible enterprise workflows.
- Day 6: Broadcasting Events and Storage Events, including cross-tab synchronization, invalidation, cleanup, and security.
- Day 7: Build one integrated system-design exercise and inject failures.
- Day 8: Mock interview. Answer every senior and scenario question aloud, then implement one topic from scratch.
