import path from "node:path";
import { describe, expect, it } from "vitest";
import { fileInDist } from "./paths.js";

describe("renderer protocol paths", () => {
  const dist = path.resolve("/tmp/pocketplate-fake-dist");

  it("joins a leading slash onto dist instead of treating it as an absolute path", () => {
    const resolved = fileInDist("/index.html", dist);
    expect(resolved).toBe(path.resolve(dist, "index.html"));
    expect(resolved).not.toBe(path.resolve("/index.html"));
  });

  it("rejects path traversal", () => {
    expect(fileInDist("/../secret.txt", dist)).toBeNull();
    expect(fileInDist("/assets/../../secret.txt", dist)).toBeNull();
  });

  it("maps hashed assets", () => {
    expect(fileInDist("/assets/index-abc.js", dist)).toBe(
      path.resolve(dist, "assets", "index-abc.js"),
    );
  });
});
