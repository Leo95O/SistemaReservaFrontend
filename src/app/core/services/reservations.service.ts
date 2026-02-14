import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../models/reservation.interface';

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  create(reservation: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservations`, reservation);
  }

  getAvailability(zoneId: string, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/reservations/availability`, {
      params: { zoneId, date }
    });
  }

  // ✅ NUEVO: Obtener mis reservas (Historial)
  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservations/my-history`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching history:', error);
          // Retornamos array vacío para que la UI muestre el "Empty State" en lugar de romperse
          return of([]); 
        })
      );
  }
}