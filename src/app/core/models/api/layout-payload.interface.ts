import { Table } from '../table.interface';

export interface LayoutPayload {
  tablesToCreate: Partial<Table>[]; // Mesas nuevas (sin ID aún o con ID temporal)
  tablesToUpdate: Partial<Table>[]; // Mesas movidas/rotadas (solo enviamos lo que cambió)
  tablesToDelete: string[];         // Array de UUIDs de mesas eliminadas
}