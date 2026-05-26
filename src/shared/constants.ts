import { GridConfig } from './types';

export const COLS = 3;
export const ROWS = 6;

export const CORNER_HANDLE_RADIUS = 10;
export const CORNER_HIT_RADIUS = 18;

// ゾーン番号 [row][col]  row=0:far side back → row=5:near side back
//  row0: 1 6 5   (opponent back row)
//  row1: 9 8 7   (opponent mid)
//  row2: 2 3 4   (opponent front)
//  row3: 4 3 2   (own front)
//  row4: 7 8 9   (own mid)
//  row5: 5 6 1   (own back row)
export const ZONE_NUMBERS: number[][] = [
  [1, 6, 5],
  [9, 8, 7],
  [2, 3, 4],
  [4, 3, 2],
  [7, 8, 9],
  [5, 6, 1],
];

// サブゾーンラベル [du, dv, letter]
// 手前側 (near half): 右下=A 右上=B 左上=C 左下=D
export const SUB_ZONE_LABELS_NEAR: [number, number, string][] = [
  [0.75, 0.75, 'A'],  // bottom-right
  [0.75, 0.25, 'B'],  // top-right
  [0.25, 0.25, 'C'],  // top-left
  [0.25, 0.75, 'D'],  // bottom-left
];
// 奥側 (far half): 手前側から見て 左上=A 左下=B 右下=C 右上=D
export const SUB_ZONE_LABELS_FAR: [number, number, string][] = [
  [0.25, 0.25, 'A'],  // top-left
  [0.25, 0.75, 'B'],  // bottom-left
  [0.75, 0.75, 'C'],  // bottom-right
  [0.75, 0.25, 'D'],  // top-right
];

export const DEFAULT_CONFIG: Omit<GridConfig, 'corners'> = {
  color: '#FFFFFF',
  opacity: 0.7,
  lineWidth: 2,
  visible: true,
  showZoneNumbers: false,
  showSubZones: 'off',
};
