# React Advanced Components: Senior Interview Q&A and Production Guide

> Scope: SSE, WebSockets, Fetch Streams, TanStack Query, debouncing/throttling, Web Workers, resumable file upload, and React Hook Form.
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
| Chunked upload | `File`, `Blob.slice`, `fetch`, `AbortController`, chunk index, checksum, idempotency, multipart upload | Reliable large transfer |
| React Hook Form | `useForm`, `register`, `Controller`, `useWatch`, `useFormState`, `useFieldArray`, `resolver`, `setError`, `reset`, `trigger` | Form state + validation |

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

**Answer:** Support the HTTP upgrade, align idle timeouts and heartbeats, decide whether affinity is needed, externalize room and presence state, and use pub/sub so a message entering node A reaches clients connected to node B.

**Likely follow-up:** When is sticky routing acceptable?

### Q16 [Scenario] A slow browser makes server memory grow.

**Answer:** Track `bufferedAmount` or equivalent server queue size, impose per-connection limits, coalesce disposable state updates, pause producers when possible, and disconnect clients that cannot recover. Never permit an unbounded per-socket queue.

**Likely follow-up:** Which messages may be dropped and which require durability?

# 3. Fetch Streams and large downloads

## Mental model

Incremental consumption of an HTTP response through `ReadableStream`, avoiding a full in-memory response where the sink supports streaming.

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

A server-state library for fetching, caching, synchronizing, invalidating, and mutating asynchronous remote data.

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

Rate-control patterns for noisy user or browser events. Debounce waits for quiet; throttle limits execution frequency during activity.

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

Background JavaScript execution outside the main UI thread, communicating through messages.

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

Splitting a file into independently uploadable parts with progress, retry, pause, resume, integrity checking, and final assembly.

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
- Day 6: Build one integrated system-design exercise and inject failures.
- Day 7: Mock interview. Answer every senior and scenario question aloud, then implement one topic from scratch.
