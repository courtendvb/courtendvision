import { GridConfig, GridCorners } from '../../shared/types';
import { CORNER_HIT_RADIUS } from '../../shared/constants';
import { GridRenderer } from './grid-renderer';

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

const canvas = document.getElementById('grid-canvas') as HTMLCanvasElement;
canvas.width = screen.width;
canvas.height = screen.height;

const renderer = new GridRenderer(canvas);
let config: GridConfig;

type CornerKey = keyof GridCorners;
const CORNER_KEYS: CornerKey[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

let dragging: CornerKey | null = null;
let mouseOverCorner = false;

function hitTest(x: number, y: number): CornerKey | null {
  for (const key of CORNER_KEYS) {
    const c = config.corners[key];
    const dx = c.x - x;
    const dy = c.y - y;
    if (dx * dx + dy * dy <= CORNER_HIT_RADIUS * CORNER_HIT_RADIUS) return key;
  }
  return null;
}

canvas.addEventListener('mousemove', (e: MouseEvent) => {
  if (!config) return;

  if (dragging) {
    config.corners[dragging] = { x: e.clientX, y: e.clientY };
    renderer.render(config);
    window.electronAPI.updateConfig({ corners: config.corners });
    return;
  }

  const hit = hitTest(e.clientX, e.clientY);

  if (hit && !mouseOverCorner) {
    mouseOverCorner = true;
    window.electronAPI.setIgnoreMouse(false);
    canvas.style.cursor = 'grab';
  } else if (!hit && mouseOverCorner) {
    mouseOverCorner = false;
    window.electronAPI.setIgnoreMouse(true);
    canvas.style.cursor = 'default';
  }
});

canvas.addEventListener('mousedown', (e: MouseEvent) => {
  if (!config) return;
  const hit = hitTest(e.clientX, e.clientY);
  if (hit) {
    dragging = hit;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  }
});

canvas.addEventListener('mouseup', () => {
  if (dragging) {
    dragging = null;
    canvas.style.cursor = mouseOverCorner ? 'grab' : 'none';
  }
});

// マウスがウィンドウ外に出たときにクリックスルーを戻す
document.addEventListener('mouseleave', () => {
  dragging = null;
  if (mouseOverCorner) {
    mouseOverCorner = false;
    window.electronAPI.setIgnoreMouse(true);
  }
});

window.electronAPI.onConfigChanged((newConfig: GridConfig) => {
  config = newConfig;
  renderer.render(config);
});

(async () => {
  config = await window.electronAPI.getConfig();
  renderer.render(config);
})();
