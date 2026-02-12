import { Zone } from './zone.interface';

export interface Branch {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  zones?: Zone[]; // Las zonas activas de esta sucursal (ej: Terraza, Salón)
}