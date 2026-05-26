import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { GridConfig } from '../shared/types';
import { IPC } from '../shared/ipc-channels';

export class OverlayWindow {
  private win: BrowserWindow | null = null;

  create(): void {
    const { bounds } = screen.getPrimaryDisplay();

    this.win = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      resizable: false,
      movable: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    });

    this.win.setAlwaysOnTop(true, 'screen-saver');
    this.win.setIgnoreMouseEvents(true, { forward: true });

    // macOS: 全 Space・フルスクリーンアプリの上にも表示する
    if (process.platform === 'darwin') {
      this.win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    this.win.loadFile(
      path.join(__dirname, '../renderer/overlay/overlay.html')
    );
  }

  sendConfig(config: GridConfig): void {
    this.win?.webContents.send(IPC.CONFIG_CHANGED, config);
  }

  setIgnoreMouse(ignore: boolean): void {
    if (ignore) {
      this.win?.setIgnoreMouseEvents(true, { forward: true });
    } else {
      this.win?.setIgnoreMouseEvents(false);
    }
  }

  show(): void {
    this.win?.show();
  }

  hide(): void {
    this.win?.hide();
  }

  isVisible(): boolean {
    return this.win?.isVisible() ?? false;
  }
}
