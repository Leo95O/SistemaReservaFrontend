export interface Table {
  id: string;      // UUID
  code: string;    // Ej: "M-01"
  x: number;       // Metros
  y: number;       // Metros
  width: number;   // Metros
  height: number;  // Metros
  rotation: number;// Grados (0-360)
  seats: number;
  shape: 'rect' | 'circle'; // Vital para Konva
}