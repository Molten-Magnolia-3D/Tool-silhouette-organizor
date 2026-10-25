import { bounds, offsetPolygon, triangulate, triangulateRectWithHoles, worldOutline } from "./geometry";
import type { PlateSettings, Point, Point3, Polygon, Tool } from "./types";

export type Triangle = [Point3, Point3, Point3];

function pushTri(tris: Triangle[], a: Point3, b: Point3, c: Point3) {
  const nx = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
  const ny = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
  const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (nx * nx + ny * ny + nz * nz < 1e-12) return;
  tris.push([a, b, c]);
}

function pocketHoles(tools: Tool[], plate: PlateSettings): Polygon[] {
  return tools
    .map((tool) => {
      const world = worldOutline(tool.outline, tool.x, tool.y, tool.rotation);
      return offsetPolygon(world, plate.clearance);
    })
    .filter((poly) => poly.length >= 3);
}

export function buildPlateMesh(tools: Tool[], plate: PlateSettings): Triangle[] {
  const w = plate.width;
  const h = plate.height;
  const t = plate.thickness;
  const floorZ = Math.max(0.6, plate.floorThickness);
  const pocketZ = Math.max(floorZ, t - plate.pocketDepth);
  const holes = pocketHoles(tools, plate).map((poly) =>
    poly.map((p) => ({
      x: Math.min(w - 0.2, Math.max(0.2, p.x)),
      y: Math.min(h - 0.2, Math.max(0.2, p.y)),
    })),
  );

  const tris: Triangle[] = [];

  const corners: Point[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const bottom = triangulate(corners);
  for (const [i, j, k] of bottom) {
    const a = corners[i]!;
    const b = corners[j]!;
    const c = corners[k]!;
    pushTri(tris, { x: a.x, y: a.y, z: 0 }, { x: c.x, y: c.y, z: 0 }, { x: b.x, y: b.y, z: 0 });
  }

  const walls: [Point, Point][] = [
    [corners[0]!, corners[1]!],
    [corners[1]!, corners[2]!],
    [corners[2]!, corners[3]!],
    [corners[3]!, corners[0]!],
  ];
  for (const [a, b] of walls) {
    pushTri(
      tris,
      { x: a.x, y: a.y, z: 0 },
      { x: b.x, y: b.y, z: 0 },
      { x: b.x, y: b.y, z: t },
    );
    pushTri(
      tris,
      { x: a.x, y: a.y, z: 0 },
      { x: b.x, y: b.y, z: t },
      { x: a.x, y: a.y, z: t },
    );
  }

  const top = triangulateRectWithHoles(w, h, holes, Math.max(4, Math.min(w, h) / 28));
  for (const [i, j, k] of top.triangles) {
    const a = top.vertices[i]!;
    const b = top.vertices[j]!;
    const c = top.vertices[k]!;
    pushTri(tris, { x: a.x, y: a.y, z: t }, { x: b.x, y: b.y, z: t }, { x: c.x, y: c.y, z: t });
  }

  for (const hole of holes) {
    const floor = triangulate(hole);
    for (const [i, j, k] of floor) {
      const a = hole[i]!;
      const b = hole[j]!;
      const c = hole[k]!;
      pushTri(
        tris,
        { x: a.x, y: a.y, z: pocketZ },
        { x: c.x, y: c.y, z: pocketZ },
        { x: b.x, y: b.y, z: pocketZ },
      );
    }
    for (let i = 0; i < hole.length; i += 1) {
      const a = hole[i]!;
      const b = hole[(i + 1) % hole.length]!;
      pushTri(
        tris,
        { x: a.x, y: a.y, z: t },
        { x: a.x, y: a.y, z: pocketZ },
        { x: b.x, y: b.y, z: pocketZ },
      );
      pushTri(
        tris,
        { x: a.x, y: a.y, z: t },
        { x: b.x, y: b.y, z: pocketZ },
        { x: b.x, y: b.y, z: t },
      );
    }
  }

  return tris;
}

export function meshStats(tris: Triangle[]): { triangles: number; min: Point3; max: Point3 } {
  let min: Point3 = { x: Infinity, y: Infinity, z: Infinity };
  let max: Point3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const tri of tris) {
    for (const p of tri) {
      min = { x: Math.min(min.x, p.x), y: Math.min(min.y, p.y), z: Math.min(min.z, p.z) };
      max = { x: Math.max(max.x, p.x), y: Math.max(max.y, p.y), z: Math.max(max.z, p.z) };
    }
  }
  return { triangles: tris.length, min, max };
}

export function toolFitsPlate(tool: Tool, plate: PlateSettings): boolean {
  const world = worldOutline(tool.outline, tool.x, tool.y, tool.rotation);
  const box = bounds(offsetPolygon(world, plate.clearance));
  return (
    box.minX >= 0 &&
    box.minY >= 0 &&
    box.maxX <= plate.width &&
    box.maxY <= plate.height
  );
}
