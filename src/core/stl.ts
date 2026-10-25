import type { Triangle } from "./mesh";

const HEADER = "Pocketplate tool silhouette organizer — Molten Magnolia 3D";

export function trianglesToBinaryStl(triangles: Triangle[]): ArrayBuffer {
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const view = new DataView(buffer);
  for (let i = 0; i < HEADER.length && i < 80; i += 1) {
    view.setUint8(i, HEADER.charCodeAt(i));
  }
  view.setUint32(80, triangles.length, true);
  let offset = 84;
  for (const [a, b, c] of triangles) {
    const nx = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
    const ny = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
    const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const len = Math.hypot(nx, ny, nz) || 1;
    view.setFloat32(offset, nx / len, true);
    view.setFloat32(offset + 4, ny / len, true);
    view.setFloat32(offset + 8, nz / len, true);
    view.setFloat32(offset + 12, a.x, true);
    view.setFloat32(offset + 16, a.y, true);
    view.setFloat32(offset + 20, a.z, true);
    view.setFloat32(offset + 24, b.x, true);
    view.setFloat32(offset + 28, b.y, true);
    view.setFloat32(offset + 32, b.z, true);
    view.setFloat32(offset + 36, c.x, true);
    view.setFloat32(offset + 40, c.y, true);
    view.setFloat32(offset + 44, c.z, true);
    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }
  return buffer;
}

export function readStlTriangleCount(buffer: ArrayBuffer): number {
  if (buffer.byteLength < 84) return 0;
  return new DataView(buffer).getUint32(80, true);
}
