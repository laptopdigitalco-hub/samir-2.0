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
