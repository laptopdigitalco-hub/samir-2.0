# Lead Generation Dubai HR — Design Spec
*Date: 2026-05-16*

## Context

fttah manually researches HR consultant businesses in Dubai to find new leads, which is time-consuming and inconsistent. This task automates that prospecting: every morning at 7am UAE time, a Trigger.dev scheduled task scrapes the web for HR consultants in Dubai, scores each one, and appends qualified leads directly to the "Leads & Pipeline fttah" Google Sheet. Runs completely unattended — no manual input required.

---

## Architecture

```
Trigger.dev Scheduled Task (cron: 0 3 * * * / 7am UAE)
├── Phase 1: Search        — Firecrawl search API, 4 queries
├── Phase 2: Scrape        — Firecrawl scrape each URL, Claude Haiku extracts structured data
├── Phase 3: Deduplicate   — Normalize domains, read existing sheet to skip known leads
├── Phase 4: Score         — Rule-based scoring 1–10, drop below threshold
└── Phase 5: Write         — OAuth refresh token → append rows to Google Sheet
```

Error handling: every phase and every individual item is wrapped in try/catch. No single failure crashes the run. The task only throws (triggering Trigger.dev retry) if Phase 1 returns zero results due to a Firecrawl API error.

---

## Components

### Task File
`src/trigger/lead-generation-dubai-hr.ts`

Single file. Exports the scheduled task. Helper functions live in the same file as named exports — no premature extraction until there's clear reuse.

### Scheduling
```ts
schedule: { cron: "0 3 * * *" }  // 3am UTC = 7am UAE (UTC+4)
```

### Constants (top of file, easy to tune)
```ts
const SCORE_THRESHOLD = 4;
const MAX_RESULTS_PER_QUERY = 10;
const SHEET_ID = "1Vxlq5so-SioJydpe3HssccVuq2Vs2Ndl0nx5ga8FK9U";
const SHEET_TAB = "Leads & Pipeline fttah";
const SEARCH_QUERIES = [
  "HR consultants Dubai",
  "human resources consulting firm Dubai",
  "HR advisory Dubai",
  "HR outsourcing company Dubai UAE",
];
```

---

## Phase 1 — Search

Uses `@mendable/firecrawl-js` `search()` method. Runs all 4 queries in sequence (not parallel — avoids rate limit). Each query returns up to 10 results with `url`, `title`, `description`.

```
LOG: [Phase 1] Running query: "HR consultants Dubai"
LOG: [Phase 1] Got 9 results for "HR consultants Dubai"
LOG: [Phase 1] Query failed: "HR advisory Dubai" — <error message> (skipping)
LOG: [Phase 1] Total unique URLs collected: 31
```

If all 4 queries fail (Firecrawl API down), task throws so Trigger.dev retries.

---

## Phase 2 — Scrape + Extract

For each unique URL:
1. Firecrawl `/scrape` in markdown format (timeout: 15s per URL)
2. Pass markdown to Claude Haiku with extraction prompt:
   ```
   Extract from this webpage: company_name, website, email, phone,
   address, services_summary (max 2 sentences), headcount_signal
   (any language about team size). Return JSON. If a field is not
   found, use null.
   ```
3. Parse JSON response into a `RawLead` object
4. On Firecrawl scrape failure: log + skip URL
5. On Claude failure: log + use `{ company_name: title, website: url, ...nulls }` fallback

```
LOG: [Phase 2] Scraping https://example.com (1/31)
LOG: [Phase 2] Extracted: Gulf HR Consulting | email: yes | phone: yes
LOG: [Phase 2] Scrape failed: https://broken.com — timeout (skipping)
LOG: [Phase 2] Extraction complete: 28 leads extracted, 3 skipped
```

---

## Phase 3 — Deduplicate

