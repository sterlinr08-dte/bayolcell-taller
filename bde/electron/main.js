// BAYOL DIAGNOSTIC ENGINE - Proceso principal de Electron (Fase 2)
// Crea la ventana, maneja la lectura del iPhone por USB y expone los datos al renderer.
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const usb = require('./ipc-handlers/usb-handler');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0A0A0A',
    title: 'BAYOL Diagnostic Engine',
    icon: path.join(__dirname, '..', 'renderer', 'css', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Abrir enlaces externos en el navegador del sistema, no dentro de la app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ---- Canales IPC (puente seguro renderer <-> sistema) ----

// Verifica si libimobiledevice está disponible en la PC
ipcMain.handle('bde:checkTools', async () => {
  return usb.checkTools();
});

// Lee el iPhone conectado: info general, batería y panic logs
ipcMain.handle('bde:leerDispositivo', async () => {
  return usb.leerDispositivo();
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
