# Pipeline Monday Summary

*Blueprint ID: PMS-001*
*Last updated: 2026-05-05*

---

## Goal

Every Monday morning, read the "Leads & Pipeline fttah" Google Sheet via Zapier MCP and produce a focused pipeline summary: stage counts, active pipeline value, and the three hottest leads with next steps due this week. Saved as a file. Nothing sent externally.

---

## Trigger

**On-demand:** fttah says "run pipeline summary" or equivalent.

Intended cadence: Monday mornings, before the week starts.

---

## Required Inputs

| Input | Source | Notes |
|---|---|---|
| Leads & Pipeline fttah | Google Sheets via Zapier MCP | Read-only. Full sheet. |
| Today's date | `CLAUDE.local.md` → currentDate | Used to filter "this week" next steps |

No questions asked of fttah. This runs silently and saves output.

---

## Expected Sheet Structure

The blueprint assumes the following columns exist in the sheet. If column names differ, stop and report what was found before continuing.

| Column | Expected name | Notes |
|---|---|---|
| Lead name | `Lead` or `Name` | Company or contact name |
| Stage | `Stage` | Pipeline stage label |
| Deal value | `Value` or `Deal Value` | Numeric, in USD |
| Next step | `Next Step` | Free text description |
| Next step date | `Next Step Date` | Date format — used to filter this week |

If any required column is missing: stop, report the column names found, and ask fttah how to map them before proceeding.

---

## Active Stages (for value calculation)

The following stages count toward total active pipeline value:

- Quote sent
- Discovery booked
- Audit in progress

All other stages are counted but excluded from the value total.

---

## Workflow

### Phase 1 — Connect and Read

1. Call `list_enabled_zapier_actions` to confirm a Google Sheets read action is available.
2. If no Sheets read action is enabled: stop and report — "No Google Sheets read action is enabled in Zapier. Enable one and re-run."
3. Read the full "Leads & Pipeline fttah" sheet.
4. Confirm row count received before proceeding.

---

### Phase 2 — Compute Stage Counts

1. Group all rows by `Stage`.
2. Count the number of leads in each stage.
3. Sort stages by count, descending.
4. Exclude blank or null stage rows from counts — log how many were skipped.

---

### Phase 3 — Compute Active Pipeline Value

1. Filter rows where `Stage` is one of: Quote sent, Discovery booked, Audit in progress.
2. Sum the `Value` column for those rows.
3. If any value field is blank or non-numeric: exclude from sum, note how many were skipped.
4. Round total to nearest whole dollar.

---

### Phase 4 — Identify Top 3 Hottest Leads

Hottest leads = leads in active stages (Quote sent, Discovery booked, Audit in progress) with a `Next Step Date` falling within the current week (Monday to Sunday).

Ranking priority:
1. Stage rank: Quote sent > Discovery booked > Audit in progress
2. Within same stage: earliest `Next Step Date` first

If fewer than 3 leads qualify this week, include the next closest by `Next Step Date` regardless of stage — and note they fall outside this week.

If no active leads exist at all: state that clearly in the output.

---

### Phase 5 — Produce the Summary

Write the summary using the computed data. Three sections, in order. See Output Format below.

---

### Phase 6 — Save

1. Save to `briefings/YYYY-MM-DD-pipeline.md` using today's date.
2. Confirm: "Pipeline summary saved to briefings/[date]-pipeline.md."

---

## Output Format

```
# Pipeline Summary — [Date]

## Pipeline Stages
[Stage name]: [count] leads
[Stage name]: [count] leads
...
Total: [N] leads across [N] stages

## Active Pipeline Value
$[total] across [N] active leads
(Quote sent · Discovery booked · Audit in progress)

## Hottest Leads This Week
1. [Lead name] — [Stage]
   Next step: [Next Step description]
   Due: [Next Step Date]

2. [Lead name] — [Stage]
   Next step: [Next Step description]
   Due: [Next Step Date]

3. [Lead name] — [Stage]
   Next step: [Next Step description]
   Due: [Next Step Date]
```

No additional sections. No commentary. No padding. If a field is blank in the sheet, write "Not specified."

---

## Failure Handling

| Failure | Response |
|---|---|
| No Sheets action enabled in Zapier | Stop. Report. Ask fttah to enable one. |
| Sheet not found or inaccessible | Stop. Report exact error. Do not retry automatically. |
| Required columns missing or renamed | Stop. List columns found. Ask fttah for mapping. |
| No active leads exist | State clearly in output — do not fabricate data. |
| Value column has non-numeric entries | Skip those rows, note count in output. |
| Fewer than 3 hot leads this week | Include next closest, flag that they fall outside this week. |
| File save fails | Output summary directly in chat. Note the save failure. |

---

## Voice Rules

- Numbers only — no narrative around them.
- If something is missing from the sheet, say so plainly.
- No motivational framing. No "great pipeline!" commentary.
- The summary is a tool, not a presentation.

---

*End of PMS-001*
