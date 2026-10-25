import { describe, expect, it } from "vitest";
import { DEFAULT_PLATE } from "./types";
import { buildPlateMesh, meshStats } from "./mesh";
import { sampleTools } from "./samples";
import { readStlTriangleCount, trianglesToBinaryStl } from "./stl";

describe("printable plate", () => {
  it("writes a binary STL whose header triangle count matches the mesh", () => {
    const tools = sampleTools();
    const tris = buildPlateMesh(tools, DEFAULT_PLATE);
    const stats = meshStats(tris);
    expect(stats.triangles).toBeGreaterThan(80);
    expect(stats.max.x).toBeCloseTo(DEFAULT_PLATE.width, 5);
    expect(stats.max.y).toBeCloseTo(DEFAULT_PLATE.height, 5);
    expect(stats.max.z).toBeCloseTo(DEFAULT_PLATE.thickness, 5);

    const buffer = trianglesToBinaryStl(tris);
    expect(readStlTriangleCount(buffer)).toBe(tris.length);
    expect(buffer.byteLength).toBe(84 + tris.length * 50);
  });

  it("still exports an empty plate", () => {
    const tris = buildPlateMesh([], DEFAULT_PLATE);
    expect(tris.length).toBeGreaterThan(10);
    expect(readStlTriangleCount(trianglesToBinaryStl(tris))).toBe(tris.length);
  });
});
