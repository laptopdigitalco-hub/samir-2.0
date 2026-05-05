# Lead Update + Follow-Up Email

*Blueprint ID: LFU-001*
*Last updated: 2026-05-05*

---

## Goal

Find a named lead in the "Leads & Pipeline fttah" Google Sheet, update its pipeline stage, then draft a professional follow-up email to the lead contact — saved as a Gmail draft for fttah to review before sending. Nothing writes or sends without confirmation.

---

## Trigger

**On-demand:** fttah says "update [lead name] in the pipeline and draft a follow-up" or equivalent.

---

## Required Inputs

Collect these before doing anything. If any are missing, stop and ask.

| Input | Source | Notes |
|---|---|---|
| Lead name | fttah at runtime | Exact company or contact name to find in the sheet |
| New pipeline stage | fttah at runtime | Must match an existing stage label in the sheet |
| Contact name | fttah at runtime | First and last name — used in email salutation |
| Contact email | fttah at runtime | Where the draft will be addressed |
| Proposal reference | fttah at runtime | What was sent: service name, date sent, amount (if known) |
| Any specific angle | fttah at runtime | Optional — anything to emphasise or mention in the follow-up |

If fttah does not provide all required inputs upfront, ask for them before proceeding. Do not assume any field.

---

## Workflow

### Phase 1 — Confirm Inputs

1. List the inputs collected so far.
2. Flag any that are missing.
3. Ask: "Ready to proceed with these details?" — wait for confirmation before touching anything.

---

### Phase 2 — Read the Sheet

1. Call `list_enabled_zapier_actions` — confirm a Google Sheets read action is available.
   - If not: stop. "No Google Sheets read action enabled in Zapier. Enable one and re-run."
2. Read the full "Leads & Pipeline fttah" sheet.
3. Search for a row matching the lead name (case-insensitive, partial match allowed).
   - If no match found: stop. "No row found for [lead name]. Check the sheet and re-run."
   - If multiple matches found: list them. Ask fttah which row to update.
4. Show fttah the current row data (lead name, current stage, deal value, next step).

---

### Phase 3 — Confirm the Update

Before writing anything:

> "I'm about to update [Lead Name] from **[current stage]** to **[new stage]**. Confirm?"

Wait for explicit confirmation. If fttah says no or changes the stage: update the target and ask again.

---

### Phase 4 — Update the Sheet

1. Call the Google Sheets write/update action via Zapier MCP.
2. Update the `Stage` field only — do not touch any other column unless fttah explicitly asks.
3. Confirm: "Stage updated to [new stage]."
4. If the write action fails: stop. Report the exact error. Do not retry automatically.

---

### Phase 5 — Draft the Follow-Up Email

Compose the email using the inputs collected in Phase 1. Follow the tone rules below.

**Show the draft to fttah before saving it anywhere.**

> "Here's the draft — want me to save it, edit anything, or scrap it?"

Wait for confirmation before proceeding.

---

### Phase 6 — Save as Gmail Draft

1. Call `list_enabled_zapier_actions` — confirm a Gmail draft action is available.
   - If not: stop. "No Gmail draft action enabled in Zapier. Enable one, or I can copy the draft here for you to send manually."
2. Save the email as a Gmail draft — do NOT send it.
3. Confirm: "Draft saved in Gmail. Subject: [subject line]. Nothing sent."

---

## Email Template

```
Subject: Following up — [Service/Proposal Name]

Hi [First Name],

I wanted to follow up on the proposal I sent over on [date sent].

[One sentence restating the core value: what the service does for them specifically.]

Happy to jump on a quick call this week if you have questions or want to talk through the details.

Let me know either way — even a no is useful.

[Signature]
```

**Tone rules:**
- Professional but human — not corporate.
- Short. Two to four sentences in the body maximum.
- No flattery, no filler, no "I hope this email finds you well."
- Direct ask at the end — reply or call, nothing vague.
- Adapt the template to what fttah shares about the lead and the proposal.

---

## Failure Handling

| Failure | Response |
|---|---|
| Missing inputs at start | Stop. List what's missing. Ask before proceeding. |
| Lead not found in sheet | Stop. Report. Ask fttah to verify the name. |
| Multiple matches in sheet | List them. Ask which to update. |
| Sheet write fails | Stop. Report exact error. Do not retry automatically. |
| Gmail draft action not enabled | Stop. Offer to paste draft in chat instead. |
| Gmail save fails | Output draft in chat. Note the save failure. |

---

## Permissions

Per `permissions.md`:
- Never send an email — always save as draft only.
- Never write to the sheet without explicit confirmation.
- Show the email draft before saving it.
- If fttah changes any input mid-run: re-confirm before executing.

---

*End of LFU-001*
