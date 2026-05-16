import { schedules } from "@trigger.dev/sdk";
import FirecrawlApp from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { google } from "googleapis";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Phase 1: Search ───────────────────────────────────────────────────────────

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

// ── Phase 2: Scrape + Extract ─────────────────────────────────────────────────

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

  const text = message.content[0].type === "text" ? message.content[0].text : "";
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
      } catch {
        console.log(`[Phase 2] Claude extraction failed for ${url} — using fallback`);
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

  console.log(`[Phase 2] Extraction complete: ${leads.length} extracted, ${skipped} skipped`);
  return leads;
}

// ── Phase 3 + 5: Google Sheets ────────────────────────────────────────────────

function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  const credentials = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function readExistingDomains(): Promise<Set<string>> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!C:C`,
    });
    const values = response.data.values ?? [];
    const domains = new Set<string>();
    for (const row of values.slice(1)) {
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
        console.log(
          `[Phase 5] Write failed, retrying... (${err instanceof Error ? err.message : String(err)})`
        );
      } else {
        console.log(
          `[Phase 5] Write failed after retry: ${err instanceof Error ? err.message : String(err)}`
        );
        throw err;
      }
    }
  }
}

// ── Scheduled Task ────────────────────────────────────────────────────────────

export const leadGenerationDubaiHr = schedules.task({
  id: "lead-generation-dubai-hr",
  cron: "0 3 * * *", // 3am UTC = 7am UAE (UTC+4)
  maxDuration: 3600,
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
});
