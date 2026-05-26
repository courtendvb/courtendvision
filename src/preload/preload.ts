import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import { GridConfig } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (): Promise<GridConfig> =>
    ipcRenderer.invoke(IPC.GET_CONFIG),

  updateConfig: (config: Partial<GridConfig>): void =>
    ipcRenderer.send(IPC.UPDATE_CONFIG, config),

  onConfigChanged: (cb: (config: GridConfig) => void): void => {
    ipcRenderer.on(IPC.CONFIG_CHANGED, (_event, config: GridConfig) => cb(config));
  },

  setIgnoreMouse: (ignore: boolean): void =>
    ipcRenderer.send(IPC.SET_IGNORE_MOUSE, ignore),

  openSettings: (): void =>
    ipcRenderer.send(IPC.OPEN_SETTINGS),

  resetCorners: (): void =>
    ipcRenderer.send(IPC.RESET_CORNERS),
});
