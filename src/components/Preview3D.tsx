import { useEffect, useRef } from "react";
import { buildPlateMesh } from "../core/mesh";
import type { PlateSettings, Tool } from "../core/types";

export function Preview3D({ tools, plate }: { tools: Tool[]; plate: PlateSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = parent.clientWidth;
      const cssH = parent.clientHeight;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const tris = buildPlateMesh(tools, plate);
      const yaw = 0.85;
      const pitch = 0.55;
      const cy = Math.cos(yaw);
      const sineYaw = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);

      const projected = tris.map((tri) => {
        const pts = tri.map((p) => {
          const x = p.x - plate.width / 2;
          const y = p.y - plate.height / 2;
          const z = p.z;
          const x1 = x * cy - y * sineYaw;
          const y1 = x * sineYaw + y * cy;
          const y2 = y1 * cp - z * sp;
          const z2 = y1 * sp + z * cp;
          return { x: x1, y: y2, z: z2 };
        });
        const depth = (pts[0]!.z + pts[1]!.z + pts[2]!.z) / 3;
        const nx =
          (pts[1]!.y - pts[0]!.y) * (pts[2]!.x - pts[0]!.x) -
          (pts[1]!.x - pts[0]!.x) * (pts[2]!.y - pts[0]!.y);
        return { pts, depth, nx };
      });
      projected.sort((a, b) => a.depth - b.depth);

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const t of projected) {
        for (const p of t.pts) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
      }
      const pad = 24;
      const sx = (cssW - pad * 2) / Math.max(1, maxX - minX);
      const sy = (cssH - pad * 2) / Math.max(1, maxY - minY);
      const s = Math.min(sx, sy);

      for (const t of projected) {
        ctx.beginPath();
        t.pts.forEach((p, i) => {
          const px = pad + (p.x - minX) * s;
          const py = pad + (p.y - minY) * s;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        const faceZ = (t.pts[0]!.z + t.pts[1]!.z + t.pts[2]!.z) / 3;
        const recessed = faceZ < 0.15;
        const light = recessed ? 0.28 : t.nx > 0 ? 0.78 : 0.48;
        ctx.fillStyle = recessed ? `rgba(92,48,24,${light + 0.35})` : `rgba(196,101,45,${light})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(28,20,16,0.18)";
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [tools, plate]);

  return <canvas ref={canvasRef} className="preview-3d" />;
}
