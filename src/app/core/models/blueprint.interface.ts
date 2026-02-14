export interface Blueprint {
  id: string;
  name: string;
  description?: string; // Opcional
  width: number;        // Ancho en metros
  height: number;       // Alto en metros
  walls: any[];         // Contrato estricto (Backend)
  furnitureLayout: any[]; // Mobiliario
  previewImageUrl?: string; // URL de la imagen previa
  createdAt: string;
  updatedAt: string;
}

// 👇 AGREGAMOS ESTO PARA QUE EL EDITOR NO FALLE
export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  angle: number;
}