# Pipeline Summary

Run the pipeline summary for fttah. Follow PMS-001 exactly.

## Steps

1. Call `list_enabled_zapier_actions` to confirm a Google Sheets read action is available.
   - If none found: stop. Report — "No Google Sheets read action is enabled in Zapier. Enable one and re-run." Do not continue.

2. Read the full "Leads & Pipeline fttah" Google Sheet via the enabled Zapier action.
   - Confirm row count received before continuing.
   - Check for required columns: `Lead` or `Name`, `Stage`, `Value` or `Deal Value`, `Next Step`, `Next Step Date`.
   - If any required column is missing or renamed: stop. List the column names found. Ask fttah how to map them. Do not proceed.

3. Compute stage counts.
   - Group all rows by `Stage`. Count leads per stage. Sort descending.
   - Skip blank/null stage rows — note how many were skipped.

4. Compute active pipeline value.
   - Active stages: Quote sent · Discovery booked · Audit in progress.
   - Sum `Value` for rows in those stages only.
   - Skip blank or non-numeric values — note how many were skipped.
   - Round to nearest whole dollar.

5. Identify the top 3 hottest leads.
   - Hottest = active stage + `Next Step Date` falls within this week (Monday–Sunday).
   - Rank: Quote sent > Discovery booked > Audit in progress. Tie-break: earliest date.
   - If fewer than 3 qualify this week: fill remaining slots with next closest by date regardless of stage — flag them as outside this week.
   - If no active leads at all: state that clearly. Do not fabricate.

6. Write the summary using this exact format:

```
# Pipeline Summary — [YYYY-MM-DD]

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

No additional sections. No commentary. No padding. Blank fields → write "Not specified."

7. Save to `briefings/YYYY-MM-DD-pipeline.md` using today's date.
   - Confirm: "Pipeline summary saved to briefings/[date]-pipeline.md."
   - If save fails: output the summary directly in chat and note the failure.

## Failure handling

- No Sheets action in Zapier → stop, report, ask fttah to enable one
- Sheet not found or inaccessible → stop, report the exact error, do not retry
- Required columns missing → stop, list columns found, ask for mapping
- No active leads → state clearly in output
- Value column has non-numeric entries → skip, note count in output
- Fewer than 3 hot leads → include next closest, flag as outside this week
- File save fails → output in chat, note the failure
