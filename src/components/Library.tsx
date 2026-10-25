import { sampleTools } from "../core/samples";
import type { Tool } from "../core/types";

export function Library({
  tools,
  selectedId,
  onSelect,
  onAddSample,
  onRemove,
  onLoadSamples,
  onClear,
}: {
  tools: Tool[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddSample: (name: string) => void;
  onRemove: (id: string) => void;
  onLoadSamples: () => void;
  onClear: () => void;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Library</p>
      <h2>Tools on the plate</h2>
      <div className="tool-list">
        {tools.length === 0 ? <p className="muted">No tools yet. Trace a photo or add a sample.</p> : null}
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={tool.id === selectedId ? "tool-row selected" : "tool-row"}
            onClick={() => onSelect(tool.id)}
          >
            <span>{tool.name}</span>
            <em>{tool.source === "trace" ? "traced" : "sample"}</em>
          </button>
        ))}
      </div>
      <div className="row wrap">
        <button type="button" className="ghost" onClick={onLoadSamples}>
          Load shop samples
        </button>
        <button type="button" className="ghost danger" onClick={onClear}>
          Clear plate
        </button>
      </div>
      {selectedId ? (
        <button type="button" className="ghost danger" onClick={() => onRemove(selectedId)}>
          Remove selected
        </button>
      ) : null}
      <p className="eyebrow" style={{ marginTop: "1.2rem" }}>
        Add a sample
      </p>
      <div className="chip-row">
        {sampleTools().map((tool) => (
          <button key={tool.name} type="button" className="chip" onClick={() => onAddSample(tool.name)}>
            {tool.name}
          </button>
        ))}
      </div>
    </section>
  );
}
