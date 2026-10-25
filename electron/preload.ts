import { contextBridge, ipcRenderer } from "electron";
import type { UpdateStatus } from "./updater.js";

contextBridge.exposeInMainWorld("pocketplate", {
  isElectron: true,
  loadProject: () => ipcRenderer.invoke("pocketplate:load-project"),
  saveProject: (json: string) => ipcRenderer.invoke("pocketplate:save-project", json),
  saveFile: (filename: string, data: Uint8Array | string, mime?: string) =>
    ipcRenderer.invoke("pocketplate:save-file", {
      filename,
      data: typeof data === "string" ? data : Array.from(data),
      mime,
    }),
  openImage: () => ipcRenderer.invoke("pocketplate:open-image"),
  getUpdateStatus: () => ipcRenderer.invoke("pocketplate:update-status") as Promise<UpdateStatus>,
  checkForUpdates: () => ipcRenderer.invoke("pocketplate:update-check") as Promise<UpdateStatus>,
  installUpdate: () => ipcRenderer.invoke("pocketplate:update-install") as Promise<boolean>,
  onUpdate: (cb: (status: UpdateStatus) => void) => {
    const listener = (_event: unknown, status: UpdateStatus) => cb(status);
    ipcRenderer.on("pocketplate:update", listener);
    return () => {
      ipcRenderer.removeListener("pocketplate:update", listener);
    };
  },
});
