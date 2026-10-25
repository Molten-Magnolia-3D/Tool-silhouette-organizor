import { describe, expect, it } from "vitest";
import {
  bounds,
  offsetPolygon,
  polygonArea,
  simplifyRdp,
  triangulate,
  worldOutline,
} from "./geometry";

describe("geometry", () => {
  it("computes signed area of a unit square", () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(polygonArea(sq)).toBe(100);
  });

  it("grows a silhouette by clearance", () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ];
    const grown = offsetPolygon(sq, 2);
    const box = bounds(grown);
    expect(box.minX).toBeLessThan(-1);
    expect(box.maxX).toBeGreaterThan(21);
  });

  it("simplifies a colinear polyline", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(simplifyRdp(line, 0.1)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it("triangulates a square into two triangles", () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    expect(triangulate(sq)).toHaveLength(2);
  });

  it("rotates a tool about its local center into world space", () => {
    const outline = [
      { x: -10, y: -2 },
      { x: 10, y: -2 },
      { x: 10, y: 2 },
      { x: -10, y: 2 },
    ];
    const world = worldOutline(outline, 50, 40, Math.PI / 2);
    const box = bounds(world);
    expect(box.minX).toBeCloseTo(48, 5);
    expect(box.maxX).toBeCloseTo(52, 5);
    expect((box.minY + box.maxY) / 2).toBeCloseTo(40, 5);
  });
});
