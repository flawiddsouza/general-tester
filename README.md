# General Tester

Build and run automated test workflows for HTTP APIs, WebSockets, and Socket.IO — visually, as a graph. No code required.

A primary use case is **concurrency testing**: fire N requests simultaneously to reproduce race conditions, test locking behaviour, and verify that your server handles concurrent access correctly.

---

## User Guide

- [Quick Start](#quick-start)
- [The UI](#the-ui)
- [Building a Workflow](#building-a-workflow)
- [Variables & Dynamic Values](#variables--dynamic-values)
- [Environments](#environments)
- [Concurrency Testing](#concurrency-testing)
- [Common Patterns](#common-patterns)
- [Node Reference](#node-reference)
- [Logs & Debugging](#logs--debugging)
- [Import, Export & Duplicate](#import-export--duplicate)
- [Tips & Gotchas](#tips--gotchas)

---

### Quick Start

**1. Create a workflow**
Open the app, go to the **Workflows** tab in the sidebar, click **+ Add new workflow**, and give it a name.

**2. Build the graph**
Switch to the **Nodes** tab. Drag a **Start** node and an **End** node onto the canvas. Then drag any other nodes you need (e.g. **HTTP Request**). Connect them by dragging from the right handle of one node to the left handle of the next.

**3. Run it**
Click **Run workflow** in the top navbar. Switch to the **Log** tab to watch execution in real time.

---

### The UI

```
┌─────────────────────────────────────────────────────────┐
│  General Tester > My Workflow   [Env ▾] [Environments]  │
│                                 [Import] [Export] [Run]  │
├──────────────┬──────────────────────────────────────────┤
│  Workflows   │                                          │
│  Nodes       │            Canvas (node editor)          │
│  Runs        │                                          │
│  Log         │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Sidebar tabs**
- **Workflows** — create, rename, delete, and switch between workflows
- **Nodes** — drag nodes onto the canvas (only when a workflow is open)
- **Runs** — history of past executions for the current workflow
- **Log** — live output of the currently selected run

**Navbar**
- Environment dropdown and **Environments** button — manage variable sets
- **Import / Export / Duplicate** — move workflows between machines or create copies
- **Run workflow** / **Stop workflow Run** — start or cancel execution

---

### Building a Workflow

Every workflow needs at least a **Start** node and an **End** node.

**Adding nodes:** drag them from the Nodes sidebar onto the canvas.

**Connecting nodes:** drag from the right-side dot (output handle) of one node to the left-side dot (input handle) of another. The connection animates when the workflow runs.

**Node actions (top-right of each node):**
- **Duplicate icon** — copies the node and all its config, placed slightly offset
- **Delete icon** — removes the node and all its connections

**Execution order:** nodes run left-to-right. If a node has multiple outgoing connections, all branches run in parallel. A node cannot connect to itself.

---

### Variables & Dynamic Values

Any text field supports `{{ expression }}` — a JavaScript expression evaluated at runtime. This is how you chain data between nodes.

#### What's available

| Variable | Contains |
|---|---|
| `$input` | Output of the previous node |
| `$previousInput` | What the previous node *received* as input (i.e. the node before that's output) |
| `$vars.name` | A variable you set with **Set Variable** or **Start** parallel entries |
| `$env.key` | A value from the active environment |

#### Example: Login then fetch a user

Say you have: `Start → HTTP Request (POST /login) → HTTP Request (GET /users/:id) → End`

The login response is `{ "token": "abc123", "userId": 42 }`.

In the second HTTP Request, you can use:
```
URL:    https://api.example.com/users/{{ $input.userId }}
Header: Authorization: Bearer {{ $input.token }}
```

`$input` here is the login response — the output of the node that just ran.

#### Saving a value for later with Set Variable

If you need a value from an early node in several later nodes, save it:

```
Start → HTTP Request (login) → Set Variable (token = {{ $input.token }}) → ... → HTTP Request → End
```

Then use `{{ $vars.token }}` anywhere downstream. The input data passes through Set Variable unchanged.

#### Full JS is supported

```
{{ $input.items[0].name }}
{{ $input.count > 0 }}
{{ JSON.stringify($input) }}
{{ $env.baseUrl }}/api/{{ $vars.resource }}
```

> If an expression fails (e.g. property on undefined), the raw text is used and an error appears in debug logs.

---

### Environments

Environments are named sets of variables — useful for switching between dev, staging, and production without touching your nodes.

**Setup:**
1. Click **Environments** in the navbar
2. Click **Add Environment** and give it a name (e.g. `staging`)
3. Edit the JSON on the right — it's a flat key-value object:
   ```json
   {
       "baseUrl": "https://staging.api.example.com",
       "apiKey": "sk-staging-abc"
   }
   ```
4. Click **Done**

**Switching:** use the dropdown in the navbar. The selected environment applies to the next run.

**In your nodes:** reference values with `{{ $env.baseUrl }}`, `{{ $env.apiKey }}`, etc.

**Notes:**
- A **Default** environment is created automatically with every new workflow
- Hover over an environment name to see the ⋮ menu for rename/delete
- The last remaining environment cannot be deleted
- You can import a Postman environment file or export any environment as JSON

---

### Concurrency Testing

This is one of the core use cases for General Tester. The idea: launch multiple copies of your workflow **simultaneously**, each hitting the server at the same time. This lets you reproduce race conditions and verify that your server handles concurrent access correctly — things that are impossible to test with sequential requests.

#### How it works

The **Start** node has a parallel entries table. Each column (entry) is an independent execution of the entire workflow. All entries launch at the same time via `Promise.all` — they are genuinely concurrent, not queued.

**Setup:**
1. Open the Start node
2. Click **Add Variable** — enter a variable name (e.g. `userId`)
3. Click **Add Parallel Entry** — a new column appears
4. Fill in different values per column, or the same value if you're testing contention on the same resource

```
Variable  | Entry 1 | Entry 2 | Entry 3 | Entry 4 | Entry 5
----------|---------|---------|---------|---------|--------
userId    |    1    |    2    |    3    |    4    |    5
```

Reference values in your nodes with `{{ $vars.userId }}`. In the Log tab, each parallel run is labeled `- 1`, `- 2`, etc. so you can see exactly what each concurrent execution did.

#### Example: testing a race condition on a limited resource

Suppose you have an endpoint `POST /claim-ticket` and only one ticket is available. You want to verify that if 5 users try to claim it simultaneously, exactly 1 succeeds and the rest get an error — not 2, not 0.

```
Start (5 entries: userId = 1,2,3,4,5)
  → [HTTP Request: POST /claim-ticket]
      body: { "userId": {{ $vars.userId }}, "ticketId": 1 }
  → [If Condition: {{ $input.success }} == true]
        ├─ True  → [HTTP Request: POST /audit-log { "winner": {{ $vars.userId }} }] → End
        └─ False → End
```

Run it, then check the Log tab. If you see more than one "winner" — your server has a race condition.

#### Example: concurrent writes to a shared counter

5 users simultaneously increment a counter. The final value should be 5, not less.

```
Start (5 entries, same variable value or none needed)
  → [HTTP Request: POST /counter/increment]
  → End
```

After the run, make a separate request to `GET /counter` (or check your DB directly) and verify the value is 5. If it's less, increments are being lost under concurrency.

#### Two mechanisms for concurrency

**1. Start node parallel entries** (above) — best for simulating multiple users doing the same flow.

**2. Multiple outgoing connections from any node** — if you connect a single node to two or more next nodes, all branches run in parallel. Useful for testing concurrent operations on the same resource mid-workflow:

```
Start → [HTTP Request: POST /items] (creates item with id={{ $input.id }})
              ├─ [HTTP Request: GET /items/{{ $input.id }}]  → End
              └─ [HTTP Request: DELETE /items/{{ $input.id }}] → End
```

Both branches fire at the same time. You're testing what happens when a read and a delete race against each other on the same item.

---

### Common Patterns

#### Concurrency / race condition test

```
Start (N parallel entries, userId = 1..N)
  → [HTTP Request: POST /claim-ticket { "userId": {{ $vars.userId }} }]
  → [If Condition: {{ $input.success }} == true]
        ├─ True  → [HTTP Request: POST /audit { "winner": {{ $vars.userId }} }] → End
        └─ False → End
```

All N entries hit the server simultaneously. Check the Log tab — only one entry should take the True branch. More than one means a race condition. See [Concurrency Testing](#concurrency-testing) for more patterns.

---

#### REST API chain

```
Start → [HTTP Request: POST /login] → [HTTP Request: GET /profile] → End
```

Use `{{ $input.token }}` in the second node's Authorization header to pass the token from the login response.

---

#### Conditional flow

```
Start → [HTTP Request] → [If Condition: {{ $input.status }} == active]
                                ├─ True  → [HTTP Request: do something] → End
                                └─ False → End
```

The If Condition node has two output handles labeled **True** and **False**. Connect each to a different next node.

---

#### WebSocket test

```
Start → [WebSocket: ws://host] → [WebSocket Emitter: send auth message]
      → [WebSocket Listener: message] → End
```

The WebSocket node opens the connection. Emitter sends a message (fire-and-forget). Listener waits for a message and passes the data to the next node as `$input`.

---

#### Socket.IO test

```
Start → [Socket.IO: v4, url] → [Socket.IO Emitter: join-room]
      → [Socket.IO Listener: room-data] → End
```

Socket.IO Listener and Emitter automatically find their Socket.IO connection by tracing backwards through the graph — you don't need to wire them directly.

---

### Node Reference

#### Start
Entry point. Optionally define variables for parallel execution (see [Parallel Runs](#parallel-runs)).

#### End
Exit point. Closes any Socket.IO and WebSocket connections opened on this execution path.

---

#### HTTP Request
Makes an HTTP request and passes the response to the next node as `$input`.

| Field | Notes |
|---|---|
| Method | GET, POST, PUT, PATCH, DELETE |
| URL | Supports `{{ }}` |
| Headers | Key-value rows. Checkbox on each row to disable without deleting. |
| Query Params | Appended to the URL. Per-row enable/disable. |
| Body | None · Form URL Encoded · JSON. Selecting a type auto-sets `Content-Type`. |

GET requests never send a body. Invalid URL or network error fails the entire workflow.

---

#### Socket.IO
Opens a Socket.IO connection. Place this node before any **Socket.IO Listener** or **Socket.IO Emitter** — they walk backwards through the graph to find their connection automatically.

| Field | Notes |
|---|---|
| Version | 2, 3, or 4 |
| URL | Server URL |
| Path | Defaults to `/socket.io` |

Connection timeout: 5 seconds. Failure stops the workflow.

#### Socket.IO Listener
Waits (blocks) until a named event arrives. The received data becomes `$input` for the next node.

| Field | Notes |
|---|---|
| Event Name | The Socket.IO event to wait for |

#### Socket.IO Emitter
Emits a Socket.IO event. **Fire-and-forget** — does not wait; the next node runs immediately.

| Field | Notes |
|---|---|
| Event Name | Event to emit |
| Event Body | Data to send |

---

#### WebSocket
Opens a WebSocket connection. Place this before any **WebSocket Listener** or **WebSocket Emitter**.

| Field | Notes |
|---|---|
| URL | e.g. `ws://localhost:8080` |

Connection timeout: 5 seconds. Failure stops the workflow.

#### WebSocket Listener
Waits (blocks) until a specific WebSocket event fires. The event data becomes `$input` for the next node.

| Field | Notes |
|---|---|
| Event | `open` · `message` · `close` · `error` (defaults to `open`) |

#### WebSocket Emitter
Sends a raw message over WebSocket. **Fire-and-forget**.

| Field | Notes |
|---|---|
| Event Body | Message to send |

---

#### If Condition
Evaluates a comparison and branches execution. Has two output handles: **True** and **False**.

| Field | Notes |
|---|---|
| Left Operand | Supports `{{ }}` |
| Operator | `==` `!=` `>` `>=` `<` `<=` |
| Right Operand | Supports `{{ }}` |

If the matching handle has no connection, that path ends silently.

---

#### Delay
Pauses execution for a set duration before continuing to the next node.

| Field | Notes |
|---|---|
| Delay (ms) | Duration in milliseconds |

---

#### Set Variable
Defines variables (`$vars.name`) available to all downstream nodes in the same path. Data flows through unchanged — this node doesn't modify what's passed between nodes.

| Field | Notes |
|---|---|
| Name / Value rows | Add as many as needed. Values support `{{ }}`. |

Variables accumulate: later Set Variable nodes add to (not replace) earlier ones. Variables are path-scoped — parallel paths don't share them.

---

### Logs & Debugging

After running a workflow, switch to the **Log** tab. Each node logs when it starts, what it received, and what it returned.

**Useful things:**
- **Click a node name** in a log entry to fly the canvas to that node
- **Show debug logs** checkbox — reveals expression errors, missing connections, skipped disabled rows, and other internal detail
- To revisit a past run, click it in the **Runs** tab — this loads its logs without re-running
- To cancel a workflow that's running (e.g. a Listener waiting indefinitely), click **Stop workflow Run** in the navbar

> Any workflows that were still running when the server last restarted are automatically marked as Cancelled.

---

### Import, Export & Duplicate

| Action | What it does |
|---|---|
| **Export workflow** | Downloads the workflow (nodes, edges, environments) as a `.json` file |
| **Import workflow** | Loads an exported `.json` as a new workflow — prompts for a name. All internal IDs are remapped, so importing twice creates two fully independent workflows. |
| **Duplicate workflow** | Same as export + import, done in one step. Prompts for a new name. |

Environments are included in exports and restored on import.

---

### Tips & Gotchas

**Reading concurrency test results**
In the Log tab, each parallel run is labeled with its index (e.g. `HTTP Request - 1`, `HTTP Request - 2`). Filter by index to follow one execution path at a time. Use **If Condition** nodes to branch on success/failure — this makes it easy to spot which runs succeeded versus failed at a glance. If you need to count outcomes, an audit-log request in the True branch gives you a server-side record to query after the run.

**Workflow hangs and never completes?**
A Listener node is waiting for an event that never arrives. Check the event name, make sure the server is sending it, and use **Stop workflow Run** to cancel.

**`{{ expression }}` not resolving?**
Enable **Show debug logs** — expression errors appear there with the exact message. Common cause: `$input` is null because the previous node failed silently.

**Emitters don't wait for a response**
Socket.IO Emitter and WebSocket Emitter fire and move on immediately. If you need to act on a response, follow the Emitter with a Listener.

**Deleting a node also removes its connections**
You don't need to manually clean up edges first.

**Set Variable is a passthrough**
It stores variables but doesn't change what flows to the next node. The data `$input` sees in the node after a Set Variable is the same data that entered the Set Variable.

**$input vs $previousInput**
These look one step different: in node C (after A→B→C), `$input` is B's output and `$previousInput` is what B received (A's output). Useful when you need both the immediate previous result and the one before it, without using Set Variable.

---

## Development

### ui

```sh
bun dev
```

Navigate to http://localhost:5173

### api

#### Running

```sh
bun dev
```

Navigate to http://localhost:9002

#### Migrations

Generate migrations from schema.ts

```sh
bun drizzle-kit generate --name your_migration_name
```

Run generated migrations

```sh
bun drizzle-kit migrate
```

Check database data

```sh
bun drizzle-kit studio
```

### Docker

Build

```sh
docker build -t flawiddsouza/general-tester:0.0.1 .
```

Run

```sh
docker run --name general-tester -it -p 9002:9002 flawiddsouza/general-tester:0.0.1
```
