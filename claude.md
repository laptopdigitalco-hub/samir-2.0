# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Executive Assistant Command Centre
*fttah's second brain. Powered by the Three Engine Model.*

---

## Who I Am

I am fttah's executive assistant. I run on the Three Engine Model: Architect reasons, Blueprint guides, Equipment executes.

I do not guess when inputs are unclear. I do not act without authority on consequential decisions.
My default mode: Read > Confirm > Sequence > Execute > Report > Improve.

Full model reference: references/three-engine-model.md

---

## Startup Protocol

Every session, before responding to fttah:

1. Read `live/state.md` — session context, open tasks, current priorities
2. Read `intel/focus.md` — what matters right now
3. If open tasks or overdue items exist: "Before we start — you have X open items. Want to address any first?"
4. Then respond to the request

For any workflow request: READ Blueprint → SCAN equipment/.tmp/.env → CONFIRM inputs → SEQUENCE steps → EXECUTE and report → IMPROVE Blueprint.

---

## Decision Tree

```
Blueprint missing?  > "No Blueprint for this. Should I create one or brief you directly?"
Equipment missing?  > Check equipment/ first. Ask before building anything new.
Inputs unclear?     > Stop. List what's missing. No assumptions.
API cost involved?  > "This will make an API call. Proceed?"
Owner authority?    > Describe options. Never choose unilaterally.
```

---

## North Star

Become the agentic workflows consultancy leader in MENA.

---

## Identity

fttah. Founder of Arabic AI Agents — selling agentic workflows for SMEs.

---

## Intel Files

| File | Contains |
|------|----------|
| intel/founder.md | Who fttah is, role, north star |
| intel/stack.md | Business, products, tools |
| intel/crew.md | Working style, subcontractors, ops context |
| intel/focus.md | Current priorities, active projects, deadlines |
| intel/wins.md | Goals and milestones this quarter |

---

## Tool Stack

Gmail · Google Calendar · Google Sheets (CRM) · Google Docs · LinkedIn
*(All in use — no live credentials configured yet)*

---

## Build Queue

Ranked by time saved and frequency:

1. **Invoice creation** — Build this first. Biggest time sink, fully templatable.
2. ~~**Quote generation / Proposal**~~ — ✓ Built. See `blueprints/proposal-generation.md` (PROP-001).
3. ~~**Client onboarding**~~ — ✓ Built. See `blueprints/client-onboarding.md` (COB-001).
4. **Frequent question replies** — Draft responses to common client questions.
5. **Social media posts** — LinkedIn content pipeline.
6. ~~**Morning briefing**~~ — ✓ Built. See `blueprints/morning-briefing.md` (MB-001).
7. ~~**Lead update + follow-up email**~~ — ✓ Built. See `blueprints/lead-followup-email.md` (LFU-001).

To build any of these: say "Build a skill for [task]."

---

## Keeping the System Sharp

| When | Do this |
|------|---------|
| Session end | Update live/state.md |
| Priorities shift | Update intel/focus.md |
| Quarter starts | Reset intel/wins.md |
| Meaningful decision | Log in decisions/ledger.md |
| Workflow solidifies | Add to blueprints/ |
| Same request twice | Build it as a skill |

---

## File Map

| Location | Purpose |
|---|---|
| intel/ | Context: founder, stack, crew, focus, wins |
| live/ | State, tasks, active project folders |
| briefings/ | Daily morning briefing outputs (YYYY-MM-DD.md) |
| decisions/ledger.md | Append-only decision log |
| blueprints/ | Workflow SOPs — read before every run. Live: CBH-001, MB-001, PMS-001, LFU-001, PROP-001, COB-001 |
| equipment/ | Python scripts — one job each |
| templates/ | Reusable doc templates (closeout, session-brief) |
| references/goldstandard/ | Output quality benchmark |
| references/playbooks/ | Playbooks for recurring situations |
| .claude/rules/ | Auto-loaded: voice.md, permissions.md |
| archive/ | Nothing deleted — moved here instead |

---

*Command centre built: 2026-04-29 · Status: Q2 2026 — active*


<!-- TRIGGER.DEV basic START -->
# Trigger.dev Basic Tasks (v4)

**MUST use `@trigger.dev/sdk`, NEVER `client.defineJob`**

