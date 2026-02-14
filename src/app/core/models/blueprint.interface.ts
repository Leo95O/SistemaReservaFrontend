export interface Blueprint {
  id: string;
  name: string;
  description?: string; // Opcional
  width: number;        // Ancho en metros
  height: number;       // Alto en metros
  walls: any[];         // Geometría (Mantenemos any[] como pediste en el contrato)
  furnitureLayout: any[]; // Mobiliario
  previewImageUrl?: string; // URL de la imagen previa
  createdAt: string;
  updatedAt: string;
}