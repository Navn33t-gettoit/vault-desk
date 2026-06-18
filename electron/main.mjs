import { app, BrowserWindow, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { APP_URL } from "../app.config.mjs";
import {
  isServerRunning,
  startServer,
  stopServer,
  waitForServer,
} from "../scripts/server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconPath = path.join(__dirname, "..", "public", "icon.png");

/** @type {BrowserWindow | null} */
let mainWindow = null;
let ownsServer = false;

async function ensureServer() {
  if (await isServerRunning()) return;

  startServer();
  ownsServer = true;
  await waitForServer();
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 800,
    minHeight: 600,
    title: "Vault Desk",
    icon: iconPath,
    backgroundColor: "#0c0c0d",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await ensureServer();
      await createWindow();
    } catch (error) {
      console.error(error);
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (ownsServer) stopServer();
    app.quit();
  });

  app.on("before-quit", () => {
    if (ownsServer) stopServer();
  });

  app.on("activate", async () => {
    if (mainWindow) return;

    try {
      await ensureServer();
      await createWindow();
    } catch (error) {
      console.error(error);
    }
  });
}