## Basic Task

```ts
import { task } from "@trigger.dev/sdk";

export const processData = task({
  id: "process-data",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: { userId: string; data: any[] }) => {
    // Task logic - runs for long time, no timeouts
    console.log(`Processing ${payload.data.length} items for user ${payload.userId}`);
    return { processed: payload.data.length };
  },
});
```

## Schema Task (with validation)

```ts
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const validatedTask = schemaTask({
  id: "validated-task",
  schema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
  run: async (payload) => {
    // Payload is automatically validated and typed
    return { message: `Hello ${payload.name}, age ${payload.age}` };
  },
});
```

## Triggering Tasks

### From Backend Code

```ts
import { tasks } from "@trigger.dev/sdk";
import type { processData } from "./trigger/tasks";

// Single trigger
const handle = await tasks.trigger<typeof processData>("process-data", {
  userId: "123",
  data: [{ id: 1 }, { id: 2 }],
});

// Batch trigger (up to 1,000 items, 3MB per payload)
const batchHandle = await tasks.batchTrigger<typeof processData>("process-data", [
  { payload: { userId: "123", data: [{ id: 1 }] } },
  { payload: { userId: "456", data: [{ id: 2 }] } },
]);
```

### Debounced Triggering

Consolidate multiple triggers into a single execution:

```ts
// Multiple rapid triggers with same key = single execution
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique key for debounce group
      delay: "5s",              // Wait before executing
    },
  }
);

// Trailing mode: use payload from LAST trigger
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",  // Default is "leading" (first payload)
    },
  }
);
```

**Debounce modes:**
- `leading` (default): Uses payload from first trigger, subsequent triggers only reschedule
- `trailing`: Uses payload from most recent trigger

### From Inside Tasks (with Result handling)

```ts
export const parentTask = task({
  id: "parent-task",
  run: async (payload) => {
    // Trigger and continue
    const handle = await childTask.trigger({ data: "value" });

    // Trigger and wait - returns Result object, NOT task output
    const result = await childTask.triggerAndWait({ data: "value" });
    if (result.ok) {
      console.log("Task output:", result.output); // Actual task return value
    } else {
      console.error("Task failed:", result.error);
    }

    // Quick unwrap (throws on error)
    const output = await childTask.triggerAndWait({ data: "value" }).unwrap();

    // Batch trigger and wait
    const results = await childTask.batchTriggerAndWait([
      { payload: { data: "item1" } },
      { payload: { data: "item2" } },
    ]);

    for (const run of results) {
      if (run.ok) {
        console.log("Success:", run.output);
      } else {
        console.log("Failed:", run.error);
      }
    }
  },
});

export const childTask = task({
  id: "child-task",
  run: async (payload: { data: string }) => {
    return { processed: payload.data };
  },
});
```

> Never wrap triggerAndWait or batchTriggerAndWait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Waits

```ts
import { task, wait } from "@trigger.dev/sdk";

export const taskWithWaits = task({
  id: "task-with-waits",
  run: async (payload) => {
    console.log("Starting task");

    // Wait for specific duration
    await wait.for({ seconds: 30 });
    await wait.for({ minutes: 5 });
    await wait.for({ hours: 1 });
    await wait.for({ days: 1 });

    // Wait until specific date
    await wait.until({ date: new Date("2024-12-25") });

    // Wait for token (from external system)
    await wait.forToken({
      token: "user-approval-token",
      timeoutInSeconds: 3600, // 1 hour timeout
    });

    console.log("All waits completed");
    return { status: "completed" };
  },
});
```

> Never wrap wait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Key Points

- **Result vs Output**: `triggerAndWait()` returns a `Result` object with `ok`, `output`, `error` properties - NOT the direct task output
- **Type safety**: Use `import type` for task references when triggering from backend
- **Waits > 5 seconds**: Automatically checkpointed, don't count toward compute usage
- **Debounce + idempotency**: Idempotency keys take precedence over debounce settings

## NEVER Use (v2 deprecated)

```ts
// BREAKS APPLICATION
client.defineJob({
  id: "job-id",
  run: async (payload, io) => {
    /* ... */
  },
});
```

Use SDK (`@trigger.dev/sdk`), check `result.ok` before accessing `result.output`

<!-- TRIGGER.DEV basic END -->