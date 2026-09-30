import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { GridConfig } from '../shared/types';
import { IPC } from '../shared/ipc-channels';

export class SettingsWindow {
  private win: BrowserWindow | null = null;

  open(currentConfig: GridConfig): void {
    // macOS: Dock 非表示（アクセサリ）アプリはアクティブにならないため、
    // 明示的に前面へ出さないと設定ウィンドウが他アプリの背後に隠れる
    if (process.platform === 'darwin') {
      app.focus({ steal: true });
    }

    if (this.win) {
      this.win.show();
      this.win.focus();
      this.win.webContents.send(IPC.CONFIG_CHANGED, currentConfig);
      return;
    }

    this.win = new BrowserWindow({
      width: 400,
      height: 320,
      resizable: false,
      title: 'Grid Settings',
      skipTaskbar: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    });

    this.win.setMenu(null);
    this.win.loadFile(
      path.join(__dirname, '../renderer/settings/settings.html')
    );

    this.win.webContents.once('did-finish-load', () => {
      this.win?.webContents.send(IPC.CONFIG_CHANGED, currentConfig);
    });

    this.win.on('closed', () => {
      this.win = null;
    });
  }

  sendConfig(config: GridConfig): void {
    this.win?.webContents.send(IPC.CONFIG_CHANGED, config);
  }

  close(): void {
    this.win?.close();
  }
}
