# Trend Research & Analysis

*Blueprint ID: TR-001*
*Last updated: 2026-05-15*

---

## Goal

Research the latest trends in AI use across construction and public works. Synthesize findings into a clean 5-trend analysis. Save the analysis as a markdown file and produce a formatted PDF report.

---

## Trigger

**"run trend pipeline"** — runs TR-001 then automatically continues to SM-001.

**"run trend research"** — runs TR-001 alone. Stops after the PDF is saved.

---

## Required Inputs

None. All research is sourced from web search during the run.

---

## Workflow

### Phase 1 — Research

Run the following web searches. Do not write output yet — hold all findings in context.

Queries to run:
- "AI in construction industry 2025 2026 trends"
- "AI in public works automation latest"
- "artificial intelligence construction sector report"

For each relevant result, note:
- Title
- Source name
- Date (approximate is fine)
- One-sentence key finding

Target: 5–7 distinct sources. Prefer recent (2024–2026). Avoid duplicates from the same source.

---

### Phase 2 — Analyze

Synthesize all findings into exactly **5 named trends**.

For each trend, write:
- **Trend name** (bold, 3–6 words)
- What it is (1–2 sentences — what's happening)
- What's driving it (1 sentence — the underlying cause)
- Why it matters for the sector (1 sentence — the business or operational impact)

Hold the analysis in context. Do not write to file yet.

---

### Phase 3 — Save Analysis

1. Check that `reports/` exists at the project root. If not, create it.
2. Write the analysis to `reports/trend-analysis-YYYY-MM-DD.md` using today's date.

File structure:

```
# AI in Construction & Public Works — Trend Analysis
*Date: YYYY-MM-DD*

## Sources Reviewed

1. [Title] — [Source], [Date] — [Key finding]
2. ...

## Top 5 Trends

### 1. [Trend Name]
[Description]
**Driver:** [What's causing it]
**Impact:** [Why it matters]

### 2. ...
```

---

### Phase 4 — Generate PDF

Write the following JSON to `.tmp/trend_report.json`:

```json
{
  "date": "YYYY-MM-DD",
  "sources": [
    {"title": "", "source": "", "date": "", "finding": ""}
  ],
  "trends": [
    {"name": "", "description": "", "driver": "", "impact": ""}
  ]
}
```

Then run:

```
python equipment/generate_trend_report_pdf.py
```

Confirm to fttah: "Trend report saved to reports/trend-report-YYYY-MM-DD.pdf"

---

### Phase 5 — Handoff

- If triggered as **"run trend pipeline"**: continue immediately to SM-001.
- If triggered as **"run trend research"**: stop here. Report: "TR-001 complete. Trend report and analysis saved to reports/."

---

## Failure Handling

| Failure | Response |
|---------|----------|
| Web search returns no usable results | Try alternate query. If still empty: "Web search isn't returning results. Can you share a source or topic to search from?" |
| `.tmp/` write fails | Output the JSON directly in chat. Ask fttah to save it manually as `.tmp/trend_report.json` before running the script. |
| Python script fails | Show the error. Ask fttah to confirm `fpdf2` is installed: `pip install fpdf2` |
| `reports/` cannot be created | Write both the markdown and PDF output directly in chat. Note the failure. |

---

## Output

| File | Contents |
|------|----------|
| `reports/trend-analysis-YYYY-MM-DD.md` | Full analysis — sources + 5 trends |
| `reports/trend-report-YYYY-MM-DD.pdf` | Formatted PDF version of the analysis |

---

*End of TR-001*
