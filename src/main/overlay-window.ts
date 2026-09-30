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
      // macOS: 非アクティブなウィンドウへの最初のクリックを捨てずに
      // Web コンテンツへ届ける（これが無いとコーナーをドラッグできない）
      acceptFirstMouse: true,
      // macOS: メニューバー領域まで含めて画面全体を覆えるようにする
      enableLargerThanScreen: true,
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
      // 生成時にメニューバー分だけ下にずらされるので、画面左上に戻す
      this.win.setBounds(bounds);
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
