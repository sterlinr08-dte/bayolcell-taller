// Puente seguro entre la interfaz (renderer) y el sistema (main).
// Solo expone funciones concretas, nunca acceso directo a Node.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bde', {
  // Devuelve { ok, version } si libimobiledevice está instalado
  checkTools: () => ipcRenderer.invoke('bde:checkTools'),
  // Lee el iPhone conectado por USB
  leerDispositivo: () => ipcRenderer.invoke('bde:leerDispositivo'),
  // Lista de ventanas/pantallas para capturar (ej. el programa de REEFOX)
  getSources: () => ipcRenderer.invoke('bde:getSources'),
  // Backup / restauración del iPhone
  iphoneBackup: () => ipcRenderer.invoke('bde:iphoneBackup'),
  iphoneRestore: () => ipcRenderer.invoke('bde:iphoneRestore'),
  openBackups: () => ipcRenderer.invoke('bde:openBackups'),
  onOpProgress: (cb) => ipcRenderer.on('bde:opProgress', (_e, l) => cb(l))
});
