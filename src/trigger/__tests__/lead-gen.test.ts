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
