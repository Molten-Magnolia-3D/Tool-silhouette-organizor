import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fileInDist } from "./paths.js";
import { setupUpdater } from "./updater.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const SCHEME = "pocketplate";

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function userDataFile(name: string) {
  return path.join(app.getPath("userData"), name);
}

function distDir() {
  return path.join(__dirname, "..", "dist");
}

function registerRendererProtocol() {
  protocol.handle(SCHEME, (request) => {
    const url = new URL(request.url);
    const pathname = url.pathname === "/" || url.pathname === "" ? "/index.html" : url.pathname;
    const filePath = fileInDist(pathname, distDir());
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
    }
    return net.fetch(pathToFileURL(filePath).href);
  });
}

function windowIcon(): string | undefined {
  const candidates = [
    path.join(process.cwd(), "build", "icon.ico"),
    path.join(__dirname, "..", "build", "icon.ico"),
    path.join(process.resourcesPath, "icon.ico"),
  ];
  return candidates.find((file) => fs.existsSync(file));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f6efe4",
    title: "Pocketplate",
    icon: windowIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadURL(`${SCHEME}://app/index.html`);
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  if (!isDev) registerRendererProtocol();

  ipcMain.handle("pocketplate:load-project", async () => {
    const file = userDataFile("project.json");
    if (!fs.existsSync(file)) return null;
    return fs.readFileSync(file, "utf8");
  });

  ipcMain.handle("pocketplate:save-project", async (_evt, json: string) => {
    const file = userDataFile("project.json");
    fs.writeFileSync(file, json, "utf8");
  });

  ipcMain.handle(
    "pocketplate:save-file",
    async (_evt, payload: { filename: string; data: number[] | string; mime?: string }) => {
      const result = await dialog.showSaveDialog({
        defaultPath: payload.filename,
      });
      if (result.canceled || !result.filePath) return false;
      const buf =
        typeof payload.data === "string"
          ? Buffer.from(payload.data, "utf8")
          : Buffer.from(payload.data);
      fs.writeFileSync(result.filePath, buf);
      return true;
    },
  );

  ipcMain.handle("pocketplate:open-image", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp"] },
        { name: "All files", extensions: ["*"] },
      ],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath);
    return { name: path.basename(filePath), data };
  });

  setupUpdater();

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
