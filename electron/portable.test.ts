import { describe, expect, it } from "vitest";
import { isPortableEnv } from "./portable.js";

describe("portable detection", () => {
  it("treats electron-builder portable env vars as portable", () => {
    expect(isPortableEnv({})).toBe(false);
    expect(isPortableEnv({ PORTABLE_EXECUTABLE_DIR: "C:\\shop" })).toBe(true);
    expect(isPortableEnv({ PORTABLE_EXECUTABLE_FILE: "Pocketplate-Portable.exe" })).toBe(true);
  });
});
