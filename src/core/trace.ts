import { bounds, closeIfNeeded, simplifyRdp } from "./geometry";
import type { Point, Polygon } from "./types";

const N8 = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
] as const;

export function thresholdMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
  invert = false,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const r = pixels[i * 4] ?? 0;
    const g = pixels[i * 4 + 1] ?? 0;
    const b = pixels[i * 4 + 2] ?? 0;
    const a = pixels[i * 4 + 3] ?? 255;
    if (a < 16) {
      mask[i] = 0;
      continue;
    }
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const dark = luma < threshold;
    mask[i] = (invert ? !dark : dark) ? 1 : 0;
  }
  return mask;
}

function at(mask: Uint8Array, width: number, height: number, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;
  return mask[y * width + x] ?? 0;
}

export function findContours(mask: Uint8Array, width: number, height: number): Polygon[] {
  const seen = new Uint8Array(width * height);
  const contours: Polygon[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!at(mask, width, height, x, y)) continue;
      if (seen[y * width + x]) continue;
      if (at(mask, width, height, x - 1, y)) continue;
      const contour = traceMoore(mask, width, height, x, y);
      if (contour.length < 8) continue;
      for (const p of contour) {
        const ix = Math.round(p.x);
        const iy = Math.round(p.y);
        if (ix >= 0 && iy >= 0 && ix < width && iy < height) seen[iy * width + ix] = 1;
      }
      contours.push(contour);
    }
  }
  return contours;
}

function traceMoore(
  mask: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
): Polygon {
  const start: Point = { x: startX, y: startY };
  const contour: Polygon = [start];
  let x = startX;
  let y = startY;
  let dir = 0;
  for (let step = 0; step < width * height; step += 1) {
    let found = false;
    for (let k = 0; k < 8; k += 1) {
      const idx = (dir + 6 + k) % 8;
      const nx = x + N8[idx]![0];
      const ny = y + N8[idx]![1];
      if (at(mask, width, height, nx, ny)) {
        x = nx;
        y = ny;
        dir = idx;
        found = true;
        break;
      }
    }
    if (!found) break;
    contour.push({ x, y });
    if (x === startX && y === startY && contour.length > 3) break;
  }
  return closeIfNeeded(contour);
}

export function pixelToMm(
  poly: Polygon,
  imageWidth: number,
  imageHeight: number,
  paperWidthMm: number,
  paperHeightMm: number,
): Polygon {
  const sx = paperWidthMm / imageWidth;
  const sy = paperHeightMm / imageHeight;
  return poly.map((p) => ({ x: p.x * sx, y: p.y * sy }));
}

export function filterAndSimplify(
  contours: Polygon[],
  imageWidth: number,
  imageHeight: number,
  minAreaRatio = 0.002,
  epsilonPx = 1.6,
): Polygon[] {
  const imageArea = imageWidth * imageHeight;
  return contours
    .map((c) => simplifyRdp(c, epsilonPx))
    .filter((c) => {
      if (c.length < 4) return false;
      const box = bounds(c);
      const area = Math.max(0, box.maxX - box.minX) * Math.max(0, box.maxY - box.minY);
      return area >= imageArea * minAreaRatio;
    });
}

export const PAPER = {
  letter: { width: 215.9, height: 279.4, label: "US Letter" },
  a4: { width: 210, height: 297, label: "A4" },
  a3: { width: 297, height: 420, label: "A3" },
  tabloid: { width: 279.4, height: 431.8, label: "Tabloid" },
} as const;

export type PaperKey = keyof typeof PAPER;
