import { describe, it, expect } from "vitest";
import { normalizeDomain, scoreLead } from "../lead-generation-dubai-hr";
import type { RawLead } from "../lead-generation-dubai-hr";

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
  it("scores 1 for a lead with only a website", () => {
    expect(scoreLead({ ...baseLead })).toBe(1);
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
