const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { APP_URL } = require("../app.config.cjs");

app.setName("Vault Desk");

/** @type {import("electron").BrowserWindow | null} */
let mainWindow = null;
let ownsServer = false;
/** @type {typeof import("../scripts/server.mjs") | null} */
let serverApi = null;

async function getServerApi() {
  if (!serverApi) {
    serverApi = await import("../scripts/server.mjs");
  }
  return serverApi;
}

async function ensureServer() {
  const { isServerRunning, startServer, waitForServer } = await getServerApi();
  if (await isServerRunning()) return;

  startServer();
  ownsServer = true;
  await waitForServer();
}

async function createWindow() {
  const iconPath = path.join(__dirname, "..", "public", "icon.png");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 800,
    minHeight: 600,
    title: "Vault Desk",
    show: false,
    icon: iconPath,
    backgroundColor: "#0c0c0d",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once("ready-to-show", () => {
    if (process.platform === "darwin") {
      app.dock.show();
    }
    mainWindow?.show();
    mainWindow?.focus();
    app.focus({ steal: true });
  });

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

async function shutdownServer() {
  if (!ownsServer) return;
  const { stopServer } = await getServerApi();
  stopServer();
  ownsServer = false;
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", async () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      return;
    }

    try {
      await ensureServer();
      await createWindow();
    } catch (error) {
      console.error(error);
    }
  });

  app.whenReady().then(async () => {
    if (process.platform === "darwin") {
      app.setActivationPolicy("regular");
    }

    try {
      await ensureServer();
      await createWindow();
    } catch (error) {
      console.error(error);
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    void shutdownServer();
    app.quit();
  });

  app.on("before-quit", () => {
    void shutdownServer();
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
