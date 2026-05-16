# Lead Generation Dubai HR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Trigger.dev scheduled task that scrapes HR consultant businesses in Dubai every morning at 7am UAE time, scores the leads, and appends qualified rows to the "Leads & Pipeline fttah" Google Sheet — fully unattended.

**Architecture:** Five sequential phases run inside a single scheduled Trigger.dev task: Firecrawl search → Firecrawl scrape + Claude Haiku extraction → domain deduplication against existing sheet rows → rule-based scoring → Google Sheets OAuth2 append. Each phase and each individual item has its own try/catch so no single failure stops the run.

**Tech Stack:** TypeScript, `@trigger.dev/sdk` v4, `@mendable/firecrawl-js`, `@anthropic-ai/sdk`, `googleapis`, `vitest`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/trigger/lead-generation-dubai-hr.ts` | Create | Scheduled task + all phase functions |
| `src/trigger/__tests__/lead-gen.test.ts` | Create | Unit tests for pure functions |
| `scripts/generate-google-token.mjs` | Create | One-time OAuth refresh token generator |
| `package.json` | Modify | Add 4 new dependencies |
| `.env` | Modify | Add 5 new keys |

---

## Task 1: Install Dependencies and Set Up Environment

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Step 1: Install packages**

Run from the project root (`c:\Users\fttah\Documents\antigravity\cohort\AE\samir 2.0`):

```bash
npm install @mendable/firecrawl-js @anthropic-ai/sdk googleapis
npm install -D vitest
```

Expected: packages appear in `node_modules/`, `package.json` updated with new deps.

- [ ] **Step 2: Add test script to package.json**

Open `package.json`. Add `"test": "vitest run"` to the `scripts` block:

```json
{
  "name": "samir-2",
  "version": "1.0.0",
  "scripts": {
    "dev": "trigger dev",
    "deploy": "trigger deploy",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.52.0",
    "@mendable/firecrawl-js": "^1.22.0",
    "@trigger.dev/sdk": "4.4.6",
    "googleapis": "^148.0.0"
  },
  "devDependencies": {
    "@trigger.dev/build": "4.4.6",
    "trigger.dev": "4.4.6",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 3: Add env var placeholders to .env**

Open `.env` (create it if it doesn't exist). Append these lines — leave values blank for now, they get filled in Task 9:

```
FIRECRAWL_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

- [ ] **Step 4: Commit**

```bash
git add package.json .env
git commit -m "feat: install firecrawl, anthropic, googleapis, vitest for lead-gen task"
```

---

## Task 2: Create the Scheduled Task Shell + Types

**Files:**
- Create: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Create the task file with types and constants**

Create `src/trigger/lead-generation-dubai-hr.ts` with this full content:

```typescript
import { schedules } from "@trigger.dev/sdk";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RawLead {
  company_name: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  services_summary: string | null;
  headcount_signal: string | null;
  linkedin_url: string | null;
  source_url: string;
  source_title: string;
}

export interface ScoredLead extends RawLead {
  score: number;
  domain: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Scheduled Task ────────────────────────────────────────────────────────────

export const leadGenerationDubaiHr = schedules.task({
  id: "lead-generation-dubai-hr",
  cron: "0 3 * * *", // 3am UTC = 7am UAE (UTC+4)
  maxDuration: 3600,
  run: async () => {
    console.log("[START] Lead generation task started");

    // Phases will be wired in Task 8
    console.log("[DONE] Task complete (shell only — phases not yet wired)");
  },
});
```

- [ ] **Step 2: Verify Trigger.dev picks up the new file**

```bash
npm run dev
```

Expected: Trigger.dev CLI output shows `lead-generation-dubai-hr` task detected. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts
git commit -m "feat: add lead-gen task shell with types and constants"
```

---

## Task 3: TDD — normalizeDomain

**Files:**
- Create: `src/trigger/__tests__/lead-gen.test.ts`
- Modify: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Write the failing test**

Create `src/trigger/__tests__/lead-gen.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { normalizeDomain } from "../lead-generation-dubai-hr";

describe("normalizeDomain", () => {
  it("strips www and lowercases", () => {
    expect(normalizeDomain("https://www.Gulf-HR.com/about")).toBe("gulf-hr.com");
  });

  it("handles URL without www", () => {
    expect(normalizeDomain("https://hrplus.ae/services")).toBe("hrplus.ae");
  });

  it("handles bare domain string", () => {
    expect(normalizeDomain("example.com")).toBe("example.com");
  });

  it("lowercases non-URL strings gracefully", () => {
    expect(normalizeDomain("SomeCompany.COM")).toBe("somecompany.com");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `normalizeDomain` is not exported from the task file.

- [ ] **Step 3: Implement normalizeDomain in task file**

Add this function to `src/trigger/lead-generation-dubai-hr.ts`, before the scheduled task export:

```typescript
export function normalizeDomain(url: string): string {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts src/trigger/__tests__/lead-gen.test.ts
git commit -m "feat: add normalizeDomain with tests"
```

---

## Task 4: TDD — scoreLead

**Files:**
- Modify: `src/trigger/__tests__/lead-gen.test.ts`
- Modify: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/trigger/__tests__/lead-gen.test.ts`:

```typescript
import { scoreLead } from "../lead-generation-dubai-hr";
import type { RawLead } from "../lead-generation-dubai-hr";

const baseLead: RawLead = {
  company_name: "Test Co",
  website: "https://testco.com",
  email: null,
  phone: null,
  address: null,
  services_summary: null,
  headcount_signal: null,
  linkedin_url: null,
  source_url: "https://testco.com",
  source_title: "Test Co",
};

describe("scoreLead", () => {
  it("scores 0 for a lead with only a website", () => {
    // website points come from having the field — but +1 is for non-null website
    expect(scoreLead({ ...baseLead, website: "https://x.com" })).toBe(1);
  });

  it("adds 2 points for email", () => {
    expect(scoreLead({ ...baseLead, email: "test@co.com" })).toBe(3);
  });

  it("adds 2 points for phone", () => {
    expect(scoreLead({ ...baseLead, phone: "+971 4 123 4567" })).toBe(3);
  });

  it("adds 2 points when services mention HR keywords (case-insensitive)", () => {
    expect(scoreLead({ ...baseLead, services_summary: "We provide HR consulting and talent acquisition." })).toBe(3);
    expect(scoreLead({ ...baseLead, services_summary: "Workforce management solutions." })).toBe(3);
    expect(scoreLead({ ...baseLead, services_summary: "IT services only." })).toBe(1);
  });

  it("adds 1 point when address mentions Dubai or UAE (case-insensitive)", () => {
    expect(scoreLead({ ...baseLead, address: "Business Bay, Dubai" })).toBe(2);
    expect(scoreLead({ ...baseLead, address: "Abu Dhabi, UAE" })).toBe(2);
  });

  it("adds 1 point for headcount signal", () => {
    expect(scoreLead({ ...baseLead, headcount_signal: "Team of 50+" })).toBe(2);
  });

  it("adds 1 point for linkedin url", () => {
    expect(scoreLead({ ...baseLead, linkedin_url: "https://linkedin.com/company/testco" })).toBe(2);
  });

  it("caps at 10 for a perfect lead", () => {
    const perfect: RawLead = {
      company_name: "Perfect HR",
      website: "https://perfecthr.ae",
      email: "info@perfecthr.ae",
      phone: "+971 4 000 0000",
      address: "DIFC, Dubai",
      services_summary: "HR consulting and talent management across UAE.",
      headcount_signal: "30 consultants",
      linkedin_url: "https://linkedin.com/company/perfecthr",
      source_url: "https://perfecthr.ae",
      source_title: "Perfect HR",
    };
    expect(scoreLead(perfect)).toBe(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `scoreLead` is not exported.

- [ ] **Step 3: Implement scoreLead in task file**

Add this function to `src/trigger/lead-generation-dubai-hr.ts`, after `normalizeDomain`:

```typescript
export function scoreLead(lead: RawLead): number {
  let score = 0;
  if (lead.email) score += 2;
  if (lead.phone) score += 2;
  if (lead.website) score += 1;
  if (lead.services_summary && /hr|people|talent|workforce/i.test(lead.services_summary)) score += 2;
  if (lead.address && /dubai|uae/i.test(lead.address)) score += 1;
  if (lead.headcount_signal) score += 1;
  if (lead.linkedin_url) score += 1;
  return Math.min(score, 10);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts src/trigger/__tests__/lead-gen.test.ts
git commit -m "feat: add scoreLead with tests"
```

---

## Task 5: TDD — deduplicateLeads

**Files:**
- Modify: `src/trigger/__tests__/lead-gen.test.ts`
- Modify: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/trigger/__tests__/lead-gen.test.ts`:

```typescript
import { deduplicateLeads } from "../lead-generation-dubai-hr";

describe("deduplicateLeads", () => {
  const lead = (website: string | null): RawLead => ({
    ...baseLead,
    website,
    source_url: website ?? "https://unknown.com",
  });

  it("removes leads whose domain already exists in the sheet", () => {
    const existing = new Set(["gulf-hr.com"]);
    const leads = [lead("https://www.gulf-hr.com"), lead("https://newco.ae")];
    const result = deduplicateLeads(leads, existing);
    expect(result).toHaveLength(1);
    expect(result[0].website).toBe("https://newco.ae");
  });

  it("removes duplicate domains within the same batch", () => {
    const leads = [
      lead("https://same.com/page1"),
      lead("https://www.same.com/page2"),
    ];
    const result = deduplicateLeads(leads, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].website).toBe("https://same.com/page1");
  });

  it("keeps leads with null website", () => {
    const leads = [lead(null), lead("https://valid.com")];
    const result = deduplicateLeads(leads, new Set());
    expect(result).toHaveLength(2);
  });

  it("returns empty array when all leads are duplicates", () => {
    const existing = new Set(["a.com", "b.com"]);
    const leads = [lead("https://a.com"), lead("https://b.com")];
    expect(deduplicateLeads(leads, existing)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `deduplicateLeads` is not exported.

- [ ] **Step 3: Implement deduplicateLeads in task file**

Add this function to `src/trigger/lead-generation-dubai-hr.ts`, after `scoreLead`:

```typescript
export function deduplicateLeads(leads: RawLead[], existingDomains: Set<string>): RawLead[] {
  const seen = new Set<string>(existingDomains);
  return leads.filter((lead) => {
    if (!lead.website) return true;
    const domain = normalizeDomain(lead.website);
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts src/trigger/__tests__/lead-gen.test.ts
git commit -m "feat: add deduplicateLeads with tests"
```

---

## Task 6: Implement searchLeads (Phase 1)

**Files:**
- Modify: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Add Firecrawl import and searchLeads function**

Add these at the top of `src/trigger/lead-generation-dubai-hr.ts`, after the existing `import { schedules }` line:

```typescript
import FirecrawlApp from "@mendable/firecrawl-js";
```

Then add this function to the file, after `deduplicateLeads`:

```typescript
async function searchLeads(
  queries: string[]
): Promise<Array<{ url: string; title: string; description: string }>> {
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
  const results: Array<{ url: string; title: string; description: string }> = [];
  const seen = new Set<string>();

  for (const query of queries) {
    try {
      console.log(`[Phase 1] Running query: "${query}"`);
      const response = await firecrawl.search(query, { limit: MAX_RESULTS_PER_QUERY });
      if (response.success && response.data) {
        let added = 0;
        for (const item of response.data) {
          if (item.url && !seen.has(item.url)) {
            seen.add(item.url);
            results.push({
              url: item.url,
              title: item.title ?? "",
              description: item.description ?? "",
            });
            added++;
          }
        }
        console.log(`[Phase 1] Got ${added} new results for "${query}"`);
      }
    } catch (err) {
      console.log(
        `[Phase 1] Query failed: "${query}" — ${err instanceof Error ? err.message : String(err)} (skipping)`
      );
    }
  }

  console.log(`[Phase 1] Total unique URLs collected: ${results.length}`);
  return results;
}
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: PASS — all existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts
git commit -m "feat: add searchLeads (Phase 1 — Firecrawl search)"
```

---

## Task 7: Implement extractLeadData (Phase 2)

**Files:**
- Modify: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Add Anthropic import and scrapeAndExtract function**

Add this import at the top of `src/trigger/lead-generation-dubai-hr.ts` (after the existing `FirecrawlApp` import from Task 6):

```typescript
import Anthropic from "@anthropic-ai/sdk";
```

Then add these two functions after `searchLeads`:

```typescript
async function extractLeadData(
  url: string,
  title: string,
  markdown: string
): Promise<RawLead> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract structured data from this webpage. Return ONLY a JSON object with these exact keys: company_name, website, email, phone, address, services_summary (max 2 sentences describing their services), headcount_signal (copy any language about team or employee size, or null), linkedin_url. Use null for any field not found. No explanation, just JSON.

URL: ${url}

Content:
${markdown.slice(0, 8000)}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in Claude response");
  const parsed = JSON.parse(match[0]);
  return { ...parsed, source_url: url, source_title: title };
}

async function scrapeAndExtractAll(
  urls: Array<{ url: string; title: string; description: string }>
): Promise<RawLead[]> {
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
  const leads: RawLead[] = [];
  let skipped = 0;

  for (let i = 0; i < urls.length; i++) {
    const { url, title, description } = urls[i];
    console.log(`[Phase 2] Scraping ${url} (${i + 1}/${urls.length})`);
    try {
      const scrapeResult = await firecrawl.scrapeUrl(url, {
        formats: ["markdown"],
        timeout: 15000,
      });
      if (!scrapeResult.success || !scrapeResult.markdown) {
        throw new Error("Empty scrape result");
      }
      try {
        const lead = await extractLeadData(url, title, scrapeResult.markdown);
        console.log(
          `[Phase 2] Extracted: ${lead.company_name ?? title} | email: ${lead.email ? "yes" : "no"} | phone: ${lead.phone ? "yes" : "no"}`
        );
        leads.push(lead);
      } catch (claudeErr) {
        // Claude failed — fall back to raw data
        console.log(
          `[Phase 2] Claude extraction failed for ${url} — using fallback`
        );
        leads.push({
          company_name: title || null,
          website: url,
          email: null,
          phone: null,
          address: null,
          services_summary: description || null,
          headcount_signal: null,
          linkedin_url: null,
          source_url: url,
          source_title: title,
        });
      }
    } catch (err) {
      console.log(
        `[Phase 2] Scrape failed: ${url} — ${err instanceof Error ? err.message : String(err)} (skipping)`
      );
      skipped++;
    }
  }

  console.log(
    `[Phase 2] Extraction complete: ${leads.length} extracted, ${skipped} skipped`
  );
  return leads;
}
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts
git commit -m "feat: add scrapeAndExtractAll with Claude Haiku extraction (Phase 2)"
```

---

## Task 8: Implement Google Sheets Helpers (Phase 3 + 5)

**Files:**
- Modify: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Add googleapis import**

Add this import at the top of `src/trigger/lead-generation-dubai-hr.ts`:

```typescript
import { google } from "googleapis";
```

- [ ] **Step 2: Add getGoogleAuth, readExistingDomains, and writeLeadsToSheets**

Add these three functions after `scrapeAndExtractAll`:

```typescript
function getGoogleAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    "http://localhost:3000"
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN! });
  return auth;
}

async function readExistingDomains(): Promise<Set<string>> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!C:C`, // Website column
    });
    const values = response.data.values ?? [];
    const domains = new Set<string>();
    for (const row of values.slice(1)) {
      // skip header row
      if (row[0]) domains.add(normalizeDomain(row[0] as string));
    }
    console.log(`[Phase 3] Read ${domains.size} existing domains from sheet`);
    return domains;
  } catch (err) {
    console.log(
      `[Phase 3] Failed to read existing domains — ${err instanceof Error ? err.message : String(err)} (proceeding without dedup)`
    );
    return new Set();
  }
}

async function writeLeadsToSheets(leads: ScoredLead[]): Promise<void> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const today = new Date().toISOString().split("T")[0];

  const rows = leads.map((lead) => [
    today,
    lead.company_name ?? "",
    lead.website ?? "",
    lead.email ?? "",
    lead.phone ?? "",
    lead.services_summary ?? "",
    lead.score,
    "New Lead",
    "lead-gen-task",
  ]);

  let attempts = 0;
  while (attempts < 2) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_TAB}!A:I`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
      console.log(`[Phase 5] Done. ${rows.length} rows appended.`);
      return;
    } catch (err) {
      attempts++;
      if (attempts < 2) {
        console.log(`[Phase 5] Write failed, retrying... (${err instanceof Error ? err.message : String(err)})`);
      } else {
        console.log(`[Phase 5] Write failed after retry: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
    }
  }
}
```

- [ ] **Step 3: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts
git commit -m "feat: add Google Sheets OAuth helpers (Phase 3 read + Phase 5 write)"
```

---

## Task 9: Wire All Phases Into the Scheduled Task

**Files:**
- Modify: `src/trigger/lead-generation-dubai-hr.ts`

- [ ] **Step 1: Replace the task shell's run function with the full pipeline**

Find the `run: async () => {` block in `leadGenerationDubaiHr` and replace its body with this:

```typescript
run: async () => {
  console.log("[START] Lead generation task started");
  const stats = { written: 0, lowScore: 0, duplicate: 0, scrapeErrors: 0 };

  // Phase 1 — Search
  const searchResults = await searchLeads(SEARCH_QUERIES);
  if (searchResults.length === 0) {
    throw new Error("[Phase 1] All queries failed — Firecrawl may be down. Triggering retry.");
  }

  // Phase 2 — Scrape + Extract
  const rawLeads = await scrapeAndExtractAll(searchResults);
  stats.scrapeErrors = searchResults.length - rawLeads.length;

  // Phase 3 — Deduplicate
  const existingDomains = await readExistingDomains();
  const beforeDedup = rawLeads.length;
  const uniqueLeads = deduplicateLeads(rawLeads, existingDomains);
  stats.duplicate = beforeDedup - uniqueLeads.length;
  console.log(
    `[Phase 3] ${stats.duplicate} leads already in CRM — skipping. ${uniqueLeads.length} new leads remain.`
  );

  // Phase 4 — Score
  const scoredLeads: ScoredLead[] = uniqueLeads.map((lead) => ({
    ...lead,
    score: scoreLead(lead),
    domain: lead.website ? normalizeDomain(lead.website) : "",
  }));

  const qualifiedLeads = scoredLeads.filter((lead) => {
    if (lead.score < SCORE_THRESHOLD) {
      console.log(
        `[Phase 4] ${lead.company_name ?? lead.source_url} → score: ${lead.score} (SKIPPED — below threshold)`
      );
      stats.lowScore++;
      return false;
    }
    console.log(`[Phase 4] ${lead.company_name ?? lead.source_url} → score: ${lead.score}`);
    return true;
  });
  console.log(
    `[Phase 4] ${qualifiedLeads.length} leads qualify, ${stats.lowScore} dropped (low score)`
  );

  // Phase 5 — Write to Sheets
  if (qualifiedLeads.length > 0) {
    console.log(`[Phase 5] Writing ${qualifiedLeads.length} rows to sheet...`);
    await writeLeadsToSheets(qualifiedLeads);
    stats.written = qualifiedLeads.length;
  } else {
    console.log("[Phase 5] No qualified leads to write.");
  }

  console.log(
    `[DONE] Wrote ${stats.written} leads | ${stats.lowScore} skipped low score | ${stats.duplicate} skipped duplicate | ${stats.scrapeErrors} scrape errors`
  );
  return stats;
},
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/trigger/lead-generation-dubai-hr.ts
git commit -m "feat: wire all phases into scheduled task — lead-generation-dubai-hr complete"
```

---

## Task 10: Generate OAuth Refresh Token (One-Time Setup)

**Files:**
- Create: `scripts/generate-google-token.mjs`

This script is run **once locally** to produce a refresh token that gets saved to `.env` and Trigger.dev cloud secrets. Never needs to run again unless the token is revoked.

- [ ] **Step 1: Add `http://localhost:3000` as an authorized redirect URI in Google Cloud Console**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Open the OAuth 2.0 Client ID that matches your existing `credentials.json`
3. Under "Authorized redirect URIs", add `http://localhost:3000`
4. Save

- [ ] **Step 2: Enable Google Sheets API**

In the same Google Cloud project:
1. Go to APIs & Services → Library
2. Search "Google Sheets API" → Enable

- [ ] **Step 3: Create the token generator script**

Create `scripts/generate-google-token.mjs`:

```javascript
import { google } from "googleapis";
import http from "http";
import { URL } from "url";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const authUrl = auth.generateAuthUrl({ access_type: "offline", scope: SCOPES, prompt: "consent" });

console.log("\nOpening browser for Google OAuth...");
console.log("If it doesn't open automatically, paste this URL:\n");
console.log(authUrl);
console.log("\nWaiting for redirect on http://localhost:3000 ...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3000");
  const code = url.searchParams.get("code");
  if (!code) {
    res.end("No code found. Try again.");
    return;
  }
  res.end("Token generated. You can close this tab.");
  server.close();

  const { tokens } = await auth.getToken(code);
  console.log("\n✓ Your GOOGLE_REFRESH_TOKEN:\n");
  console.log(tokens.refresh_token);
  console.log("\nAdd this to .env:\n");
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\nAlso add it to Trigger.dev cloud secrets.");
});

server.listen(3000);
```

- [ ] **Step 4: Fill in CLIENT_ID and CLIENT_SECRET in .env from credentials.json**

Open `credentials.json` (existing file from Python OAuth setup). Copy the values:

```
GOOGLE_CLIENT_ID=<client_id from credentials.json>
GOOGLE_CLIENT_SECRET=<client_secret from credentials.json>
```

- [ ] **Step 5: Run the token generator**

```bash
node scripts/generate-google-token.mjs
```

Open the printed URL in your browser. Authorize the app. The terminal will print your refresh token. Copy it to `.env`:

```
GOOGLE_REFRESH_TOKEN=<the token printed in terminal>
```

- [ ] **Step 6: Fill in remaining env vars**

```
FIRECRAWL_API_KEY=<from firecrawl.dev dashboard>
ANTHROPIC_API_KEY=<from console.anthropic.com>
```

- [ ] **Step 7: Commit the script (not the .env values)**

```bash
git add scripts/generate-google-token.mjs
git commit -m "feat: add one-time OAuth token generator script"
```

---

## Task 11: End-to-End Verification

- [ ] **Step 1: Start the Trigger.dev dev server**

```bash
npm run dev
```

Expected: CLI output shows `lead-generation-dubai-hr` task detected and ready.

- [ ] **Step 2: Trigger the task manually from the dashboard**

1. Open the Trigger.dev dashboard (printed URL in CLI output)
2. Find `lead-generation-dubai-hr`
3. Click "Test run"
4. Submit with empty payload `{}`

- [ ] **Step 3: Confirm Phase 1 logs appear**

In the dashboard run log, verify you see:
```
[START] Lead generation task started
[Phase 1] Running query: "HR consultants Dubai"
[Phase 1] Got N results for "HR consultants Dubai"
...
[Phase 1] Total unique URLs collected: N
```

- [ ] **Step 4: Confirm Phase 2–4 logs appear**

```
[Phase 2] Scraping https://... (1/N)
[Phase 2] Extracted: Company Name | email: yes | phone: no
...
[Phase 3] Read N existing domains from sheet
[Phase 4] Company Name → score: 7
```

- [ ] **Step 5: Check Google Sheet for new rows**

Open the "Leads & Pipeline fttah" sheet. Confirm new rows appear with:
- Column A: today's date
- Column H: `New Lead`
- Column I: `lead-gen-task`

- [ ] **Step 6: Confirm dedup works**

Trigger the task again immediately. The same leads should NOT be added a second time. Confirm `[Phase 3]` logs show all leads as duplicates and no rows are added to the sheet.

- [ ] **Step 7: Deploy to production**

```bash
npm run deploy
```

Expected: task deploys successfully. The cron `0 3 * * *` will fire automatically next morning at 7am UAE.

---

## Final File State

`src/trigger/lead-generation-dubai-hr.ts` structure (top to bottom):

```
imports (schedules, FirecrawlApp, Anthropic, google)
RawLead interface
ScoredLead interface
constants (SCORE_THRESHOLD, SHEET_ID, SHEET_TAB, SEARCH_QUERIES, MAX_RESULTS_PER_QUERY)
normalizeDomain()
scoreLead()
deduplicateLeads()
searchLeads()
extractLeadData()
scrapeAndExtractAll()
getGoogleAuth()
readExistingDomains()
writeLeadsToSheets()
leadGenerationDubaiHr (schedules.task export)
```
