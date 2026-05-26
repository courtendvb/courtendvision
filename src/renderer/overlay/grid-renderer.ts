import { GridCorners, GridConfig } from '../../shared/types';
import {
  COLS, ROWS,
  CORNER_HANDLE_RADIUS,
  ZONE_NUMBERS,
  SUB_ZONE_LABELS_NEAR,
  SUB_ZONE_LABELS_FAR,
} from '../../shared/constants';

// ────────────────────────────────────────────────────────────
//  Homography: 単位正方形 (u,v) → 画面座標 (x,y)
// ────────────────────────────────────────────────────────────

interface H9 {
  a: number; b: number; c: number;
  d: number; e: number; f: number;
  g: number; h: number;
}

function buildHomography(corners: GridCorners): H9 {
  const { topLeft: p0, topRight: p1, bottomLeft: p2, bottomRight: p3 } = corners;

  const dx1 = p1.x - p3.x, dx2 = p2.x - p3.x;
  const dy1 = p1.y - p3.y, dy2 = p2.y - p3.y;
  const sx  = p0.x - p1.x + p3.x - p2.x;
  const sy  = p0.y - p1.y + p3.y - p2.y;
  const den = dx1 * dy2 - dx2 * dy1;

  if (Math.abs(den) < 1e-6) {
    return {
      a: p1.x - p0.x, b: p2.x - p0.x, c: p0.x,
      d: p1.y - p0.y, e: p2.y - p0.y, f: p0.y,
      g: 0, h: 0,
    };
  }

  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;

  return {
    a: p1.x - p0.x + g * p1.x,
    b: p2.x - p0.x + h * p2.x,
    c: p0.x,
    d: p1.y - p0.y + g * p1.y,
    e: p2.y - p0.y + h * p2.y,
    f: p0.y,
    g, h,
  };
}

function project(H: H9, u: number, v: number): { x: number; y: number } {
  const w = H.g * u + H.h * v + 1;
  return {
    x: (H.a * u + H.b * v + H.c) / w,
    y: (H.d * u + H.e * v + H.f) / w,
  };
}

// セルの見た目の高さ（px）を推定してフォントサイズ算出に使う
function cellHeightPx(H: H9, row: number, col: number): number {
  const uc = (col + 0.5) / COLS;
  const top    = project(H, uc, row / ROWS);
  const bottom = project(H, uc, (row + 1) / ROWS);
  return Math.hypot(bottom.x - top.x, bottom.y - top.y);
}

const HALF_ROW = ROWS / 2;

// ────────────────────────────────────────────────────────────

export class GridRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(config: GridConfig): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!config.visible) return;

    const { corners, color, opacity, lineWidth } = config;
    const H = buildHomography(corners);

    // ── 1. メイングリッド線 ───────────────────────────────
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.strokeStyle = color;
    this.ctx.lineCap = 'round';

    for (let col = 0; col <= COLS; col++) {
      const u = col / COLS;
      const p1 = project(H, u, 0), p2 = project(H, u, 1);
      this.ctx.lineWidth = lineWidth;
      this.ctx.setLineDash([]);
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    for (let row = 0; row <= ROWS; row++) {
      const v = row / ROWS;
      const isHalf = row === HALF_ROW;
      this.ctx.lineWidth = isHalf ? lineWidth * 2.5 : lineWidth;
      this.ctx.setLineDash(isHalf ? [12, 6] : []);
      const p1 = project(H, 0, v), p2 = project(H, 1, v);
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
    this.ctx.restore();

    // ── 2. サブゾーン区切り線 (オプション) ───────────────
    if (config.showSubZones !== 'off') {
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = Math.max(0.5, lineWidth * 0.5);
      this.ctx.setLineDash([5, 4]);
      this.ctx.lineCap = 'round';

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const uMid = (col + 0.5) / COLS;
          const vMid = (row + 0.5) / ROWS;

          // 縦の中割り線
          const sv1 = project(H, uMid, row / ROWS);
          const sv2 = project(H, uMid, (row + 1) / ROWS);
          this.ctx.beginPath();
          this.ctx.moveTo(sv1.x, sv1.y);
          this.ctx.lineTo(sv2.x, sv2.y);
          this.ctx.stroke();

          // 横の中割り線
          const sh1 = project(H, col / COLS, vMid);
          const sh2 = project(H, (col + 1) / COLS, vMid);
          this.ctx.beginPath();
          this.ctx.moveTo(sh1.x, sh1.y);
          this.ctx.lineTo(sh2.x, sh2.y);
          this.ctx.stroke();
        }
      }

      this.ctx.setLineDash([]);
      this.ctx.restore();
    }

    // ── 3. ゾーン番号 (オプション) ────────────────────────
    if (config.showZoneNumbers) {
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const zoneNum = ZONE_NUMBERS[row][col];
          const center  = project(H, (col + 0.5) / COLS, (row + 0.5) / ROWS);
          const cellH   = cellHeightPx(H, row, col);

          // ゾーン番号: セル高さの 50% + 2px、14px〜102px でクランプ
          const fontSize = Math.max(14, Math.min(102, cellH * 0.50 + 2));
          this.ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
          this.ctx.fillText(String(zoneNum), center.x, center.y);
        }
      }

      this.ctx.restore();
    }

    // ── 4. A/B/C/D ラベル (full モード時のみ) ────────────
    if (config.showSubZones === 'full') {
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cellH    = cellHeightPx(H, row, col);
          // A/B/C/D: セル高さの 22%、8px〜36px でクランプ
          const fontSize = Math.max(8, Math.min(36, cellH * 0.22));
          this.ctx.font  = `${fontSize}px 'Segoe UI', Arial, sans-serif`;

          const labels = row < HALF_ROW ? SUB_ZONE_LABELS_FAR : SUB_ZONE_LABELS_NEAR;
          for (const [du, dv, letter] of labels) {
            const u  = (col + du) / COLS;
            const v  = (row + dv) / ROWS;
            const pt = project(H, u, v);
            this.ctx.fillText(letter, pt.x, pt.y);
          }
        }
      }

      this.ctx.restore();
    }

    // ── 5. コーナーハンドル (常時) ────────────────────────
    this.drawCornerHandles(corners, color);
  }

  private drawCornerHandles(corners: GridCorners, color: string): void {
    const pts = [
      corners.topLeft, corners.topRight,
      corners.bottomLeft, corners.bottomRight,
    ];
    for (const pt of pts) {
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, CORNER_HANDLE_RADIUS + 2, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, CORNER_HANDLE_RADIUS, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#000';
      this.ctx.fill();
    }
  }
}
