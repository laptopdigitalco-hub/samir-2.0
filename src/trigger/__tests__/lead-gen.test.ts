import { describe, it, expect } from "vitest";
import { normalizeDomain, scoreLead, deduplicateLeads } from "../lead-generation-dubai-hr";
import type { RawLead } from "../lead-generation-dubai-hr";

// ── normalizeDomain ───────────────────────────────────────────────────────────

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

// ── scoreLead ─────────────────────────────────────────────────────────────────

const base: RawLead = {
  url: "https://testco.com",
  title: "Test Company",
  description: "A company in Dubai.",
};

describe("scoreLead", () => {
  it("scores 0 for an unrelated lead", () => {
    expect(scoreLead({ url: "https://bakery.com", title: "Bakery", description: "Fresh bread daily." })).toBe(0);
  });

  it("adds 3 points for HR keyword in text", () => {
    expect(scoreLead({ ...base, title: "HR Consulting Group", description: "" })).toBeGreaterThanOrEqual(3);
  });

  it("adds 3 points for Dubai/UAE in text", () => {
    expect(scoreLead({ ...base, title: "Generic Firm", description: "Based in Dubai." })).toBeGreaterThanOrEqual(3);
  });

  it("adds 2 points for consulting keyword", () => {
    const score = scoreLead({ url: "https://x.com", title: "Consultancy", description: "" });
    expect(score).toBeGreaterThanOrEqual(2);
  });

  it("caps at 10 for a perfect lead", () => {
    expect(
      scoreLead({ url: "https://hrco.ae", title: "HR Consultants Dubai", description: "HR outsourcing and talent recruitment in UAE." })
    ).toBe(10);
  });
});

// ── deduplicateLeads ──────────────────────────────────────────────────────────

const makeLead = (url: string): RawLead => ({ url, title: "Test", description: "Test" });

describe("deduplicateLeads", () => {
  it("removes leads whose domain already exists in the sheet", () => {
    const existing = new Set(["gulf-hr.com"]);
    const leads = [makeLead("https://www.gulf-hr.com"), makeLead("https://newco.ae")];
    const result = deduplicateLeads(leads, existing);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://newco.ae");
  });

  it("removes duplicate domains within the same batch", () => {
    const leads = [makeLead("https://same.com/page1"), makeLead("https://www.same.com/page2")];
    const result = deduplicateLeads(leads, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://same.com/page1");
  });

  it("returns empty array when all leads are duplicates", () => {
    const existing = new Set(["a.com", "b.com"]);
    const leads = [makeLead("https://a.com"), makeLead("https://b.com")];
    expect(deduplicateLeads(leads, existing)).toHaveLength(0);
  });
});
