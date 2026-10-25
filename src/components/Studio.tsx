import { useMemo, useState } from "react";
import { sampleTools } from "../core/samples";
import { buildPlateMesh } from "../core/mesh";
import { trianglesToBinaryStl } from "../core/stl";
import type { Platform } from "../platform";
import { useProject } from "../store";
import { Inspector } from "./Inspector";
import { Library } from "./Library";
import { PhotoTrace } from "./PhotoTrace";
import { PlateCanvas } from "./PlateCanvas";
import { Preview3D } from "./Preview3D";

export function Studio({ platform }: { platform: Platform }) {
  const projectApi = useProject(platform);
  const [view, setView] = useState<"plate" | "print">("plate");
  const [notice, setNotice] = useState("");

  const triangles = useMemo(
    () => buildPlateMesh(projectApi.project.tools, projectApi.project.plate),
    [projectApi.project.tools, projectApi.project.plate],
  );

  async function exportStl() {
    const buffer = trianglesToBinaryStl(triangles);
    const name = `${projectApi.project.name.replace(/\s+/g, "-").toLowerCase()}-pocketplate.stl`;
    const ok = await platform.saveFile(name, new Uint8Array(buffer), "model/stl");
    setNotice(ok ? `Saved ${name}` : "Export canceled.");
  }

  return (
    <div className="studio">
      <aside>
        <Library
          tools={projectApi.project.tools}
          selectedId={projectApi.selectedId}
          onSelect={projectApi.setSelectedId}
          onAddSample={(name) => {
            const sample = sampleTools().find((t) => t.name === name);
            if (!sample) return;
            projectApi.addTool({
              name: sample.name,
              outline: sample.outline,
              rotation: 0,
              x: sample.x,
              y: sample.y,
              source: "sample",
            });
          }}
          onRemove={projectApi.removeTool}
          onLoadSamples={projectApi.loadSamples}
          onClear={projectApi.clearTools}
        />
        <PhotoTrace platform={platform} onAdd={projectApi.addTool} />
      </aside>
      <main>
        <div className="view-switch">
          <button type="button" className={view === "plate" ? "on" : ""} onClick={() => setView("plate")}>
            Floor plate
          </button>
          <button type="button" className={view === "print" ? "on" : ""} onClick={() => setView("print")}>
            Print preview
          </button>
        </div>
        <div className="stage">
          {view === "plate" ? (
            <PlateCanvas
              plate={projectApi.project.plate}
              tools={projectApi.project.tools}
              selectedId={projectApi.selectedId}
              onSelect={projectApi.setSelectedId}
              onMove={(id, x, y) => projectApi.updateTool(id, { x, y })}
            />
          ) : (
            <Preview3D tools={projectApi.project.tools} plate={projectApi.project.plate} />
          )}
        </div>
        {notice ? <p className="muted stage-note">{notice}</p> : null}
      </main>
      <aside>
        <Inspector
          plate={projectApi.project.plate}
          selected={projectApi.selected}
          onPlate={projectApi.updatePlate}
          onTool={projectApi.updateTool}
          onExport={() => void exportStl()}
          triangleCount={triangles.length}
        />
      </aside>
    </div>
  );
}
