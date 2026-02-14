import { Zone } from './zone.interface';
import { Branch } from './branch.interface';

export interface Reservation {
  id?: string;
  date: string;     // ISO String (YYYY-MM-DD)
  time: string;     // HH:mm
  customerName: string;
  customerEmail: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  
  // Relaciones anidadas (Populated by Backend)
  zone?: Zone;
  branch?: Branch;
  tableIds: string[];
  
  createdAt?: Date;
}