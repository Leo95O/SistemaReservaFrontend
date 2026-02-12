export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number; // Metros reales
  angle: number;
}

export interface Blueprint {
  id: string;
  name: string;
  description?: string;
  walls: Wall[]; // JSONB del backend
  furnitureLayout: any[]; // JSONB de mesas "template"
  previewImageUrl?: string;
  createdAt: string;
}