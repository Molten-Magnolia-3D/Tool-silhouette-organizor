import type { PlateSettings, Tool } from "../core/types";

export function Inspector({
  plate,
  selected,
  onPlate,
  onTool,
  onExport,
  triangleCount,
}: {
  plate: PlateSettings;
  selected: Tool | null;
  onPlate: (patch: Partial<PlateSettings>) => void;
  onTool: (id: string, patch: Partial<Tool>) => void;
  onExport: () => void;
  triangleCount: number;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Plate</p>
      <h2>Pocket settings</h2>
      <label>
        Width mm
        <input
          type="number"
          min={40}
          max={400}
          value={plate.width}
          onChange={(e) => onPlate({ width: Number(e.target.value) })}
        />
      </label>
      <label>
        Height mm
        <input
          type="number"
          min={40}
          max={400}
          value={plate.height}
          onChange={(e) => onPlate({ height: Number(e.target.value) })}
        />
      </label>
      <label>
        Thickness mm
        <input
          type="number"
          min={4}
          max={40}
          step={0.5}
          value={plate.thickness}
          onChange={(e) => onPlate({ thickness: Number(e.target.value) })}
        />
      </label>
      <label>
        Pocket depth mm
        <input
          type="number"
          min={1}
          max={36}
          step={0.5}
          value={plate.pocketDepth}
          onChange={(e) => onPlate({ pocketDepth: Number(e.target.value) })}
        />
      </label>
      <label>
        Clearance mm
        <input
          type="number"
          min={0}
          max={4}
          step={0.1}
          value={plate.clearance}
          onChange={(e) => onPlate({ clearance: Number(e.target.value) })}
        />
      </label>
      <label>
        Floor mm
        <input
          type="number"
          min={0.8}
          max={8}
          step={0.2}
          value={plate.floorThickness}
          onChange={(e) => onPlate({ floorThickness: Number(e.target.value) })}
        />
      </label>
      {selected ? (
        <>
          <p className="eyebrow">Selected</p>
          <label>
            Name
            <input value={selected.name} onChange={(e) => onTool(selected.id, { name: e.target.value })} />
          </label>
          <label>
            Rotation {Math.round((selected.rotation * 180) / Math.PI)}°
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round((selected.rotation * 180) / Math.PI)}
              onChange={(e) => onTool(selected.id, { rotation: (Number(e.target.value) * Math.PI) / 180 })}
            />
          </label>
        </>
      ) : (
        <p className="muted">Click a pocket on the plate to rotate or rename it.</p>
      )}
      <button type="button" className="primary" onClick={onExport}>
        Export STL
      </button>
      <p className="muted">{triangleCount.toLocaleString()} triangles · binary STL in millimeters</p>
    </section>
  );
}
