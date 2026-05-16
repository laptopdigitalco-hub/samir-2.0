import { schedules } from "@trigger.dev/sdk";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RawLead {
  url: string;
  title: string;
  description: string;
}

export interface ScoredLead extends RawLead {
  score: number;
  domain: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SCORE_THRESHOLD = 3;
const MAX_RESULTS_PER_QUERY = 10;
const SHEET_ID = "1NUmLEqQFenmpqaGMH8FdGXsMwcTSwyqBqMUMTvGUyJY";
const SHEET_TAB = "Leads & Pipeline fttah";
const SEARCH_QUERIES = [
  "HR consultants Dubai",
  "human resources consulting firm Dubai",
  "HR advisory Dubai",
  "HR outsourcing company Dubai UAE",
];

// ── Pure Functions ────────────────────────────────────────────────────────────

export function normalizeDomain(url: string): string {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function scoreLead(lead: RawLead): number {
  const text = `${lead.title} ${lead.description}`.toLowerCase();
  let score = 0;
  if (/hr|human resources|people ops|people & culture/.test(text)) score += 3;
  if (/dubai|uae|emirates/.test(text)) score += 3;
  if (/consult/.test(text)) score += 2;
  if (/recruit|talent/.test(text)) score += 1;
  if (/outsourc|workforce/.test(text)) score += 1;
  return Math.min(score, 10);
}

export function deduplicateLeads(leads: RawLead[], existingDomains: Set<string>): RawLead[] {
  const seen = new Set<string>(existingDomains);
  return leads.filter((lead) => {
    const domain = normalizeDomain(lead.url);
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });
}

// ── Google Auth (no googleapis — direct JWT + fetch) ──────────────────────────

async function getAccessToken(): Promise<string> {
  const { createSign } = await import("crypto");
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(credentials.private_key, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${payload}.${signature}`,
  });

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ── Google Sheets ─────────────────────────────────────────────────────────────

async function getExistingDomains(): Promise<Set<string>> {
  const token = await getAccessToken();
  const range = encodeURIComponent(`${SHEET_TAB}!B:B`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    console.log(`[Sheets] Could not read existing domains: ${res.status}`);
    return new Set();
  }

  const data = await res.json() as { values?: string[][] };
  const domains = new Set<string>();
  for (const row of (data.values ?? []).slice(1)) {
    if (row[0]) domains.add(normalizeDomain(row[0]));
  }
  console.log(`[Sheets] ${domains.size} existing domains`);
  return domains;
}

async function writeLeads(leads: ScoredLead[]): Promise<void> {
  const token = await getAccessToken();
  const today = new Date().toISOString().split("T")[0];
  const rows = leads.map((l) => [today, l.url, l.title, l.description, l.score, "New Lead", "lead-gen-task"]);
  const range = encodeURIComponent(`${SHEET_TAB}!A:G`);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=RAW`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) throw new Error(`Sheets write failed: ${res.status} ${await res.text()}`);
  console.log(`[Sheets] ${rows.length} rows written`);
}

// ── Phase 1: Search ───────────────────────────────────────────────────────────

async function searchLeads(): Promise<RawLead[]> {
  const { default: FirecrawlApp } = await import("@mendable/firecrawl-js");
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
  const results: RawLead[] = [];
  const seen = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    try {
      console.log(`[Search] "${query}"`);
      const response = await firecrawl.search(query, { limit: MAX_RESULTS_PER_QUERY });
      if (response.success && response.data) {
        let added = 0;
        for (const item of response.data) {
          if (item.url && !seen.has(item.url)) {
            seen.add(item.url);
            results.push({ url: item.url, title: item.title ?? "", description: item.description ?? "" });
            added++;
          }
        }
        console.log(`[Search] ${added} new results for "${query}"`);
      }
    } catch (err) {
      console.log(`[Search] Failed: "${query}" — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[Search] Total: ${results.length} unique URLs`);
  return results;
}

// ── Scheduled Task ────────────────────────────────────────────────────────────

export const leadGenerationDubaiHr = schedules.task({
  id: "lead-generation-dubai-hr",
  cron: "0 3 * * *", // 3am UTC = 7am UAE (UTC+4)
  maxDuration: 600,
  run: async () => {
    console.log("[START] Lead generation");

    const leads = await searchLeads();
    if (leads.length === 0) throw new Error("All queries failed — Firecrawl may be down");

    const existingDomains = await getExistingDomains();
    const unique = deduplicateLeads(leads, existingDomains);
    console.log(`[Dedup] ${leads.length - unique.length} already in sheet, ${unique.length} new`);

    const scored: ScoredLead[] = unique.map((lead) => ({
      ...lead,
      score: scoreLead(lead),
      domain: normalizeDomain(lead.url),
    }));

    const qualified = scored.filter((l) => {
      const keep = l.score >= SCORE_THRESHOLD;
      console.log(`[Score] ${l.title} → ${l.score}${keep ? "" : " (SKIPPED)"}`);
      return keep;
    });

    if (qualified.length > 0) {
      await writeLeads(qualified);
    } else {
      console.log("[Done] No qualified leads this run");
    }

    const stats = { written: qualified.length, lowScore: scored.length - qualified.length, duplicate: leads.length - unique.length };
    console.log(`[DONE] ${stats.written} written | ${stats.lowScore} low-score | ${stats.duplicate} duplicate`);
    return stats;
  },
});
