import { Table } from './table.interface';

export interface Zone {
  id: string;
  name: string;
  width: number;  // Metros
  height: number; // Metros
  backgroundImageUrl?: string;
  tables?: Table[]; // El signo '?' evita errores si viene undefined
}