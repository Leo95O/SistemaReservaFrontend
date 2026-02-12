import { Wall } from './blueprint.interface';
import { Table } from './table.interface';

export interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  
  // NUEVOS CAMPOS DEL BACKEND
  isUnderMaintenance: boolean; // El semáforo de edición
  walls: Wall[]; // Copia de los muros del blueprint
  blueprintId?: string;
  
  tables?: Table[];
  branchId: string;
}