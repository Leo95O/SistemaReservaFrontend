export interface Reservation {
  id: string;
  clientName: string;
  reservationDate: string; // ISO Date (YYYY-MM-DD)
  startTime: string;       // Hora inicio (HH:mm)
  durationMinutes: number; // Duración en minutos
  
  // Relación Clave: Una reserva bloquea VARIAS mesas
  tableIds: string[];      // ["uuid-1", "uuid-2"]
  
  status: 'confirmed' | 'cancelled' | 'pending';
}