import { app, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { GridConfig } from '../shared/types';
import { DEFAULT_CONFIG } from '../shared/constants';
import { IPC } from '../shared/ipc-channels';
import { OverlayWindow } from './overlay-window';
import { SettingsWindow } from './settings-window';
import { TrayManager } from './tray-manager';

app.disableHardwareAcceleration();

// macOS: Dock アイコンを非表示にしてトレイ専用アプリにする
if (process.platform === 'darwin') {
  app.dock?.hide();
}

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig(): GridConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const cfg = JSON.parse(raw) as GridConfig;
      // boolean → string マイグレーション
      if (typeof cfg.showSubZones === 'boolean') {
        cfg.showSubZones = cfg.showSubZones ? 'full' : 'off';
      }
      return cfg;
    }
  } catch {
    // fall through to default
  }

  const { bounds } = screen.getPrimaryDisplay();
  const w = bounds.width;
  const h = bounds.height;

  return {
    ...DEFAULT_CONFIG,
    corners: {
      topLeft:     { x: Math.round(w * 0.25), y: Math.round(h * 0.20) },
      topRight:    { x: Math.round(w * 0.75), y: Math.round(h * 0.20) },
      bottomLeft:  { x: Math.round(w * 0.25), y: Math.round(h * 0.80) },
      bottomRight: { x: Math.round(w * 0.75), y: Math.round(h * 0.80) },
    },
  };
}

function saveConfig(config: GridConfig): void {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

app.whenReady().then(() => {
  let config = loadConfig();

  const overlayWindow = new OverlayWindow();
  const settingsWindow = new SettingsWindow();

  overlayWindow.create();

  const tray = new TrayManager(
    overlayWindow,
    settingsWindow,
    config,
    (newConfig) => {
      config = newConfig;
      saveConfig(config);
      overlayWindow.sendConfig(config);
    }
  );
  tray.create();

  ipcMain.handle(IPC.GET_CONFIG, () => config);

  ipcMain.on(IPC.UPDATE_CONFIG, (_event, partial: Partial<GridConfig>) => {
    config = { ...config, ...partial };
    saveConfig(config);
    tray.updateConfig(config);
    overlayWindow.sendConfig(config);
    settingsWindow.sendConfig(config);
  });

  ipcMain.on(IPC.SET_IGNORE_MOUSE, (_event, ignore: boolean) => {
    overlayWindow.setIgnoreMouse(ignore);
  });

  ipcMain.on(IPC.OPEN_SETTINGS, () => {
    settingsWindow.open(config);
  });

  ipcMain.on(IPC.RESET_CORNERS, () => {
    const { bounds } = screen.getPrimaryDisplay();
    const w = bounds.width;
    const h = bounds.height;
    config = {
      ...config,
      corners: {
        topLeft:     { x: Math.round(w * 0.25), y: Math.round(h * 0.20) },
        topRight:    { x: Math.round(w * 0.75), y: Math.round(h * 0.20) },
        bottomLeft:  { x: Math.round(w * 0.25), y: Math.round(h * 0.80) },
        bottomRight: { x: Math.round(w * 0.75), y: Math.round(h * 0.80) },
      },
    };
    saveConfig(config);
    overlayWindow.sendConfig(config);
    tray.updateConfig(config);
  });
});

// タスクトレイアプリとして常駐させる
app.on('window-all-closed', (e: Event) => e.preventDefault());
