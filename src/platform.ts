import { unavailableUpdate } from "./core/update";
import type { UpdateStatus } from "./core/types";

export interface Platform {
  isElectron: boolean;
  loadProject(): Promise<string | null>;
  saveProject(json: string): Promise<void>;
  saveFile(filename: string, data: Uint8Array | string, mime?: string): Promise<boolean>;
  openImage(): Promise<{ name: string; data: Uint8Array } | null>;
  getUpdateStatus(): Promise<UpdateStatus>;
  checkForUpdates(): Promise<UpdateStatus>;
  installUpdate(): Promise<boolean>;
  onUpdate(cb: (status: UpdateStatus) => void): () => void;
}

type ElectronApi = {
  isElectron: true;
  loadProject: () => Promise<string | null>;
  saveProject: (json: string) => Promise<void>;
  saveFile: (filename: string, data: Uint8Array | string, mime?: string) => Promise<boolean>;
  openImage: () => Promise<{ name: string; data: Uint8Array } | null>;
  getUpdateStatus: () => Promise<UpdateStatus>;
  checkForUpdates: () => Promise<UpdateStatus>;
  installUpdate: () => Promise<boolean>;
  onUpdate: (cb: (status: UpdateStatus) => void) => () => void;
};

declare global {
  interface Window {
    pocketplate?: ElectronApi;
  }
}

function download(filename: string, data: Uint8Array | string, mime = "application/octet-stream") {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: mime })
      : new Blob([Uint8Array.from(data)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const KEY = "pocketplate-project";

export function createPlatform(): Platform {
  if (window.pocketplate?.isElectron) {
    const api = window.pocketplate;
    return {
      isElectron: true,
      loadProject: () => api.loadProject(),
      saveProject: (json) => api.saveProject(json),
      saveFile: (filename, data, mime) => api.saveFile(filename, data, mime),
      openImage: () => api.openImage(),
      getUpdateStatus: () => api.getUpdateStatus(),
      checkForUpdates: () => api.checkForUpdates(),
      installUpdate: () => api.installUpdate(),
      onUpdate: (cb) => api.onUpdate(cb),
    };
  }

  return {
    isElectron: false,
    async loadProject() {
      return localStorage.getItem(KEY);
    },
    async saveProject(json) {
      localStorage.setItem(KEY, json);
    },
    async saveFile(filename, data, mime) {
      download(filename, data, mime);
      return true;
    },
    async openImage() {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          const buf = new Uint8Array(await file.arrayBuffer());
          resolve({ name: file.name, data: buf });
        };
        input.click();
      });
    },
    async getUpdateStatus() {
      return unavailableUpdate("dev", "Browser preview. Install the Windows app to receive updates.");
    },
    async checkForUpdates() {
      return unavailableUpdate("dev", "Browser preview. Install the Windows app to receive updates.");
    },
    async installUpdate() {
      return false;
    },
    onUpdate() {
      return () => undefined;
    },
  };
}
