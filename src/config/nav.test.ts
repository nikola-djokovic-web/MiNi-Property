import { describe, expect, it } from "vitest";
import { navItems, isNavActive } from "./nav";
import en from "@/dictionaries/en";
import de from "@/dictionaries/de";

describe("navItems", () => {
  it("every labelKey exists in the English dictionary's nav section", () => {
    for (const item of navItems) {
      expect(en.nav).toHaveProperty(item.labelKey);
    }
  });

  it("every labelKey exists in the German dictionary's nav section", () => {
    for (const item of navItems) {
      expect(de.nav).toHaveProperty(item.labelKey);
    }
  });

  it("has no duplicate hrefs", () => {
    const hrefs = navItems.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("isNavActive", () => {
  it("matches the dashboard path exactly, not its sub-paths", () => {
    expect(isNavActive("/en/dashboard", "/dashboard")).toBe(true);
    expect(isNavActive("/en/dashboard/foo", "/dashboard")).toBe(false);
  });

  it("matches other paths by prefix", () => {
    expect(isNavActive("/en/properties/123", "/properties")).toBe(true);
    expect(isNavActive("/en/properties", "/properties")).toBe(true);
    expect(isNavActive("/en/tenants", "/properties")).toBe(false);
  });

  it("works across locales", () => {
    expect(isNavActive("/de/workers", "/workers")).toBe(true);
  });
});
