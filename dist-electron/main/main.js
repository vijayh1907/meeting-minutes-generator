"use strict";
const electron = require("electron");
const path = require("path");
let mainWindow = null;
function getPreloadPath() {
  return path.join(__dirname, "../preload/preload.js");
}
async function createMainWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexHtml = path.join(__dirname, "../../dist/index.html");
    await mainWindow.loadFile(indexHtml);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("activate", async () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) await createMainWindow();
});
electron.app.whenReady().then(createMainWindow);
//# sourceMappingURL=main.js.map
