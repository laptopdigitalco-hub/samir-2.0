import { schedules } from "@trigger.dev/sdk";

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

// ── Scheduled Task ────────────────────────────────────────────────────────────

export const leadGenerationDubaiHr = schedules.task({
  id: "lead-generation-dubai-hr",
  cron: "0 3 * * *", // 3am UTC = 7am UAE (UTC+4)
  maxDuration: 3600,
  run: async () => {
    console.log("[START] Lead generation task started");

    // Phases will be wired in Task 9
    console.log("[DONE] Task complete (shell only — phases not yet wired)");
  },
});
