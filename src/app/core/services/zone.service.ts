import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Zone } from '../models/zone.interface';
import { Table } from '../models/table.interface';

@Injectable({
  providedIn: 'root'
})
export class ZoneService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/zones`;

  /**
   * Obtiene la zona completa (muros + mesas)
   */
  getZone(id: string): Observable<Zone> {
    return this.http.get<Zone>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva zona instanciando un plano base (Blueprint)
   */
  instantiateBlueprint(blueprintId: string, branchId: string, name: string): Observable<Zone> {
    const payload = { blueprintId, branchId, name };
    return this.http.post<Zone>(`${this.apiUrl}/instantiate`, payload);
  }

  /**
   * Intenta bloquear la zona para edición exclusiva.
   * Retorna éxito si nadie más la tiene bloqueada.
   */
  lockZone(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/lock`, {});
  }

  /**
   * Libera la zona para que otros puedan editarla.
   */
  unlockZone(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/unlock`, {});
  }

  /**
   * Guarda la distribución completa de mesas.
   * Estrategia: Full Replace (Reemplaza todo el array de mesas)
   */
  saveLayout(id: string, tables: Table[]): Observable<Zone> {
    // Envolvemos en un objeto según la convención REST
    return this.http.patch<Zone>(`${this.apiUrl}/${id}/layout`, { tables });
  }
}