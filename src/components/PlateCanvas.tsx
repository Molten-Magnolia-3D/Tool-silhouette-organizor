import { useEffect, useRef } from "react";
import { bounds, worldOutline } from "../core/geometry";
import type { PlateSettings, Tool } from "../core/types";

const COLORS = ["#c4652d", "#6b7a5a", "#8b4d6b", "#3d6b8a", "#b0892c", "#7a4e2a"];

export function PlateCanvas({
  plate,
  tools,
  selectedId,
  onSelect,
  onMove,
}: {
  plate: PlateSettings;
  tools: Tool[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

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

      const pad = 28;
      const scale = Math.min((cssW - pad * 2) / plate.width, (cssH - pad * 2) / plate.height);
      const ox = (cssW - plate.width * scale) / 2;
      const oy = (cssH - plate.height * scale) / 2;

      ctx.fillStyle = "#efe4d4";
      ctx.fillRect(ox, oy, plate.width * scale, plate.height * scale);
      ctx.strokeStyle = "#1c1410";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + 0.5, oy + 0.5, plate.width * scale, plate.height * scale);

      ctx.strokeStyle = "rgba(28,20,16,0.12)";
      ctx.lineWidth = 1;
      for (let x = plate.margin; x < plate.width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(ox + x * scale, oy);
        ctx.lineTo(ox + x * scale, oy + plate.height * scale);
        ctx.stroke();
      }
      for (let y = plate.margin; y < plate.height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(ox, oy + y * scale);
        ctx.lineTo(ox + plate.width * scale, oy + y * scale);
        ctx.stroke();
      }

      tools.forEach((tool, i) => {
        const world = worldOutline(tool.outline, tool.x, tool.y, tool.rotation);
        ctx.beginPath();
        world.forEach((p, idx) => {
          const px = ox + p.x * scale;
          const py = oy + p.y * scale;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = `${COLORS[i % COLORS.length]}cc`;
        ctx.fill();
        ctx.strokeStyle = tool.id === selectedId ? "#1c1410" : "rgba(28,20,16,0.45)";
        ctx.lineWidth = tool.id === selectedId ? 2.4 : 1.1;
        ctx.stroke();
      });

      ctx.fillStyle = "#6a5b4e";
      ctx.font = "12px IBM Plex Mono, ui-monospace, monospace";
      ctx.fillText(`${plate.width} × ${plate.height} mm`, ox, oy - 8);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [plate, tools, selectedId]);

  function toPlate(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const pad = 28;
    const scale = Math.min((rect.width - pad * 2) / plate.width, (rect.height - pad * 2) / plate.height);
    const ox = (rect.width - plate.width * scale) / 2;
    const oy = (rect.height - plate.height * scale) / 2;
    return {
      x: (clientX - rect.left - ox) / scale,
      y: (clientY - rect.top - oy) / scale,
    };
  }

  function hit(x: number, y: number): Tool | undefined {
    return [...tools].reverse().find((tool) => {
      const box = bounds(worldOutline(tool.outline, tool.x, tool.y, tool.rotation));
      return x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
    });
  }

  return (
    <canvas
      ref={canvasRef}
      className="plate-canvas"
      onPointerDown={(e) => {
        const pt = toPlate(e.clientX, e.clientY);
        if (!pt) return;
        const tool = hit(pt.x, pt.y);
        if (!tool) {
          onSelect(null);
          return;
        }
        onSelect(tool.id);
        drag.current = { id: tool.id, dx: pt.x - tool.x, dy: pt.y - tool.y };
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const pt = toPlate(e.clientX, e.clientY);
        if (!pt) return;
        onMove(drag.current.id, pt.x - drag.current.dx, pt.y - drag.current.dy);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    />
  );
}
