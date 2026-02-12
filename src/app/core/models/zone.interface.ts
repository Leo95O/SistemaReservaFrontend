import { Table } from './table.interface';
import { Wall } from './blueprint.interface'; // Asegúrate de importar esto

export interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundImageUrl?: string;
  
  tables?: Table[]; 
  walls?: Wall[]; // 👈 NUEVO: Ahora la zona transporta sus muros
}