import { describe, expect, it } from "vitest";
import { filterAndSimplify, findContours, pixelToMm, thresholdMask } from "./trace";

function rectImage(width: number, height: number, x0: number, y0: number, x1: number, y1: number) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1;
      const v = inside ? 20 : 240;
      const i = (y * width + x) * 4;
      pixels[i] = v;
      pixels[i + 1] = v;
      pixels[i + 2] = v;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

describe("photo trace", () => {
  it("finds a dark rectangle on paper", () => {
    const width = 80;
    const height = 60;
    const pixels = rectImage(width, height, 20, 15, 50, 40);
    const mask = thresholdMask(pixels, width, height, 128);
    const contours = findContours(mask, width, height);
    expect(contours.length).toBeGreaterThan(0);
    const kept = filterAndSimplify(contours, width, height, 0.01, 1.2);
    expect(kept.length).toBe(1);
    expect(kept[0]!.length).toBeGreaterThan(3);
  });

  it("scales pixel outlines onto letter paper", () => {
    const mm = pixelToMm(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      100,
      200,
      215.9,
      279.4,
    );
    expect(mm[1]!.x).toBeCloseTo(215.9, 5);
  });
});
