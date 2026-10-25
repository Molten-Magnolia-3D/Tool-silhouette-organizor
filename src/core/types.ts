export type Point = { x: number; y: number };
export type Point3 = { x: number; y: number; z: number };
export type Polygon = Point[];

export interface Tool {
  id: string;
  name: string;
  outline: Polygon;
  rotation: number;
  x: number;
  y: number;
  source: "sample" | "trace";
}

export interface PlateSettings {
  width: number;
  height: number;
  thickness: number;
  pocketDepth: number;
  clearance: number;
  floorThickness: number;
  margin: number;
}

export interface Project {
  name: string;
  tools: Tool[];
  plate: PlateSettings;
}

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "unavailable"
  | "error";

export interface UpdateStatus {
  version: string;
  packaged: boolean;
  portable: boolean;
  state: UpdateState;
  message: string;
  versionAvailable?: string;
  percent?: number;
}

export const DEFAULT_PLATE: PlateSettings = {
  width: 200,
  height: 150,
  thickness: 12,
  pocketDepth: 8,
  clearance: 0.8,
  floorThickness: 2,
  margin: 8,
};

export function defaultProject(): Project {
  return {
    name: "Shop drawer",
    tools: [],
    plate: { ...DEFAULT_PLATE },
  };
}
