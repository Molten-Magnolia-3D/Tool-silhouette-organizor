import { newId } from "./ids";
import type { Polygon, Tool } from "./types";

function rect(w: number, h: number, rx = 1.2): Polygon {
  const x0 = -w / 2;
  const y0 = -h / 2;
  return [
    { x: x0 + rx, y: y0 },
    { x: x0 + w - rx, y: y0 },
    { x: x0 + w, y: y0 + rx },
    { x: x0 + w, y: y0 + h - rx },
    { x: x0 + w - rx, y: y0 + h },
    { x: x0 + rx, y: y0 + h },
    { x: x0, y: y0 + h - rx },
    { x: x0, y: y0 + rx },
  ];
}

function hex(r: number): Polygon {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
}

function unionRects(parts: { x: number; y: number; w: number; h: number }[]): Polygon {
  // Approximate union as a single outline of the bounding silhouette via sampled points.
  // Used only for sample tools with simple L / T shapes.
  const outline: Polygon = [];
  for (const part of parts) {
    outline.push(...rect(part.w, part.h).map((p) => ({ x: p.x + part.x, y: p.y + part.y })));
  }
  return convexHull(outline);
}

function convexHull(points: Polygon): Polygon {
  const pts = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (pts.length <= 2) return pts;
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Polygon = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Polygon = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function tool(name: string, outline: Polygon, x: number, y: number): Tool {
  return {
    id: newId("tool"),
    name,
    outline,
    rotation: 0,
    x,
    y,
    source: "sample",
  };
}

export function sampleTools(): Tool[] {
  const hexKey = unionRects([
    { x: 0, y: 0, w: 48, h: 5.5 },
    { x: 20, y: 10, w: 5.5, h: 22 },
  ]);
  const wrench = unionRects([
    { x: 0, y: 0, w: 92, h: 8 },
    { x: -40, y: 0, w: 18, h: 16 },
    { x: 40, y: 0, w: 16, h: 14 },
  ]);
  const driver = unionRects([
    { x: -28, y: 0, w: 36, h: 14 },
    { x: 22, y: 0, w: 62, h: 6 },
  ]);
  const pliers = unionRects([
    { x: -18, y: 0, w: 28, h: 22 },
    { x: 22, y: -7, w: 48, h: 6 },
    { x: 22, y: 7, w: 48, h: 6 },
  ]);
  const knife = unionRects([
    { x: -22, y: 0, w: 40, h: 16 },
    { x: 28, y: 0, w: 52, h: 8 },
  ]);
  return [
    tool("Hex key 5 mm", hexKey, 40, 28),
    tool("Combination wrench", wrench, 110, 36),
    tool("Screwdriver", driver, 55, 78),
    tool("Needle-nose pliers", pliers, 145, 88),
    tool("Utility knife", knife, 70, 122),
    tool("M8 nut", hex(8.2), 175, 24),
  ];
}

export const SAMPLE_NAMES = sampleTools().map((t) => t.name);
