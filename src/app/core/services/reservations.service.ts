import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reservations`;

  /**
   * Consulta disponibilidad.
   * Retorna un array con los IDs de las mesas ocupadas en esa fecha/hora.
   * GET /reservations/availability?zoneId=XXX&datetime=2023-10-25T14:00
   */
  getAvailability(zoneId: string, datetime: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/availability`, {
      params: { zoneId, datetime }
    });
  }

  /**
   * Crea la reserva final.
   * POST /reservations
   */
  create(data: { 
    zoneId: string, 
    tableIds: string[], 
    datetime: string, 
    customerName: string, 
    customerEmail: string 
  }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}