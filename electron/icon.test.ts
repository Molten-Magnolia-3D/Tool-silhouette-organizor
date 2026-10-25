import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("desktop icon", () => {
  it("ships a multi-size Windows ico", () => {
    const buf = fs.readFileSync("build/icon.ico");
    expect(buf.readUInt16LE(0)).toBe(0);
    expect(buf.readUInt16LE(2)).toBe(1);
    expect(buf.readUInt16LE(4)).toBeGreaterThanOrEqual(4);
    expect(fs.existsSync("build/icon.png")).toBe(true);
  });
});
