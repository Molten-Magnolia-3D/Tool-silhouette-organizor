import { useCallback, useEffect, useMemo, useState } from "react";
import { bounds, worldOutline } from "./core/geometry";
import { newId } from "./core/ids";
import { sampleTools } from "./core/samples";
import { DEFAULT_PLATE, defaultProject, type PlateSettings, type Project, type Tool } from "./core/types";
import type { Platform } from "./platform";

function parseProject(raw: string | null): Project | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Project>;
    if (!data || typeof data !== "object") return null;
    return {
      name: typeof data.name === "string" ? data.name : "Shop drawer",
      tools: Array.isArray(data.tools) ? (data.tools as Tool[]) : [],
      plate: { ...DEFAULT_PLATE, ...(data.plate ?? {}) },
    };
  } catch {
    return null;
  }
}

export function useProject(platform: Platform) {
  const [project, setProject] = useState<Project>(() => {
    const seeded = defaultProject();
    seeded.tools = sampleTools();
    return seeded;
  });
  const [selectedId, setSelectedId] = useState<string | null>(project.tools[0]?.id ?? null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void platform.loadProject().then((raw) => {
      if (cancelled) return;
      const loaded = parseProject(raw);
      if (loaded && loaded.tools.length) {
        setProject(loaded);
        setSelectedId(loaded.tools[0]?.id ?? null);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  useEffect(() => {
    if (!ready) return;
    const handle = window.setTimeout(() => {
      void platform.saveProject(JSON.stringify(project));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [platform, project, ready]);

  const selected = useMemo(
    () => project.tools.find((t) => t.id === selectedId) ?? null,
    [project.tools, selectedId],
  );

  const updatePlate = useCallback((patch: Partial<PlateSettings>) => {
    setProject((prev) => ({ ...prev, plate: { ...prev.plate, ...patch } }));
  }, []);

  const addTool = useCallback((tool: Omit<Tool, "id">) => {
    const next: Tool = { ...tool, id: newId("tool") };
    const box = bounds(worldOutline(next.outline, 0, 0, 0));
    setProject((prev) => {
      const placed = {
        ...next,
        x: prev.plate.margin + (box.maxX - box.minX) / 2,
        y: prev.plate.margin + (box.maxY - box.minY) / 2,
      };
      return { ...prev, tools: [...prev.tools, placed] };
    });
    setSelectedId(next.id);
    return next.id;
  }, []);

  const updateTool = useCallback((id: string, patch: Partial<Tool>) => {
    setProject((prev) => ({
      ...prev,
      tools: prev.tools.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTool = useCallback((id: string) => {
    setProject((prev) => ({ ...prev, tools: prev.tools.filter((t) => t.id !== id) }));
    setSelectedId((curr) => (curr === id ? null : curr));
  }, []);

  const loadSamples = useCallback(() => {
    const tools = sampleTools();
    setProject((prev) => ({ ...prev, tools }));
    setSelectedId(tools[0]?.id ?? null);
  }, []);

  const clearTools = useCallback(() => {
    setProject((prev) => ({ ...prev, tools: [] }));
    setSelectedId(null);
  }, []);

  return {
    project,
    setProject,
    selected,
    selectedId,
    setSelectedId,
    updatePlate,
    addTool,
    updateTool,
    removeTool,
    loadSamples,
    clearTools,
  };
}
