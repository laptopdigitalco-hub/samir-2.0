# Social Media Repurposing

*Blueprint ID: SM-001*
*Last updated: 2026-05-15*

---

## Goal

Take the trend analysis from TR-001 and repurpose it into three social media posts for Arabic AI Agents: LinkedIn, Facebook, and Instagram. Save all three posts to a formatted PDF.

---

## Trigger

**Automatic** — runs immediately after TR-001 when triggered by "run trend pipeline".

**"run social repurposing"** — runs SM-001 standalone. Reads the most recent trend analysis from `reports/`.

---

## Required Inputs

| Input | Source |
|-------|--------|
| Trend analysis | In-context from TR-001 (pipeline), or `reports/trend-analysis-YYYY-MM-DD.md` (standalone) |

---

## Workflow

### Phase 1 — Load Analysis

**If running in-pipeline:** The TR-001 analysis is already in context. Use it directly.

**If running standalone:**
1. List files in `reports/` matching `trend-analysis-*.md`.
2. Pick the one with the most recent date in the filename.
3. Read it.
4. If no file found: "No trend analysis found. Run trend research first, or paste the analysis here and I'll work from that."

---

### Phase 2 — LinkedIn Post

Write a thought leadership post for Arabic AI Agents targeting construction and public works professionals.

**Format:**
- Hook line (one punchy sentence that earns the scroll)
- 3 key insights (short bullets — 1 sentence each, drawn from the top trends)
- Closing CTA (one sentence — invite engagement or link to more)

**Specs:**
- Length: 150–200 words
- Tone: confident, direct, professional — not corporate
- Voice: Arabic AI Agents as the expert in AI workflows for the sector
- No hashtags on LinkedIn

---

### Phase 3 — Facebook Post

Write a conversational post targeting business owners and entrepreneurs who may work in or adjacent to construction and public works.

**Specs:**
- Length: 100–150 words
- Tone: warm, accessible, real-world framing
- Angle: what does this mean for people actually working in the sector — not abstract
- 2–3 hashtags at the end (natural, not cluttered)

---

### Phase 4 — Instagram Post

Write a short, punchy caption. Pick the single most striking insight from the research and make it land.

**Specs:**
- Length: 80–100 words
- Tone: direct and energetic — made for a fast scroll
- End with 5 relevant hashtags on their own line

Example hashtags: #AIinConstruction #ArabicAIAgents #FutureOfWork #SmartBuilding #AIWorkflows

---

### Phase 5 — Generate PDF

Write the following JSON to `.tmp/social_posts.json`:

```json
{
  "date": "YYYY-MM-DD",
  "topic": "AI in Construction and Public Works",
  "brand": "Arabic AI Agents",
  "linkedin": "full LinkedIn post text",
  "facebook": "full Facebook post text",
  "instagram": "full Instagram caption text",
  "hashtags": ["#AIinConstruction", "#ArabicAIAgents", "#FutureOfWork", "#SmartBuilding", "#AIWorkflows"]
}
```

Then run:

```
python equipment/generate_social_pdf.py
```

Confirm to fttah: "Social posts saved to reports/social-posts-YYYY-MM-DD.pdf"

---

## Failure Handling

| Failure | Response |
|---------|----------|
| No trend analysis file found (standalone) | "No trend analysis found. Run trend research first, or paste the analysis here." |
| `.tmp/` write fails | Output the JSON directly in chat. Ask fttah to save manually before running the script. |
| Python script fails | Output all 3 posts clearly formatted in chat. Note the save failure. Ask fttah to check `pip install fpdf2`. |

---

## Output

| File | Contents |
|------|----------|
| `reports/social-posts-YYYY-MM-DD.pdf` | LinkedIn post, Facebook post, Instagram post — all formatted and dated |

---

## Voice Rules for Social Posts

- No buzzwords. No "revolutionising" or "game-changing."
- Every sentence should be something fttah would actually say.
- LinkedIn can be polished — Facebook and Instagram must feel human.
- The Instagram hook has to work without any context. Write it like the reader knows nothing.

---

*End of SM-001*
