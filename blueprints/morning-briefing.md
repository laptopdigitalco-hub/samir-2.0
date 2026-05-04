# Morning Briefing

*Blueprint ID: MB-001*
*Last updated: 2026-05-04*

---

## Goal

Produce a focused daily briefing that grounds fttah for the day — pulling from current priorities, reflecting on yesterday, reframing any worry, and leaving one question to think with. Saved as a file. Nothing sent externally.

---

## Trigger

**On-demand:** fttah says "run morning briefing" or equivalent.

---

## Required Inputs

| Input | Source | Notes |
|---|---|---|
| Weekly focus and priorities | `intel/focus.md` | Read at the start of every run |
| Yesterday's output | fttah (asked directly) | One question — no prompting for detail |
| Today's worry | fttah (asked directly) | One question — no prompting for detail |

No MCP tools required. No API calls. No external reads beyond `intel/focus.md`.

---

## Workflow

### Phase 1 — Read

1. Read `intel/focus.md`.
2. Extract: this week's top priority, any active deadlines, and any flagged items.
3. Do not summarise or report yet — just hold the context.

---

### Phase 2 — Ask

Ask both questions in a single message. Wait for fttah's answers before continuing.

```
Two quick questions before your briefing:

1. What did you get done yesterday?
2. What's the one thing you're worried about today?
```

Do not proceed to Phase 3 until fttah has answered both.

---

### Phase 3 — Produce the Briefing

Write the briefing using fttah's answers and the focus context. Four sections, in order.

#### Section 1 — Today's Top Focus

Pull the single most important priority from `intel/focus.md` for today or this week. One sentence. No list.

#### Section 2 — Yesterday

One-line reflection on what fttah reported getting done. Acknowledge it straight — no cheerleading, no padding.

#### Section 3 — Reframe

Take whatever fttah said they're worried about. Write one short paragraph that reframes it — not to dismiss the worry, but to name it clearly and shift the angle. If it's solvable, say what the actual lever is. If it's not, name what fttah can control.

#### Section 4 — Question to Sit With

One question. Not an action item. Something worth thinking about during the day. Drawn from the tension between the worry and the priority.

---

### Phase 4 — Save

1. Check if `briefings/` exists at the project root. If not, create it.
2. Save the briefing to `briefings/YYYY-MM-DD.md` using today's date.
3. Confirm: "Briefing saved to briefings/[date].md."

---

## Output Format

```
# Morning Briefing — [Date]

## Today's Focus
[One sentence — the top priority for today]

## Yesterday
[One line — what you got done]

## On the Worry
[Short paragraph reframing what fttah said they're worried about]

## Question for Today
[One question to sit with]
```

No headers beyond these four. No bullets inside sections. Short paragraphs only.

---

## Failure Handling

| Failure | Response |
|---|---|
| `intel/focus.md` missing or empty | Ask fttah: "focus.md is missing — what are you focused on this week?" Then proceed with the answer. |
| fttah answers only one question | Ask for the missing answer before continuing. |
| `briefings/` folder cannot be created | Output the briefing directly in chat. Note the save failure. |
| File write fails | Same as above — output in chat, note the failure. |

---

## Voice Rules for the Briefing

- No motivational language. No "you've got this."
- The reframe is honest, not optimistic by default.
- The question is specific — drawn from what fttah actually said, not generic.
- Every sentence earns its place.

---

*End of MB-001*