1. Normalize each domain: `https://www.Gulf-HR.com/about` → `gulf-hr.com`
2. Read column C (Website) of the Leads & Pipeline sheet once — cache the list for this run
3. Drop any lead whose domain already appears in the sheet
4. Drop duplicates within this run's batch (keep first occurrence)

```
LOG: [Phase 3] Read 47 existing domains from sheet
LOG: [Phase 3] 6 leads already in CRM — skipping
LOG: [Phase 3] 22 new leads remain after dedup
```

---

## Phase 4 — Score

Rule-based, deterministic, no AI:

| Signal | Points |
|--------|--------|
| Has email | +2 |
| Has phone | +2 |
| Has website | +1 |
| Services mention HR/people/talent/workforce (case-insensitive) | +2 |
| Address mentions Dubai or UAE | +1 |
| Headcount signal found | +1 |
| Has LinkedIn URL | +1 |
| **Max** | **10** |

Leads scoring < `SCORE_THRESHOLD` (default: 4) are dropped.

```
LOG: [Phase 4] Gulf HR Consulting → score: 8
LOG: [Phase 4] Random Blog Post → score: 1 (SKIPPED — below threshold)
LOG: [Phase 4] 17 leads qualify, 5 dropped (low score)
```

---

## Phase 5 — Write to Google Sheets

### Auth: OAuth 2.0 with stored refresh token

The existing Python equipment scripts use OAuth with `credentials.json` + `token.json` (local files). For Trigger.dev (serverless), credentials are stored as env vars and the OAuth2 client is constructed at runtime:

```ts
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"  // OOB redirect for desktop app flow
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
```

The refresh token never expires unless revoked — safe for unattended use.

### Sheet columns written (appended as new rows)

| Column | Value |
|--------|-------|
| A — Date Added | `YYYY-MM-DD` (today) |
| B — Company Name | extracted |
| C — Website | extracted |
| D — Email | extracted or blank |
| E — Phone | extracted or blank |
| F — Services Summary | extracted |
| G — Score | numeric |
| H — Stage | `New Lead` (hardcoded) |
| I — Source | `lead-gen-task` (hardcoded) |

One `spreadsheets.values.append` call per run (batch all rows). One retry on failure.

```
LOG: [Phase 5] Writing 17 rows to sheet...
LOG: [Phase 5] Done. 17 rows appended.
LOG: [DONE] Wrote 17 leads | 5 skipped low score | 6 skipped duplicate | 3 scrape errors
```

---

## Environment Variables

| Key | Purpose |
|-----|---------|
| `FIRECRAWL_API_KEY` | Firecrawl auth |
| `ANTHROPIC_API_KEY` | Claude Haiku extraction |
| `GOOGLE_CLIENT_ID` | OAuth2 client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token (generated once via OAuth flow) |

All added to `.env` locally and Trigger.dev cloud secrets for production.

---

## New Packages

```json
"@mendable/firecrawl-js": "latest",
"@anthropic-ai/sdk": "latest",
"googleapis": "latest"
```

---

## One-Time Setup Required Before First Run

1. Enable Google Sheets API in Google Cloud Console (same project as existing credentials)
2. Run a one-time OAuth flow to generate a refresh token — can use existing `credentials.json` from the Python scripts, just adapted to JS
3. Add all env vars to `.env` and Trigger.dev cloud secrets
4. Deploy task: `npm run deploy`

---

## Verification

1. Run `trigger dev` locally, trigger the task manually from Trigger.dev dashboard
2. Confirm logs show all 5 phases completing
3. Check Google Sheet — new rows should appear with `Source = lead-gen-task`
4. Confirm dedup works: trigger again immediately — same leads should not be added twice
5. Confirm error resilience: set a bad URL in search results manually, confirm task continues
6. Once verified, confirm cron fires at 7am UAE the next morning

---

## Files Modified / Created

| File | Action |
|------|--------|
| `src/trigger/lead-generation-dubai-hr.ts` | Create |
| `package.json` | Add 3 new dependencies |
| `.env` | Add 5 new keys |
