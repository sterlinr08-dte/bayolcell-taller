// BAYOL DIAGNOSTIC ENGINE - Proceso principal de Electron (Fase 2)
// Crea la ventana, maneja la lectura del iPhone por USB y expone los datos al renderer.
const { app, BrowserWindow, ipcMain, shell, desktopCapturer } = require('electron');
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

// Lista de ventanas/pantallas para "capturar de pantalla" (ej. el programa de REEFOX)
ipcMain.handle('bde:getSources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
  return sources.map(s => ({ id: s.id, name: s.name }));
});

// Backup / restauración del iPhone (envía progreso línea por línea al renderer)
ipcMain.handle('bde:iphoneBackup', async (e) => usb.iphoneBackup((l) => { try { e.sender.send('bde:opProgress', l); } catch (_) {} }));
ipcMain.handle('bde:iphoneRestore', async (e) => usb.iphoneRestore((l) => { try { e.sender.send('bde:opProgress', l); } catch (_) {} }));
ipcMain.handle('bde:openBackups', async () => { const dir = usb.backupsBase(); try { shell.openPath(dir); } catch (_) {} return dir; });

// Herramientas iPhone
ipcMain.handle('bde:infoIphone', async () => usb.infoCompleta());
ipcMain.handle('bde:deviceAccion', async (_e, accion) => usb.deviceAccion(accion));
ipcMain.handle('bde:salirRecovery', async () => usb.salirRecovery());
ipcMain.handle('bde:captura', async () => usb.captura());
ipcMain.handle('bde:appsLista', async () => usb.appsLista());
ipcMain.handle('bde:abrirArchivo', async (_e, f) => { try { shell.showItemInFolder(f); } catch (_) {} return true; });

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
