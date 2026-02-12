export interface Table {
  id: string; // UUID
  code: string; // Ej: "M-01", "VIP-02"
  
  // Posición y Dimensiones (Todo en METROS)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // Grados (0-360)
  
  seats: number;    // Capacidad (sillas)
  shape: 'rect' | 'circle'; // Para saber cómo dibujar en Konva
}