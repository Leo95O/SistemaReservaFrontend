import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Zone } from '../models/zone.interface';
import { Table } from '../models/table.interface';

@Injectable({
  providedIn: 'root'
})
export class ZoneService {
  private http = inject(HttpClient);
  // Asegúrate de que environment.apiUrl apunta a 'http://localhost:3000/api' (o similar)
  private apiUrl = `${environment.apiUrl}/zones`;

  /**
   * Obtiene la zona completa (muros + mesas) por ID
   */
  getZone(id: string): Observable<Zone> {
    return this.http.get<Zone>(`${this.apiUrl}/${id}`);
  }

  /**
   * ✅ NUEVO: Obtiene las zonas asociadas a una sucursal específica.
   * Usado por: ClientHomeComponent
   */
  getZonesByBranch(branchId: string): Observable<Zone[]> {
    // Asumimos que el backend filtra por query param: GET /zones?branchId=XYZ
    const params = new HttpParams().set('branchId', branchId);
    return this.http.get<Zone[]>(this.apiUrl, { params });
  }

  /**
   * Crea una nueva zona instanciando un plano base (Blueprint).
   * Usado por: BranchManager
   */
  instantiateBlueprint(blueprintId: string, branchId: string, name: string): Observable<Zone> {
    const payload = { blueprintId, branchId, name };
    return this.http.post<Zone>(`${this.apiUrl}/instantiate`, payload);
  }

  /**
   * Intenta bloquear la zona para edición exclusiva.
   * Usado por: FurnitureEditor (ngOnInit/toggle)
   */
  lockZone(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/lock`, {});
  }

  /**
   * Libera la zona para que otros puedan editarla.
   * Usado por: FurnitureEditor (ngOnDestroy)
   */
  unlockZone(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/unlock`, {});
  }

  /**
   * Guarda la distribución completa de mesas.
   * Estrategia: Full Replace (Reemplaza todo el array de mesas)
   */
  saveLayout(id: string, tables: Table[]): Observable<Zone> {
    // El backend espera { tables: [...] } en el body
    return this.http.patch<Zone>(`${this.apiUrl}/${id}/layout`, { tables });
  }
}