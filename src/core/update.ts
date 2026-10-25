import type { UpdateStatus } from "./types";

export function unavailableUpdate(version: string, message: string): UpdateStatus {
  return {
    version,
    packaged: false,
    portable: false,
    state: "unavailable",
    message,
  };
}

export function parseSemver(version: string): [number, number, number] | null {
  const match = String(version)
    .trim()
    .match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNewerVersion(remote: string, local: string): boolean {
  const a = parseSemver(remote);
  const b = parseSemver(local);
  if (!a || !b) return Boolean(remote) && remote !== local;
  if (a[0] !== b[0]) return a[0] > b[0];
  if (a[1] !== b[1]) return a[1] > b[1];
  return a[2] > b[2];
}
