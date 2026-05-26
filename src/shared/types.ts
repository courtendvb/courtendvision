export interface Corner {
  x: number;
  y: number;
}

export interface GridCorners {
  topLeft: Corner;
  topRight: Corner;
  bottomLeft: Corner;
  bottomRight: Corner;
}

export interface GridConfig {
  corners: GridCorners;
  color: string;
  opacity: number;
  lineWidth: number;
  visible: boolean;
  showZoneNumbers: boolean;
  showSubZones: 'off' | 'grid-only' | 'full';
}
