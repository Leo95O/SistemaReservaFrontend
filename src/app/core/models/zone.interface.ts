import { Table } from './table.interface';

export interface Zone {
  id: string; // UUID
  name: string;
  width: number;  // Metros (float)
  height: number; // Metros (float)
  backgroundImageUrl?: string; // URL absoluta del plano (opcional)
  tables?: Table[]; // Relación One-To-Many
}