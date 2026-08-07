const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fgs', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial) => ipcRenderer.invoke('settings:update', partial),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  listPacks: () => ipcRenderer.invoke('packs:list'),
  getPackDetail: (packPath) => ipcRenderer.invoke('packs:detail', packPath),
  listLibrary: () => ipcRenderer.invoke('library:list'),
  saveLibraryGame: (game) => ipcRenderer.invoke('library:save', game),
  openPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),
  showItemInFolder: (targetPath) => ipcRenderer.invoke('shell:showItem', targetPath),
  pathExists: (targetPath) => ipcRenderer.invoke('fs:exists', targetPath),
  getAppPaths: () => ipcRenderer.invoke('app:getPaths'),
});
