import { useState } from "react";
import { bounds } from "../core/geometry";
import { filterAndSimplify, findContours, PAPER, pixelToMm, thresholdMask, type PaperKey } from "../core/trace";
import type { Tool } from "../core/types";
import type { Platform } from "../platform";

async function decodeImage(data: Uint8Array): Promise<HTMLCanvasElement> {
  const blob = new Blob([Uint8Array.from(data)]);
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the photo.");
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

export function PhotoTrace({
  platform,
  onAdd,
}: {
  platform: Platform;
  onAdd: (tool: Omit<Tool, "id">) => void;
}) {
  const [paper, setPaper] = useState<PaperKey>("letter");
  const [threshold, setThreshold] = useState(140);
  const [invert, setInvert] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setStatus("Opening photo…");
    try {
      const file = await platform.openImage();
      if (!file) {
        setStatus("");
        return;
      }
      const canvas = await decodeImage(file.data);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not read the photo.");
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const mask = thresholdMask(image.data, canvas.width, canvas.height, threshold, invert);
      const contours = findContours(mask, canvas.width, canvas.height);
      const kept = filterAndSimplify(contours, canvas.width, canvas.height);
      const sheet = PAPER[paper];
      if (!kept.length) {
        setStatus("No silhouettes found. Try a darker threshold or invert.");
        return;
      }
      kept.forEach((contour, i) => {
        const mm = pixelToMm(contour, canvas.width, canvas.height, sheet.width, sheet.height);
        const box = bounds(mm);
        const outline = mm.map((p) => ({
          x: p.x - (box.minX + box.maxX) / 2,
          y: p.y - (box.minY + box.maxY) / 2,
        }));
        onAdd({
          name: kept.length === 1 ? file.name.replace(/\.[^.]+$/, "") : `${file.name.replace(/\.[^.]+$/, "")} ${i + 1}`,
          outline,
          rotation: 0,
          x: 0,
          y: 0,
          source: "trace",
        });
      });
      setStatus(`Added ${kept.length} silhouette${kept.length === 1 ? "" : "s"} from ${file.name}.`);
    } catch (err) {
      setStatus((err as Error).message || "Could not trace that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">Photo</p>
      <h2>Trace a silhouette</h2>
      <p className="muted">
        Lay the tool on paper, shoot from above, then Pocketplate traces the outline and scales it from the sheet size.
      </p>
      <label>
        Paper
        <select value={paper} onChange={(e) => setPaper(e.target.value as PaperKey)}>
          {(Object.keys(PAPER) as PaperKey[]).map((key) => (
            <option key={key} value={key}>
              {PAPER[key].label} ({PAPER[key].width}×{PAPER[key].height} mm)
            </option>
          ))}
        </select>
      </label>
      <label>
        Threshold {threshold}
        <input
          type="range"
          min={40}
          max={220}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </label>
      <label className="check">
        <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
        Invert (light tool on dark)
      </label>
      <button type="button" className="primary" disabled={busy} onClick={() => void run()}>
        {busy ? "Tracing…" : "Open photo and trace"}
      </button>
      {status ? <p className="muted">{status}</p> : null}
    </section>
  );
}
