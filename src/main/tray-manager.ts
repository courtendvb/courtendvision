import { Tray, Menu, nativeImage, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { GridConfig } from '../shared/types';
import { OverlayWindow } from './overlay-window';
import { SettingsWindow } from './settings-window';

type ConfigChangeCallback = (config: GridConfig) => void;

export class TrayManager {
  private tray: Tray | null = null;
  private config: GridConfig;
  private overlayWindow: OverlayWindow;
  private settingsWindow: SettingsWindow;
  private onConfigChange: ConfigChangeCallback;

  constructor(
    overlayWindow: OverlayWindow,
    settingsWindow: SettingsWindow,
    config: GridConfig,
    onConfigChange: ConfigChangeCallback
  ) {
    this.overlayWindow = overlayWindow;
    this.settingsWindow = settingsWindow;
    this.config = config;
    this.onConfigChange = onConfigChange;
  }

  create(): void {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    let icon: Electron.NativeImage;

    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } else {
      icon = nativeImage.createEmpty();
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('CourtEnd Vision');
    this.buildMenu();
  }

  updateConfig(config: GridConfig): void {
    this.config = config;
    this.buildMenu();
  }

  private buildMenu(): void {
    const isVisible = this.config.visible;
    const opacityPct = Math.round(this.config.opacity * 100);

    const opacityItems = [20, 30, 40, 50, 60, 70, 80, 90, 100].map((pct) => ({
      label: `${pct}%`,
      type: 'radio' as const,
      checked: opacityPct === pct,
      click: () => {
        this.config = { ...this.config, opacity: pct / 100 };
        this.onConfigChange(this.config);
        this.buildMenu();
      },
    }));

    const colorItems = [
      { label: 'White (Default)', color: '#FFFFFF' },
      { label: 'Black',          color: '#000000' },
      { label: 'Red',            color: '#FF3333' },
      { label: 'Yellow',         color: '#FFFF00' },
      { label: 'Green',          color: '#00FF00' },
      { label: 'Blue',           color: '#3399FF' },
    ].map(({ label, color }) => ({
      label,
      type: 'radio' as const,
      checked: this.config.color === color,
      click: () => {
        this.config = { ...this.config, color };
        this.onConfigChange(this.config);
        this.buildMenu();
      },
    }));

    const menu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide Grid' : 'Show Grid',
        click: () => {
          this.config = { ...this.config, visible: !this.config.visible };
          this.onConfigChange(this.config);
          if (this.config.visible) {
            this.overlayWindow.show();
          } else {
            this.overlayWindow.hide();
          }
          this.buildMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Grid Color',
        submenu: colorItems,
      },
      {
        label: `Opacity (${opacityPct}%)`,
        submenu: opacityItems,
      },
      { type: 'separator' },
      {
        label: 'Zone Numbers',
        type: 'checkbox' as const,
        checked: this.config.showZoneNumbers,
        click: () => {
          this.config = { ...this.config, showZoneNumbers: !this.config.showZoneNumbers };
          this.onConfigChange(this.config);
          this.buildMenu();
        },
      },
      {
        label: 'Sub-zones (A/B/C/D)',
        submenu: (
          ['off', 'grid-only', 'full'] as const
        ).map((value, i) => ({
          label: ['Off', 'Grid Only', 'Grid + Labels'][i],
          type: 'radio' as const,
          checked: this.config.showSubZones === value,
          click: () => {
            this.config = { ...this.config, showSubZones: value };
            this.onConfigChange(this.config);
            this.buildMenu();
          },
        })),
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        click: () => {
          this.settingsWindow.open(this.config);
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ]);

    this.tray?.setContextMenu(menu);
  }
}
