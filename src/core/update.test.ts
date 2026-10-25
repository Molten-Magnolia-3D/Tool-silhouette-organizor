import { describe, expect, it } from "vitest";
import { isNewerVersion, parseSemver, unavailableUpdate } from "./update";

describe("update status", () => {
  it("marks development copies as unable to self-update", () => {
    const status = unavailableUpdate("1.0.0", "Updates are checked in the installed Windows app.");
    expect(status.state).toBe("unavailable");
    expect(status.packaged).toBe(false);
    expect(status.version).toBe("1.0.0");
  });

  it("compares stamped shop versions", () => {
    expect(parseSemver("1.0.33")).toEqual([1, 0, 33]);
    expect(isNewerVersion("1.0.40", "1.0.33")).toBe(true);
    expect(isNewerVersion("1.0.33", "1.0.33")).toBe(false);
    expect(isNewerVersion("1.0.32", "1.0.33")).toBe(false);
    expect(isNewerVersion("2.0.1", "1.9.99")).toBe(true);
  });
});
