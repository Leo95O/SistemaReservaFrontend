export interface Blueprint {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  walls: any[];
  furnitureLayout: any[];
  previewImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 👇 IMPORTANTE: Exportamos esto para que el Editor no falle
export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  angle: number;
}