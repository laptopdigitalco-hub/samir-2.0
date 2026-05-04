# Communication Business Handler

*Blueprint ID: CBH-001*
*Last updated: 2026-05-04*

---

## Goal

Read, triage, and draft responses to all pending client and subcontractor emails. Produce a summary of what needs attention, then one ready-to-review draft per item. Nothing is sent — everything goes to Gmail Drafts for fttah to approve and send.

---

## Trigger

**On-demand:** fttah says "handle comms" or equivalent.
**Inbound:** A new message arrives in a client or subcontractor thread.

Both triggers run the same full workflow.

---

## Required Inputs

| Input | Tool | Notes |
|---|---|---|
| Inbox threads | `search_threads` | Scoped to client + subcontractor labels/senders |
| Full thread history | `get_thread` | Needed for context before drafting |
| Calendar events | `list_events` | Only if scheduling is mentioned in a thread |

No equipment scripts required. Entire workflow runs on MCP tools.

---

## Scope

Two communication types only. All other email is ignored.

1. **Client emails** — active or prospective clients
2. **Subcontractor emails** — vendors, contractors, suppliers working under fttah

---

## Workflow

### Phase 1 — Read

1. Run `search_threads` with query: `is:unread (label:clients OR label:subcontractors) -label:handled`
2. If zero results: report "No pending communications found." Stop.
3. For each thread, run `get_thread` to retrieve full message history.
4. Classify each thread as **Client** or **Subcontractor** based on sender or label.
5. If a thread references a date, time, or meeting — run `list_events` for that window before moving on.

---

### Phase 2 — Triage

For each thread, determine:

- Is a response needed?
- Is there a deadline or blocked party?
- Is there enough context to draft a reply?

Assign one status per thread:

| Status | Meaning |
|---|---|
| `DRAFT` | Enough context to write a response now |
| `NEEDS INFO` | Missing information — flag for fttah, no draft |
| `FYI ONLY` | No response required — note in summary, skip drafting |

---

### Phase 3 — Draft

Process all `DRAFT` threads. Apply the correct sub-workflow based on type.

#### Sub-workflow A — Client Email

> Voice: Professional but warm. Sounds like a real person wrote it. Open with their specific problem — not a greeting. No filler phrases ("Hope this finds you well", "Please don't hesitate", "As per my last email", "Best regards" padding).

Format — always use this structure:

```
Subject: Next steps — [Client Name]

[One genuine opening line that names their specific situation or problem]

Here's what's happening:
- [Concrete next step or status]
- [Next bullet if needed]
- [Third bullet if needed]

[Short sign-off — one line or nothing]

fttah
```

Steps:
1. Read the full thread. Identify the one thing the client is waiting on or worried about.
2. Write the opening line around that — specific to them, not generic.
3. Bullets = concrete actions or updates only. No vague reassurances.
4. Keep the sign-off to one natural sentence or omit entirely.
5. Run `create_draft` with the completed message.
6. Run `label_message` to apply `label:handled` to the thread.

---

#### Sub-workflow B — Subcontractor Email

> Voice: Direct and clear. No fluff. First sentence states the point. Subcontractors need precision, not warmth.

Format:

```
Subject: [Specific topic — no vague subjects]

[One sentence: what this message is about]

[What is needed from them, or what fttah is confirming]

[Deadline or next step if applicable]

fttah
```

Steps:
1. Read the thread. Identify the open item — deliverable, timeline, question, or issue.
2. Draft a response where the first sentence states the ask or update.
3. Include deadline or expected next contact if relevant.
4. Run `create_draft` with the completed message.
5. Run `label_message` to apply `label:handled` to the thread.

---

### Phase 4 — Report

Output a summary first, then the drafts. Always in this order.

---

## Output Format

### Section 1 — Summary

```
## Pending Communications — [Date]

### Clients ([N] items)
1. [Client Name] — [1-line description of what they need] — [DRAFT / NEEDS INFO / FYI ONLY]

### Subcontractors ([N] items)
1. [Name] — [1-line description] — [DRAFT / NEEDS INFO / FYI ONLY]

### Flagged for fttah
- [Thread] — [Why a draft cannot be created without more information]
```

### Section 2 — Drafts

One block per item, in the same order as the summary:

```
---
## Draft [N] — [Client / Subcontractor]: [Name]
**Subject:** [Subject line]
**To:** [Email address]
**Thread context:** [1-sentence summary of the conversation]

[Full draft body]

Draft saved to Gmail Drafts. Thread labeled: handled.
---
```

---

## Failure Handling

| Failure | Response |
|---|---|
| `search_threads` errors | Report the error. Stop. Ask fttah to check Gmail MCP connection. |
| `get_thread` fails for a thread | Skip it. Include in summary as `ERROR — could not retrieve thread`. |
| `create_draft` fails | Report which draft failed. Include full draft text in output so fttah can copy manually. Do not label the thread as handled. |
| `label_message` fails | Report it. Draft still stands. Remind fttah to label manually to avoid duplicate processing. |
| No clear recipient in thread | Flag as `NEEDS INFO`. Do not guess the recipient. |
| `list_events` fails | Proceed without calendar data. Note in the draft: "Could not verify calendar — confirm scheduling details before sending." |

---

## Voice Quick Reference

**Client-facing**
- Open with their specific problem — not a greeting
- Bullets = actions and updates only, not reassurances
- Never: "Hope this finds you well" / "Please don't hesitate" / "As per" / trailing "Best regards"
- Sign off short — one line or nothing

**Subcontractor-facing**
- First sentence states the point
- Include the deadline or next step
- Precision over warmth — but no harshness

**Both**
- Nothing is ever sent directly
- Every output is a Gmail draft
- fttah reviews and sends

---

## Future Equipment (not built yet)

If volume increases, these scripts could be extracted to `equipment/`:

- `triage_threads.py` — classify and score threads by urgency
- `draft_client_email.py` — client draft generator with voice rules enforced
- `draft_subcontractor_email.py` — subcontractor draft generator
- `label_handled.py` — batch label utility post-send

---

*End of CBH-001*
