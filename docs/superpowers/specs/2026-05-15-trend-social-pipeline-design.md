# Design Spec: Trend Research + Social Repurposing Pipeline

*Date: 2026-05-15*
*Status: Built*

---

## What This Is

A two-blueprint pipeline for market intelligence and content creation. One command runs the full pipeline. Each blueprint can also be triggered independently.

**TR-001** researches AI trends in construction and public works, analyzes them, and produces a PDF report.

**SM-001** takes that research and repurposes it into three social media posts for Arabic AI Agents (LinkedIn, Facebook, Instagram), saved as a second PDF.

---

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Chain type | One command, automatic | Reduces friction — fttah runs one thing, gets two outputs |
| Social posts | Arabic AI Agents brand only | That's the current priority |
| PDF destination | Local `reports/` folder | No Google auth needed — simple and immediate |
| PDF generation | `fpdf2` Python library | Pure Python, no external binaries, pip install only |
| Intermediate artifact | `reports/trend-analysis-YYYY-MM-DD.md` | Lets SM-001 run standalone without needing TR-001 in context |
| JSON handoff | `.tmp/` JSON files | Clean boundary between Architect (writes JSON) and Equipment (reads and renders) |

---

## Architecture

```
"run trend pipeline"
        │
        ▼
   ┌─────────┐
   │  TR-001  │  Phase 1: Web research (5-7 sources)
   │          │  Phase 2: Synthesize → 5 named trends
   │          │  Phase 3: Save → reports/trend-analysis-YYYY-MM-DD.md
   │          │  Phase 4: JSON → .tmp/ → generate_trend_report_pdf.py
   └────┬─────┘             → reports/trend-report-YYYY-MM-DD.pdf
        │
        │ (automatic handoff)
        ▼
   ┌─────────┐
   │  SM-001  │  Phase 1: Load TR-001 analysis (from context or file)
   │          │  Phase 2: Write LinkedIn post (150-200 words)
   │          │  Phase 3: Write Facebook post (100-150 words)
   │          │  Phase 4: Write Instagram post (80-100 words + hashtags)
   │          │  Phase 5: JSON → .tmp/ → generate_social_pdf.py
   └──────────┘             → reports/social-posts-YYYY-MM-DD.pdf
```

---

## Files

| File | Purpose |
|------|---------|
| `blueprints/trend-research.md` | TR-001 — research and analysis SOP |
| `blueprints/social-repurposing.md` | SM-001 — social content creation SOP |
| `equipment/generate_trend_report_pdf.py` | Renders trend analysis as PDF |
| `equipment/generate_social_pdf.py` | Renders 3 social posts as PDF |
| `.tmp/trend_report.json` | Handoff file — Architect writes, script reads |
| `.tmp/social_posts.json` | Handoff file — Architect writes, script reads |
| `reports/trend-analysis-YYYY-MM-DD.md` | Intermediate artifact — analysis in markdown |
| `reports/trend-report-YYYY-MM-DD.pdf` | Final output — trend report PDF |
| `reports/social-posts-YYYY-MM-DD.pdf` | Final output — social posts PDF |

---

## Standalone Triggers

| Trigger phrase | What runs |
|----------------|-----------|
| "run trend pipeline" | TR-001 → SM-001 (full pipeline) |
| "run trend research" | TR-001 only (stops after PDF) |
| "run social repurposing" | SM-001 only (reads latest analysis file) |

---

## Dependency

```
pip install fpdf2
```

One install, no external binaries, no auth tokens.

---

*End of design spec*
