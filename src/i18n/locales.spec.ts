import { describe, it, expect } from "vitest";
import ua from "@/i18n/locales/ua";
import en from "@/i18n/locales/en";

/** Collect every leaf key path (e.g. "app.title") from a messages object. */
const keyPaths = (obj: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? keyPaths(value as Record<string, unknown>, path)
      : [path];
  });

describe("locale message parity", () => {
  it("ua and en expose the exact same set of keys", () => {
    const uaKeys = keyPaths(ua).sort();
    const enKeys = keyPaths(en).sort();
    expect(enKeys).toEqual(uaKeys);
  });

  it("has no empty translation strings", () => {
    for (const messages of [ua, en]) {
      const values = keyPaths(messages).map((path) =>
        path.split(".").reduce<unknown>((acc, k) => (acc as never)[k], messages),
      );
      expect(values.every((v) => typeof v === "string" && v.length > 0)).toBe(
        true,
      );
    }
  });
});
