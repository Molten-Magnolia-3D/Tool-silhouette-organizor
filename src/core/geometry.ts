import type { Point, Polygon } from "./types";

export function clonePoly(poly: Polygon): Polygon {
  return poly.map((p) => ({ x: p.x, y: p.y }));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polygonArea(poly: Polygon): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

export function isClockwise(poly: Polygon): boolean {
  return polygonArea(poly) < 0;
}

export function ensureCounterClockwise(poly: Polygon): Polygon {
  return isClockwise(poly) ? [...poly].reverse() : poly;
}

export function bounds(poly: Polygon): { minX: number; minY: number; maxX: number; maxY: number } {
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
  return { minX, minY, maxX, maxY };
}

export function translate(poly: Polygon, dx: number, dy: number): Polygon {
  return poly.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

export function rotateAround(poly: Polygon, cx: number, cy: number, radians: number): Polygon {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return poly.map((p) => {
    const x = p.x - cx;
    const y = p.y - cy;
    return { x: cx + x * c - y * s, y: cy + x * s + y * c };
  });
}

export function centroid(poly: Polygon): Point {
  const box = bounds(poly);
  return { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 };
}

export function closeIfNeeded(poly: Polygon): Polygon {
  if (poly.length < 2) return poly;
  const first = poly[0]!;
  const last = poly[poly.length - 1]!;
  if (dist(first, last) < 1e-6) return poly.slice(0, -1);
  return poly;
}

export function simplifyRdp(points: Polygon, epsilon: number): Polygon {
  if (points.length <= 2) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = pointLineDistance(points[i]!, first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = simplifyRdp(points.slice(0, index + 1), epsilon);
    const right = simplifyRdp(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function pointLineDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return dist(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/** Outward offset for a simple polygon. Positive delta grows the silhouette. */
export function offsetPolygon(poly: Polygon, delta: number): Polygon {
  const ring = ensureCounterClockwise(closeIfNeeded(poly));
  if (ring.length < 3) return ring;
  const out: Polygon = [];
  for (let i = 0; i < ring.length; i += 1) {
    const prev = ring[(i - 1 + ring.length) % ring.length]!;
    const curr = ring[i]!;
    const next = ring[(i + 1) % ring.length]!;
    const e1 = normalize({ x: curr.x - prev.x, y: curr.y - prev.y });
    const e2 = normalize({ x: next.x - curr.x, y: next.y - curr.y });
    // CCW ring: outward is the right-hand normal of each edge.
    const n1 = { x: e1.y, y: -e1.x };
    const n2 = { x: e2.y, y: -e2.x };
    const n = normalize({ x: n1.x + n2.x, y: n1.y + n2.y });
    const denom = Math.max(0.25, n.x * n1.x + n.y * n1.y);
    out.push({
      x: curr.x + (n.x * delta) / denom,
      y: curr.y + (n.y * delta) / denom,
    });
  }
  return out;
}

function normalize(p: Point): Point {
  const len = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / len, y: p.y / len };
}

export function worldOutline(outline: Polygon, x: number, y: number, rotation: number): Polygon {
  const local = centroid(outline);
  return translate(rotateAround(outline, local.x, local.y, rotation), x - local.x, y - local.y);
}

export function pointInPoly(p: Point, poly: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const a = poly[i]!;
    const b = poly[j]!;
    const intersect = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y + 1e-12) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function rectanglesOverlap(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

/**
 * Ear-clip a simple CCW polygon into triangle index triples (into the input ring).
 */
export function triangulate(poly: Polygon): [number, number, number][] {
  const ring = ensureCounterClockwise(closeIfNeeded(poly));
  const n = ring.length;
  if (n < 3) return [];
  const verts = ring.map((p, i) => ({ ...p, i }));
  const index = verts.map((_, i) => i);
  const tris: [number, number, number][] = [];
  let guard = 0;
  while (index.length > 3 && guard < n * n) {
    guard += 1;
    let clipped = false;
    for (let i = 0; i < index.length; i += 1) {
      const i0 = index[(i - 1 + index.length) % index.length]!;
      const i1 = index[i]!;
      const i2 = index[(i + 1) % index.length]!;
      const a = verts[i0]!;
      const b = verts[i1]!;
      const c = verts[i2]!;
      if (cross(a, b, c) <= 0) continue;
      let ear = true;
      for (const k of index) {
        if (k === i0 || k === i1 || k === i2) continue;
        if (pointInTriangle(verts[k]!, a, b, c)) {
          ear = false;
          break;
        }
      }
      if (!ear) continue;
      tris.push([a.i, b.i, c.i]);
      index.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (index.length === 3) {
    const a = verts[index[0]!]!;
    const b = verts[index[1]!]!;
    const c = verts[index[2]!]!;
    if (Math.abs(cross(a, b, c)) > 1e-8) tris.push([a.i, b.i, c.i]);
  }
  return tris;
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const d1 = cross(a, b, p);
  const d2 = cross(b, c, p);
  const d3 = cross(c, a, p);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** Rectangle with polygonal holes, triangulated by grid sampling of safe quads. */
export function triangulateRectWithHoles(
  width: number,
  height: number,
  holes: Polygon[],
  step = 6,
): { vertices: Point[]; triangles: [number, number, number][] } {
  const cols = Math.max(2, Math.ceil(width / step));
  const rows = Math.max(2, Math.ceil(height / step));
  const vertices: Point[] = [];
  const indexAt: number[][] = [];
  for (let r = 0; r <= rows; r += 1) {
    const row: number[] = [];
    for (let c = 0; c <= cols; c += 1) {
      const p = { x: (c / cols) * width, y: (r / rows) * height };
      row.push(vertices.length);
      vertices.push(p);
    }
    indexAt.push(row);
  }
  const triangles: [number, number, number][] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const a = indexAt[r]![c]!;
      const b = indexAt[r]![c + 1]!;
      const d = indexAt[r + 1]![c]!;
      const e = indexAt[r + 1]![c + 1]!;
      const mid = {
        x: (vertices[a]!.x + vertices[e]!.x) / 2,
        y: (vertices[a]!.y + vertices[e]!.y) / 2,
      };
      if (holes.some((hole) => pointInPoly(mid, hole))) continue;
      triangles.push([a, b, e], [a, e, d]);
    }
  }
  return { vertices, triangles };
}
