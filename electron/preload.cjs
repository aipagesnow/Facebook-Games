const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fgs', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial) => ipcRenderer.invoke('settings:update', partial),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  listPacks: (platform) => ipcRenderer.invoke('packs:list', platform),
  getPackDetail: (packPath) => ipcRenderer.invoke('packs:detail', packPath),
  listLibrary: (platform) => ipcRenderer.invoke('library:list', platform),
  listUploadTargets: (platform) => ipcRenderer.invoke('upload:listTargets', platform),
  saveLibraryGame: (game, platform) => ipcRenderer.invoke('library:save', game, platform),
  openPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),
  showItemInFolder: (targetPath) => ipcRenderer.invoke('shell:showItem', targetPath),
  openZipHelper: (zipOrFolderPath) => ipcRenderer.invoke('shell:openZipHelper', zipOrFolderPath),
  pathExists: (targetPath) => ipcRenderer.invoke('fs:exists', targetPath),
  getAppPaths: () => ipcRenderer.invoke('app:getPaths'),
  setApiKey: (key) => ipcRenderer.invoke('settings:setApiKey', key),
  getResearchCatalog: () => ipcRenderer.invoke('research:catalog'),
  buildPlanPrompt: (options) => ipcRenderer.invoke('research:buildPrompt', options),
  getResearchHistory: (platform) => ipcRenderer.invoke('research:history', platform),
  runResearch: (options) => ipcRenderer.invoke('research:run', options),
  cancelResearch: () => ipcRenderer.invoke('research:cancel'),
  listShipBoards: (platform) => ipcRenderer.invoke('ship:list', platform),
  saveShipBoard: (board) => ipcRenderer.invoke('ship:save', board),
  proposeCrossPlatform: (input) => ipcRenderer.invoke('cross:propose', input),
  updatePackStatus: (packPath, status) => ipcRenderer.invoke('packs:setStatus', packPath, status),
  deleteLibraryGame: (id, platform) => ipcRenderer.invoke('library:delete', id, platform),
  pathStat: (targetPath) => ipcRenderer.invoke('fs:stat', targetPath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  onResearchProgress: (handler) => {
    const wrapped = (_e, entry) => handler(entry);
    ipcRenderer.on('research:progress', wrapped);
    return () => ipcRenderer.removeListener('research:progress', wrapped);
  },
});
