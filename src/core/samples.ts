import { newId } from "./ids";
import type { Polygon, Tool } from "./types";

function center(poly: Polygon): Polygon {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return poly.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

function hex(r: number): Polygon {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
}

function tool(name: string, outline: Polygon, x: number, y: number): Tool {
  return {
    id: newId("tool"),
    name,
    outline: center(outline),
    rotation: 0,
    x,
    y,
    source: "sample",
  };
}

export function sampleTools(): Tool[] {
  const hexKey: Polygon = [
    { x: 0, y: 0 },
    { x: 48, y: 0 },
    { x: 48, y: 26 },
    { x: 42.2, y: 26 },
    { x: 42.2, y: 5.6 },
    { x: 0, y: 5.6 },
  ];
  const wrench: Polygon = [
    { x: 0, y: 6 },
    { x: 10, y: 0 },
    { x: 18, y: 2 },
    { x: 86, y: 5 },
    { x: 100, y: 1 },
    { x: 108, y: 6 },
    { x: 108, y: 16 },
    { x: 100, y: 21 },
    { x: 86, y: 17 },
    { x: 18, y: 20 },
    { x: 10, y: 22 },
    { x: 0, y: 16 },
  ];
  const driver: Polygon = [
    { x: 0, y: 4 },
    { x: 12, y: 0 },
    { x: 34, y: 0 },
    { x: 38, y: 5 },
    { x: 96, y: 6.5 },
    { x: 102, y: 5 },
    { x: 102, y: 11 },
    { x: 96, y: 9.5 },
    { x: 38, y: 11 },
    { x: 34, y: 16 },
    { x: 12, y: 16 },
    { x: 0, y: 12 },
  ];
  const pliers: Polygon = [
    { x: 0, y: 10 },
    { x: 16, y: 2 },
    { x: 28, y: 8 },
    { x: 78, y: 0 },
    { x: 84, y: 4 },
    { x: 32, y: 14 },
    { x: 84, y: 24 },
    { x: 78, y: 28 },
    { x: 28, y: 20 },
    { x: 16, y: 26 },
    { x: 0, y: 18 },
  ];
  const knife: Polygon = [
    { x: 0, y: 2 },
    { x: 36, y: 0 },
    { x: 40, y: 4 },
    { x: 92, y: 5 },
    { x: 96, y: 8 },
    { x: 40, y: 12 },
    { x: 36, y: 16 },
    { x: 0, y: 14 },
  ];
  return [
    tool("Hex key 5 mm", hexKey, 40, 28),
    tool("Combination wrench", wrench, 118, 32),
    tool("Screwdriver", driver, 58, 78),
    tool("Needle-nose pliers", pliers, 148, 90),
    tool("Utility knife", knife, 68, 124),
    tool("M8 nut", hex(8.2), 178, 22),
  ];
}
