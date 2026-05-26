import { GridConfig } from '../../shared/types';

declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<GridConfig>;
      updateConfig: (config: Partial<GridConfig>) => void;
      onConfigChanged: (cb: (config: GridConfig) => void) => void;
      setIgnoreMouse: (ignore: boolean) => void;
      openSettings: () => void;
      resetCorners: () => void;
    };
  }
}

const colorInput      = document.getElementById('color-input')      as HTMLInputElement;
const colorHex        = document.getElementById('color-hex')         as HTMLSpanElement;
const opacityInput    = document.getElementById('opacity-input')     as HTMLInputElement;
const opacityLabel    = document.getElementById('opacity-label')     as HTMLSpanElement;
const linewidthInput  = document.getElementById('linewidth-input')   as HTMLInputElement;
const toggleZones     = document.getElementById('toggle-zones')      as HTMLInputElement;
const szOff           = document.getElementById('sz-off')            as HTMLInputElement;
const szGridOnly      = document.getElementById('sz-grid-only')      as HTMLInputElement;
const szFull          = document.getElementById('sz-full')           as HTMLInputElement;
const btnApply        = document.getElementById('btn-apply')         as HTMLButtonElement;
const btnReset        = document.getElementById('btn-reset')         as HTMLButtonElement;
const btnClose        = document.getElementById('btn-close')         as HTMLButtonElement;

function applyConfig(config: GridConfig): void {
  colorInput.value          = config.color;
  colorHex.textContent      = config.color.toUpperCase();
  opacityInput.value        = String(Math.round(config.opacity * 100));
  opacityLabel.textContent  = `${Math.round(config.opacity * 100)}%`;
  linewidthInput.value      = String(config.lineWidth);
  toggleZones.checked  = config.showZoneNumbers;
  szOff.checked      = config.showSubZones === 'off';
  szGridOnly.checked = config.showSubZones === 'grid-only';
  szFull.checked     = config.showSubZones === 'full';
}

colorInput.addEventListener('input', () => {
  colorHex.textContent = colorInput.value.toUpperCase();
});

opacityInput.addEventListener('input', () => {
  opacityLabel.textContent = `${opacityInput.value}%`;
});

btnApply.addEventListener('click', () => {
  window.electronAPI.updateConfig({
    color:           colorInput.value,
    opacity:         parseInt(opacityInput.value, 10) / 100,
    lineWidth:       parseInt(linewidthInput.value, 10),
    showZoneNumbers: toggleZones.checked,
    showSubZones: szFull.checked ? 'full' : szGridOnly.checked ? 'grid-only' : 'off',
  });
});

btnReset.addEventListener('click', () => {
  window.electronAPI.resetCorners();
});

btnClose.addEventListener('click', () => {
  window.close();
});

window.electronAPI.onConfigChanged((config: GridConfig) => {
  applyConfig(config);
});

(async () => {
  const config = await window.electronAPI.getConfig();
  applyConfig(config);
})();
